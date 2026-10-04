"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Store, MapPin, Users, Receipt, TrendingUp } from "lucide-react";
import Link from "next/link";

interface Business {
  business_id: number;
  vendor_number: string;
  business_name: string;
  owner_name: string;
  phone_number: string;
  market: { name: string };
  section: { section_name: string } | null;
  business_type: { name: string; fee_amount: string };
  status: string;
  gps_latitude: string | null;
  gps_longitude: string | null;
}

const statusStyles: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-600",
  Pending: "bg-amber-50 text-amber-600",
  Suspended: "bg-red-50 text-red-600",
  Inactive: "bg-gray-100 text-gray-500",
};

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/vendors")
      .then((r) => r.json())
      .then((d) => setBusinesses(d.businesses || []))
      .catch(() => setBusinesses([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = businesses.filter(
    (b) =>
      b.business_name.toLowerCase().includes(search.toLowerCase()) ||
      b.vendor_number.toLowerCase().includes(search.toLowerCase()) ||
      b.owner_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Businesses</h1>
          <p className="text-sm text-gray-500 mt-1">All registered market businesses and their locations</p>
        </div>
        <Link
          href="/dashboard/businesses/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-[#3d5a45]/20"
        >
          <Plus size={16} />
          Register Business
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by business, owner or vendor number..."
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
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Business</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Vendor No.</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Location</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Daily Fee</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">GPS</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">Loading businesses...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">No businesses found</td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.business_id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#e8f0ec] flex items-center justify-center text-[#3d5a45] text-xs font-bold">
                          {b.business_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{b.business_name}</p>
                          <p className="text-xs text-gray-500">{b.owner_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`/dashboard/vendors/${b.vendor_number}`} className="text-sm text-[#3d5a45] font-mono hover:underline">
                        {b.vendor_number}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{b.business_type?.name}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <MapPin size={13} className="text-gray-400" />
                        {b.market?.name} {b.section ? `• ${b.section.section_name}` : ""}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-800">
                      MWK {Number(b.business_type?.fee_amount || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      {b.gps_latitude && b.gps_longitude ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <TrendingUp size={12} />
                          Pinned
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Not set</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[b.status] || "bg-gray-100 text-gray-500"}`}>
                        {b.status}
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
