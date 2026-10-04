"use client";

// Payments hub — the daily working surface: record cash payments and
// watch the live transaction feed. Reminders are fully automatic
// (dispatched every 30 minutes to unpaid vendors), so there is no
// manual reminder workflow in the UI.

import { useState, useEffect, useCallback } from "react";
import { Search, Download, CheckCircle2, XCircle, Clock, PlusCircle, X } from "lucide-react";

interface Payment {
  payment_id: number;
  amount: string | number;
  fee_type: string;
  payment_channel: string;
  status: string;
  created_at: string;
  transaction_ref: string | null;
  business: { vendor_number: string; business_name: string; owner_name: string; market: { name: string } };
  collector: { full_name: string } | null;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  Completed: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  Failed: { icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  Pending: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
};

// Official brand marks for wallet channels
const CHANNEL_LOGOS: Record<string, { src: string; alt: string }> = {
  AirtelMoney: { src: "/brands/airtel.png", alt: "Airtel Money" },
  TNMMpamba: { src: "/brands/tnm.png", alt: "TNM Mpamba" },
};

function ChannelBadge({ channel }: { channel: string }) {
  const logo = CHANNEL_LOGOS[channel];
  if (logo) {
    return (
      <span className="inline-flex items-center justify-center h-6 w-[52px] rounded-md bg-white border border-gray-100 overflow-hidden" title={logo.alt}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo.src} alt={logo.alt} className="max-h-[18px] max-w-[44px] object-contain" />
      </span>
    );
  }
  return (
    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
      {channel}
    </span>
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  // Cash recording modal
  const [showRecord, setShowRecord] = useState(false);
  const [vendorNumber, setVendorNumber] = useState("");
  const [amount, setAmount] = useState("300");
  const [channel, setChannel] = useState("Cash");
  const [recordMsg, setRecordMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/payments?status=${filter}&search=${encodeURIComponent(search)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setPayments(d?.payments || []))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, [filter, search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);


  const recordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setRecordMsg(null);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_number: vendorNumber, amount: Number(amount), payment_channel: channel }),
      });
      const data = await res.json();
      if (res.ok) {
        setRecordMsg({
          ok: true,
          text: `${data.message || "Payment recorded"} — an automatic receipt has been sent to the vendor.`,
        });
        load();
      } else {
        setRecordMsg({ ok: false, text: data.error || "Failed to record payment" });
      }
    } catch {
      setRecordMsg({ ok: false, text: "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
          <p className="text-sm text-gray-500 mt-1">Record fees and follow the live transaction feed — reminders go out automatically</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowRecord(true);
              setRecordMsg(null);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-[#3d5a45]/20"
          >
            <PlusCircle size={16} />
            Record Payment
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-colors"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Record payment modal */}
      {showRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowRecord(false)}>
          <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-800">Record a Payment</h3>
              <button onClick={() => setShowRecord(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            {recordMsg && (
              <div className={`rounded-xl px-4 py-3 mb-4 text-sm ${recordMsg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                {recordMsg.text}
              </div>
            )}

            <form onSubmit={recordPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Vendor ID</label>
                <input
                  type="text"
                  value={vendorNumber}
                  onChange={(e) => setVendorNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. V-01001"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-mono"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (MWK)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                    required
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm appearance-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="AirtelMoney">Airtel Money</option>
                    <option value="TNMMpamba">TNM Mpamba</option>
                  </select>
                  {channel !== "Cash" && CHANNEL_LOGOS[channel] && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center justify-center h-7 w-[60px] rounded-md bg-white border border-gray-100 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={CHANNEL_LOGOS[channel].src} alt={CHANNEL_LOGOS[channel].alt} className="max-h-5 object-contain" />
                      </span>
                      <span className="text-[11px] text-gray-400">selected channel</span>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-gray-400">
                Cash payments are marked complete immediately — the vendor&apos;s map dot turns green and they receive an automatic receipt. Wallet payments stay pending until the provider confirms.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#3d5a45] hover:bg-[#2d4335] text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {submitting ? "Recording..." : "Record Payment"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex flex-col lg:flex-row gap-4 justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions, vendors, refs..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30"
            />
          </div>
          <div className="flex gap-2">
            {["All", "Completed", "Pending", "Failed"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
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
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">Loading payments...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">No payments found</td>
                </tr>
              ) : (
                payments.map((p) => {
                  const cfg = statusConfig[p.status] || statusConfig.Pending;
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={p.payment_id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-gray-800">P-{p.payment_id}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{p.transaction_ref || "—"}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-800">{p.business?.business_name}</p>
                        <p className="text-xs text-gray-500">{p.business?.vendor_number}</p>
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-gray-800">MWK {Number(p.amount).toLocaleString()}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{p.fee_type}</td>
                      <td className="px-5 py-4">
                        <ChannelBadge channel={p.payment_channel} />
                      </td>
                      <td className="px-5 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                          <StatusIcon size={12} />
                          {p.status}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {new Date(p.created_at).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </td>
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
