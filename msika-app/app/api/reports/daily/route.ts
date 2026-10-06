import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { getScope, paymentScopeFilter } from "@/lib/permissions";

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
  const payFilter = paymentScopeFilter(scope);

  const payments = await prisma.payment.findMany({
    where: { AND: [{ status: "Completed", paid_at: { gte: dayStart, lt: dayEnd } }, payFilter] },
    select: {
      amount: true,
      fee_type: true,
      payment_channel: true,
      business: {
        select: {
          section: { select: { section_name: true } },
        },
      },
    },
  });

  const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0);

  const feeTypes: Record<string, number> = {};
  const channels: Record<string, number> = {};
  const sections: Record<string, { amount: number; vendors: Set<string> }> = {};

  for (const p of payments) {
    feeTypes[p.fee_type] = (feeTypes[p.fee_type] ?? 0) + Number(p.amount);
    channels[p.payment_channel] = (channels[p.payment_channel] ?? 0) + Number(p.amount);
    const sectionName = p.business.section?.section_name ?? "Unassigned";
    if (!sections[sectionName]) sections[sectionName] = { amount: 0, vendors: new Set() };
    // Approximate vendor contribution per section by transaction volume
    sections[sectionName].amount += Number(p.amount);
  }

  // Distinct paying vendors count for the day
  const distinctVendors = await prisma.payment.findMany({
    where: { AND: [{ status: "Completed", paid_at: { gte: dayStart, lt: dayEnd } }, payFilter] },
    select: { business_id: true },
    distinct: ["business_id"],
  });

  const sectionRows = Object.entries(sections)
    .map(([name, s]) => ({ name, amount: s.amount, vendors: s.vendors.size, transactions: 0 }))
    .sort((a, b) => b.amount - a.amount);

  return NextResponse.json({
    date: dayStart.toISOString().slice(0, 10),
    total_revenue: totalRevenue,
    total_transactions: payments.length,
    active_vendors: distinctVendors.length,
    fee_types: Object.entries(feeTypes)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount),
    channels: Object.entries(channels)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount),
    sections: sectionRows,
  });
}
