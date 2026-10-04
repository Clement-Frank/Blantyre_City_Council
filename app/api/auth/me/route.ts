import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyToken(token);

    return NextResponse.json({
      userId: Number(payload.sub) || undefined,
      username: payload.username,
      role: payload.role,
      fullName: payload.fullName,
    });
  } catch {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
}
