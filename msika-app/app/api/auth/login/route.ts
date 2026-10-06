import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { signToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { collectors, roles, supervisors, users } from '@/src/db/schema';
import { logAudit } from '@/lib/audit';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body as { username?: string; password?: string };

    const normalizedUsername = username?.trim().toLowerCase() ?? '';
    const normalizedPassword = password?.trim() ?? '';

    if (!normalizedUsername || !normalizedPassword) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Staff accounts live in three tables: collectors, supervisors, admin users.
    let dbUser: {
      id: number;
      username: string;
      full_name: string;
      password_hash: string;
    } | null = null;
    let role = '';

    const [collector] = await db
      .select()
      .from(collectors)
      .where(eq(collectors.username, normalizedUsername))
      .limit(1);
    if (collector && collector.is_active) {
      dbUser = {
        id: collector.collector_id,
        username: collector.username,
        full_name: collector.full_name,
        password_hash: collector.password_hash,
      };
      role = 'Collector';
    }

    if (!dbUser) {
      const [supervisor] = await db
        .select()
        .from(supervisors)
        .where(eq(supervisors.username, normalizedUsername))
        .limit(1);
      if (supervisor && supervisor.is_active) {
        dbUser = {
          id: supervisor.supervisor_id,
          username: supervisor.username,
          full_name: supervisor.full_name,
          password_hash: supervisor.password_hash,
        };
        role = 'Supervisor';
      }
    }

    if (!dbUser) {
      const [admin] = await db
        .select({
          user_id: users.user_id,
          username: users.username,
          full_name: users.full_name,
          password_hash: users.password_hash,
          is_active: users.is_active,
          role_name: roles.role_name,
        })
        .from(users)
        .leftJoin(roles, eq(roles.role_id, users.role_id))
        .where(eq(users.username, normalizedUsername))
        .limit(1);
      if (admin && admin.is_active) {
        dbUser = {
          id: admin.user_id,
          username: admin.username,
          full_name: admin.full_name,
          password_hash: admin.password_hash,
        };
        role = admin.role_name ?? '';
      }
    }

    if (!dbUser) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const valid = await bcrypt.compare(normalizedPassword, dbUser.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const token = await signToken({
      sub: String(dbUser.id),
      username: dbUser.username,
      fullName: dbUser.full_name,
      role,
    });

    await logAudit({
      actorType: 'User',
      actorId: dbUser.id,
      actorName: dbUser.full_name,
      action: 'LOGIN',
      resource: 'Session',
      resourceId: dbUser.username,
      details: `Login as ${role}`,
    });

    const response = NextResponse.json({
      success: true,
      role,
      fullName: dbUser.full_name,
      message: 'Login successful',
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Login API Error:', message);
    return NextResponse.json({ error: 'Server error: ' + message }, { status: 500 });
  }
}
