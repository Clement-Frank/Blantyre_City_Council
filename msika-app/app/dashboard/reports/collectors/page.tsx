"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import ReportToolbar from "@/components/dashboard/ReportToolbar";

interface ReportTable {
  title: string;
  subtitle: string;
  summary: { label: string; value: string }[];
  columns: string[];
  rows: (string | number)[][];
}

export default function CollectorsReportPage() {
  const [report, setReport] = useState<ReportTable | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/summary?type=collectors")
      .then((r) => (r.ok ? r.json() : null))
      .then(setReport)
      .finally(() => setLoading(false));
  }, []);

  const rows = report?.rows ?? [];
  const maxCollected = Math.max(1, ...rows.map((r) => Number(r[5])));

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/reports" className="p-2 hover:bg-gray-100 rounded-lg transition-colors no-print">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Collector Performance</h1>
            <p className="text-sm text-gray-500 mt-1">{report?.subtitle ?? "Registrations and collections, last 30 days"}</p>
          </div>
        </div>
        <ReportToolbar type="collectors" />
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
            {report.summary.map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm print-block">
                <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                <p className="text-2xl font-bold text-gray-800 tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden print-block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Rank</th>
                    {report.columns.map((c) => (
                      <th key={c} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                        {c}
                      </th>
                    ))}
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={report.columns.length + 2} className="px-5 py-10 text-center text-sm text-gray-400">
                        No collector activity recorded yet.
                      </td>
                    </tr>
                  )}
                  {rows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            i === 0 ? "bg-[#3d5a45] text-white" : i === 1 ? "bg-[#5a9e8f] text-white" : i === 2 ? "bg-[#7bc4b5] text-white" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {i + 1}
                        </div>
                      </td>
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className={`px-5 py-4 text-sm ${
                            j === 0
                              ? "font-semibold text-gray-800"
                              : j === 5
                                ? "font-semibold text-[#3d5a45] tabular-nums"
                                : "text-gray-600"
                          }`}
                        >
                          {j === 5 ? `MWK ${Number(cell).toLocaleString("en-MW")}` : cell}
                        </td>
                      ))}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-[#3d5a45] h-2 rounded-full transition-[width] duration-700"
                              style={{ width: `${(Number(row[5]) / maxCollected) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{Math.round((Number(row[5]) / maxCollected) * 100)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-5 py-4 text-[11px] text-gray-400 border-t border-gray-50">
              Cash collected is the sum of completed payments attributed to each collector in the last 30 days.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
