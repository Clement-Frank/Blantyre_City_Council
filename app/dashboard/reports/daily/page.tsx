"use client";

import { ArrowLeft, Download, Calendar, TrendingUp, Users, Receipt } from "lucide-react";
import Link from "next/link";

const dailyData = {
  date: "2026-07-24",
  totalRevenue: 452300,
  totalTransactions: 1284,
  standardFees: 385200,
  bulkFees: 67100,
  airtelMoney: 289000,
  tnmMpamba: 123400,
  ussd: 39900,
  topSections: [
    { name: "Vegetables", amount: 156000, vendors: 420 },
    { name: "Fish", amount: 98000, vendors: 310 },
    { name: "Textiles", amount: 87000, vendors: 280 },
    { name: "Hardware", amount: 67300, vendors: 190 },
    { name: "Others", amount: 44000, vendors: 84 },
  ],
};

export default function DailyReportPage() {
  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/reports" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Daily Revenue Report</h1>
            <p className="text-sm text-gray-500 mt-1">{dailyData.date}</p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-[#3d5a45]/20">
          <Download size={16} />
          Export PDF
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#e8f0ec] flex items-center justify-center">
              <TrendingUp size={20} className="text-[#3d5a45]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">MWK {dailyData.totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Revenue</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#e8f0ec] flex items-center justify-center">
              <Receipt size={20} className="text-[#3d5a45]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{dailyData.totalTransactions}</p>
              <p className="text-xs text-gray-500">Transactions</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#e8f0ec] flex items-center justify-center">
              <Users size={20} className="text-[#3d5a45]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">1,284</p>
              <p className="text-xs text-gray-500">Active Vendors</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-base font-bold text-gray-800 mb-4">Revenue by Fee Type</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Standard Daily Fee</span>
                <span className="text-sm font-bold text-gray-800">MWK {dailyData.standardFees.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className="bg-[#3d5a45] h-2.5 rounded-full" style={{ width: "85%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Kupikulisa Bulk Fee</span>
                <span className="text-sm font-bold text-gray-800">MWK {dailyData.bulkFees.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className="bg-[#5a9e8f] h-2.5 rounded-full" style={{ width: "15%" }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-base font-bold text-gray-800 mb-4">Revenue by Channel</h3>
          <div className="space-y-4">
            {[
              { name: "Airtel Money", amount: dailyData.airtelMoney, color: "#3d5a45", width: "64%" },
              { name: "TNM Mpamba", amount: dailyData.tnmMpamba, color: "#5a9e8f", width: "27%" },
              { name: "USSD", amount: dailyData.ussd, color: "#7bc4b5", width: "9%" },
            ].map((c) => (
              <div key={c.name}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">{c.name}</span>
                  <span className="text-sm font-bold text-gray-800">MWK {c.amount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className="h-2.5 rounded-full" style={{ width: c.width, backgroundColor: c.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-base font-bold text-gray-800 mb-4">Revenue by Market Section</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Section</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Vendors</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Revenue</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {dailyData.topSections.map((s) => (
                <tr key={s.name} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4 text-sm font-medium text-gray-800">{s.name}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{s.vendors}</td>
                  <td className="px-5 py-4 text-sm font-bold text-[#3d5a45]">MWK {s.amount.toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-[#3d5a45] h-2 rounded-full"
                          style={{ width: `${(s.amount / dailyData.totalRevenue) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{((s.amount / dailyData.totalRevenue) * 100).toFixed(1)}%</span>
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