"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, CheckCircle2, XCircle, Clock } from "lucide-react";
import Link from "next/link";

interface Payment {
  payment_id: number;
  amount: string | number;
  fee_type: string;
  payment_channel: string;
  status: string;
  created_at: string;
  transaction_ref: string | null;
  business: { vendor_number: string; business_name: string; owner_name: string; market: { name: string } };
}

export default function RecentPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    fetch("/api/payments?limit=6")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setPayments(d.payments || []))
      .catch(() => undefined);
  }, []);

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
    return `${Math.floor(hrs / 24)} days ago`;
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-gray-800">Live Transactions</h3>
          <p className="text-xs text-gray-500 mt-0.5">Recent market fee payments</p>
        </div>
        <Link
          href="/dashboard/payments"
          className="flex items-center gap-1 text-xs font-medium text-[#5a9e8f] hover:text-[#3d5a45] transition-colors"
        >
          See all <ArrowUpRight size={14} />
        </Link>
      </div>

      <div className="space-y-3">
        {payments.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No payments recorded yet</p>
        ) : (
          payments.map((payment) => (
            <Link
              href={`/dashboard/vendors/${payment.business.vendor_number}`}
              key={payment.payment_id}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  payment.status === "Completed"
                    ? "bg-emerald-50 text-emerald-600"
                    : payment.status === "Failed"
                    ? "bg-red-50 text-red-500"
                    : "bg-amber-50 text-amber-500"
                }`}
              >
                {payment.status === "Completed" ? (
                  <CheckCircle2 size={18} />
                ) : payment.status === "Failed" ? (
                  <XCircle size={18} />
                ) : (
                  <Clock size={18} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-800 truncate">
                    {payment.business.business_name}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">
                    {payment.business.vendor_number}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {payment.fee_type} • {payment.business.market?.name} • {timeAgo(payment.created_at)}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-gray-800">
                  MWK {Number(payment.amount).toLocaleString()}
                </p>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    payment.payment_channel === "AirtelMoney"
                      ? "bg-red-50 text-red-600"
                      : payment.payment_channel === "TNMMpamba"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {payment.payment_channel}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
