"use client";

// Markets module — Blantyre City Council markets and their submarkets.
// The council operates Limbe Market (Limbe Sub Office); its submarkets
// (sections) are where stalls and vendors are organised. Admins can add
// new submarkets; every card shows live vendor counts.

import { useCallback, useEffect, useState } from "react";
import { Plus, MapPin, Store, Users, Building2, Layers, Loader2, X, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface MarketIntel {
  market_id: number;
  name: string;
  location: string;
  sub_office: string | null;
  vendors: number;
  sections: number;
  sections_detail: { section: string; vendors: number; paid_today: number }[];
  revenue_30d: number;
  paid_today: number;
  unpaid_today: number;
}

export default function MarketsPage() {
  const [markets, setMarkets] = useState<MarketIntel[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingFor, setAddingFor] = useState<number | null>(null);
  const [newSection, setNewSection] = useState("");
  const [msg, setMsg] = useState<{ market_id: number; ok: boolean; text: string } | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === "Administrator";

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/market-intel")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.market) return setMarkets([]);
        setMarkets([
          {
            market_id: d.market.market_id,
            name: d.market.name,
            location: d.market.location,
            sub_office: d.market.sub_office,
            vendors: d.market.vendors,
            sections: d.market.sections,
            sections_detail: (d.sections ?? []).map(
              (s: { section: string; vendors: number; paid_today: number }) => ({
                section: s.section,
                vendors: s.vendors,
                paid_today: s.paid_today,
              })
            ),
            revenue_30d: d.summary.revenue_30d ?? 0,
            paid_today: d.summary.paid_today ?? 0,
            unpaid_today: d.summary.unpaid_today ?? 0,
          },
        ]);
      })
      .catch(() => setMarkets([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addSection = async (marketId: number) => {
    if (!newSection.trim()) return;
    setMsg(null);
    try {
      const res = await fetch("/api/markets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ market_id: marketId, section_name: newSection.trim() }),
      });
      const d = await res.json();
      if (res.ok) {
        setMsg({ market_id: marketId, ok: true, text: `Submarket "${newSection.trim()}" added` });
        setNewSection("");
        setAddingFor(null);
        load();
      } else {
        setMsg({ market_id: marketId, ok: false, text: d.error || "Failed to add submarket" });
      }
    } catch {
      setMsg({ market_id: marketId, ok: false, text: "Network error" });
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 size={18} className="animate-spin inline text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Markets</h1>
        <p className="text-sm text-gray-500 mt-1">Blantyre City Council markets and their submarkets</p>
      </div>

      {markets.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-sm text-gray-400">
          No markets registered yet.
        </div>
      )}

      {markets.map((m) => (
        <div key={m.market_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Market header */}
          <div className="p-6 border-b border-gray-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#e8f0ec] flex items-center justify-center shrink-0">
                <Store size={22} className="text-[#3d5a45]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">{m.name}</h2>
                <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={11} /> {m.location}
                  </span>
                  {m.sub_office && (
                    <span className="inline-flex items-center gap-1">
                      <Building2 size={11} /> {m.sub_office}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xl font-bold text-gray-800 tabular-nums">{m.vendors}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Vendors</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-[#3d5a45] tabular-nums">{m.sections}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Submarkets</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-emerald-600 tabular-nums">{m.paid_today}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Paid today</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-red-500 tabular-nums">{m.unpaid_today}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Unpaid</p>
              </div>
            </div>
          </div>

          {/* Submarkets */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Layers size={14} className="text-[#3d5a45]" /> Submarkets
              </h3>
              {isAdmin && addingFor !== m.market_id && (
                <button
                  onClick={() => {
                    setAddingFor(m.market_id);
                    setMsg(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#3d5a45] bg-[#e8f0ec] hover:bg-[#d8e6dd] rounded-lg transition-colors"
                >
                  <Plus size={13} /> Add submarket
                </button>
              )}
            </div>

            {msg && msg.market_id === m.market_id && (
              <div className={`rounded-xl px-4 py-2.5 mb-4 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                {msg.text}
              </div>
            )}

            {addingFor === m.market_id && (
              <div className="flex gap-2 mb-4 max-w-md">
                <input
                  autoFocus
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSection(m.market_id)}
                  placeholder="Submarket name, e.g. Chimwemwe Row"
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30"
                />
                <button
                  onClick={() => addSection(m.market_id)}
                  disabled={!newSection.trim()}
                  className="px-4 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors"
                  title="Save submarket"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => {
                    setAddingFor(null);
                    setNewSection("");
                  }}
                  className="px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl transition-colors"
                  title="Cancel"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {m.sections_detail.map((sec) => (
                <div
                  key={sec.section}
                  className="flex items-center justify-between px-4 py-3.5 bg-gray-50/70 rounded-xl border border-gray-100 hover:border-[#5a9e8f]/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-[#3d5a45] shrink-0">
                      <Store size={14} />
                    </span>
                    <p className="text-sm font-semibold text-gray-800 truncate">{sec.section}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <Users size={11} /> {sec.vendors}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600">{sec.paid_today} paid</span>
                  </div>
                </div>
              ))}
              {m.sections_detail.length === 0 && (
                <p className="text-xs text-gray-400 col-span-full">No submarkets yet.</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
