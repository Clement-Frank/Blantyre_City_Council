"use client";

import { recentPayments } from "@/lib/mock-data";
import { ArrowUpRight, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export default function RecentPayments() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-gray-800">
            Transactions History
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Recent market fee payments
          </p>
        </div>
        <Link
          href="/dashboard/payments"
          className="flex items-center gap-1 text-xs font-medium text-[#5a9e8f] hover:text-[#3d5a45] transition-colors"
        >
          See all <ArrowUpRight size={14} />
        </Link>
      </div>

      <div className="space-y-3">
        {recentPayments.map((payment) => (
          <div
            key={payment.id}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                payment.status === "Completed"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-500"
              }`}
            >
              {payment.status === "Completed" ? (
                <CheckCircle2 size={18} />
              ) : (
                <XCircle size={18} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-gray-800 truncate">
                  {payment.vendor}
                </h4>
                <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">
                  {payment.vendorId}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {payment.type} • {payment.market} • {payment.time}
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-gray-800">
                MWK {payment.amount.toLocaleString()}
              </p>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  payment.channel === "AirtelMoney"
                    ? "bg-red-50 text-red-600"
                    : payment.channel === "TNMMpamba"
                    ? "bg-blue-50 text-blue-600"
                    : "bg-gray-50 text-gray-600"
                }`}
              >
                {payment.channel}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}