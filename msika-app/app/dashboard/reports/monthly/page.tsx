"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, TrendingUp } from "lucide-react";
import ReportToolbar from "@/components/dashboard/ReportToolbar";

interface ReportTable {
  title: string;
  subtitle: string;
  summary: { label: string; value: string }[];
  columns: string[];
  rows: (string | number)[][];
}

export default function MonthlyReportPage() {
  const [report, setReport] = useState<ReportTable | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/summary?type=monthly")
      .then((r) => (r.ok ? r.json() : null))
      .then(setReport)
      .finally(() => setLoading(false));
  }, []);

  const max = Math.max(1, ...(report?.rows.map((r) => Number(r[1])) ?? [0]));

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/reports" className="p-2 hover:bg-gray-100 rounded-lg transition-colors no-print">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Monthly Revenue Report</h1>
            <p className="text-sm text-gray-500 mt-1">{report?.subtitle ?? "Last six months of collections"}</p>
          </div>
        </div>
        <ReportToolbar type="monthly" />
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
                <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs">
                  <TrendingUp size={12} />
                  <span>live from recorded payments</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm print-block">
            <h3 className="text-base font-bold text-gray-800 mb-4">Monthly Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50">
                    {report.columns.map((c) => (
                      <th key={c} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                        {c}
                      </th>
                    ))}
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {report.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className={`px-5 py-4 text-sm ${
                            j === 0 ? "font-medium text-gray-800" : j === 1 ? "font-bold text-gray-800 tabular-nums" : "text-gray-600"
                          }`}
                        >
                          {j === 1 ? `MWK ${Number(cell).toLocaleString("en-MW")}` : cell}
                        </td>
                      ))}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-[#3d5a45] h-2 rounded-full transition-[width] duration-700"
                              style={{ width: `${(Number(row[1]) / max) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {Math.round((Number(row[1]) / max) * 100)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-gray-400 mt-4">
              Generated from completed payments only. Wallet payments appear once the provider confirms them.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
