"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Phone, MapPin, Calendar, Receipt, QrCode, Wallet, Printer } from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";

interface VendorDetail {
  vendor_number: string;
  business_name: string;
  owner_name: string;
  phone_number: string;
  market: { name: string };
  section: { section_name: string } | null;
  business_type: { name: string; fee_amount: string };
  status: string;
  registration_date: string;
  registered_by: { full_name: string } | null;
  gps_latitude: string | null;
  gps_longitude: string | null;
  preferred_wallet: string;
  payments: {
    payment_id: number;
    amount: string;
    fee_type: string;
    status: string;
    transaction_ref: string | null;
    paid_at: string | null;
    created_at: string;
    payment_channel: string;
    collector: { full_name: string } | null;
  }[];
}

export default function VendorDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    fetch(`/api/vendors/${id}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed to load");
        return d;
      })
      .then((d) => setVendor(d.business))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Real QR: points vendors to their public self-pay page
  useEffect(() => {
    if (!vendor?.vendor_number) return;
    const url = `${window.location.origin}/pay/${vendor.vendor_number}`;
    QRCode.toDataURL(url, { width: 320, margin: 1, color: { dark: "#0E0E0B", light: "#FFFFFF" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [vendor?.vendor_number]);

  if (loading) {
    return <div className="py-20 text-center text-sm text-gray-400">Loading vendor profile...</div>;
  }
  if (error || !vendor) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-red-500 mb-4">{error || "Vendor not found"}</p>
        <Link href="/dashboard/vendors" className="text-sm text-[#3d5a45] underline">Back to vendors</Link>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const paidToday = vendor.payments.some(
    (p) => p.status === "Completed" && p.paid_at && new Date(p.paid_at) >= today
  );
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthTotal = vendor.payments
    .filter((p) => p.status === "Completed" && p.paid_at && new Date(p.paid_at) >= monthStart)
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalCompleted = vendor.payments.filter((p) => p.status === "Completed");
  const compliance = vendor.payments.length ? Math.round((totalCompleted.length / vendor.payments.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-[1000px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/vendors" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Vendor Profile</h1>
            <p className="text-sm text-gray-500 mt-1 font-mono">{vendor.vendor_number}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-colors"
          >
            <Printer size={16} />
            Print
          </button>
          <Link
            href={`/dashboard/payments?vendor=${vendor.vendor_number}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-[#3d5a45]/20"
          >
            <Receipt size={16} />
            Record Payment
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3d5a45] to-[#5a9e8f] flex items-center justify-center text-white text-xl font-bold shrink-0">
                {vendor.owner_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-gray-800">{vendor.business_name}</h2>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    paidToday ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                  }`}>
                    {paidToday ? "● Paid Today" : "● Not Paid Today"}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  {vendor.owner_name} • {vendor.business_type?.name}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={14} className="text-gray-400" />
                    {vendor.phone_number}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={14} className="text-gray-400" />
                    {vendor.market?.name} • {vendor.section?.section_name || "—"}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={14} className="text-gray-400" />
                    Registered {new Date(vendor.registration_date).toLocaleDateString("en-GB")}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Wallet size={14} className="text-gray-400" />
                    {vendor.preferred_wallet}
                  </div>
                </div>
                {vendor.gps_latitude && vendor.gps_longitude && (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${vendor.gps_latitude}&mlon=${vendor.gps_longitude}#map=18/${vendor.gps_latitude}/${vendor.gps_longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#3d5a45] font-medium hover:underline"
                  >
                    <MapPin size={12} />
                    Stall location: [{Number(vendor.gps_latitude).toFixed(5)}, {Number(vendor.gps_longitude).toFixed(5)}] — view on map
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-base font-bold text-gray-800 mb-4">Payment History</h3>
            {vendor.payments.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">No payments recorded yet</p>
            ) : (
              <div className="space-y-3">
                {vendor.payments.map((p) => (
                  <div key={p.payment_id} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      p.status === "Completed" ? "bg-emerald-50" : p.status === "Failed" ? "bg-red-50" : "bg-amber-50"
                    }`}>
                      <Receipt size={18} className={p.status === "Completed" ? "text-emerald-600" : p.status === "Failed" ? "text-red-500" : "text-amber-500"} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800">{p.fee_type}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          p.status === "Completed" ? "bg-emerald-50 text-emerald-600" : p.status === "Failed" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Ref: {p.transaction_ref || "—"} • {p.payment_channel}
                        {p.collector ? ` • by ${p.collector.full_name}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800">MWK {Number(p.amount).toLocaleString()}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(p.paid_at || p.created_at).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Stall Pay QR</h3>
            {qrDataUrl ? (
              <div className="inline-block p-3 bg-white border-2 border-[#3d5a45]/20 rounded-2xl shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt={`Pay QR for ${vendor.vendor_number}`} className="w-40 h-40" />
              </div>
            ) : (
              <div className="w-40 h-40 mx-auto bg-[#e8f0ec] rounded-xl flex items-center justify-center mb-3">
                <QrCode size={64} className="text-[#3d5a45]" />
              </div>
            )}
            <p className="text-xs text-gray-600 font-semibold mt-3">SCAN TO PAY DAILY FEE</p>
            <p className="text-[11px] text-gray-400 mt-1">Opens this stall&apos;s payment page — dot turns green instantly</p>
            <p className="text-[10px] text-gray-400 mt-1 font-mono">{vendor.vendor_number}</p>
          </div>

          <div className="bg-gradient-to-br from-[#3d5a45] to-[#2d4335] rounded-2xl p-6 text-white shadow-lg">
            <h3 className="text-sm font-bold mb-4">Payment Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-xs text-white/70">This Month</span>
                <span className="text-sm font-bold">MWK {monthTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-xs text-white/70">Payments Recorded</span>
                <span className="text-sm font-bold">{totalCompleted.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/70">Compliance</span>
                <span className="text-sm font-bold text-emerald-300">{compliance}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
