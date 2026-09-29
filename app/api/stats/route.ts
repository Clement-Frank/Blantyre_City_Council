import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await verifyToken(token);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalBusinesses,
      totalPaymentsToday,
      totalRevenueToday,
    ] = await Promise.all([
      prisma.business.count(),
      prisma.payment.count({
        where: {
          created_at: { gte: today },
          status: "Completed",
        },
      }),
      prisma.payment.aggregate({
        where: {
          created_at: { gte: today },
          status: "Completed",
        },
        _sum: { amount: true },
      }),
    ]);

    return NextResponse.json({
      totalBusinesses,
      totalPaymentsToday,
      totalRevenueToday: totalRevenueToday._sum.amount || 0,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}