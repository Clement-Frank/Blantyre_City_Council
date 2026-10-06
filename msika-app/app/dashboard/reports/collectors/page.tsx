"use client";

import { ArrowLeft, Download, UserCheck, TrendingUp, Award } from "lucide-react";
import Link from "next/link";

const collectorStats = [
  { name: "John Phiri", username: "j.phiri", subOffice: "Limbe", vendorsRegistered: 145, paymentsVerified: 432, avgDaily: 28, rank: 1 },
  { name: "Alice Banda", username: "a.banda", subOffice: "Limbe", vendorsRegistered: 132, paymentsVerified: 389, avgDaily: 25, rank: 2 },
  { name: "Mercy Chirwa", username: "m.chirwa", subOffice: "Ntonda", vendorsRegistered: 198, paymentsVerified: 567, avgDaily: 35, rank: 3 },
  { name: "Kelvin Ngwira", username: "k.ngwira", subOffice: "Ndirande", vendorsRegistered: 89, paymentsVerified: 234, avgDaily: 18, rank: 4 },
  { name: "Grace Mhango", username: "g.mhango", subOffice: "Limbe", vendorsRegistered: 156, paymentsVerified: 478, avgDaily: 31, rank: 5 },
];

export default function CollectorsReportPage() {
  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/reports" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Collector Performance</h1>
            <p className="text-sm text-gray-500 mt-1">Registration and verification activity</p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-[#3d5a45]/20">
          <Download size={16} />
          Export
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#e8f0ec] flex items-center justify-center">
              <UserCheck size={20} className="text-[#3d5a45]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">720</p>
              <p className="text-xs text-gray-500">Total Vendors Registered</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#e8f0ec] flex items-center justify-center">
              <TrendingUp size={20} className="text-[#3d5a45]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">2,100</p>
              <p className="text-xs text-gray-500">Payments Verified</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#e8f0ec] flex items-center justify-center">
              <Award size={20} className="text-[#3d5a45]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">27.4</p>
              <p className="text-xs text-gray-500">Avg Daily Verifications</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Rank</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Collector</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Sub Office</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Vendors Reg.</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Verified</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Avg/Day</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {collectorStats.map((c) => (
                <tr key={c.username} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      c.rank === 1 ? "bg-[#3d5a45] text-white" :
                      c.rank === 2 ? "bg-[#5a9e8f] text-white" :
                      c.rank === 3 ? "bg-[#7bc4b5] text-white" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {c.rank}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3d5a45] to-[#5a9e8f] flex items-center justify-center text-white text-xs font-bold">
                        {c.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                        <p className="text-xs text-gray-500">@{c.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{c.subOffice}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-800">{c.vendorsRegistered}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-[#3d5a45]">{c.paymentsVerified}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{c.avgDaily}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-[#3d5a45] h-2 rounded-full"
                          style={{ width: `${Math.min((c.paymentsVerified / 600) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{((c.paymentsVerified / 600) * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}