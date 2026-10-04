"use client";

// Limbe Market Command Center — the merged Markets + Market Pulse module.
// One module, one engine: real market record, live sections, vendor
// reliability scoring (MRI), and an enforcement watchlist ranked by the
// MWK/day each stall is costing the council.

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  Activity, ArrowUpRight, BrainCircuit, Flame, Layers,
  Medal, MapPin, Plus, Sparkles, Store, Target, Trophy, Users,
} from "lucide-react";
import { TIER_STYLES, type MriTier } from "@/lib/mri";
import { useAuth } from "@/hooks/useAuth";

interface VendorIntel {
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
  missed_last_30: number;
  revenue_at_risk: number;
  components: { ewma: number; momentum: number; consistency: number };
}

interface SectionIntel {
  section: string;
  vendors: number;
  paid_today: number;
  compliance_today: number;
  avg_mri: number;
  revenue_30d: number;
  revenue_at_risk: number;
  tier: MriTier;
}

interface IntelPayload {
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
  collector_board: { collector_id: number | null; name: string; payments: number; total: number }[];
  algorithm: {
    name: string;
    weights: { ewma: number; momentum: number; consistency: number };
    half_life_days: number;
    prior_strength: number;
    market_prior: number;
    window_days: number;
  };
}

type View = "watchlist" | "streaks" | "all";

