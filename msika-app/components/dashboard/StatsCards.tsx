"use client";

import { ArrowUpRight, CircleDollarSign, Users, ReceiptText } from "lucide-react";

const stats = [
  {
    label: "Revenue Collected",
    value: "MWK 2.4M",
    change: "+12.4%",
    icon: CircleDollarSign,
  },
  {
    label: "Active Vendors",
    value: "1,284",
    change: "+8.1%",
    icon: Users,
  },
  {
    label: "Payments Verified",
    value: "842",
    change: "+5.6%",
    icon: ReceiptText,
  },
];

export default function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
              <div className="rounded-xl bg-[#eef5f1] p-3 text-[#3d5a45]">
                <Icon size={18} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm font-medium text-emerald-600">
              <ArrowUpRight size={14} />
              {stat.change}
            </div>
          </div>
        );
      })}
    </div>
  );
}
