import { prisma } from "./prisma";
import type { Scope } from "./permissions";
import { paymentScopeFilter, businessScopeFilter } from "./permissions";

// ============================================================
// Report engine — real aggregates shared by the report pages,
// the CSV export and print/PDF views.
// Every report is scoped exactly like the rest of the app:
// administrators see the council, supervisors their sub-office,
// collectors their own recordings.
// ============================================================

export type ReportType = "daily" | "monthly" | "compliance" | "collectors" | "revenue";

export interface ReportTable {
  title: string;
  subtitle: string;
  summary: { label: string; value: string }[];
  columns: string[];
  rows: (string | number)[][];
  /** File slug used for the download name */
  slug: string;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const dayKey = (d: Date) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c.toISOString().slice(0, 10);
};

/** Monday 00:00 of the week containing `d`. */
const weekStart = (d: Date) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  const day = (c.getDay() + 6) % 7; // Mon=0
  c.setDate(c.getDate() - day);
  return c;
};

const mwk = (n: number) => `MWK ${Math.round(n).toLocaleString("en-MW")}`;

// ------------------------------------------------------------
// Daily revenue — one day, with fee-type / channel / section detail
// ------------------------------------------------------------
export interface DailyDetail {
  date: string;
  total_revenue: number;
  total_transactions: number;
  active_vendors: number;
  fee_types: { name: string; amount: number }[];
  channels: { name: string; amount: number }[];
  sections: { name: string; amount: number; transactions: number }[];
}

export async function dailyReport(
  scope: Scope,
  dateParam?: string | null
): Promise<{ table: ReportTable; detail: DailyDetail }> {
  let dayStart: Date;
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    dayStart = new Date(`${dateParam}T00:00:00`);
  } else {
    dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
  }
  const dayEnd = new Date(dayStart.getTime() + 86400000);
  const payFilter = paymentScopeFilter(scope);
  const where = { AND: [{ status: "Completed" as const, paid_at: { gte: dayStart, lt: dayEnd } }, payFilter] };

  const payments = await prisma.payment.findMany({
    where,
    select: {
      amount: true,
      fee_type: true,
      payment_channel: true,
      business_id: true,
      business: { select: { section: { select: { section_name: true } } } },
    },
  });

  const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0);
  const feeTypes = new Map<string, number>();
  const channels = new Map<string, number>();
  const sections = new Map<string, { amount: number; transactions: number }>();
  const vendors = new Set<number>();

  for (const p of payments) {
    feeTypes.set(p.fee_type, (feeTypes.get(p.fee_type) ?? 0) + Number(p.amount));
    channels.set(p.payment_channel, (channels.get(p.payment_channel) ?? 0) + Number(p.amount));
    const sectionName = p.business.section?.section_name ?? "Unassigned";
    const cur = sections.get(sectionName) ?? { amount: 0, transactions: 0 };
    cur.amount += Number(p.amount);
    cur.transactions += 1;
    sections.set(sectionName, cur);
    vendors.add(p.business_id);
  }

  const byAmount = <T extends { amount: number }>(arr: T[]) => arr.sort((a, b) => b.amount - a.amount);
  const date = dayStart.toISOString().slice(0, 10);

  const detail: DailyDetail = {
    date,
    total_revenue: totalRevenue,
    total_transactions: payments.length,
    active_vendors: vendors.size,
    fee_types: byAmount([...feeTypes.entries()].map(([name, amount]) => ({ name, amount }))),
    channels: byAmount([...channels.entries()].map(([name, amount]) => ({ name, amount }))),
    sections: [...sections.entries()]
      .map(([name, v]) => ({ name, amount: v.amount, transactions: v.transactions }))
      .sort((a, b) => b.amount - a.amount),
  };

  const table: ReportTable = {
    title: "Daily Revenue Report",
    subtitle: `Collections for ${date}`,
    slug: `daily-revenue-${date}`,
    summary: [
      { label: "Total revenue", value: mwk(totalRevenue) },
      { label: "Transactions", value: String(payments.length) },
      { label: "Vendors paid", value: String(vendors.size) },
    ],
    columns: ["Breakdown", "Item", "Amount (MWK)"],
    rows: [
      ...detail.channels.map((c) => ["Channel", c.name, Math.round(c.amount)]),
      ...detail.fee_types.map((f) => ["Fee type", f.name, Math.round(f.amount)]),
      ...detail.sections.map((s) => ["Section", s.name, Math.round(s.amount)]),
    ],
  };

  return { table, detail };
}

