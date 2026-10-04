"use client";

// Audit trail — real security/activity log straight from the AuditLog table.
// Every login, payment, registration, and verification is recorded by the
// API layer (lib/audit.ts); this page surfaces it for administrators.

import { useCallback, useEffect, useState } from "react";
import { Search, RefreshCw, Globe, User, Cpu } from "lucide-react";

interface AuditRow {
  log_id: number;
  actor_type: string;
  actor_name: string;
  action: string;
  resource: string;
  resource_id: string | null;
  details: string | null;
  ip_address: string | null;
  timestamp: string;
}

interface AuditPayload {
  logs: AuditRow[];
  total: number;
  action_counts: { action: string; count: number }[];
}

const actionStyles: Record<string, string> = {
  CREATE: "bg-emerald-50 text-emerald-700 border-emerald-100",
  UPDATE: "bg-blue-50 text-blue-700 border-blue-100",
  DELETE: "bg-red-50 text-red-700 border-red-100",
  LOGIN: "bg-[#e8f0ec] text-[#3d5a45] border-[#d8e6dd]",
  LOGOUT: "bg-gray-50 text-gray-600 border-gray-100",
  PAYMENT: "bg-amber-50 text-amber-700 border-amber-100",
  VERIFY: "bg-teal-50 text-teal-700 border-teal-100",
  EXPORT: "bg-purple-50 text-purple-700 border-purple-100",
};

const actorIcon = (type: string) => (type === "User" ? User : type === "ApiClient" ? Globe : Cpu);

function timeAgo(ts: string) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<{ action: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/audit-logs?search=${encodeURIComponent(search)}&action=${filter}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: AuditPayload | null) => {
        if (!d) return setLogs([]);
        setLogs(d.logs);
        setTotal(d.total);
        setCounts(d.action_counts);
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [search, filter]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Security and compliance trail — {total} matching event{total === 1 ? "" : "s"} recorded automatically by the system
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-colors"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Action summary chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("All")}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            filter === "All" ? "bg-[#3d5a45] text-white shadow-md" : "bg-white border border-gray-100 text-gray-600 hover:bg-gray-50"
          }`}
        >
          All ({counts.reduce((a, c) => a + c.count, 0)})
        </button>
        {counts.map((c) => (
          <button
            key={c.action}
            onClick={() => setFilter(c.action)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              filter === c.action ? "bg-[#3d5a45] text-white shadow-md" : "bg-white border border-gray-100 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {c.action} ({c.count})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search actor, resource, details..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50">
                {["Actor", "Action", "Resource", "Details", "IP Address", "When"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">Loading audit trail...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">No audit events found</td>
                </tr>
              ) : (
                logs.map((l) => {
                  const ActorIcon = actorIcon(l.actor_type);
                  return (
                    <tr key={l.log_id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                            <ActorIcon size={14} />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{l.actor_name}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">{l.actor_type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${actionStyles[l.action] || "bg-gray-50 text-gray-600 border-gray-100"}`}>
                          {l.action}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-800">{l.resource}</p>
                        {l.resource_id && <p className="text-[10px] text-gray-400 font-mono mt-0.5">{l.resource_id}</p>}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 max-w-[280px]">
                        <p className="truncate">{l.details || "—"}</p>
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-gray-500">{l.ip_address || "—"}</td>
                      <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">{timeAgo(l.timestamp)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
