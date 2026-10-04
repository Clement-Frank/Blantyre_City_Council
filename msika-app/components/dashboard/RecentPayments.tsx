"use client";

// Live Transactions — realtime feed with popping animations.
// Polls every 8s; when a new payment lands it slides/pops into the top of
// the list with a lime glow, exactly like a live ticker. Channel badges use
// the official Airtel / TNM logos.

import { useEffect, useRef, useState } from "react";
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

// Official brand marks (served from /public/brands)
const CHANNEL_LOGOS: Record<string, { src: string; alt: string; bg: string }> = {
  AirtelMoney: { src: "/brands/airtel.png", alt: "Airtel Money", bg: "bg-white border border-red-100" },
  TNMMpamba: { src: "/brands/tnm.png", alt: "TNM Mpamba", bg: "bg-white border border-gray-100" },
};

function ChannelBadge({ channel }: { channel: string }) {
  const logo = CHANNEL_LOGOS[channel];
  if (logo) {
    return (
      <span
        className={`inline-flex items-center justify-center h-6 w-[52px] rounded-md ${logo.bg} overflow-hidden`}
        title={logo.alt}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo.src} alt={logo.alt} className="max-h-[18px] max-w-[44px] object-contain" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
      {channel}
    </span>
  );
}

export default function RecentPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  const knownIds = useRef<Set<number> | null>(null);

  const load = () => {
    fetch("/api/payments?limit=8")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        const list: Payment[] = d.payments || [];
        setIsLive(true);

        if (knownIds.current === null) {
          // First load — no animations, just populate
          knownIds.current = new Set(list.map((p) => p.payment_id));
          setPayments(list);
          return;
        }

        const fresh = list.filter((p) => !knownIds.current!.has(p.payment_id));
        if (fresh.length > 0) {
          knownIds.current = new Set(list.map((p) => p.payment_id));
          setPayments(list);
          const freshIds = new Set(fresh.map((f) => f.payment_id));
          setNewIds(freshIds);
          setTimeout(() => setNewIds(new Set()), 4000);
        } else {
          setPayments(list);
        }
      })
      .catch(() => setIsLive(false));
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
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
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            Live Transactions
            <span className="relative inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              <span className="relative flex w-2 h-2">
                <span className={`absolute inline-flex w-full h-full rounded-full bg-emerald-400 ${isLive ? "msika-live-ping" : ""}`} />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
              </span>
              {isLive ? "LIVE" : "…"}
            </span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Payments as they happen — refreshes every 8s</p>
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
          payments.map((payment) => {
            const isNew = newIds.has(payment.payment_id);
            return (
              <Link
                href={`/dashboard/vendors/${payment.business.vendor_number}`}
                key={payment.payment_id}
                className={`relative flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group ${
                  isNew ? "msika-txn-pop bg-[#AFE607]/[0.06] ring-1 ring-[#AFE607]/30" : ""
                }`}
              >
                {isNew && (
                  <span className="absolute -top-1.5 right-3 z-10 px-2 py-0.5 rounded-full bg-[#AFE607] text-[#0E0E0B] text-[9px] font-extrabold uppercase tracking-wider shadow">
                    new
                  </span>
                )}

                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    isNew
                      ? "bg-[#AFE607]/20 text-[#5f7a04]"
                      : payment.status === "Completed"
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

                <div className="text-right shrink-0 space-y-1">
                  <p className={`text-sm font-bold ${isNew ? "text-[#3d5a45]" : "text-gray-800"}`}>
                    MWK {Number(payment.amount).toLocaleString()}
                  </p>
                  <ChannelBadge channel={payment.payment_channel} />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
