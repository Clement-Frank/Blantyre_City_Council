"use client";

// Markets — Blantyre City Council market cards with their submarkets.
// Live data from the scoped dashboard + market intelligence feeds:
// vendor counts, today's revenue, and the submarkets under each market.

import { useEffect, useState } from "react";
import { Search, Plus, MapPin, Store, Users, Layers, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface MarketCard {
  id: number;
  name: string;
  subOffice: string;
  location: string;
  sections: number;
  vendors: number;
  dailyRevenue: number;
  status: string;
  submarkets: string[];
}

interface GrowthStats {
  week: number;
  month: number;
  year: number;
  total: number;
}

function GrowthBlock({ label, caption }: { label: string; caption: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-8 h-8 rounded-lg bg-[#e8f0ec] flex items-center justify-center">
          <TrendingUp size={15} className="text-[#3d5a45]" />
        </span>
        <p className="text-xs font-semibold text-gray-500 ">{label}</p>
      </div>
      <p className="text-2xl font-extrabold text-gray-900 tabular-nums">{caption}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">new vendors</p>
    </div>
  );
}

export default function MarketsPage() {
  const [markets, setMarkets] = useState<MarketCard[]>([]);
  const [growth, setGrowth] = useState<GrowthStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const isAdmin = user?.role === "Administrator";

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch("/api/dashboard").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/market-intel").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([dash, intel]) => {
        if (!alive) return;
        if (dash?.stats) {
          setGrowth({
            week: dash.stats.new_vendors_week ?? 0,
            month: dash.stats.new_vendors_month ?? 0,
            year: dash.stats.new_vendors_year ?? 0,
            total: dash.stats.total_vendors ?? 0,
          });
        }
        const cards: MarketCard[] = [];
        if (intel?.market) {
          cards.push({
            id: intel.market.market_id,
            name: intel.market.name,
            subOffice: intel.market.sub_office ? intel.market.sub_office.replace(" Sub Office", "") : "Limbe",
            location: intel.market.location,
            sections: intel.market.sections,
            vendors: dash?.stats?.active_vendors ?? intel.market.vendors,
            dailyRevenue: dash?.stats?.revenue_today ?? 0,
            status: "Active",
            submarkets: (intel.sections ?? [])
              .filter((s: { section: string }) => s.section !== "Unassigned")
              .map((s: { section: string }) => s.section),
          });
        }
        setMarkets(cards);
      })
      .catch(() => setMarkets([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const filtered = markets.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Markets</h1>
          <p className="text-sm text-gray-500 mt-1">Manage council markets and sub-offices</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search markets..."
              className="w-52 pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3d5a45]/30"
            />
          </div>
          {isAdmin && (
            <Link
              href="/dashboard/markets/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-[#3d5a45]/20"
            >
              <Plus size={16} />
              Add Market
            </Link>
          )}
        </div>
      </div>

      {growth && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <GrowthBlock label="This week" caption={String(growth.week)} />
          <GrowthBlock label="This month" caption={String(growth.month)} />
          <GrowthBlock label="This year" caption={String(growth.year)} />
          <GrowthBlock label="Total registered" caption={String(growth.total)} />
        </section>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading ? (
          <div className="col-span-full bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-sm text-gray-400">
            Loading markets...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-sm text-gray-400">
            No markets found.
          </div>
        ) : (
          filtered.map((market) => (
            <div key={market.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#e8f0ec] flex items-center justify-center group-hover:bg-[#3d5a45] transition-colors">
                  <Store size={20} className="text-[#3d5a45] group-hover:text-white transition-colors" />
                </div>
                <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-medium ${
                  market.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                }`}>
                  {market.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">{market.name}</h3>
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
                <MapPin size={12} />
                {market.location} · {market.subOffice} Sub Office
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
                <div>
                  <p className="text-lg font-bold text-gray-800 inline-flex items-center gap-1.5">
                    <Users size={14} className="text-gray-400" />
                    {market.vendors}
                  </p>
                  <p className="text-[10px] text-gray-500">Vendors</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#3d5a45]">MWK {market.dailyRevenue.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500">Today</p>
                </div>
              </div>
              {market.submarkets.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2 inline-flex items-center gap-1">
                    <Layers size={11} /> {market.sections} submarkets
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {market.submarkets.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded-md bg-[#e8f0ec] text-[#3d5a45] text-[10px] font-semibold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
