"use client";

import { useState } from "react";
import { Search, Filter, Download, CheckCircle2, XCircle, Clock } from "lucide-react";

const payments = [
  { id: "P-78291", vendor: "Grace Banda", vendorId: "V-00231", amount: 300, type: "Standard Daily Fee", market: "Limbe Market", date: "2026-07-24 08:30", status: "Completed", channel: "AirtelMoney", ref: "AM-88213X" },
  { id: "P-78290", vendor: "John Phiri", vendorId: "V-00189", amount: 2000, type: "Kupikulisa Bulk Fee", market: "Limbe Market", date: "2026-07-24 08:15", status: "Completed", channel: "TNMMpamba", ref: "TM-99102Z" },
  { id: "P-78289", vendor: "Mercy Chirwa", vendorId: "V-00342", amount: 300, type: "Standard Daily Fee", market: "Limbe Market", date: "2026-07-24 07:45", status: "Failed", channel: "USSD", ref: "N/A" },
  { id: "P-78288", vendor: "Patrick Banda", vendorId: "V-00156", amount: 300, type: "Standard Daily Fee", market: "Limbe Market", date: "2026-07-24 07:20", status: "Completed", channel: "AirtelMoney", ref: "AM-88210Y" },
  { id: "P-78287", vendor: "Esther Nkhoma", vendorId: "V-00411", amount: 2000, type: "Kupikulisa Bulk Fee", market: "Limbe Market", date: "2026-07-24 06:55", status: "Pending", channel: "TNMMpamba", ref: "TM-99100A" },
];

const statusConfig = {
  Completed: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  Failed: { icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  Pending: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
};

export default function PaymentsPage() {
  const [filter, setFilter] = useState("All");

  const filtered = filter === "All" ? payments : payments.filter((p) => p.status === filter);

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
          <p className="text-sm text-gray-500 mt-1">Track and verify all market fee transactions</p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-colors">
          <Download size={16} />
          Export
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex flex-col lg:flex-row gap-4 justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search transactions..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30"
            />
          </div>
          <div className="flex gap-2">
            {["All", "Completed", "Pending", "Failed"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  filter === s
                    ? "bg-[#3d5a45] text-white shadow-md"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
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
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Transaction</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Vendor</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Amount</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Channel</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((p) => {
                const StatusIcon = statusConfig[p.status as keyof typeof statusConfig].icon;
                return (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-800">{p.id}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{p.ref}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-800">{p.vendor}</p>
                      <p className="text-xs text-gray-500">{p.vendorId}</p>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-gray-800">MWK {p.amount.toLocaleString()}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{p.type}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        p.channel === "AirtelMoney" ? "bg-red-50 text-red-600" :
                        p.channel === "TNMMpamba" ? "bg-blue-50 text-blue-600" :
                        "bg-gray-50 text-gray-600"
                      }`}>
                        {p.channel}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[p.status as keyof typeof statusConfig].bg} ${statusConfig[p.status as keyof typeof statusConfig].color}`}>
                        <StatusIcon size={12} />
                        {p.status}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{p.date}</td>
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