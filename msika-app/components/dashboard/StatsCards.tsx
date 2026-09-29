"use client";

import { useEffect, useState } from "react";
import { Wallet, Users, Receipt, ShieldCheck, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardStats {
  total_vendors: number;
  active_vendors: number;
  paid_today: number;
  unpaid_today: number;
  compliance_today: number;
  revenue_today: number;
  revenue_yesterday: number;
  revenue_month: number;
  revenue_growth_pct: number | null;
  transactions_today: number;
  failed_today: number;
  new_vendors_week: number;
  collection_rate: number;
}

export default function StatsCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setStats(d.stats))
      .catch(() => undefined);
  }, []);

  const cards = stats
    ? [
        {
          icon: Wallet,
          value: `MWK ${stats.revenue_today.toLocaleString()}`,
          title: "Today's Revenue",
          subtext: stats.revenue_growth_pct !== null ? `${stats.revenue_growth_pct >= 0 ? "+" : ""}${stats.revenue_growth_pct}% vs yesterday` : "No data for yesterday",
          trend: stats.revenue_growth_pct === null ? true : stats.revenue_growth_pct >= 0,
        },
        {
          icon: Users,
          value: stats.total_vendors.toLocaleString(),
          title: "Total Vendors",
          subtext: `${stats.new_vendors_week} new this week`,
          trend: true,
        },
        {
          icon: Receipt,
          value: stats.transactions_today.toLocaleString(),
          title: "Transactions Today",
          subtext: `${stats.paid_today} paid • ${stats.unpaid_today} unpaid`,
          trend: stats.transactions_today > 0,
        },
        {
          icon: ShieldCheck,
          value: `${stats.compliance_today}%`,
          title: "Compliance Today",
          subtext: `MWK ${stats.revenue_month.toLocaleString()} collected this month`,
          trend: stats.compliance_today >= 50,
        },
      ]
    : [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {!stats
        ? [0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-[#E5E5E0] shadow-sm animate-pulse">
              <div className="w-12 h-12 bg-gray-100 rounded-xl mb-4" />
              <div className="h-7 bg-gray-100 rounded w-28 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-36" />
            </div>
          ))
        : cards.map((card, idx) => {
            const Icon = card.icon;
            const isUp = card.trend;

            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-[#E5E5E0] shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-[#F5F5F0] rounded-xl">
                    <Icon size={20} className="text-[#0E0E0B]" />
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                      isUp ? "bg-[#AFE607]/15 text-[#0E0E0B]" : "bg-red-50 text-red-600"
                    )}
                  >
                    {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {isUp ? "On track" : "Needs attention"}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-[#0E0E0B] mb-1">{card.value}</h3>
                <p className="text-xs text-gray-500">{card.title} • {card.subtext}</p>
              </div>
            );
          })}
    </div>
  );
}
