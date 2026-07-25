import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Decode the simple base64 token
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      return NextResponse.json({
        userId: 1,
        username: payload.username,
        role: payload.role,
        fullName: payload.fullName,
      });
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error: any) {
    console.error('Me API Error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}