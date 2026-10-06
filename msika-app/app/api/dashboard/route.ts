import { NextResponse } from "next/server";
import { and, asc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  businesses,
  marketSections,
  payments,
  revenueSummaries,
} from "@/src/db/schema";
import { getSessionUser } from "@/lib/session";
import { getScope, businessScopeSql, paymentScopeSql } from "@/lib/permissions";

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
  const bizScope = businessScopeSql(scope, {
    registeredBy: businesses.registered_by_collector_id,
    marketId: businesses.market_id,
  });
  const payScope = paymentScopeSql(scope, {
    collectorId: payments.collector_id,
    businessId: payments.business_id,
  });
  // Revenue summaries roll up per sub-office — supervisors only see their own
  const summaryWhere = scope.subOfficeId ? eq(revenueSummaries.sub_office_id, scope.subOfficeId) : undefined;

  const [
    totalVendors,
    activeVendors,
    paidToday,
    revenueTodayRows,
    revenueYesterdayRows,
    revenueMonthRows,
    paymentsToday,
    failedToday,
    newVendorsWeek,
    weeklyRevenue,
    scopedBusinesses,
    monthPayments,
    dailySeries,
  ] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(businesses).where(bizScope),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(businesses)
      .where(bizScope ? and(eq(businesses.status, "Active"), bizScope) : eq(businesses.status, "Active")),
    db
      .select({ business_id: payments.business_id })
      .from(payments)
      .where(
        and(
          eq(payments.status, "Completed"),
          gte(payments.paid_at, today),
          payScope
        )
      ),
    db
      .select({ sum: sql<string>`sum(${payments.amount})` })
      .from(payments)
      .where(
        and(
          eq(payments.status, "Completed"),
          gte(payments.paid_at, today),
          payScope
        )
      ),
    db
      .select({ sum: sql<string>`sum(${payments.amount})` })
      .from(payments)
      .where(
        and(
          eq(payments.status, "Completed"),
          gte(payments.paid_at, yesterday),
          lt(payments.paid_at, today),
          payScope
        )
      ),
    db
      .select({ sum: sql<string>`sum(${payments.amount})` })
      .from(payments)
      .where(
        and(
          eq(payments.status, "Completed"),
          gte(payments.paid_at, monthStart),
          payScope
        )
      ),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(payments)
      .where(
        and(
          eq(payments.status, "Completed"),
          gte(payments.paid_at, today),
          payScope
        )
      ),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(payments)
      .where(
        and(
          gte(payments.paid_at, today),
          eq(payments.status, "Failed"),
          payScope
        )
      ),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(businesses)
      .where(bizScope ? and(gte(businesses.registration_date, weekAgo), bizScope) : gte(businesses.registration_date, weekAgo)),
    db
      .select()
      .from(revenueSummaries)
      .where(
        summaryWhere ? and(gte(revenueSummaries.summary_date, summaryDayKey(weekAgo)), summaryWhere) : gte(revenueSummaries.summary_date, summaryDayKey(weekAgo))
      )
      .orderBy(asc(revenueSummaries.summary_date)),
    db
      .select({
        business_id: businesses.business_id,
        section_name: marketSections.section_name,
      })
      .from(businesses)
      .leftJoin(marketSections, eq(marketSections.section_id, businesses.section_id))
      .where(bizScope),
    db
      .select({ business_id: payments.business_id, amount: payments.amount })
      .from(payments)
      .where(
        and(
          eq(payments.status, "Completed"),
          gte(payments.paid_at, monthStart),
          payScope
        )
      ),
    db
      .select()
      .from(revenueSummaries)
      .where(
        summaryWhere
          ? and(gte(revenueSummaries.summary_date, summaryDayKey(new Date(today.getTime() - 29 * 86400000))), summaryWhere)
          : gte(revenueSummaries.summary_date, summaryDayKey(new Date(today.getTime() - 29 * 86400000)))
      )
      .orderBy(asc(revenueSummaries.summary_date)),
  ]);

  const revenueToday = Number(revenueTodayRows[0]?.sum ?? 0);
  const revenueYesterday = Number(revenueYesterdayRows[0]?.sum ?? 0);
  const revenueMonth = Number(revenueMonthRows[0]?.sum ?? 0);
  const expectedToday = (activeVendors[0]?.n ?? 0) * 300; // rough expected daily collection

  const paidVendorIds = new Set(paidToday.map((p) => p.business_id));
  const activeCount = activeVendors[0]?.n ?? 0;
  const complianceToday = activeCount ? Math.round((paidVendorIds.size / activeCount) * 100) : 0;

  const growthPct = revenueYesterday > 0 ? Math.round(((revenueToday - revenueYesterday) / revenueYesterday) * 100) : null;

  // Aggregate section breakdown from scoped data
  const sectionMap = new Map<string, { vendors: number; revenue: number }>();
  const bizSection = new Map<number, string>();
  for (const b of scopedBusinesses) {
    const name = b.section_name ?? "Unassigned";
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
      total_vendors: totalVendors[0]?.n ?? 0,
      active_vendors: activeCount,
      paid_today: paidVendorIds.size,
      unpaid_today: activeCount - paidVendorIds.size,
      compliance_today: complianceToday,
      revenue_today: revenueToday,
      revenue_yesterday: revenueYesterday,
      revenue_month: revenueMonth,
      revenue_growth_pct: growthPct,
      transactions_today: paymentsToday[0]?.n ?? 0,
      failed_today: failedToday[0]?.n ?? 0,
      new_vendors_week: newVendorsWeek[0]?.n ?? 0,
      collection_rate: expectedToday ? Math.round((revenueToday / expectedToday) * 100) : 0,
    },
    section_breakdown,
    weekly_revenue: weeklyRevenue.map((r) => ({
      date: summaryDateToIso(r.summary_date),
      amount: Number(r.total_amount),
      transactions: r.total_transactions,
    })),
    daily_series: dailySeries.map((r) => ({
      date: summaryDateToIso(r.summary_date),
      amount: Number(r.total_amount),
      transactions: r.total_transactions,
    })),
  });
}

// RevenueSummary.summary_date is a date column (string keys in Drizzle).
function summaryDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function summaryDateToIso(d: string): string {
  return new Date(`${d}T00:00:00Z`).toISOString().slice(0, 10);
}
