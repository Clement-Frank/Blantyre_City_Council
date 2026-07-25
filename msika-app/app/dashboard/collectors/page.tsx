"use client";

import { useState } from "react";
import { Search, Plus, Phone, MapPin, MoreHorizontal, UserCheck, TrendingUp } from "lucide-react";
import Link from "next/link";

const collectors = [
  { id: 1, name: "John Phiri", username: "j.phiri", mobile: "0881234567", subOffice: "Limbe", market: "Limbe Market", vendorsRegistered: 145, paymentsVerified: 432, status: "Active" },
  { id: 2, name: "Alice Banda", username: "a.banda", mobile: "0999876543", subOffice: "Limbe", market: "Limbe Market", vendorsRegistered: 132, paymentsVerified: 389, status: "Active" },
  { id: 3, name: "Mercy Chirwa", username: "m.chirwa", mobile: "0884567890", subOffice: "Ntonda", market: "Mpemba Market", vendorsRegistered: 198, paymentsVerified: 567, status: "Active" },
  { id: 4, name: "Kelvin Ngwira", username: "k.ngwira", mobile: "0992345678", subOffice: "Ndirande", market: "Chadzunda Market", vendorsRegistered: 89, paymentsVerified: 234, status: "On Leave" },
];

export default function CollectorsPage() {
  const [search, setSearch] = useState("");

  const filtered = collectors.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Collectors</h1>
          <p className="text-sm text-gray-500 mt-1">Manage revenue collectors across all markets</p>
        </div>
        <Link
          href="/dashboard/collectors/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-[#3d5a45]/20"
        >
          <Plus size={16} />
          Add Collector
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#e8f0ec] flex items-center justify-center">
              <UserCheck size={20} className="text-[#3d5a45]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">12</p>
              <p className="text-xs text-gray-500">Active Collectors</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#e8f0ec] flex items-center justify-center">
              <TrendingUp size={20} className="text-[#3d5a45]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">564</p>
              <p className="text-xs text-gray-500">Vendors Registered Today</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#e8f0ec] flex items-center justify-center">
              <UserCheck size={20} className="text-[#3d5a45]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">1,632</p>
              <p className="text-xs text-gray-500">Payments Verified Today</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search collectors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Collector</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Contact</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Assignment</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Vendors</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Verified</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
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
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Phone size={13} className="text-gray-400" />
                      {c.mobile}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <MapPin size={13} className="text-gray-400" />
                      {c.market}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-800">{c.vendorsRegistered}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-[#3d5a45]">{c.paymentsVerified}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      c.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreHorizontal size={16} className="text-gray-400" />
                    </button>
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