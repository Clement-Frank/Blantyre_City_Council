"use client";

import { ArrowLeft, Download, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

const monthlyData = [
  { month: "January", revenue: 4200000, transactions: 11200, target: 4000000 },
  { month: "February", revenue: 5100000, transactions: 13500, target: 4500000 },
  { month: "March", revenue: 4800000, transactions: 12800, target: 4800000 },
  { month: "April", revenue: 6200000, transactions: 16500, target: 5000000 },
  { month: "May", revenue: 5800000, transactions: 15400, target: 5200000 },
  { month: "June", revenue: 7100000, transactions: 18900, target: 5500000 },
];

export default function MonthlyReportPage() {
  const totalRevenue = monthlyData.reduce((a, b) => a + b.revenue, 0);
  const totalTarget = monthlyData.reduce((a, b) => a + b.target, 0);
  const avgGrowth = ((totalRevenue - totalTarget) / totalTarget * 100).toFixed(1);

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/reports" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Monthly Revenue Report</h1>
            <p className="text-sm text-gray-500 mt-1">January - June 2026</p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-[#3d5a45]/20">
          <Download size={16} />
          Export Excel
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total Revenue (6 months)</p>
          <p className="text-2xl font-bold text-gray-800">MWK {(totalRevenue / 1000000).toFixed(1)}M</p>
          <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs">
            <TrendingUp size={12} />
            <span>+{avgGrowth}% vs target</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total Transactions</p>
          <p className="text-2xl font-bold text-gray-800">88,300</p>
          <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs">
            <TrendingUp size={12} />
            <span>+8.4% vs last period</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Average Monthly</p>
          <p className="text-2xl font-bold text-gray-800">MWK {(totalRevenue / 6 / 1000000).toFixed(2)}M</p>
          <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs">
            <TrendingUp size={12} />
            <span>Above target</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-base font-bold text-gray-800 mb-4">Monthly Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Month</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Revenue</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Target</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Variance</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Transactions</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {monthlyData.map((m) => {
                const variance = m.revenue - m.target;
                const pct = ((m.revenue / m.target) * 100).toFixed(1);
                return (
                  <tr key={m.month} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 text-sm font-medium text-gray-800">{m.month}</td>
                    <td className="px-5 py-4 text-sm font-bold text-gray-800">MWK {(m.revenue / 1000000).toFixed(2)}M</td>
                    <td className="px-5 py-4 text-sm text-gray-600">MWK {(m.target / 1000000).toFixed(2)}M</td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-medium ${variance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {variance >= 0 ? "+" : ""}MWK {(variance / 1000000).toFixed(2)}M
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{m.transactions.toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${Number(pct) >= 100 ? "bg-[#3d5a45]" : "bg-[#5a9e8f]"}`}
                            style={{ width: `${Math.min(Number(pct), 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}