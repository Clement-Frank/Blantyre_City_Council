"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import ReportToolbar from "@/components/dashboard/ReportToolbar";

interface ReportTable {
  title: string;
  subtitle: string;
  summary: { label: string; value: string }[];
  columns: string[];
  rows: (string | number)[][];
}

const formatCurrency = (value: number | string | undefined) => {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  if (n >= 1000000) return `MWK ${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `MWK ${(n / 1000).toFixed(0)}K`;
  return `MWK ${n}`;
};

export default function RevenueTrendsPage() {
  const [report, setReport] = useState<ReportTable | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/summary?type=revenue")
      .then((r) => (r.ok ? r.json() : null))
      .then(setReport)
      .finally(() => setLoading(false));
  }, []);

  const chartData = (report?.rows ?? []).map((r) => ({
    week: String(r[0]),
    revenue: Number(r[1]),
    transactions: Number(r[2]),
  }));

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/reports" className="p-2 hover:bg-gray-100 rounded-lg transition-colors no-print">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Revenue Trends</h1>
            <p className="text-sm text-gray-500 mt-1">{report?.subtitle ?? "Weekly collections, last 12 weeks"}</p>
          </div>
        </div>
        <ReportToolbar type="revenue" />
      </div>

      {loading ? (
        <div className="py-20 flex items-center justify-center gap-2 text-sm text-gray-400">
          <Loader2 size={16} className="animate-spin" /> Generating report…
        </div>
      ) : !report ? (
        <p className="text-sm text-gray-500">Report unavailable.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {report.summary.map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm print-block">
                <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                <p className="text-2xl font-bold text-gray-800 tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm print-block">
            <div className="mb-6">
              <h3 className="text-base font-bold text-gray-800">Weekly Revenue Trend</h3>
              <p className="text-xs text-gray-500 mt-0.5">Completed collections per week</p>
            </div>
            <div className="h-[350px] w-full">
              {chartData.length === 0 ? (
                <p className="h-full flex items-center justify-center text-sm text-gray-400">
                  No payments recorded in this period.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3d5a45" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3d5a45" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} dy={10} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 11 }}
                      tickFormatter={formatCurrency}
                      width={80}
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(value as number | string | undefined), "Revenue"]}
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#3d5a45"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm print-block">
            <h3 className="text-base font-bold text-gray-800 mb-4">Week by Week</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50">
                    {report.columns.map((c) => (
                      <th key={c} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {report.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 text-sm font-medium text-gray-800">{row[0]}</td>
                      <td className="px-5 py-4 text-sm font-bold text-gray-800 tabular-nums">
                        MWK {Number(row[1]).toLocaleString("en-MW")}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">{row[2]}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