// ------------------------------------------------------------
// Monthly revenue — last 6 calendar months
// ------------------------------------------------------------
export async function monthlyReport(scope: Scope): Promise<ReportTable> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const payments = await prisma.payment.findMany({
    where: {
      AND: [{ status: "Completed", paid_at: { gte: start } }, paymentScopeFilter(scope)],
    },
    select: { amount: true, paid_at: true, business_id: true },
  });

  const buckets = new Map<string, { revenue: number; txns: number; vendors: Set<number> }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, {
      revenue: 0,
      txns: 0,
      vendors: new Set(),
    });
  }
  for (const p of payments) {
    if (!p.paid_at) continue;
    const key = `${p.paid_at.getFullYear()}-${String(p.paid_at.getMonth() + 1).padStart(2, "0")}`;
    const b = buckets.get(key);
    if (!b) continue;
    b.revenue += Number(p.amount);
    b.txns += 1;
    b.vendors.add(p.business_id);
  }

  const entries = [...buckets.entries()];
  const totalRevenue = entries.reduce((s, [, b]) => s + b.revenue, 0);
  const totalTxns = entries.reduce((s, [, b]) => s + b.txns, 0);
  const currentMonth = entries[entries.length - 1]?.[1]?.revenue ?? 0;
  const previousMonth = entries[entries.length - 2]?.[1]?.revenue ?? 0;
  const growth =
    previousMonth > 0 ? Math.round(((currentMonth - previousMonth) / previousMonth) * 100) : null;

  const rows = entries.map(([key, b], idx) => {
    const [year, month] = key.split("-").map(Number);
    const prev = idx > 0 ? entries[idx - 1][1].revenue : 0;
    const change = prev > 0 ? Math.round(((b.revenue - prev) / prev) * 100) : 0;
    return [
      `${MONTHS[month - 1]} ${year}`,
      Math.round(b.revenue),
      b.txns,
      b.vendors.size,
      idx === 0 ? "—" : `${change >= 0 ? "+" : ""}${change}%`,
    ];
  });

  return {
    title: "Monthly Revenue Report",
    subtitle: `${MONTHS[new Date(entries[0]?.[0] + "-01").getMonth()]} – ${MONTHS[now.getMonth()]} ${now.getFullYear()}`,
    slug: "monthly-revenue",
    summary: [
      { label: "Total revenue (6 months)", value: mwk(totalRevenue) },
      { label: "Transactions", value: totalTxns.toLocaleString() },
      {
        label: "This month vs last",
        value: growth === null ? "—" : `${growth >= 0 ? "+" : ""}${growth}%`,
      },
    ],
    columns: ["Month", "Revenue (MWK)", "Transactions", "Paying vendors", "Change"],
    rows,
  };
}

