"use client";

import { useState } from "react";
import { Search, Plus, MoreHorizontal, Phone, MapPin } from "lucide-react";
import Link from "next/link";

const vendors = [
  { id: "V-00231", name: "Grace Banda", mobile: "0991234567", market: "Limbe Market", section: "Vegetables", status: "Active", registered: "2026-01-15" },
  { id: "V-00189", name: "John Phiri", mobile: "0889876543", market: "Limbe Market", section: "Fish", status: "Active", registered: "2025-11-20" },
  { id: "V-00342", name: "Mercy Chirwa", mobile: "0994567890", market: "Limbe Market", section: "Textiles", status: "Suspended", registered: "2026-03-10" },
  { id: "V-00156", name: "Patrick Banda", mobile: "0882345678", market: "Limbe Market", section: "Hardware", status: "Active", registered: "2025-08-05" },
  { id: "V-00411", name: "Esther Nkhoma", mobile: "0998765432", market: "Limbe Market", section: "Vegetables", status: "Active", registered: "2026-05-22" },
];

export default function VendorsPage() {
  const [search, setSearch] = useState("");

  const filtered = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vendors</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage registered market vendors
          </p>
        </div>
        <Link
          href="/dashboard/vendors/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-[#3d5a45]/20"
        >
          <Plus size={16} />
          Register Vendor
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by name or vendor ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30"
            />
          </div>
          <div className="flex gap-2">
            <select className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-600 focus:outline-none">
              <option>All Markets</option>
              <option>Limbe Market</option>
            </select>
            <select className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-600 focus:outline-none">
              <option>All Status</option>
              <option>Active</option>
              <option>Suspended</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Vendor</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Contact</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Location</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Registered</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#e8f0ec] flex items-center justify-center text-[#3d5a45] text-xs font-bold">
                        {vendor.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{vendor.name}</p>
                        <p className="text-xs text-gray-500">{vendor.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Phone size={13} className="text-gray-400" />
                      {vendor.mobile}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <MapPin size={13} className="text-gray-400" />
                      {vendor.section}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      vendor.status === "Active"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-red-50 text-red-600"
                    }`}>
                      {vendor.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">{vendor.registered}</td>
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