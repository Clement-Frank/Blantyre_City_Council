import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { getScope, businessScopeFilter, paymentScopeFilter } from "@/lib/permissions";

// GET /api/dashboard — market growth + collection stats, scoped to the user's role
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const scope = await getScope(user);
  const bizFilter = businessScopeFilter(scope);
  const payFilter = paymentScopeFilter(scope);
  // Revenue summaries roll up per sub-office — supervisors only see their own
  const subOfficeFilter = scope.subOfficeId ? { sub_office_id: scope.subOfficeId } : {};

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
    scopedBusinesses,
    monthPayments,
    dailySeries,
  ] = await Promise.all([
    prisma.business.count({ where: bizFilter }),
    prisma.business.count({ where: { AND: [{ status: "Active" }, bizFilter] } }),
    prisma.payment.findMany({
      where: { AND: [{ status: "Completed", paid_at: { gte: today } }, payFilter] },
      select: { business_id: true },
    }),
    prisma.payment.aggregate({
      where: { AND: [{ status: "Completed", paid_at: { gte: today } }, payFilter] },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { AND: [{ status: "Completed", paid_at: { gte: yesterday, lt: today } }, payFilter] },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { AND: [{ status: "Completed", paid_at: { gte: monthStart } }, payFilter] },
      _sum: { amount: true },
    }),
    prisma.payment.count({
      where: { AND: [{ status: "Completed", paid_at: { gte: today } }, payFilter] },
    }),
    prisma.payment.count({
      where: { AND: [{ paid_at: { gte: today }, status: "Failed" }, payFilter] },
    }),
    prisma.business.count({ where: { AND: [{ registration_date: { gte: weekAgo } }, bizFilter] } }),
    prisma.revenueSummary.findMany({
      where: { AND: [{ summary_date: { gte: weekAgo } }, subOfficeFilter] },
      orderBy: { summary_date: "asc" },
    }),
    // Section breakdown computed from scoped businesses (replaces the old raw SQL
    // so every role only sees its own vendors' revenue)
    prisma.business.findMany({
      where: bizFilter,
      select: { business_id: true, section: { select: { section_name: true } } },
    }),
    prisma.payment.findMany({
      where: { AND: [{ status: "Completed", paid_at: { gte: monthStart } }, payFilter] },
      select: { business_id: true, amount: true },
    }),
    prisma.revenueSummary.findMany({
      where: { AND: [{ summary_date: { gte: new Date(today.getTime() - 29 * 86400000) } }, subOfficeFilter] },
      orderBy: { summary_date: "asc" },
    }),
  ]);

  const revenueToday = Number(revenueTodayAgg._sum.amount ?? 0);
  const revenueYesterday = Number(revenueYesterdayAgg._sum.amount ?? 0);
  const revenueMonth = Number(revenueMonthAgg._sum.amount ?? 0);
  const expectedToday = activeVendors * 300; // rough expected daily collection

  const paidVendorIds = new Set(paidToday.map((p) => p.business_id));
  const complianceToday = activeVendors ? Math.round((paidVendorIds.size / activeVendors) * 100) : 0;

  const growthPct = revenueYesterday > 0 ? Math.round(((revenueToday - revenueYesterday) / revenueYesterday) * 100) : null;

  // Aggregate section breakdown from scoped data
  const sectionMap = new Map<string, { vendors: number; revenue: number }>();
  const bizSection = new Map<number, string>();
  for (const b of scopedBusinesses) {
    const name = b.section?.section_name ?? "Unassigned";
    bizSection.set(b.business_id, name);
    const cur = sectionMap.get(name) ?? { vendors: 0, revenue: 0 };
    cur.vendors++;
    sectionMap.set(name, cur);
  }
  for (const p of monthPayments) {
    const name = bizSection.get(p.business_id) ?? "Unassigned";
    const cur = sectionMap.get(name) ?? { vendors: 0, revenue: 0 };
    cur.revenue += Number(p.amount);
    sectionMap.set(name, cur);
  }
  const section_breakdown = [...sectionMap.entries()]
    .map(([section_name, s]) => ({ section_name, vendor_count: s.vendors, revenue: s.revenue }))
    .sort((a, b) => b.vendor_count - a.vendor_count);

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
    section_breakdown,
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
