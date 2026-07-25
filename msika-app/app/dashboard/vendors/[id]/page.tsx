"use client";

import { useParams } from "next/navigation";
import { ArrowLeft, Phone, MapPin, Calendar, Receipt, QrCode, Edit, Printer } from "lucide-react";
import Link from "next/link";

const vendorData = {
  vendorId: "V-00231",
  name: "Grace Banda",
  mobile: "0991234567",
  market: "Limbe Market",
  section: "Vegetables",
  status: "Active",
  registered: "2026-01-15",
  registeredBy: "John Phiri",
  qrCode: "/qr/V-00231.png",
  payments: [
    { date: "2026-07-24", amount: 300, type: "Standard Daily Fee", ref: "AM-88213X", status: "Completed" },
    { date: "2026-07-23", amount: 300, type: "Standard Daily Fee", ref: "AM-88102Y", status: "Completed" },
    { date: "2026-07-22", amount: 300, type: "Standard Daily Fee", ref: "AM-87991Z", status: "Completed" },
    { date: "2026-07-21", amount: 300, type: "Standard Daily Fee", ref: "AM-87880A", status: "Completed" },
    { date: "2026-07-20", amount: 2000, type: "Kupikulisa Bulk Fee", ref: "TM-77012B", status: "Completed" },
  ],
};

export default function VendorDetailPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="space-y-6 max-w-[1000px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/vendors" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Vendor Profile</h1>
            <p className="text-sm text-gray-500 mt-1">{id}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-colors">
            <Printer size={16} />
            Print
          </button>
          <Link href={`/dashboard/vendors/edit/${id}`} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-[#3d5a45]/20">
            <Edit size={16} />
            Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3d5a45] to-[#5a9e8f] flex items-center justify-center text-white text-xl font-bold shrink-0">
                {vendorData.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-gray-800">{vendorData.name}</h2>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium">{vendorData.status}</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">{vendorData.vendorId}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={14} className="text-gray-400" />
                    {vendorData.mobile}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={14} className="text-gray-400" />
                    {vendorData.market} • {vendorData.section}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={14} className="text-gray-400" />
                    Registered {vendorData.registered}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Receipt size={14} className="text-gray-400" />
                    By {vendorData.registeredBy}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-base font-bold text-gray-800 mb-4">Payment History</h3>
            <div className="space-y-3">
              {vendorData.payments.map((p, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <Receipt size={18} className="text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800">{p.type}</p>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-medium">{p.status}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Ref: {p.ref}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">MWK {p.amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{p.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Vendor QR Code</h3>
            <div className="w-40 h-40 mx-auto bg-[#e8f0ec] rounded-xl flex items-center justify-center mb-3">
              <QrCode size={64} className="text-[#3d5a45]" />
            </div>
            <p className="text-xs text-gray-500">Scan to verify payment status</p>
            <button className="mt-4 w-full py-2.5 bg-[#e8f0ec] hover:bg-[#d4e5dc] text-[#3d5a45] text-sm font-medium rounded-xl transition-colors">
              Download QR
            </button>
          </div>

          <div className="bg-gradient-to-br from-[#3d5a45] to-[#2d4335] rounded-2xl p-6 text-white shadow-lg">
            <h3 className="text-sm font-bold mb-4">Payment Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-xs text-white/70">This Month</span>
                <span className="text-sm font-bold">MWK 8,400</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-xs text-white/70">Total Paid (2026)</span>
                <span className="text-sm font-bold">MWK 52,800</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/70">Compliance</span>
                <span className="text-sm font-bold text-emerald-300">94%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}