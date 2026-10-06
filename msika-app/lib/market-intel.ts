import { and, asc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { db } from "./db";
import {
  businesses as businessesTable,
  businessTypes as businessTypesTable,
  collectors as collectorsTable,
  marketSections as marketSectionsTable,
  markets as marketsTable,
  payments as paymentsTable,
  subOffices as subOfficesTable,
} from "@/src/db/schema";
import { businessScopeSql, paymentScopeSql } from "./permissions";

// ============================================================
// Msika Market Intelligence Engine
// ============================================================
// ONE engine powering every analytics surface (Market Center,
// dashboard focus panel, watchlists) so numbers can never
// disagree between modules.
//
// ── The Msika Reliability Index (MRI) ────────────────────────
// A 0–100 vendor score answering: "how dependable is this
// stall at paying its daily market fee?"
//
//   MRI_raw = 100 × ( 0.60·W + 0.25·S + 0.15·C )
//
//   W  EWMA compliance      — share of active days paid, with
//                             exponential recency weighting
//                             (half-life 10 days): yesterday's
//                             payment counts ~2× a payment from
//                             10 days ago.
//   S  Momentum             — current consecutive-day paying
//                             streak, saturating at 14 days.
//   C  Consistency          — 1 − coefficient of variation of
//                             inter-payment gaps: steady payers
//                             score high, erratic ones low.
//
//   MRI = shrink(MRI_raw)   — empirical-Bayes shrinkage toward
//                             the market-wide compliance prior:
//                             MRI = (n·MRI_raw + k·100·m̄)/(n + k)
//                             with prior strength k = 10 and n =
//                             the vendor's active days in the
//                             window. New stalls start near the
//                             market average instead of 0 or 100.
//
// Tiers: ≥85 Excellent · ≥70 Reliable · ≥50 Watch ·
//        ≥30 At Risk · else Chronic.
// Revenue-at-risk = daily fee × (1 − MRI/100) — the expected
// MWK/day a stall is costing the council, used to rank
// enforcement priorities.
// ============================================================

// Scoring constants, tiers and UI styles live in the client-safe
// lib/mri.ts — re-exported here so server code has one import path.
export {
  MRI_WEIGHTS,
  MRI_HALF_LIFE_DAYS,
  MRI_MOMENTUM_SATURATION_DAYS,
  MRI_PRIOR_STRENGTH,
  INTEL_WINDOW_DAYS,
  mriTier,
  TIER_STYLES,
} from "./mri";
export type { MriTier } from "./mri";

// Server-side copies of the constants the math needs at runtime.
import {
  MRI_WEIGHTS as W,
  MRI_HALF_LIFE_DAYS as HALF_LIFE,
  MRI_MOMENTUM_SATURATION_DAYS as SATURATION,
  MRI_PRIOR_STRENGTH as PRIOR_K,
  INTEL_WINDOW_DAYS as WINDOW,
  mriTier,
} from "./mri";
import type { MriTier } from "./mri";

const iso = (d: Date) => d.toISOString().slice(0, 10);

// ---------- pure scoring primitives (exported for tests) ----------

/** Sum of EWMA weights over an inclusive day range ending today. */
export function ewmaTotalWeight(activeDays: number, halfLife = HALF_LIFE): number {
  let total = 0;
  for (let age = 0; age < activeDays; age++) total += Math.pow(0.5, age / halfLife);
  return total;
}

/**
 * Score one vendor from its set of paid ISO dates.
 * `today` and `registeredAt` are Date objects; all computation is in day steps.
 */
export function scoreVendor(
  paidDays: Set<string>,
  today: Date,
  registeredAt: Date,
  marketPrior: number // 0..1 market-wide raw compliance
): {
  mri: number;
  tier: MriTier;
  current_streak: number;
  longest_streak: number;
  paid_last_30: number;
  missed_last_30: number;
  ewma: number;
  consistency: number;
  momentum: number;
} {
  // Active window: last 30 days, clamped to how long the stall has existed.
  const ageDays = Math.max(
    0,
    Math.floor((today.getTime() - new Date(registeredAt).setHours(0, 0, 0, 0)) / 86400000)
  );
  const activeDays = Math.min(WINDOW, ageDays + 1);

  // -- W: EWMA compliance ------------------------------------
  let paidWeight = 0;
  for (let i = 0; i < activeDays; i++) {
    const d = iso(new Date(today.getTime() - i * 86400000));
    if (paidDays.has(d)) paidWeight += Math.pow(0.5, i / HALF_LIFE);
  }
  const totalWeight = ewmaTotalWeight(activeDays);
  const ewma = totalWeight > 0 ? paidWeight / totalWeight : 0;

  // -- S: momentum (current streak, saturating) ---------------
  let cur = 0;
  let cursor = new Date(today);
  if (!paidDays.has(iso(cursor))) cursor = new Date(today.getTime() - 86400000);
  while (paidDays.has(iso(cursor))) {
    cur++;
    cursor = new Date(cursor.getTime() - 86400000);
  }
  const momentum = Math.min(cur / SATURATION, 1);

  // -- C: consistency (1 − CV of inter-payment gaps) ----------
  const paidSorted = [...paidDays].sort();
  const recent = paidSorted.filter((d) => d >= iso(new Date(today.getTime() - (activeDays - 1) * 86400000)));
  let consistency = 0;
  if (recent.length >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < recent.length; i++) {
      gaps.push(
        Math.round((new Date(recent[i]).getTime() - new Date(recent[i - 1]).getTime()) / 86400000)
      );
    }
    const mean = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    if (mean > 0) {
      const variance = gaps.reduce((s, g) => s + (g - mean) ** 2, 0) / gaps.length;
      consistency = Math.max(0, Math.min(1, 1 - Math.sqrt(variance) / mean));
    }
  } else if (recent.length === 1 && activeDays === 1) {
    consistency = 1; // paid the one day they have existed
  }

  const raw = 100 * (W.ewma * ewma + W.momentum * momentum + W.consistency * consistency);

  // -- Empirical-Bayes shrinkage toward the market prior ------
  const n = Math.max(activeDays, 1);
  const mri = Math.round((n * raw + PRIOR_K * 100 * marketPrior) / (n + PRIOR_K));

  // -- longest run inside the window ---------------------------
  let best = 0;
  let run = 0;
  for (let i = activeDays - 1; i >= 0; i--) {
    if (paidDays.has(iso(new Date(today.getTime() - i * 86400000)))) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }

  return {
    mri: Math.max(0, Math.min(100, mri)),
    tier: mriTier(Math.max(0, Math.min(100, mri))),
    current_streak: cur,
    longest_streak: Math.max(best, cur),
    paid_last_30: recent.length,
    missed_last_30: Math.max(0, activeDays - recent.length),
    ewma: Math.round(ewma * 100),
    consistency: Math.round(consistency * 100),
    momentum: Math.round(momentum * 100),
  };
}

