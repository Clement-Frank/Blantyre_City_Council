"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { revenueData } from "@/lib/mock-data";

const formatCurrency = (value: number | string | readonly (number | string)[] | undefined) => {
  if (Array.isArray(value)) {
    return formatCurrency(value[0]);
  }

  const numericValue = typeof value === "number" ? value : Number(value ?? 0);
  if (numericValue >= 1000000) return `MWK ${(numericValue / 1000000).toFixed(1)}M`;
  if (numericValue >= 1000) return `MWK ${(numericValue / 1000).toFixed(0)}K`;
  return `MWK ${numericValue}`;
};

export default function RevenueChart() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E5E5E0] shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-[#0E0E0B]">Revenue Classification</h3>
          <p className="text-xs text-gray-500 mt-0.5">Income vs Collection targets</p>
        </div>
        <select className="px-3 py-1.5 bg-[#F5F5F0] border border-[#E5E5E0] rounded-lg text-xs text-[#0E0E0B] focus:outline-none focus:ring-2 focus:ring-[#AFE607]/30">
          <option>6 months</option>
          <option>3 months</option>
          <option>1 year</option>
        </select>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5F5F0" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} tickFormatter={formatCurrency} width={80} />
            <Tooltip
              formatter={(value) => [formatCurrency(value), ""]}
              contentStyle={{ backgroundColor: "#0E0E0B", border: "1px solid #2A2A24", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
              itemStyle={{ color: "#AFE607" }}
            />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} iconType="circle" iconSize={8} />
            <Bar dataKey="income" name="Collected" fill="#AFE607" radius={[6, 6, 0, 0]} maxBarSize={36} />
            <Bar dataKey="outcome" name="Target" fill="#0E0E0B" radius={[6, 6, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}