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
      totalVendors,
      totalPaymentsToday,
      totalRevenueToday,
    ] = await Promise.all([
      prisma.vendor.count(),
      prisma.payment.count({
        where: {
          payment_date: { gte: today },
          status_id: 2, // Assuming 2 = Completed
        },
      }),
      prisma.payment.aggregate({
        where: {
          payment_date: { gte: today },
          status_id: 2,
        },
        _sum: { amount: true },
      }),
    ]);

    return NextResponse.json({
      totalVendors,
      totalPaymentsToday,
      totalRevenueToday: totalRevenueToday._sum.amount || 0,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}