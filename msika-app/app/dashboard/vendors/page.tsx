"use client";

import { useState, useEffect } from "react";
import { Search, Plus, MoreHorizontal, Phone, MapPin, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

interface Vendor {
  business_id: number;
  vendor_number: string;
  business_name: string;
  owner_name: string;
  phone_number: string;
  market: { name: string };
  section: { section_name: string } | null;
  status: string;
  registration_date: string;
  paid_today: boolean;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      fetch(`/api/vendors?search=${encodeURIComponent(search)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setVendors(d?.businesses || []))
        .catch(() => setVendors([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const filtered = statusFilter === "All" ? vendors : statusFilter === "Paid" ? vendors.filter((v) => v.paid_today) : statusFilter === "Unpaid" ? vendors.filter((v) => !v.paid_today) : vendors.filter((v) => v.status === statusFilter);

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vendors</h1>
          <p className="text-sm text-gray-500 mt-1">Manage registered market vendors and today's payment status</p>
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
              placeholder="Search by name, vendor ID or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30"
            />
          </div>
          <div className="flex gap-2">
            {["All", "Paid", "Unpaid", "Active", "Suspended"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  statusFilter === s ? "bg-[#3d5a45] text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Vendor</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Contact</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Location</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Paid Today</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">Loading vendors...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">No vendors found</td>
                </tr>
              ) : (
                filtered.map((vendor) => (
                  <tr key={vendor.vendor_number} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <Link href={`/dashboard/vendors/${vendor.vendor_number}`} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#e8f0ec] flex items-center justify-center text-[#3d5a45] text-xs font-bold">
                          {vendor.owner_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{vendor.business_name}</p>
                          <p className="text-xs text-gray-500">{vendor.vendor_number}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Phone size={13} className="text-gray-400" />
                        {vendor.phone_number}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <MapPin size={13} className="text-gray-400" />
                        {vendor.section?.section_name || vendor.market?.name}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {vendor.paid_today ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          Unpaid
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        vendor.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                      }`}>
                        {vendor.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`/dashboard/vendors/${vendor.vendor_number}`} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors inline-block">
                        <MoreHorizontal size={16} className="text-gray-400" />
                      </Link>
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
