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

const statusStyles: Record<string, string> = {
  Compliant: "bg-emerald-50 text-emerald-700",
  "At Risk": "bg-amber-50 text-amber-700",
  "Non-Compliant": "bg-rose-50 text-rose-700",
};

const statusIcon: Record<string, React.ReactNode> = {
  Compliant: <ShieldCheck size={16} className="text-emerald-600" />,
  "At Risk": <ShieldAlert size={16} className="text-amber-600" />,
  "Non-Compliant": <ShieldX size={16} className="text-rose-600" />,
};

export default function ComplianceReportPage() {
  const compliantCount = complianceData.filter((item) => item.status === "Compliant").length;
  const atRiskCount = complianceData.filter((item) => item.status === "At Risk").length;
  const nonCompliantCount = complianceData.filter((item) => item.status === "Non-Compliant").length;

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
              <p className="text-2xl font-bold text-gray-800">{compliantCount}</p>
              <p className="text-xs text-gray-500">Compliant</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <ShieldAlert size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{atRiskCount}</p>
              <p className="text-xs text-gray-500">At Risk</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <ShieldX size={20} className="text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{nonCompliantCount}</p>
              <p className="text-xs text-gray-500">Non-Compliant</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-base font-bold text-gray-800 mb-4">Vendor Status Overview</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Vendor</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Market</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Section</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Paid / Missed</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Streak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {complianceData.map((item) => (
                <tr key={item.vendorId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="text-sm font-medium text-gray-800">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.vendorId}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{item.market}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{item.section}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{item.daysPaid} / {item.daysMissed}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[item.status]}`}>
                      {statusIcon[item.status]}
                      {item.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{item.streak} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
