"use client";

// Market Focus — dashboard snapshot from the ONE market-intel engine,
// identical numbers to the Markets module. Links into the
// full module instead of duplicating its statistics.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowUpRight, BrainCircuit, Target } from "lucide-react";
import { TIER_STYLES, type MriTier } from "@/lib/mri";

interface VendorIntel {
  vendor_number: string;
  business_name: string;
  section: string | null;
  mri: number;
  tier: MriTier;
  revenue_at_risk: number;
}

interface FocusData {
  summary: {
    compliance_today: number;
    avg_mri: number;
    revenue_at_risk: number;
    excellent: number;
    chronic: number;
  };
  watchlist: VendorIntel[];
}

export default function MarketFocusCard() {
  const [data, setData] = useState<FocusData | null>(null);

  useEffect(() => {
    fetch("/api/market-intel")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => undefined);
  }, []);

  if (!data) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-[#E5E5E0] shadow-sm h-full flex items-center justify-center">
        <div className="inline-flex items-center gap-2 text-xs text-gray-400">
          <Activity size={14} className="animate-pulse text-[#3d5a45]" />
          Loading market focus…
        </div>
      </div>
    );
  }

  const mwk = (n: number) => `MK ${Math.round(n).toLocaleString("en-MW")}`;

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E5E5E0] shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-bold text-[#0E0E0B] flex items-center gap-2">
          <BrainCircuit size={16} className="text-[#3d5a45]" />
          Market Focus
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#3d5a45] bg-[#e8f0ec] px-2 py-1 rounded-full">
          MRI
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-5">Vendor reliability — Limbe Market</p>

      {/* Score + risk figures */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl bg-[#F5F5F0] px-4 py-3">
          <p className="text-2xl font-extrabold text-[#0E0E0B] tabular-nums">{data.summary.avg_mri}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Avg reliability</p>
        </div>
        <div className="rounded-xl bg-red-50 px-4 py-3">
          <p className="text-2xl font-extrabold text-red-600 tabular-nums">{mwk(data.summary.revenue_at_risk)}</p>
          <p className="text-[10px] text-red-400 mt-0.5">At risk / day</p>
        </div>
      </div>

      {/* Tier split */}
      <div className="flex items-center gap-2 mb-5">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          {data.summary.excellent} excellent
        </span>
        <span className="text-gray-300">·</span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-red-700">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          {data.summary.chronic} chronic
        </span>
      </div>

      {/* Enforcement priorities */}
      <div className="flex-1">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2 flex items-center gap-1">
          <Target size={11} className="text-red-400" />
          Enforcement priorities
        </p>
        <div className="space-y-2">
          {data.watchlist.slice(0, 3).map((v) => (
            <Link
              key={v.vendor_number}
              href={`/dashboard/vendors/${v.vendor_number}`}
              className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <span
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 ${TIER_STYLES[v.tier].bg} ${TIER_STYLES[v.tier].text}`}
              >
                {v.mri}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-semibold text-gray-800 truncate">{v.business_name}</span>
                <span className="block text-[10px] text-gray-400">{v.section ?? "Unassigned"}</span>
              </span>
              <span className="text-[11px] font-bold text-red-500 shrink-0">{mwk(v.revenue_at_risk)}</span>
            </Link>
          ))}
          {data.watchlist.length === 0 && (
            <p className="text-xs text-emerald-600 font-medium py-3 text-center">
              All stalls paid — nothing to enforce
            </p>
          )}
        </div>
      </div>

      <Link
        href="/dashboard/markets"
        className="mt-4 inline-flex items-center justify-center gap-1.5 w-full px-4 py-2.5 bg-[#0E0E0B] hover:bg-[#1A1A16] text-[#AFE607] text-xs font-bold rounded-xl transition-colors"
      >
        Open Markets
        <ArrowUpRight size={13} />
      </Link>
    </div>
  );
}
