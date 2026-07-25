"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { revenueData } from "@/lib/mock-data";

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `MWK ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `MWK ${(value / 1000).toFixed(0)}K`;
  return `MWK ${value}`;
};

export default function RevenueChart() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-gray-800">
            Revenue Classification
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Income vs Collection targets
          </p>
        </div>
        <select className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30">
          <option>6 months</option>
          <option>3 months</option>
          <option>1 year</option>
        </select>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={revenueData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f0f0f0"
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              tickFormatter={formatCurrency}
              width={80}
            />
            <Tooltip
              formatter={(value: unknown) => [formatCurrency(Number(value) || 0), ""]}
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                fontSize: "12px",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }}
              iconType="circle"
              iconSize={8}
            />
            <Bar
              dataKey="income"
              name="Collected"
              fill="#5a9e8f"
              radius={[6, 6, 0, 0]}
              maxBarSize={36}
            />
            <Bar
              dataKey="outcome"
              name="Target"
              fill="#3d5a45"
              radius={[6, 6, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}