export default function MarketCenterPage() {
  const [data, setData] = useState<IntelPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("watchlist");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [newSubmarket, setNewSubmarket] = useState("");
  const [submarketMsg, setSubmarketMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === "Administrator";

  const load = useCallback(() => {
    fetch("/api/market-intel")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addSubmarket = async () => {
    if (!newSubmarket.trim() || !data) return;
    setSubmarketMsg(null);
    try {
      const res = await fetch("/api/markets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ market_id: data.market.market_id, section_name: newSubmarket.trim() }),
      });
      const d = await res.json();
      if (res.ok) {
        setSubmarketMsg({ ok: true, text: `Submarket "${newSubmarket.trim()}" added` });
        setNewSubmarket("");
        load();
      } else {
        setSubmarketMsg({ ok: false, text: d.error || "Failed to add submarket" });
      }
    } catch {
      setSubmarketMsg({ ok: false, text: "Network error" });
    }
  };

  const mwk = (n: number) => `MK ${Math.round(n).toLocaleString("en-MW")}`;

  const shown = useMemo(() => {
    if (!data) return [];
    let list = data.vendors;
    if (view === "watchlist") list = data.watchlist;
    else if (view === "streaks")
      list = [...data.vendors].sort((a, b) => b.current_streak - a.current_streak).slice(0, 10);
    if (sectionFilter !== "all") list = list.filter((v) => (v.section ?? "Unassigned") === sectionFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (v) =>
          v.business_name.toLowerCase().includes(q) ||
          v.vendor_number.toLowerCase().includes(q) ||
          v.owner_name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [data, view, sectionFilter, search]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-gray-400">
          <Activity size={16} className="animate-pulse text-[#3d5a45]" />
          Computing vendor reliability scores…
        </div>
      </div>
    );
  }
  if (!data) {
    return <div className="py-24 text-center text-sm text-red-500">Could not load market intelligence.</div>;
  }

  const s = data.summary;
  const market = data.market;

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* ===== Command center hero ===== */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0E0E0B] text-white shadow-2xl">
        <div className="absolute -top-24 -right-16 w-[420px] h-[420px] rounded-full bg-[#AFE607]/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-10 w-[300px] h-[300px] rounded-full bg-[#AFE607]/5 blur-3xl" />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#AFE607] flex items-center gap-2">
                <Store size={14} />
                {market.sub_office ?? "Blantyre City Council"}
              </p>
              <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
                {market.name} · Command Center
              </h1>
              <p className="mt-1 text-sm text-white/50">
                {market.location} — {market.vendors} vendors across {market.sections} sections,
                scored by the Msika Reliability Index.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
              <div className="rounded-2xl bg-[#141410]/80 border border-[#1F1F1A] px-4 py-3">
                <p className="text-xl font-extrabold text-[#AFE607] tabular-nums">{s.compliance_today}%</p>
                <p className="text-[10px] uppercase tracking-wider text-white/40 mt-0.5">Paid today</p>
              </div>
              <div className="rounded-2xl bg-[#141410]/80 border border-[#1F1F1A] px-4 py-3">
                <p className="text-xl font-extrabold text-white tabular-nums">{s.avg_mri}</p>
                <p className="text-[10px] uppercase tracking-wider text-white/40 mt-0.5">Avg MRI</p>
              </div>
              <div className="rounded-2xl bg-[#141410]/80 border border-[#1F1F1A] px-4 py-3">
                <p className="text-xl font-extrabold text-white tabular-nums">{mwk(s.revenue_30d)}</p>
                <p className="text-[10px] uppercase tracking-wider text-white/40 mt-0.5">Revenue 30d</p>
              </div>
              <div className="rounded-2xl bg-[#141410]/80 border border-[#1F1F1A] px-4 py-3">
                <p className="text-xl font-extrabold text-red-400 tabular-nums">{mwk(s.revenue_at_risk)}</p>
                <p className="text-[10px] uppercase tracking-wider text-white/40 mt-0.5">At risk /day</p>
              </div>
            </div>
          </div>

          {/* Algorithm badge */}
          <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-[#141410]/80 border border-[#1F1F1A] px-4 py-2.5">
            <BrainCircuit size={16} className="text-[#AFE607]" />
            <p className="text-[11px] text-white/50">
              <span className="text-white/90 font-semibold">Msika Reliability Index</span>
              {" "}— EWMA compliance × {data.algorithm.weights.ewma} · momentum × {data.algorithm.weights.momentum} · consistency × {data.algorithm.weights.consistency}, shrunk toward market prior {data.algorithm.market_prior}%
            </p>
          </div>
        </div>
      </section>

      {/* ===== Tier distribution ===== */}
      <section className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <Users size={16} className="text-[#3d5a45] mb-2" />
          <p className="text-2xl font-extrabold text-gray-900 tabular-nums">{s.vendors}</p>
          <p className="text-[11px] text-gray-500">Active vendors</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className={`text-2xl font-extrabold tabular-nums ${TIER_STYLES.Excellent.text}`}>{s.excellent}</p>
          <p className="text-[11px] text-gray-500">Excellent (MRI ≥85)</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-2xl font-extrabold text-teal-700 tabular-nums">
            {s.vendors - s.excellent - s.chronic - data.vendors.filter((v) => ["Watch", "At Risk"].includes(v.tier)).length}
          </p>
          <p className="text-[11px] text-gray-500">Reliable (70–84)</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-2xl font-extrabold text-amber-700 tabular-nums">
            {data.vendors.filter((v) => ["Watch", "At Risk"].includes(v.tier)).length}
          </p>
          <p className="text-[11px] text-gray-500">Watch / At Risk</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className={`text-2xl font-extrabold tabular-nums ${TIER_STYLES.Chronic.text}`}>{s.chronic}</p>
          <p className="text-[11px] text-gray-500">Chronic (MRI &lt;30)</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <Flame size={16} className="text-orange-500 mb-2" />
          <p className="text-2xl font-extrabold text-gray-900 tabular-nums">{s.perfect_streaks}</p>
          <p className="text-[11px] text-gray-500">Perfect 30-day streaks</p>
        </div>
      </section>

      {/* ===== Markets & submarkets ===== */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0E0E0B] text-white shadow-2xl p-6">
        <div className="absolute -top-20 -left-10 w-[300px] h-[300px] rounded-full bg-[#AFE607]/5 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#AFE607] flex items-center justify-center text-[#0E0E0B] shrink-0">
              <Store size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{market.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#AFE607] text-[#0E0E0B]">MARKET</span>
              </div>
              <p className="text-xs text-white/50 mt-1 flex items-center gap-1.5">
                <MapPin size={11} /> {market.location}
                {market.sub_office && (
                  <>
                    <span className="text-white/20">·</span> {market.sub_office} Sub Office
                  </>
                )}
              </p>
              <p className="text-xs text-white/40 mt-2">
                {market.vendors} vendors · {market.sections} submarkets
              </p>
            </div>
          </div>
          {isAdmin && (
            <div className="w-full lg:w-80">
              <p className="text-[11px] text-white/40 mb-2">Add a submarket (section)</p>
              <div className="flex gap-2">
                <input
                  value={newSubmarket}
                  onChange={(e) => setNewSubmarket(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSubmarket()}
                  placeholder="e.g. Chimwemwe Row"
                  className="flex-1 px-3.5 py-2.5 bg-[#1A1A16] border border-[#2A2A24] rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#AFE607]/40"
                />
                <button
                  onClick={addSubmarket}
                  disabled={!newSubmarket.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#AFE607] hover:bg-[#C5F92E] disabled:opacity-40 text-[#0E0E0B] text-sm font-bold rounded-xl transition-colors shrink-0"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
              {submarketMsg && (
                <p className={`text-xs mt-2 ${submarketMsg.ok ? "text-[#AFE607]" : "text-red-400"}`}>{submarketMsg.text}</p>
              )}
            </div>
          )}
        </div>
        <div className="relative flex flex-wrap gap-2 mt-5">
          {data.sections.map((sec) => (
            <button
              key={sec.section}
              onClick={() => {
                setView("all");
                setSectionFilter(sec.section === "Unassigned" ? "Unassigned" : sec.section);
              }}
              className={`group inline-flex items-center gap-2 pl-3 pr-2.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                (sectionFilter === sec.section || (sec.section === "Unassigned" && sectionFilter === "Unassigned"))
                  ? "bg-[#AFE607] text-[#0E0E0B] border-[#AFE607]"
                  : "bg-[#1A1A16] text-white/70 border-[#2A2A24] hover:border-[#AFE607]/50 hover:text-white"
              }`}
              title={`Show vendors in ${sec.section}`}
            >
              {sec.section}
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  (sectionFilter === sec.section || (sec.section === "Unassigned" && sectionFilter === "Unassigned"))
                    ? "bg-[#0E0E0B]/15 text-[#0E0E0B]"
                    : "bg-[#AFE607]/15 text-[#AFE607]"
                }`}
              >
                {sec.vendors}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ===== Section intelligence ===== */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
          <Layers size={15} className="text-[#3d5a45]" /> Section Intelligence — {market.name}
        </h2>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="px-2 py-2">Section</th>
                <th className="px-2 py-2">Vendors</th>
                <th className="px-2 py-2">Paid today</th>
                <th className="px-2 py-2">Compliance</th>
                <th className="px-2 py-2">Avg MRI</th>
                <th className="px-2 py-2">Revenue 30d</th>
                <th className="px-2 py-2">At risk /day</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.sections.map((sec) => (
                <tr
                  key={sec.section}
                  className="hover:bg-gray-50/60 cursor-pointer transition-colors"
                  onClick={() => {
                    setSectionFilter(sec.section === "Unassigned" ? "Unassigned" : sec.section);
                    setView("all");
                  }}
                >
                  <td className="px-2 py-3">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800">
                      <span className={`w-2 h-2 rounded-full ${TIER_STYLES[sec.tier].dot}`} />
                      {sec.section}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-sm text-gray-600 tabular-nums">{sec.vendors}</td>
                  <td className="px-2 py-3 text-sm text-gray-600 tabular-nums">
                    {sec.paid_today}/{sec.vendors}
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            sec.compliance_today >= 70 ? "bg-emerald-500" : sec.compliance_today >= 40 ? "bg-amber-400" : "bg-red-400"
                          }`}
                          style={{ width: `${sec.compliance_today}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 tabular-nums">{sec.compliance_today}%</span>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${TIER_STYLES[sec.tier].bg} ${TIER_STYLES[sec.tier].text}`}>
                      {sec.avg_mri}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-sm font-semibold text-gray-800 tabular-nums">{mwk(sec.revenue_30d)}</td>
                  <td className="px-2 py-3 text-sm font-semibold text-red-500 tabular-nums">
                    {sec.revenue_at_risk > 0 ? mwk(sec.revenue_at_risk) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== Vendors: views ===== */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            {(
              [
                { key: "watchlist", label: `Enforcement (${data.watchlist.length})`, icon: Target },
                { key: "streaks", label: "Top Streaks", icon: Flame },
                { key: "all", label: `All vendors (${data.vendors.length})`, icon: Users },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setView(t.key)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  view === t.key
                    ? "bg-[#0E0E0B] text-[#AFE607]"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                }`}
              >
                <t.icon size={13} />
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#AFE607]/30"
            >
              <option value="all">All sections</option>
              {data.sections.map((sec) => (
                <option key={sec.section} value={sec.section}>
                  {sec.section}
                </option>
              ))}
            </select>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stall or owner…"
              className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs w-44 focus:outline-none focus:ring-2 focus:ring-[#AFE607]/30"
            />
          </div>
        </div>

        <div className="space-y-2">
          {shown.length === 0 && (
            <p className="text-sm text-gray-400 py-8 text-center">Nothing here right now.</p>
          )}
          {shown.map((v) => (
            <Link
              key={v.vendor_number}
              href={`/dashboard/vendors/${v.vendor_number}`}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-50 hover:border-gray-200 hover:bg-gray-50/60 transition-all"
            >
              {/* MRI dial */}
              <div
                className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 ring-1 ${TIER_STYLES[v.tier].bg} ${TIER_STYLES[v.tier].ring}`}
              >
                <span className={`text-sm font-extrabold leading-none ${TIER_STYLES[v.tier].text}`}>{v.mri}</span>
                <span className="text-[8px] uppercase tracking-wider text-gray-400 mt-0.5">MRI</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-800 truncate">{v.business_name}</p>
                  {!v.paid_today && (
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.7)]" title="Unpaid today" />
                  )}
                </div>
                <p className="text-[11px] text-gray-500 truncate">
                  {v.vendor_number} • {v.section ?? "Unassigned"} • fee {mwk(v.daily_fee)}/day
                  {v.current_streak > 0 && ` • 🔥 ${v.current_streak}d streak`}
                </p>
              </div>

              <div className="hidden md:flex items-center gap-4 shrink-0 text-right">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-gray-400">EWMA</p>
                  <p className="text-xs font-bold text-gray-700 tabular-nums">{v.components.ewma}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-gray-400">Streak</p>
                  <p className="text-xs font-bold text-gray-700 tabular-nums">{v.components.momentum}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-gray-400">Steady</p>
                  <p className="text-xs font-bold text-gray-700 tabular-nums">{v.components.consistency}</p>
                </div>
                {v.revenue_at_risk > 0 && (
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-wider text-red-400">At risk</p>
                    <p className="text-xs font-bold text-red-500 tabular-nums">{mwk(v.revenue_at_risk)}</p>
                  </div>
                )}
              </div>

              <span className={`hidden lg:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${TIER_STYLES[v.tier].bg} ${TIER_STYLES[v.tier].text}`}>
                {v.tier}
              </span>
              <ArrowUpRight size={14} className="text-gray-300 shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      {/* ===== Collector board ===== */}
      {data.collector_board.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Trophy size={15} className="text-amber-500" /> Collector Board — cash collected (30 days)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.collector_board.map((c, i) => (
              <div key={c.collector_id ?? i} className="rounded-2xl border border-gray-100 p-4 bg-gray-50/50">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-amber-100 text-amber-700" : "bg-[#e8f0ec] text-[#3d5a45]"}`}>
                    {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                  {i === 0 && <Medal size={14} className="text-amber-500" />}
                </div>
                <p className="text-xl font-extrabold text-gray-900">{mwk(c.total)}</p>
                <p className="text-[11px] text-gray-400">
                  {c.payments} payments • avg {mwk(c.payments ? c.total / c.payments : 0)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== How the score works ===== */}
      <section className="bg-gradient-to-br from-[#0E0E0B] to-[#1A2410] rounded-2xl p-6 text-white shadow-lg border border-[#1F1F1A]">
        <div className="flex items-start gap-3">
          <Sparkles size={18} className="text-[#AFE607] mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-bold">How the Msika Reliability Index works</h3>
            <p className="text-xs text-white/50 mt-2 leading-relaxed">
              Every stall gets a 0–100 dependability score from 30 days of payment history.
              <span className="text-white/80 font-semibold"> Recent payments weigh double</span> (exponentially
              decayed, half-life {data.algorithm.half_life_days} days), a{" "}
              <span className="text-white/80 font-semibold">hot paying streak</span> adds momentum, and{" "}
              <span className="text-white/80 font-semibold">steady daily gaps</span> beat erratic bursts.
              New stalls are <span className="text-white/80 font-semibold">shrunk toward the market average</span>{" "}
              (prior strength {data.algorithm.prior_strength}) so 3 good days never look like 3 months.
              Enforcement targets stalls by <span className="text-[#AFE607] font-semibold">MWK lost per day</span>,
              not just missed days — {mwk(s.revenue_at_risk)}/day is on the table right now.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
