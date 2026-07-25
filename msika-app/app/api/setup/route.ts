import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const roles = ['Collector', 'Supervisor', 'Administrator', 'SystemAdmin'];
    for (const role_name of roles) {
      await prisma.role.upsert({
        where: { role_name },
        update: {},
        create: { role_name },
      });
    }

    const adminRole = await prisma.role.findUnique({
      where: { role_name: 'Administrator' },
    });

    if (!adminRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 500 });
    }

    const existing = await prisma.administrator.findUnique({
      where: { username: 'admin' },
    });

    if (!existing) {
      const hash = await bcrypt.hash('password123', 10);
      await prisma.administrator.create({
        data: {
          username: 'admin',
          password_hash: hash,
          full_name: 'System Administrator',
          role_id: adminRole.role_id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Setup complete. Login with username: admin, password: password123',
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Setup failed' }, { status: 500 });
  }
}