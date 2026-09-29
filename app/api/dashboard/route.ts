import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

// GET /api/dashboard — real market growth + collection stats
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalVendors,
    activeVendors,
    paidToday,
    revenueTodayAgg,
    revenueYesterdayAgg,
    revenueMonthAgg,
    paymentsToday,
    failedToday,
    newVendorsWeek,
    weeklyRevenue,
    sectionBreakdown,
    dailySeries,
  ] = await Promise.all([
    prisma.business.count(),
    prisma.business.count({ where: { status: "Active" } }),
    prisma.payment.findMany({
      where: { status: "Completed", paid_at: { gte: today } },
      select: { business_id: true, amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: "Completed", paid_at: { gte: today } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: "Completed", paid_at: { gte: yesterday, lt: today } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: "Completed", paid_at: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.payment.count({ where: { status: "Completed", paid_at: { gte: today } } }),
    prisma.payment.count({ where: { paid_at: { gte: today }, status: "Failed" } }),
    prisma.business.count({ where: { registration_date: { gte: weekAgo } } }),
    prisma.revenueSummary.findMany({
      where: { summary_date: { gte: weekAgo } },
      orderBy: { summary_date: "asc" },
    }),
    prisma.$queryRaw<Array<{ section_name: string; vendor_count: bigint; revenue: string | number }>>`
      SELECT ms.section_name,
             COUNT(DISTINCT b.business_id)::bigint AS vendor_count,
             COALESCE(SUM(p.amount), 0) AS revenue
      FROM "MarketSection" ms
      LEFT JOIN "Business" b ON b.section_id = ms.section_id
      LEFT JOIN "Payment" p ON p.business_id = b.business_id
        AND p.status = 'Completed' AND p.paid_at >= ${monthStart}
      GROUP BY ms.section_name
      ORDER BY vendor_count DESC
    `,
    prisma.revenueSummary.findMany({
      where: { summary_date: { gte: new Date(today.getTime() - 29 * 86400000) } },
      orderBy: { summary_date: "asc" },
    }),
  ]);

  const paidTodayAmount = revenueTodayAgg._sum.amount ?? 0;
  const yesterdayAmount = revenueYesterdayAgg._sum.amount ?? 0;
  const revenueToday = Number(paidTodayAmount);
  const revenueYesterday = Number(yesterdayAmount);
  const revenueMonth = Number(revenueMonthAgg._sum.amount ?? 0);
  const expectedToday = activeVendors * 300; // rough expected daily collection

  const paidVendorIds = new Set(paidToday.map((p) => p.business_id));
  const complianceToday = activeVendors ? Math.round((paidVendorIds.size / activeVendors) * 100) : 0;

  const growthPct = revenueYesterday > 0 ? Math.round(((revenueToday - revenueYesterday) / revenueYesterday) * 100) : null;

  return NextResponse.json({
    stats: {
      total_vendors: totalVendors,
      active_vendors: activeVendors,
      paid_today: paidVendorIds.size,
      unpaid_today: activeVendors - paidVendorIds.size,
      compliance_today: complianceToday,
      revenue_today: revenueToday,
      revenue_yesterday: revenueYesterday,
      revenue_month: revenueMonth,
      revenue_growth_pct: growthPct,
      transactions_today: paymentsToday,
      failed_today: failedToday,
      new_vendors_week: newVendorsWeek,
      collection_rate: expectedToday ? Math.round((revenueToday / expectedToday) * 100) : 0,
    },
    section_breakdown: sectionBreakdown.map((s) => ({
      section_name: s.section_name,
      vendor_count: Number(s.vendor_count),
      revenue: Number(s.revenue),
    })),
    weekly_revenue: weeklyRevenue.map((r) => ({
      date: r.summary_date.toISOString().slice(0, 10),
      amount: Number(r.total_amount),
      transactions: r.total_transactions,
    })),
    daily_series: dailySeries.map((r) => ({
      date: r.summary_date.toISOString().slice(0, 10),
      amount: Number(r.total_amount),
      transactions: r.total_transactions,
    })),
  });
}
