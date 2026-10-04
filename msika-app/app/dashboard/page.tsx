"use client";

// Msika control tower — the main dashboard is purpose-built around what the
// system does: collect market fees, show who has paid (green) and who has not
// (red), and keep revenue flowing into Blantyre City Council.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  UserPlus,
  Receipt,
  MapPinned,
  TrendingUp,
  TrendingDown,
  Smartphone,
  Banknote,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import MarketFocusCard from "@/components/dashboard/MarketFocusCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import RecentPayments from "@/components/dashboard/RecentPayments";

interface DashStats {
  total_vendors: number;
  active_vendors: number;
  paid_today: number;
  unpaid_today: number;
  compliance_today: number;
  revenue_today: number;
  revenue_yesterday: number;
  revenue_month: number;
  revenue_growth_pct: number | null;
  transactions_today: number;
  new_vendors_week: number;
  collection_rate: number;
}

interface ChannelMix {
  channel: string;
  count: number;
  amount: number;
}

const CHANNEL_META: Record<string, { label: string; icon: React.ElementType; color: string; logo?: string }> = {
  Cash: { label: "Cash (collector)", icon: Banknote, color: "#f59e0b" },
  AirtelMoney: { label: "Airtel Money", icon: Smartphone, color: "#e40000", logo: "/brands/airtel.png" },
  TNMMpamba: { label: "TNM Mpamba", icon: Smartphone, color: "#00a0a0", logo: "/brands/tnm.png" },
  Bank: { label: "Bank", icon: Banknote, color: "#3b82f6" },
};

