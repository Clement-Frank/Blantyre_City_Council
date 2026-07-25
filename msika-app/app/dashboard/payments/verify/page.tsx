"use client";

import { useState } from "react";
import { Search, QrCode, CheckCircle2, XCircle, ArrowLeft, Receipt, Calendar, User } from "lucide-react";
import Link from "next/link";

const mockVendor = {
  vendorId: "V-00231",
  name: "Grace Banda",
  market: "Limbe Market",
  section: "Vegetables",
  status: "Paid",
  lastPayment: "2026-07-24 08:30",
  amount: 300,
  ref: "AM-88213X",
  history: [
    { date: "2026-07-24", amount: 300, status: "Completed", ref: "AM-88213X" },
    { date: "2026-07-23", amount: 300, status: "Completed", ref: "AM-88102Y" },
    { date: "2026-07-22", amount: 300, status: "Completed", ref: "AM-87991Z" },
  ],
};

export default function VerifyPaymentPage() {
  const [searchId, setSearchId] = useState("");
  const [vendor, setVendor] = useState<typeof mockVendor | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    if (searchId.toUpperCase() === "V-00231") {
      setVendor(mockVendor);
    } else {
      setVendor(null);
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
          <p className="text-sm text-gray-500 mt-1">Check vendor payment status by ID or QR code</p>
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
              placeholder="Enter Vendor ID (e.g. V-00231)"
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
            className="px-6 py-3 bg-[#3d5a45] hover:bg-[#2d4335] text-white font-medium rounded-xl transition-colors shadow-lg shadow-[#3d5a45]/20"
          >
            Verify
          </button>
        </div>
      </form>

      {searched && !vendor && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
          <XCircle size={40} className="text-red-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-red-800">Vendor Not Found</h3>
          <p className="text-sm text-red-600 mt-1">No vendor found with ID "{searchId}". Please check and try again.</p>
        </div>
      )}

      {vendor && (
        <div className="space-y-5">
          <div className="bg-gradient-to-br from-[#3d5a45] to-[#2d4335] rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 bg-white/20 rounded-lg text-xs font-medium">{vendor.vendorId}</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-400/20 text-emerald-300 rounded-lg text-xs font-medium">
                    <CheckCircle2 size={12} />
                    Paid Today
                  </span>
                </div>
                <h2 className="text-xl font-bold">{vendor.name}</h2>
                <p className="text-sm text-white/70 mt-1">{vendor.market} • {vendor.section}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">MWK {vendor.amount}</p>
                <p className="text-xs text-white/60">Latest Payment</p>
              </div>
            </div>
            <div className="mt-5 pt-5 border-t border-white/10 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-white/50 mb-1">Transaction Ref</p>
                <p className="text-sm font-mono font-medium">{vendor.ref}</p>
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1">Date & Time</p>
                <p className="text-sm font-medium">{vendor.lastPayment}</p>
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1">Channel</p>
                <p className="text-sm font-medium">Airtel Money</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-base font-bold text-gray-800 mb-4">Payment History</h3>
            <div className="space-y-3">
              {vendor.history.map((h, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Receipt size={18} className="text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">MWK {h.amount}</p>
                    <p className="text-xs text-gray-500">Ref: {h.ref}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-emerald-600">{h.status}</p>
                    <p className="text-[10px] text-gray-400">{h.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}