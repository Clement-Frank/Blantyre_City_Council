import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses, marketSections, payments } from "@/src/db/schema";
import { getSessionUser } from "@/lib/session";
import { getScope, paymentScopeSql } from "@/lib/permissions";

// GET /api/reports/daily?date=YYYY-MM-DD — real daily revenue aggregates
// for the Daily Revenue Report: totals, fee types, channels (Cash, Airtel
// Money, TNM Mpamba) and revenue by market section.
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dateParam = request.nextUrl.searchParams.get("date");
  let dayStart: Date;
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    dayStart = new Date(`${dateParam}T00:00:00`);
  } else {
    dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
  }
  const dayEnd = new Date(dayStart.getTime() + 86400000);

  const scope = await getScope(user);
  const payScope = paymentScopeSql(scope, {
    collectorId: payments.collector_id,
    businessId: payments.business_id,
  });
  const payWhere = and(
    eq(payments.status, "Completed"),
    gte(payments.paid_at, dayStart),
    lt(payments.paid_at, dayEnd),
    payScope
  );

  const rows = await db
    .select({
      amount: payments.amount,
      fee_type: payments.fee_type,
      payment_channel: payments.payment_channel,
      section_name: marketSections.section_name,
    })
    .from(payments)
    .leftJoin(businesses, eq(businesses.business_id, payments.business_id))
    .leftJoin(marketSections, eq(marketSections.section_id, businesses.section_id))
    .where(payWhere);

  const totalRevenue = rows.reduce((s, p) => s + Number(p.amount), 0);

  const feeTypes: Record<string, number> = {};
  const channels: Record<string, number> = {};
  const sections: Record<string, { amount: number; vendors: Set<string> }> = {};

  for (const p of rows) {
    feeTypes[p.fee_type] = (feeTypes[p.fee_type] ?? 0) + Number(p.amount);
    channels[p.payment_channel] = (channels[p.payment_channel] ?? 0) + Number(p.amount);
    const sectionName = p.section_name ?? "Unassigned";
    if (!sections[sectionName]) sections[sectionName] = { amount: 0, vendors: new Set() };
    // Approximate vendor contribution per section by transaction volume
    sections[sectionName].amount += Number(p.amount);
  }

  // Distinct paying vendors count for the day
  const distinctRows = await db
    .selectDistinct({ business_id: payments.business_id })
    .from(payments)
    .where(payWhere);
  const distinctVendors = distinctRows.length;

  const sectionRows = Object.entries(sections)
    .map(([name, s]) => ({ name, amount: s.amount, vendors: s.vendors.size, transactions: 0 }))
    .sort((a, b) => b.amount - a.amount);

  return NextResponse.json({
    date: dayStart.toISOString().slice(0, 10),
    total_revenue: totalRevenue,
    total_transactions: rows.length,
    active_vendors: distinctVendors,
    fee_types: Object.entries(feeTypes)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount),
    channels: Object.entries(channels)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount),
    sections: sectionRows,
  });
}
