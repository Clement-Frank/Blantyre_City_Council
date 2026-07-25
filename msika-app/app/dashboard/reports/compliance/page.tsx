"use client";

import { ArrowLeft, Download, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import Link from "next/link";

const complianceData = [
  { vendorId: "V-00231", name: "Grace Banda", market: "Limbe Market", section: "Vegetables", daysPaid: 28, daysMissed: 2, status: "Compliant", streak: 14 },
  { vendorId: "V-00189", name: "John Phiri", market: "Limbe Market", section: "Fish", daysPaid: 30, daysMissed: 0, status: "Compliant", streak: 30 },
  { vendorId: "V-00342", name: "Mercy Chirwa", market: "Limbe Market", section: "Textiles", daysPaid: 15, daysMissed: 15, status: "Non-Compliant", streak: 0 },
  { vendorId: "V-00156", name: "Patrick Banda", market: "Limbe Market", section: "Hardware", daysPaid: 25, daysMissed: 5, status: "At Risk", streak: 3 },
  { vendorId: "V-00411", name: "Esther Nkhoma", market: "Limbe Market", section: "Vegetables", daysPaid: 30, daysMissed: 0, status: "Compliant", streak: 30 },
];

export default function ComplianceReportPage() {
  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/reports" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Vendor Compliance</h1>
            <p className="text-sm text-gray-500 mt-1">Payment frequency and compliance tracking</p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-[#3d5a45]/20">
          <Download size={16} />
          Export
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <ShieldCheck size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">1,040</p>
              <p className="text-xs text-gray-500">Compliant