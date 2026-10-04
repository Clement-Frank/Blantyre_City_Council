"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface SectionStat {
  section_name: string;
  vendor_count: number;
  revenue: number;
}

const SECTION_COLORS = ["#3d5a45", "#5a9e8f", "#7bc4b5", "#2d4a3e", "#AFE607", "#d4e5dc"];

export default function CollectionStats() {
  const [stats, setStats] = useState<{
    compliance_today: number;
    paid_today: number;
    unpaid_today: number;
    revenue_month: number;
  } | null>(null);
  const [sections, setSections] = useState<SectionStat[]>([]);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setStats(d.stats);
        setSections(d.section_breakdown || []);
      })
      .catch(() => undefined);
  }, []);

  const compliance = stats?.compliance_today ?? 0;
  const revenueMonth = stats?.revenue_month ?? 0;
  const topSections = sections.slice(0, 4);
  const totalVendors = sections.reduce((sum, s) => sum + s.vendor_count, 0);

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E5E5E0] shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-[#0E0E0B]">Collection Stats</h3>
          <p className="text-xs text-gray-500 mt-0.5">Today's compliance & revenue by section</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1 flex flex-col items-center">
          <div className="relative w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{ value: compliance }, { value: 100 - compliance }]} cx="50%" cy="50%" innerRadius={42} outerRadius={58} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                  <Cell fill="#AFE607" />
                  <Cell fill="#F5F5F0" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-[#0E0E0B]">{compliance}%</span>
              <span className="text-[10px] text-gray-500">Paid today</span>
            </div>
          </div>
          <p className="text-sm font-semibold text-[#0E0E0B] mt-2">
            {stats ? `${stats.paid_today} green • ${stats.unpaid_today} red` : "—"}
          </p>
          <p className="text-[10px] text-gray-400">vendors paid vs unpaid today</p>
        </div>

        <div className="col-span-2 sm:col-span-1 flex flex-col items-center">
          <div className="relative w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{ value: Math.max(compliance, 8) }, { value: 100 - Math.max(compliance, 8) }]} cx="50%" cy="50%" innerRadius={42} outerRadius={58} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                  <Cell fill="#0E0E0B" />
                  <Cell fill="#F5F5F0" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-[#0E0E0B]">{stats ? `${stats.paid_today}` : "—"}</span>
              <span className="text-[10px] text-gray-500">Transactions</span>
            </div>
          </div>
          <p className="text-sm font-semibold text-[#0E0E0B] mt-2">MWK {revenueMonth.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400">collected this month</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[#F5F5F0] space-y-2">
        {topSections.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-2">No section data</p>
        ) : (
          topSections.map((item, i) => {
            const pct = totalVendors ? Math.round((item.vendor_count / totalVendors) * 100) : 0;
            return (
              <div key={item.section_name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SECTION_COLORS[i % SECTION_COLORS.length] }} />
                  <span className="text-xs text-gray-600">{item.section_name}</span>
                </div>
                <span className="text-xs font-semibold text-[#0E0E0B]">
                  {item.vendor_count} vendors ({pct}%)
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