// ------------------------------------------------------------
// Vendor compliance — last 30 days, per vendor
// ------------------------------------------------------------
export async function complianceReport(scope: Scope): Promise<ReportTable> {
  const windowDays = 30;
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - (windowDays - 1));

  const businesses = await prisma.business.findMany({
    where: { AND: [{ status: "Active" }, businessScopeFilter(scope)] },
    select: {
      business_id: true,
      vendor_number: true,
      business_name: true,
      owner_name: true,
      market: { select: { name: true } },
      section: { select: { section_name: true } },
    },
    orderBy: { business_name: "asc" },
  });

  const payments = await prisma.payment.findMany({
    where: { AND: [{ status: "Completed", paid_at: { gte: from } }, paymentScopeFilter(scope)] },
    select: { business_id: true, paid_at: true },
  });

  const paidDays = new Map<number, Set<string>>();
  for (const p of payments) {
    if (!p.paid_at) continue;
    const set = paidDays.get(p.business_id) ?? new Set<string>();
    set.add(dayKey(p.paid_at));
    paidDays.set(p.business_id, set);
  }

  const rows = businesses.map((b) => {
    const days = paidDays.get(b.business_id)?.size ?? 0;
    const pct = Math.round((days / windowDays) * 100);
    const status = pct >= 80 ? "Compliant" : pct >= 50 ? "At Risk" : "Non-Compliant";
    return [
      b.vendor_number,
      b.business_name,
      b.owner_name,
      b.market.name,
      b.section?.section_name ?? "—",
      days,
      windowDays - days,
      `${pct}%`,
      status,
    ];
  });

  const compliant = rows.filter((r) => r[8] === "Compliant").length;
  const atRisk = rows.filter((r) => r[8] === "At Risk").length;
  const nonCompliant = rows.filter((r) => r[8] === "Non-Compliant").length;

  return {
    title: "Vendor Compliance Report",
    subtitle: `Payment frequency over the last ${windowDays} days`,
    slug: "vendor-compliance",
    summary: [
      { label: "Compliant vendors", value: String(compliant) },
      { label: "At risk", value: String(atRisk) },
      { label: "Non-compliant", value: String(nonCompliant) },
    ],
    columns: [
      "Vendor No.",
      "Business",
      "Owner",
      "Market",
      "Section",
      "Days paid",
      "Days missed",
      "Compliance",
      "Status",
    ],
    rows,
  };
}

// ------------------------------------------------------------
// Collector performance — last 30 days
// ------------------------------------------------------------
export async function collectorReport(scope: Scope): Promise<ReportTable> {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - 29);

  // A collector sees only their own performance row; supervisors see their
  // sub-office; administrators see everyone.
  const collectorWhere =
    scope.role === "Collector"
      ? { collector_id: scope.collectorId ?? -1 }
      : scope.subOfficeId
        ? { sub_office_id: scope.subOfficeId }
        : {};

  const [collectors, payments, registrations] = await Promise.all([
    prisma.collector.findMany({
      where: collectorWhere,
      select: {
        collector_id: true,
        full_name: true,
        username: true,
        sub_office: { select: { name: true } },
      },
      orderBy: { full_name: "asc" },
    }),
    prisma.payment.findMany({
      where: { AND: [{ status: "Completed", paid_at: { gte: from } }, paymentScopeFilter(scope)] },
      select: { collector_id: true, amount: true, paid_at: true },
    }),
    prisma.business.findMany({
      where: { AND: [{ registration_date: { gte: from } }, businessScopeFilter(scope)] },
      select: { registered_by_collector_id: true },
    }),
  ]);

  const perCollector = new Map<number, { count: number; amount: number; days: Set<string> }>();
  for (const p of payments) {
    if (!p.collector_id) continue;
    const cur = perCollector.get(p.collector_id) ?? { count: 0, amount: 0, days: new Set<string>() };
    cur.count += 1;
    cur.amount += Number(p.amount);
    if (p.paid_at) cur.days.add(dayKey(p.paid_at));
    perCollector.set(p.collector_id, cur);
  }

  const regsPerCollector = new Map<number, number>();
  for (const r of registrations) {
    if (!r.registered_by_collector_id) continue;
    regsPerCollector.set(
      r.registered_by_collector_id,
      (regsPerCollector.get(r.registered_by_collector_id) ?? 0) + 1
    );
  }

  const rows = collectors
    .map((c) => {
      const stats = perCollector.get(c.collector_id);
      const vendored = regsPerCollector.get(c.collector_id) ?? 0;
      return {
        name: c.full_name,
        username: c.username,
        subOffice: c.sub_office?.name ?? "—",
        registered: vendored,
        verified: stats?.count ?? 0,
        collected: Math.round(stats?.amount ?? 0),
        activeDays: stats?.days.size ?? 0,
      };
    })
    .sort((a, b) => b.collected - a.collected);

  const totals = rows.reduce(
    (acc, r) => ({
      registered: acc.registered + r.registered,
      verified: acc.verified + r.verified,
      collected: acc.collected + r.collected,
    }),
    { registered: 0, verified: 0, collected: 0 }
  );

  return {
    title: "Collector Performance Report",
    subtitle: "Registrations and cash collections over the last 30 days",
    slug: "collector-performance",
    summary: [
      { label: "Vendors registered", value: totals.registered.toLocaleString() },
      { label: "Payments recorded", value: totals.verified.toLocaleString() },
      { label: "Cash collected", value: mwk(totals.collected) },
    ],
    columns: [
      "Collector",
      "Username",
      "Sub-office",
      "Vendors registered",
      "Payments recorded",
      "Cash collected (MWK)",
      "Active days",
    ],
    rows: rows.map((r) => [
      r.name,
      `@${r.username}`,
      r.subOffice,
      r.registered,
      r.verified,
      r.collected,
      r.activeDays,
    ]),
  };
}

