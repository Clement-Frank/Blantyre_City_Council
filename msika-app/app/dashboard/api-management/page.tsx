"use client";

import { useState } from "react";
import { Search, Plus, Key, Copy, Eye, EyeOff, Trash2, RefreshCw, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const apiClients = [
  { id: 1, name: "Airtel Money Malawi", contact: "api@airtel.mw", phone: "0999000000", council: "Blantyre City Council", keys: 2, status: "Active", lastUsed: "2 mins ago" },
  { id: 2, name: "TNM Mpamba", contact: "dev@tnm.mw", phone: "0888000000", council: "Blantyre City Council", keys: 1, status: "Active", lastUsed: "5 mins ago" },
  { id: 3, name: "USSD Provider Ltd", contact: "support@ussd.mw", phone: "0999111111", council: "Lilongwe City Council", keys: 1, status: "Inactive", lastUsed: "3 days ago" },
];

export default function ApiManagementPage() {
  const [search, setSearch] = useState("");
  const [showKey, setShowKey] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const filtered = apiClients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">API Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage external service providers and API keys</p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-[#3d5a45]/20">
          <Plus size={16} />
          Register API Client
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total API Clients</p>
          <p className="text-2xl font-bold text-gray-800">12</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Active Keys</p>
          <p className="text-2xl font-bold text-[#3d5a45]">18</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">API Calls (Today)</p>
          <p className="text-2xl font-bold text-gray-800">45,230</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Avg Response Time</p>
          <p className="text-2xl font-bold text-gray-800">124ms</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search API clients..."
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
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Client</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Council</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">API Keys</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Last Used</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3d5a45] to-[#5a9e8f] flex items-center justify-center text-white text-xs font-bold">
                        {client.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{client.name}</p>
                        <p className="text-xs text-gray-500">{client.contact}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{client.council}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Key size={14} className="text-[#3d5a45]" />
                      <span className="text-sm font-medium text-gray-800">{client.keys}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      client.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">{client.lastUsed}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 hover:bg-[#e8f0ec] rounded-lg transition-colors text-[#3d5a45]" title="Regenerate Key">
                        <RefreshCw size={16} />
                      </button>
                      <button className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-500" title="Revoke">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* API Key Generator Mock */}
      <div className="bg-gradient-to-br from-[#3d5a45] to-[#2d4335] rounded-2xl p-6 text-white shadow-lg">
        <h3 className="text-base font-bold mb-4">Generate New API Key</h3>
        <div className="flex gap-3">
          <div className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl font-mono text-sm text-white/90 flex items-center justify-between">
            <span>{showKey ? "msika_a1b2c3d4e5f6789012345678abcdef" : "••••••••••••••••••••••••••••••••"}</span>
            <button onClick={() => setShowKey(showKey ? null : 1)} className="text-white/50 hover:text-white transition-colors">
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button onClick={() => copyKey("msika_a1b2c3d4e5f6789012345678abcdef")} className="px-4 py-3 bg-[#5a9e8f] hover:bg-[#4a8e7f] rounded-xl transition-colors">
            {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
          </button>
        </div>
        <p className="text-xs text-white/50 mt-3">Copy this key immediately. It will not be shown again.</p>
      </div>
    </div>
  );
}