"use client";

// Daily Revenue Report — driven entirely by live payment data.
// Channels: Cash, Airtel Money, TNM Mpamba (the channels Msika actually
// collects through — USSD is intentionally not part of the system).

import { useEffect, useState } from "react";
import { ArrowLeft, Download, TrendingUp, Users, Receipt, Banknote, Smartphone, Loader2 } from "lucide-react";
import Link from "next/link";

interface Report {
  date: string;
  total_revenue: number;
  total_transactions: number;
  active_vendors: number;
  fee_types: { name: string; amount: number }[];
  channels: { name: string; amount: number }[];
  sections: { name: string; amount: number; transactions: number }[];
}

const CHANNEL_COLORS: Record<string, string> = {
  Cash: "#f59e0b",
  AirtelMoney: "#e40000",
  TNMMpamba: "#00a0a0",
};

const CHANNEL_LABELS: Record<string, string> = {
  Cash: "Cash (collector)",
  AirtelMoney: "Airtel Money",
  TNMMpamba: "TNM Mpamba",
};

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  Cash: Banknote,
  AirtelMoney: Smartphone,
  TNMMpamba: Smartphone,
};

export default function DailyReportPage() {
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/daily?date=${date}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [date]);

  const mwk = (n: number) => `MWK ${n.toLocaleString("en-MW", { maximumFractionDigits: 0 })}`;
  const total = data?.total_revenue ?? 0;

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/reports" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Daily Revenue Report</h1>
            <p className="text-sm text-gray-500 mt-1">Live figures from recorded payments</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm"
          />
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-[#3d5a45]/20"
          >
            <Download size={16} />
            Print / PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex items-center justify-center gap-2 text-sm text-gray-400">
          <Loader2 size={16} className="animate-spin" /> Loading report…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { icon: TrendingUp, value: mwk(data?.total_revenue ?? 0), label: "Total Revenue" },
              { icon: Receipt, value: String(data?.total_transactions ?? 0), label: "Transactions" },
              { icon: Users, value: String(data?.active_vendors ?? 0), label: "Vendors Paid" },
            ].map((c) => (
              <div key={c.label} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-[#e8f0ec] flex items-center justify-center">
                    <c.icon size={20} className="text-[#3d5a45]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{c.value}</p>
                    <p className="text-xs text-gray-500">{c.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fee types */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-base font-bold text-gray-800 mb-4">Revenue by Fee Type</h3>
              {(data?.fee_types.length ?? 0) === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">No payments recorded on this date.</p>
              ) : (
                <div className="space-y-4">
                  {data!.fee_types.map((f) => (
                    <div key={f.name}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">{f.name}</span>
                        <span className="text-sm font-bold text-gray-800">{mwk(f.amount)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div
                          className="bg-[#3d5a45] h-2.5 rounded-full transition-all duration-700"
                          style={{ width: `${total ? (f.amount / total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Channels — Cash, Airtel Money, TNM Mpamba (no USSD) */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-base font-bold text-gray-800 mb-1">Revenue by Channel</h3>
              <p className="text-xs text-gray-400 mb-4">How the money was collected</p>
              {(data?.channels.length ?? 0) === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">No payments recorded on this date.</p>
              ) : (
                <div className="space-y-4">
                  {data!.channels.map((c) => {
                    const color = CHANNEL_COLORS[c.name] ?? "#6b7280";
                    const Icon = CHANNEL_ICONS[c.name] ?? Banknote;
                    const pct = total ? Math.round((c.amount / total) * 100) : 0;
                    return (
                      <div key={c.name}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600 inline-flex items-center gap-1.5">
                            <Icon size={13} style={{ color }} />
                            {CHANNEL_LABELS[c.name] ?? c.name}
                          </span>
                          <span className="text-sm font-bold text-gray-800">
                            {mwk(c.amount)} <span className="text-xs font-normal text-gray-400">({pct}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div
                            className="h-2.5 rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sections */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-base font-bold text-gray-800 mb-4">Revenue by Market Section</h3>
            {(data?.sections.length ?? 0) === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">No payments recorded on this date.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Section</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Revenue</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">% of Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data!.sections.map((s) => (
                      <tr key={s.name} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4 text-sm font-medium text-gray-800">{s.name}</td>
                        <td className="px-5 py-4 text-sm font-bold text-[#3d5a45]">{mwk(s.amount)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-100 rounded-full h-2">
                              <div
                                className="bg-[#3d5a45] h-2 rounded-full"
                                style={{ width: `${total ? (s.amount / total) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {total ? ((s.amount / total) * 100).toFixed(1) : "0.0"}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