// ------------------------------------------------------------
// Revenue trend — last 12 weeks
// ------------------------------------------------------------
export async function revenueTrendReport(scope: Scope): Promise<ReportTable> {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - 7 * 12);

  const payments = await prisma.payment.findMany({
    where: { AND: [{ status: "Completed", paid_at: { gte: from } }, paymentScopeFilter(scope)] },
    select: { amount: true, paid_at: true, business_id: true },
  });

  const buckets = new Map<string, { revenue: number; txns: number; vendors: Set<number> }>();
  for (let i = 11; i >= 0; i--) {
    const start = weekStart(new Date());
    start.setDate(start.getDate() - i * 7);
    buckets.set(dayKey(start), { revenue: 0, txns: 0, vendors: new Set() });
  }
  for (const p of payments) {
    if (!p.paid_at) continue;
    const key = dayKey(weekStart(p.paid_at));
    const b = buckets.get(key);
    if (!b) continue;
    b.revenue += Number(p.amount);
    b.txns += 1;
    b.vendors.add(p.business_id);
  }

  const entries = [...buckets.entries()];
  const total = entries.reduce((s, [, b]) => s + b.revenue, 0);
  const peak = entries.reduce(
    (best, entry) => (entry[1].revenue > best[1].revenue ? entry : best),
    entries[0] ?? ["", { revenue: 0, txns: 0, vendors: new Set<number>() }]
  );
  const half = Math.floor(entries.length / 2);
  const firstHalf = entries.slice(0, half).reduce((s, [, b]) => s + b.revenue, 0);
  const secondHalf = entries.slice(half).reduce((s, [, b]) => s + b.revenue, 0);
  const trend = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : null;

  const rows = entries.map(([key, b]) => {
    const d = new Date(`${key}T00:00:00`);
    const label = `Wk of ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
    return [label, Math.round(b.revenue), b.txns, b.vendors.size];
  });

  return {
    title: "Revenue Trends Report",
    subtitle: "Weekly collections for the last 12 weeks",
    slug: "revenue-trends",
    summary: [
      { label: "Total (12 weeks)", value: mwk(total) },
      {
        label: "Best week",
        value: peak[1].revenue ? `${mwk(peak[1].revenue)}` : "—",
      },
      {
        label: "Recent trend",
        value: trend === null ? "—" : `${trend >= 0 ? "+" : ""}${trend}%`,
      },
    ],
    columns: ["Week", "Revenue (MWK)", "Transactions", "Paying vendors"],
    rows,
  };
}

// ------------------------------------------------------------
// CSV serialisation
// ------------------------------------------------------------
export function toCsv(table: ReportTable): string {
  const escape = (value: string | number) => {
    const s = String(value ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    escape(table.title),
    escape(table.subtitle),
    "",
    ...table.summary.map((s) => `${escape(s.label)},${escape(s.value)}`),
    "",
    table.columns.map(escape).join(","),
    ...table.rows.map((row) => row.map(escape).join(",")),
  ];
  return `${lines.join("\n")}\n`;
}

/** Dispatch used by both the JSON and CSV endpoints. */
export async function buildReport(
  type: ReportType,
  scope: Scope
): Promise<ReportTable | null> {
  switch (type) {
    case "monthly":
      return monthlyReport(scope);
    case "compliance":
      return complianceReport(scope);
    case "collectors":
      return collectorReport(scope);
    case "revenue":
      return revenueTrendReport(scope);
    default:
      return null;
  }
}
