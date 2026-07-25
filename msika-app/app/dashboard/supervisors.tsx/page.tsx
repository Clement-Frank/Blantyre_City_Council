"use client";

import { useState } from "react";
import { Search, Plus, Shield, MapPin, MoreHorizontal, Store } from "lucide-react";
import Link from "next/link";

const supervisors = [
  { id: 1, name: "Mary Banda", username: "m.banda", subOffice: "Limbe", markets: ["Limbe Market"], collectors: 4, status: "Active" },
  { id: 2, name: "James Moyo", username: "j.moyo", subOffice: "Ntonda", markets: ["Mpemba Market", "Chadzunda Market"], collectors: 6, status: "Active" },
  { id: 3, name: "Patricia Nkhoma", username: "p.nkhoma", subOffice: "Ndirande", markets: ["Chilobwe Market", "Madziabango Market"], collectors: 5, status: "Active" },
];

export default function SupervisorsPage() {
  const [search, setSearch] = useState("");

  const filtered = supervisors.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Supervisors</h1>
          <p className="text-sm text-gray-500 mt-1">Manage market supervisors across sub-offices</p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-[#3d5a45]/20">
          <Plus size={16} />
          Add Supervisor
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search supervisors..."
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
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Supervisor</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Sub Office</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Markets</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Collectors</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#5a9e8f] to-[#7bc4b5] flex items-center justify-center text-white text-xs font-bold">
                        {s.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-500">@{s.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <MapPin size={13} className="text-gray-400" />
                      {s.subOffice}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {s.markets.map((m) => (
                        <span key={m} className="inline-flex items-center gap-1 px-2 py-1 bg-[#e8f0ec] text-[#3d5a45] rounded-lg text-[11px] font-medium">
                          <Store size={10} />
                          {m}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-800">{s.collectors}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600">
                      {s.status}
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