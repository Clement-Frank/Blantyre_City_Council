"use client";

import { useState } from "react";
import { Search, CheckCircle2, XCircle, ArrowLeft, Receipt, QrCode } from "lucide-react";
import Link from "next/link";

interface VerifyResult {
  vendor_number: string;
  business_name: string;
  owner_name: string;
  market: string;
  section: string;
  daily_fee: number | null;
  paid_today: boolean;
  today_payment: { transaction_ref: string | null; amount: string | number; paid_at: string; payment_channel: string } | null;
  history: { payment_id: number; amount: string | number; status: string; transaction_ref: string | null; paid_at: string | null; payment_channel: string }[];
}

export default function VerifyPaymentPage() {
  const [searchId, setSearchId] = useState("");
  const [vendor, setVendor] = useState<VerifyResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/payments/verify?vendor_number=${encodeURIComponent(searchId.trim())}`);
      const data = await res.json();
      setVendor(res.ok ? data.vendor : null);
    } catch {
      setVendor(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[800px]">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/payments" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Verify Payment</h1>
          <p className="text-sm text-gray-500 mt-1">Check vendor payment status by ID or phone number</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter Vendor ID (e.g. V-01001) or phone"
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30"
            />
          </div>
          <button
            type="button"
            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
            title="Scan QR"
          >
            <QrCode size={20} />
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[#3d5a45] hover:bg-[#2d4335] text-white font-medium rounded-xl transition-colors shadow-lg shadow-[#3d5a45]/20 disabled:opacity-50"
          >
            {loading ? "..." : "Verify"}
          </button>
        </div>
      </form>

      {searched && !loading && !vendor && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
          <XCircle size={40} className="text-red-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-red-800">Vendor Not Found</h3>
          <p className="text-sm text-red-600 mt-1">No vendor found with ID "{searchId}". Please check and try again.</p>
        </div>
      )}

      {vendor && (
        <div className="space-y-5">
          <div className={`rounded-2xl p-6 text-white shadow-lg bg-gradient-to-br ${vendor.paid_today ? "from-emerald-700 to-[#2d4335]" : "from-red-700 to-[#2d4335]"}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 bg-white/20 rounded-lg text-xs font-mono font-medium">{vendor.vendor_number}</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${vendor.paid_today ? "bg-emerald-400/20 text-emerald-300" : "bg-red-400/20 text-red-300"}`}>
                    <CheckCircle2 size={12} />
                    {vendor.paid_today ? "Paid Today" : "Not Paid Today"}
                  </span>
                </div>
                <h2 className="text-xl font-bold">{vendor.business_name}</h2>
                <p className="text-sm text-white/70 mt-1">{vendor.market} • {vendor.section || "—"}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{vendor.today_payment ? `MWK ${Number(vendor.today_payment.amount).toLocaleString()}` : `MWK ${vendor.daily_fee ? Number(vendor.daily_fee).toLocaleString() : "—"}`}</p>
                <p className="text-xs text-white/60">{vendor.today_payment ? "Latest Payment" : "Daily Fee Due"}</p>
              </div>
            </div>
            {vendor.today_payment && (
              <div className="mt-5 pt-5 border-t border-white/10 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-white/50 mb-1">Transaction Ref</p>
                  <p className="text-sm font-mono font-medium">{vendor.today_payment.transaction_ref || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-1">Date & Time</p>
                  <p className="text-sm font-medium">{new Date(vendor.today_payment.paid_at).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-1">Channel</p>
                  <p className="text-sm font-medium">{vendor.today_payment.payment_channel}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-base font-bold text-gray-800 mb-4">Payment History</h3>
            {vendor.history.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">No payments recorded</p>
            ) : (
              <div className="space-y-3">
                {vendor.history.map((h) => (
                  <div key={h.payment_id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${h.status === "Completed" ? "bg-emerald-50" : "bg-amber-50"}`}>
                      <Receipt size={18} className={h.status === "Completed" ? "text-emerald-600" : "text-amber-500"} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">MWK {Number(h.amount).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Ref: {h.transaction_ref || "—"} • {h.payment_channel}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-medium ${h.status === "Completed" ? "text-emerald-600" : "text-amber-600"}`}>{h.status}</p>
                      <p className="text-[10px] text-gray-400">
                        {h.paid_at ? new Date(h.paid_at).toLocaleDateString("en-GB") : "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
