"use client";

import { useState } from "react";
import { Search, Plus, MapPin, Store, Users, Receipt, TrendingUp, MoreHorizontal } from "lucide-react";
import Link from "next/link";

const markets = [
  { id: 1, name: "Limbe Market", subOffice: "Limbe", location: "Limbe Township", sections: 5, vendors: 1240, dailyRevenue: 452300, status: "Active" },
  { id: 2, name: "Mpemba Market", subOffice: "Ntonda", location: "Ntonda East", sections: 4, vendors: 890, dailyRevenue: 312500, status: "Active" },
  { id: 3, name: "Chadzunda Market", subOffice: "Ntonda", location: "Chadzunda Road", sections: 3, vendors: 650, dailyRevenue: 198000, status: "Active" },
  { id: 4, name: "Chilobwe Market", subOffice: "Ndirande", location: "Chilobwe Hills", sections: 4, vendors: 720, dailyRevenue: 245000, status: "Active" },
  { id: 5, name: "Madziabango Market", subOffice: "Ndirande", location: "Madziabango", sections: 3, vendors: 540, dailyRevenue: 178000, status: "Maintenance" },
];

export default function MarketsPage() {
  const [search, setSearch] = useState("");

  const filtered = markets.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Markets</h1>
          <p className="text-sm text-gray-500 mt-1">Manage council markets and sub-offices</p>
        </div>
        <Link
          href="/dashboard/markets/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-[#3d5a45]/20"
        >
          <Plus size={16} />
          Add Market
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {markets.map((market) => (
          <div key={market.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#e8f0ec] flex items-center justify-center group-hover:bg-[#3d5a45] transition-colors">
                <Store size={20} className="text-[#3d5a45] group-hover:text-white transition-colors" />
              </div>
              <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-medium ${
                market.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
              }`}>
                {market.status}
              </span>
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-1">{market.name}</h3>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
              <MapPin size={12} />
              {market.location}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
              <div>
                <p className="text-lg font-bold text-gray-800">{market.vendors}</p>
                <p className="text-[10px] text-gray-500">Vendors</p>
              </div>
              <div>
                <p className="text-lg font-bold text-[#3d5a45]">MWK {market.dailyRevenue.toLocaleString()}</p>
                <p className="text-[10px] text-gray-500">Today</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}