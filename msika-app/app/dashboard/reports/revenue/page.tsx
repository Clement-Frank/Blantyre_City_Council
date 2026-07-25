"use client";

import { ArrowLeft, Download, TrendingUp, Calendar } from "lucide-react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const trendData = [
  { week: "Week 1", revenue: 980000, target: 1000000 },
  { week: "Week 2", revenue: 1120000, target: 1000000 },
  { week: "Week 3", revenue: 1050000, target: 1000000 },
  { week: "Week 4", revenue: 1280000, target: 1100000 },
  { week: "Week 5", revenue: 1150000, target: 1100000 },
  { week: "Week 6", revenue: 1420000, target: 1100000 },
  { week: "Week 7", revenue: 1380000, target: 1200000 },
  { week: "Week 8", revenue: 1560000, target: 1200000 },
  { week: "Week 9", revenue: 1490000, target: 1200000 },
  { week: "Week 10", revenue: 1680000, target: 1300000 },
  { week: "Week 11", revenue: 1620000, target: 1300000 },
  { week: "Week 12", revenue: 1750000, target: 1300000 },
];

const formatCurrency = (value: number | string | undefined) => {
  const numericValue = typeof value === "number" ? value : Number(value ?? 0);
  if (numericValue >= 1000000) return `MWK ${(numericValue / 1000000).toFixed(1)}M`;
  if (numericValue >= 1000) return `MWK ${(numericValue / 1000).toFixed(0)}K`;
  return `MWK ${numericValue}`;
};

export default function RevenueTrendsPage() {
  const totalRevenue = trendData.reduce((a, b) => a + b.revenue, 0);
  const totalTarget = trendData.reduce((a, b) => a + b.target, 0);
  const growth = (((totalRevenue - totalTarget) / totalTarget) * 100).toFixed(1);

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/reports" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Revenue Trends</h1>
            <p className="text-sm text-gray-500 mt-1">Time-series analysis for forecasting</p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-[#3d5a45]/20">
          <Download size={16} />
          Export
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total Revenue (12 weeks)</p>
          <p className="text-2xl font-bold text-gray-800">MWK {(totalRevenue / 1000000).toFixed(2)}M</p>
          <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs">
            <TrendingUp size={12} />
            <span>+{growth}% vs target</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Highest Week</p>
          <p className="text-2xl font-bold text-gray-800">MWK 1.75M</p>
          <p className="text-xs text-gray-400 mt-2">Week 12</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Projected Monthly</p>
          <p className="text-2xl font-bold text-gray-800">MWK 7.2M</p>
          <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs">
            <TrendingUp size={12} />
            <span>+15% trend</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-gray-800">Weekly Revenue Trend</h3>
            <p className="text-xs text-gray-500 mt-0.5">Actual vs Target over 12 weeks</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
            <Calendar size={14} className="text-gray-400" />
            <span className="text-xs text-gray-600">Last 12 Weeks</span>
          </div>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3d5a45" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3d5a45" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5a9e8f" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#5a9e8f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} tickFormatter={formatCurrency} width={80} />
              <Tooltip
                formatter={(value) => [formatCurrency(value as number | string | undefined), ""]}
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", fontSize: "12px" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} iconType="circle" iconSize={8} />
              <Area type="monotone" dataKey="revenue" name="Actual Revenue" stroke="#3d5a45" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              <Area type="monotone" dataKey="target" name="Target" stroke="#5a9e8f" strokeWidth={2} strokeDasharray="6 4" fillOpacity={1} fill="url(#colorTarget)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}