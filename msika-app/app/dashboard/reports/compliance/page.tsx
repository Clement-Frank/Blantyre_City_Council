"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import ReportToolbar from "@/components/dashboard/ReportToolbar";

interface ReportTable {
  title: string;
  subtitle: string;
  summary: { label: string; value: string }[];
  columns: string[];
  rows: (string | number)[][];
}

const STATUS_STYLES: Record<string, string> = {
  Compliant: "bg-emerald-50 text-emerald-700",
  "At Risk": "bg-amber-50 text-amber-700",
  "Non-Compliant": "bg-rose-50 text-rose-700",
};

export default function ComplianceReportPage() {
  const [report, setReport] = useState<ReportTable | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/reports/summary?type=compliance")
      .then((r) => (r.ok ? r.json() : null))
      .then(setReport)
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => {
    const all = report?.rows ?? [];
    return all.filter((row) => {
      const matchesStatus = status === "All" || row[8] === status;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        String(row[0]).toLowerCase().includes(q) ||
        String(row[1]).toLowerCase().includes(q) ||
        String(row[2]).toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [report, status, search]);

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/reports" className="p-2 hover:bg-gray-100 rounded-lg transition-colors no-print">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Vendor Compliance</h1>
            <p className="text-sm text-gray-500 mt-1">{report?.subtitle ?? "Payment frequency over the last 30 days"}</p>
          </div>
        </div>
        <ReportToolbar type="compliance" />
      </div>

      {loading ? (
        <div className="py-20 flex items-center justify-center gap-2 text-sm text-gray-400">
          <Loader2 size={16} className="animate-spin" /> Generating report…
        </div>
      ) : !report ? (
        <p className="text-sm text-gray-500">Report unavailable.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {report.summary.map((s, i) => (
              <div key={s.label} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm print-block">
                <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                <p className={`text-2xl font-bold tabular-nums ${i === 0 ? "text-emerald-700" : i === 1 ? "text-amber-600" : "text-rose-600"}`}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm print-block">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-base font-bold text-gray-800">Vendor Status ({rows.length})</h3>
              <div className="flex flex-wrap items-center gap-2 no-print">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search vendor…"
                    className="pl-8 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3d5a45]/30 w-44"
                  />
                </div>
                {["All", "Compliant", "At Risk", "Non-Compliant"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      status === s ? "bg-[#3d5a45] text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
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
                    {report.columns.map((c) => (
                      <th key={c} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={report.columns.length} className="px-5 py-10 text-center text-sm text-gray-400">
                        No vendors match this filter.
                      </td>
                    </tr>
                  )}
                  {rows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-800">{row[1]}</p>
                        <p className="text-xs text-gray-500">{row[0]}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">{row[2]}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{row[3]}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{row[4]}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{row[5]} paid · {row[6]} missed</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                row[8] === "Compliant" ? "bg-emerald-500" : row[8] === "At Risk" ? "bg-amber-500" : "bg-rose-500"
                              }`}
                              style={{ width: String(row[7]) }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{row[7]}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[String(row[8])] ?? "bg-gray-50 text-gray-600"}`}>
                          {row[8]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-gray-400 mt-4">
              A vendor is compliant at 80% or more paid days in the window, at risk at 50–79%, non-compliant below 50%.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
