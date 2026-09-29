"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Phone, MapPin, UserCheck, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";

interface Collector {
  collector_id: number;
  full_name: string;
  username: string;
  mobile_number: string;
  sub_office: string | null;
  vendors_registered: number;
  payments_recorded: number;
  cash_collected: number;
  is_active: boolean;
}

export default function CollectorsPage() {
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/collectors")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setCollectors(d?.collectors || []))
      .catch(() => setCollectors([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = collectors.filter(
    (c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.username.toLowerCase().includes(search.toLowerCase())
  );

  const totalVendors = collectors.reduce((s, c) => s + c.vendors_registered, 0);
  const totalPayments = collectors.reduce((s, c) => s + c.payments_recorded, 0);

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
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e8f0ec] flex items-center justify-center">
            <UserCheck size={20} className="text-[#3d5a45]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{collectors.filter((c) => c.is_active).length}</p>
            <p className="text-xs text-gray-500">Active Collectors</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e8f0ec] flex items-center justify-center">
            <TrendingUp size={20} className="text-[#3d5a45]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{totalVendors}</p>
            <p className="text-xs text-gray-500">Vendors Registered</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e8f0ec] flex items-center justify-center">
            <Wallet size={20} className="text-[#3d5a45]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{totalPayments.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Payments Recorded</p>
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
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Sub Office</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Vendors</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Payments</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Cash Collected</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">Loading collectors...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">No collectors found</td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.collector_id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3d5a45] to-[#5a9e8f] flex items-center justify-center text-white text-xs font-bold">
                          {c.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{c.full_name}</p>
                          <p className="text-xs text-gray-500">@{c.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Phone size={13} className="text-gray-400" />
                        {c.mobile_number || "—"}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <MapPin size={13} className="text-gray-400" />
                        {c.sub_office || "—"}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-800">{c.vendors_registered}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-[#3d5a45]">{c.payments_recorded}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-800">MWK {c.cash_collected.toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        c.is_active ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                      }`}>
                        {c.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