// ---------- payload types ----------

export interface VendorIntel {
  business_id: number;
  vendor_number: string;
  business_name: string;
  owner_name: string;
  section: string | null;
  daily_fee: number;
  paid_today: boolean;
  mri: number;
  tier: MriTier;
  current_streak: number;
  longest_streak: number;
  paid_last_30: number;
  missed_last_30: number;
  revenue_at_risk: number;
  components: { ewma: number; momentum: number; consistency: number };
}

export interface SectionIntel {
  section: string;
  vendors: number;
  paid_today: number;
  compliance_today: number;
  avg_mri: number;
  revenue_30d: number;
  revenue_at_risk: number;
  tier: MriTier;
}

export interface CollectorIntel {
  collector_id: number | null;
  name: string;
  payments: number;
  total: number;
}

export interface MarketIntelPayload {
  market: {
    market_id: number;
    name: string;
    location: string;
    sub_office: string | null;
    vendors: number;
    sections: number;
  };
  summary: {
    vendors: number;
    paid_today: number;
    unpaid_today: number;
    compliance_today: number;
    avg_mri: number;
    excellent: number;
    chronic: number;
    perfect_streaks: number;
    revenue_30d: number;
    revenue_at_risk: number;
  };
  sections: SectionIntel[];
  vendors: VendorIntel[];
  watchlist: VendorIntel[];
  top_streaks: VendorIntel[];
  collector_board: CollectorIntel[];
  algorithm: {
    name: string;
    weights: typeof W;
    half_life_days: number;
    prior_strength: number;
    market_prior: number;
    window_days: number;
  };
}

// ---------- the one builder every surface calls ----------

