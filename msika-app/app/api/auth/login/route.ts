import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';

// ============================================
// MOCK MODE: Set to true to bypass database
// Use this to test the UI immediately.
// ============================================
const MOCK_MODE = true;

const MOCK_USERS = [
  {
    username: 'admin',
    password: 'password123',
    fullName: 'System Administrator',
    role: 'Administrator',
  },
  {
    username: 'collector',
    password: 'password123',
    fullName: 'John Phiri',
    role: 'Collector',
  },
  {
    username: 'supervisor',
    password: 'password123',
    fullName: 'Mary Banda',
    role: 'Supervisor',
  },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body as {
      username?: string;
      password?: string;
    };

    const normalizedUsername = username?.trim().toLowerCase() ?? '';
    const normalizedPassword = password?.trim() ?? '';

    if (!normalizedUsername || !normalizedPassword) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    let user: { username: string; fullName: string; role: string } | null = null;

    if (MOCK_MODE) {
      user = MOCK_USERS.find(
        (candidate) =>
          candidate.username === normalizedUsername &&
          candidate.password === normalizedPassword
      ) ?? null;

      if (!user) {
        return NextResponse.json(
          { error: 'Invalid username or password' },
          { status: 401 }
        );
      }
    } else {
      const { prisma } = await import('@/lib/prisma');
      const bcrypt = await import('bcryptjs');

      let dbUser: any = null;
      let role = '';

      const collector = await prisma.collector.findUnique({
        where: { username: normalizedUsername },
        include: { role: true },
      });

      if (collector) {
        dbUser = collector;
        role = collector.role.role_name;
      }

      if (!dbUser) {
        const supervisor = await prisma.supervisor.findUnique({
          where: { username: normalizedUsername },
          include: { role: true },
        });

        if (supervisor) {
          dbUser = supervisor;
          role = supervisor.role.role_name;
        }
      }

      if (!dbUser) {
        const admin = await prisma.administrator.findUnique({
          where: { username: normalizedUsername },
          include: { role: true },
        });

        if (admin) {
          dbUser = admin;
          role = admin.role.role_name;
        }
      }

      if (!dbUser) {
        return NextResponse.json(
          { error: 'Invalid username or password' },
          { status: 401 }
        );
      }

      const valid = await bcrypt.compare(normalizedPassword, dbUser.password_hash);
      if (!valid) {
        return NextResponse.json(
          { error: 'Invalid username or password' },
          { status: 401 }
        );
      }

      user = {
        username: dbUser.username,
        fullName: dbUser.full_name,
        role,
      };
    }

    const tokenPayload = {
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      iat: Date.now(),
    };

    const token = MOCK_MODE
      ? Buffer.from(JSON.stringify(tokenPayload)).toString('base64')
      : await signToken(tokenPayload);

    const response = NextResponse.json({
      success: true,
      role: user.role,
      fullName: user.fullName,
      message: 'Login successful',
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Login API Error:', message);
    return NextResponse.json(
      { error: 'Server error: ' + message },
      { status: 500 }
    );
  }
}