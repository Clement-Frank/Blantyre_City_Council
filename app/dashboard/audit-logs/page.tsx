"use client";

import { useState } from "react";
import { Search, Shield, Filter, Download, Clock, Globe, User } from "lucide-react";

const auditLogs = [
  { id: 1, actor: "John Phiri", actorType: "User", action: "CREATE", resource: "Business", resourceId: "VN-45231", details: "Registered new business: Grace's Grocery", ip: "102.67.12.45", timestamp: "2026-07-25 14:32:10" },
  { id: 2, actor: "Airtel Money", actorType: "ApiClient", action: "PAYMENT", resource: "Payment", resourceId: "P-78291", details: "Payment confirmation webhook received", ip: "41.78.220.10", timestamp: "2026-07-25 14:30:05" },
  { id: 3, actor: "Mary Banda", actorType: "User", action: "LOGIN", resource: "Auth", resourceId: null, details: "Supervisor login successful", ip: "102.67.45.12", timestamp: "2026-07-25 14:15:22" },
  { id: 4, actor: "System", actorType: "System", action: "UPDATE", resource: "RevenueSummary", resourceId: "RS-2407", details: "Daily aggregation job completed", ip: "localhost", timestamp: "2026-07-25 14:00:00" },
  { id: 5, actor: "Kelvin Ngwira", actorType: "User", action: "DELETE", resource: "Business", resourceId: "VN-45199", details: "Removed duplicate registration", ip: "102.67.89.33", timestamp: "2026-07-25 13:45:18" },
];

const actionColors: Record<string, string> = {
  CREATE: "bg-emerald-50 text-emerald-600",
  UPDATE: "bg-blue-50 text-blue-600",
  DELETE: "bg-red-50 text-red-600",
  LOGIN: "bg-[#e8f0ec] text-[#3d5a45]",
  PAYMENT: "bg-amber-50 text-amber-600",
};

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = auditLogs.filter((log) => {
    const matchesSearch = log.actor.toLowerCase().includes(search.toLowerCase()) || log.details.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" || log.action === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-1">Security and compliance activity trail</p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-[#3d5a45]/20">
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex flex-col lg:flex-row gap-4 justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30"
            />
          </div>
          <div className="flex gap-2">
            {["All", "CREATE", "UPDATE", "DELETE", "LOGIN", "PAYMENT"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  filter === s ? "bg-[#3d5a45] text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
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
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Timestamp</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Actor</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Action</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Resource</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Details</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock size={13} className="text-gray-400" />
                      {log.timestamp}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        log.actorType === "User" ? "bg-[#e8f0ec] text-[#3d5a45]" :
                        log.actorType === "ApiClient" ? "bg-blue-50 text-blue-600" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {log.actorType === "User" ? <User size={12} /> : log.actorType === "ApiClient" ? <Globe size={12} /> : <Shield size={12} />}
                      </div>
                      <span className="text-sm font-medium text-gray-800">{log.actor}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${actionColors[log.action] || "bg-gray-50 text-gray-600"}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {log.resource} {log.resourceId && <span className="text-gray-400 text-xs ml-1">#{log.resourceId}</span>}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600 max-w-xs truncate">{log.details}</td>
                  <td className="px-5 py-4 text-xs font-mono text-gray-500">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}