function ComplianceRing({ pct }: { pct: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const filled = (Math.min(Math.max(pct, 0), 100) / 100) * c;
  return (
    <div className="relative w-[132px] h-[132px] shrink-0">
      <svg viewBox="0 0 132 132" className="w-full h-full -rotate-90">
        <circle cx="66" cy="66" r={r} fill="none" stroke="#1F1F1A" strokeWidth="12" />
        <circle
          cx="66"
          cy="66"
          r={r}
          fill="none"
          stroke="#AFE607"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c - filled}`}
          className="transition-[stroke-dasharray] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-white tabular-nums">{pct}%</span>
        <span className="text-[10px] uppercase tracking-wider text-white/40">compliance</span>
      </div>
    </div>
  );
}

// Smooth count-up used by the hero figures (revenue, paid, unpaid, compliance).
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (!Number.isFinite(target)) return;
    const start = performance.now();
    const from = fromRef.current;
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      const v = from + (target - from) * eased;
      setValue(v);
      if (p < 1) {
        raf = requestAnimationFrame(step);
      } else {
        fromRef.current = target;
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashStats | null>(null);
  const [channels, setChannels] = useState<ChannelMix[]>([]);

  useEffect(() => {
    const load = () =>
      fetch("/api/dashboard")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && setStats(d.stats))
        .catch(() => {});
    load();
    const t = setInterval(load, 60000);

    // Channel mix from the latest payments (realtime wallet + cash feed)
    fetch("/api/payments?limit=200")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const payments = (d?.payments ?? []) as {
          payment_channel: string;
          amount: string | number;
        }[];
        const map = new Map<string, ChannelMix>();
        for (const p of payments) {
          const cur = map.get(p.payment_channel) ?? { channel: p.payment_channel, count: 0, amount: 0 };
          cur.count += 1;
          cur.amount += Number(p.amount);
          map.set(p.payment_channel, cur);
        }
        setChannels([...map.values()].sort((a, b) => b.amount - a.amount));
      })
      .catch(() => {});

    return () => clearInterval(t);
  }, []);

  const mwk = (n: number) => `MK ${n.toLocaleString("en-MW", { maximumFractionDigits: 0 })}`;

  // Animated hero figures — sweep up when data lands (and on each refresh)
  const paidCount = useCountUp(stats?.paid_today ?? 0);
  const unpaidCount = useCountUp(stats?.unpaid_today ?? 0);
  const compliance = useCountUp(stats?.compliance_today ?? 0);
  const revenue = useCountUp(stats?.revenue_today ?? 0);

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* ===== Control tower hero ===== */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0E0E0B] text-white shadow-2xl">
        <div className="absolute -top-24 -right-16 w-[420px] h-[420px] rounded-full bg-[#AFE607]/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-10 w-[300px] h-[300px] rounded-full bg-[#AFE607]/5 blur-3xl" />

        <div className="relative p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center gap-8">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#AFE607]">
              Msika · Market Fee Control Tower
            </p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
              Today at Limbe Market
            </h1>
            <p className="mt-1 text-sm text-white/50">
              Karani, {user?.fullName || "Administrator"} — here is who has paid and how much has come in.
            </p>

            <div className="mt-6 flex flex-wrap items-end gap-x-10 gap-y-4">
              <div className="msika-rise">
                <p className="text-[11px] uppercase tracking-wider text-white/40">Collected today</p>
                <p className="text-4xl font-extrabold text-[#AFE607] leading-tight tabular-nums">
                  {stats ? mwk(revenue) : "—"}
                </p>
                {stats?.revenue_growth_pct != null && (
                  <span
                    className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                      stats.revenue_growth_pct >= 0
                        ? "bg-[#AFE607]/15 text-[#C5F92E]"
                        : "bg-red-500/15 text-red-300"
                    }`}
                  >
                    {stats.revenue_growth_pct >= 0 ? (
                      <TrendingUp size={12} />
                    ) : (
                      <TrendingDown size={12} />
                    )}
                    {stats.revenue_growth_pct >= 0 ? "+" : ""}
                    {stats.revenue_growth_pct}% vs yesterday
                  </span>
                )}
              </div>
              <div className="hidden sm:block">
                <p className="text-[11px] uppercase tracking-wider text-white/40">Transactions</p>
                <p className="text-2xl font-bold">{stats?.transactions_today ?? "—"}</p>
              </div>
              <div className="hidden sm:block">
                <p className="text-[11px] uppercase tracking-wider text-white/40">This month</p>
                <p className="text-2xl font-bold">{stats ? mwk(stats.revenue_month) : "—"}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard/map"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#AFE607] hover:bg-[#9AD106] text-[#0E0E0B] text-sm font-bold rounded-xl transition-all shadow-lg shadow-[#AFE607]/25"
              >
                <MapPinned size={16} />
                Open Live Map
              </Link>
              <Link
                href="/dashboard/vendors/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A1A16] hover:bg-[#2A2A24] border border-[#2A2A24] text-white text-sm font-medium rounded-xl transition-all"
              >
                <UserPlus size={16} />
                Register Vendor
              </Link>
              <Link
                href="/dashboard/payments"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A1A16] hover:bg-[#2A2A24] border border-[#2A2A24] text-white text-sm font-medium rounded-xl transition-all"
              >
                <Receipt size={16} />
                Record Payment
              </Link>
            </div>
          </div>

          {/* Paid vs unpaid split */}
          <div className="msika-rise flex items-center gap-8 rounded-2xl bg-[#141410]/80 border border-[#1F1F1A] p-6 lg:p-7">
            <ComplianceRing pct={Math.round(compliance)} />
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.8)] animate-pulse" />
                <div>
                  <p className="text-xl font-bold leading-none tabular-nums">{Math.round(paidCount)}</p>
                  <p className="text-[11px] text-white/40">paid — green dots</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse" />
                <div>
                  <p className="text-xl font-bold leading-none tabular-nums">{Math.round(unpaidCount)}</p>
                  <p className="text-[11px] text-white/40">unpaid — red dots</p>
                </div>
              </div>
              <p className="text-[11px] text-white/40 max-w-[220px] leading-relaxed">
                Reminders dispatch automatically every 30 minutes — no chasing needed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== How the money arrives ===== */}
      {channels.length > 0 && (
        <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {channels.slice(0, 5).map((ch) => {
            const meta = CHANNEL_META[ch.channel] ?? {
              label: ch.channel,
              icon: Banknote,
              color: "#6b7280",
            };
            const Icon = meta.icon;
            return (
              <div
                key={ch.channel}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  {meta.logo ? (
                    <div className="w-10 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={meta.logo} alt={meta.label} className="max-h-6 max-w-[36px] object-contain" />
                    </div>
                  ) : (
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
                    >
                      <Icon size={15} />
                    </div>
                  )}
                  <p className="text-xs font-semibold text-gray-700 leading-tight">{meta.label}</p>
                </div>
                <p className="text-lg font-extrabold text-gray-900">{mwk(ch.amount)}</p>
                <p className="text-[11px] text-gray-400">{ch.count} payments</p>
              </div>
            );
          })}
        </section>
      )}

      {/* ===== Revenue + market focus ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RevenueChart />
        </div>
        <MarketFocusCard />
      </div>

      {/* ===== Live feed ===== */}
      <div>
        <RecentPayments />
      </div>
    </div>
  );
}