export async function buildMarketIntel(scope: {
  role: string;
  collectorId: number | null;
  supervisorId: number | null;
  subOfficeId: number | null;
}): Promise<MarketIntelPayload> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const windowStart = new Date(today.getTime() - (WINDOW - 1) * 86400000);

  const bizWhere = and(
    eq(businessesTable.status, "Active"),
    businessScopeSql(scope, { registeredBy: businessesTable.registered_by_collector_id, marketId: businessesTable.market_id })
  );
  const payWhere = and(
    eq(paymentsTable.status, "Completed"),
    gte(paymentsTable.paid_at, windowStart),
    paymentScopeSql(scope, { collectorId: paymentsTable.collector_id, businessId: paymentsTable.business_id })
  );

  const [marketRows, vendorsRaw, payments, collectorRows, collectors] = await Promise.all([
    // The council's flagship market — real record, not mock data.
    db
      .select({
        market_id: marketsTable.market_id,
        name: marketsTable.name,
        location: marketsTable.location,
        sub_office: subOfficesTable.name,
      })
      .from(marketsTable)
      .leftJoin(subOfficesTable, eq(subOfficesTable.sub_office_id, marketsTable.sub_office_id))
      .where(scope.subOfficeId && scope.role === "Supervisor" ? eq(marketsTable.sub_office_id, scope.subOfficeId) : undefined)
      .orderBy(asc(marketsTable.market_id))
      .limit(1),
    db
      .select({
        business_id: businessesTable.business_id,
        vendor_number: businessesTable.vendor_number,
        business_name: businessesTable.business_name,
        owner_name: businessesTable.owner_name,
        registration_date: businessesTable.registration_date,
        market_id: businessesTable.market_id,
        section_name: marketSectionsTable.section_name,
        fee_amount: businessTypesTable.fee_amount,
      })
      .from(businessesTable)
      .leftJoin(marketSectionsTable, eq(marketSectionsTable.section_id, businessesTable.section_id))
      .leftJoin(businessTypesTable, eq(businessTypesTable.business_type_id, businessesTable.business_type_id))
      .where(bizWhere),
    db
      .select({ business_id: paymentsTable.business_id, paid_at: paymentsTable.paid_at, amount: paymentsTable.amount })
      .from(paymentsTable)
      .where(payWhere),
    db
      .select({
        collector_id: paymentsTable.collector_id,
        _count: { payment_id: sql<number>`count(*)::int` },
        _sum: { amount: sql<string>`sum(${paymentsTable.amount})` },
      })
      .from(paymentsTable)
      .where(and(payWhere, isNotNull(paymentsTable.collector_id)))
      .groupBy(paymentsTable.collector_id),
    db
      .select({ collector_id: collectorsTable.collector_id, full_name: collectorsTable.full_name, sub_office_id: collectorsTable.sub_office_id })
      .from(collectorsTable),
  ]);

  // Stitch to the row shapes the scoring code below already expects.
  const market = marketRows[0];
  const vendors = vendorsRaw.map((v) => ({
    ...v,
    section: v.section_name ? { section_name: v.section_name } : null,
    business_type: v.fee_amount != null ? { fee_amount: v.fee_amount } : null,
  }));

  // Paid-date sets per vendor + 30-day revenue per vendor
  const paysByVendor = new Map<number, Set<string>>();
  const revenue30ByVendor = new Map<number, number>();
  let revenue30d = 0;
  for (const p of payments) {
    if (!p.paid_at) continue;
    const key = iso(p.paid_at);
    const set = paysByVendor.get(p.business_id) ?? new Set<string>();
    set.add(key);
    paysByVendor.set(p.business_id, set);
    revenue30ByVendor.set(p.business_id, (revenue30ByVendor.get(p.business_id) ?? 0) + Number(p.amount));
    revenue30d += Number(p.amount);
  }

  // Market prior: share of active days paid across all scoped vendors
  let totalPaidDays = 0;
  let totalActiveDays = 0;
  for (const v of vendors) {
    const days = paysByVendor.get(v.business_id) ?? new Set<string>();
    const ageDays = Math.max(
      0,
      Math.floor((today.getTime() - new Date(v.registration_date).setHours(0, 0, 0, 0)) / 86400000)
    );
    const activeDays = Math.min(WINDOW, ageDays + 1);
    totalPaidDays += Math.min(days.size, activeDays);
    totalActiveDays += activeDays;
  }
  const marketPrior = totalActiveDays > 0 ? totalPaidDays / totalActiveDays : 0;

  // Score every vendor
  const intel: VendorIntel[] = vendors.map((v) => {
    const days = paysByVendor.get(v.business_id) ?? new Set<string>();
    const s = scoreVendor(days, today, v.registration_date, marketPrior);
    const fee = v.business_type ? Number(v.business_type.fee_amount) : 0;
    return {
      business_id: v.business_id,
      vendor_number: v.vendor_number,
      business_name: v.business_name,
      owner_name: v.owner_name,
      section: v.section?.section_name ?? null,
      daily_fee: fee,
      paid_today: days.has(iso(today)),
      mri: s.mri,
      tier: s.tier,
      current_streak: s.current_streak,
      longest_streak: s.longest_streak,
      paid_last_30: s.paid_last_30,
      missed_last_30: s.missed_last_30,
      revenue_at_risk: Math.round(fee * (1 - s.mri / 100)),
      components: { ewma: s.ewma, momentum: s.momentum, consistency: s.consistency },
    };
  });

  const paidTodayCount = intel.filter((v) => v.paid_today).length;

  // Section analytics — computed once, here
  const sectionMap = new Map<string, { vendors: number; paidToday: number; mriSum: number; revenue: number; risk: number }>();
  for (const v of intel) {
    const key = v.section ?? "Unassigned";
    const cur =
      sectionMap.get(key) ?? { vendors: 0, paidToday: 0, mriSum: 0, revenue: 0, risk: 0 };
    cur.vendors++;
    if (v.paid_today) cur.paidToday++;
    cur.mriSum += v.mri;
    cur.revenue += revenue30ByVendor.get(v.business_id) ?? 0;
    cur.risk += v.revenue_at_risk;
    sectionMap.set(key, cur);
  }
  const sections: SectionIntel[] = [...sectionMap.entries()]
    .map(([section, s]) => {
      const avg = Math.round(s.mriSum / s.vendors);
      return {
        section,
        vendors: s.vendors,
        paid_today: s.paidToday,
        compliance_today: Math.round((s.paidToday / s.vendors) * 100),
        avg_mri: avg,
        revenue_30d: s.revenue,
        revenue_at_risk: s.risk,
        tier: mriTier(avg),
      };
    })
    .sort((a, b) => b.avg_mri - a.avg_mri);

  // Enforcement watchlist — ranked by MWK/day at risk (MRI × fee),
  // so enforcement effort targets the stalls costing the council most.
  const watchlist = [...intel]
    .filter((v) => !v.paid_today && v.revenue_at_risk > 0)
    .sort((a, b) => b.revenue_at_risk - a.revenue_at_risk || a.mri - b.mri)
    .slice(0, 10);

  const top_streaks = [...intel]
    .sort((a, b) => b.current_streak - a.current_streak || b.longest_streak - a.longest_streak)
    .slice(0, 5);

  // Collector board — supervisors only see collectors in their sub-office
  const visibleCollectors =
    scope.role === "Supervisor" && scope.subOfficeId
      ? collectors.filter((c) => c.sub_office_id === scope.subOfficeId)
      : collectors;
  const visibleIds = new Set(visibleCollectors.map((c) => c.collector_id));
  const collector_board: CollectorIntel[] = collectorRows
    .map((r) => ({
      collector_id: r.collector_id,
      name: collectors.find((c) => c.collector_id === r.collector_id)?.full_name ?? "Unknown",
      payments: r._count.payment_id,
      total: Number(r._sum.amount ?? 0),
    }))
    .filter((r) => r.collector_id === scope.collectorId || visibleIds.has(r.collector_id ?? -1))
    .sort((a, b) => b.total - a.total);

  const avgMri = intel.length ? Math.round(intel.reduce((s, v) => s + v.mri, 0) / intel.length) : 0;

  return {
    market: {
      market_id: market?.market_id ?? 1,
      name: market?.name ?? "Limbe Market",
      location: market?.location ?? "Limbe, Blantyre",
      sub_office: market?.sub_office ?? null,
      vendors: intel.length,
      sections: sections.filter((s) => s.section !== "Unassigned").length,
    },
    summary: {
      vendors: intel.length,
      paid_today: paidTodayCount,
      unpaid_today: intel.length - paidTodayCount,
      compliance_today: intel.length ? Math.round((paidTodayCount / intel.length) * 100) : 0,
      avg_mri: avgMri,
      excellent: intel.filter((v) => v.tier === "Excellent").length,
      chronic: intel.filter((v) => v.tier === "Chronic").length,
      perfect_streaks: intel.filter((v) => v.current_streak >= WINDOW).length,
      revenue_30d: Math.round(revenue30d),
      revenue_at_risk: intel.reduce((s, v) => s + v.revenue_at_risk, 0),
    },
    sections,
    vendors: intel.sort((a, b) => a.mri - b.mri), // weakest first — enforcement view
    watchlist,
    top_streaks,
    collector_board,
    algorithm: {
      name: "Msika Reliability Index (EWMA + momentum + consistency, empirical-Bayes shrunk)",
      weights: W,
      half_life_days: HALF_LIFE,
      prior_strength: PRIOR_K,
      market_prior: Math.round(marketPrior * 100),
      window_days: WINDOW,
    },
  };
}
