"use client";

// "How the money arrives" — three animated channel cards.
// Each channel has its own signature motion so staff can read the money flow
// at a glance without reading numbers first:
//   Cash   → a metallic shine sweep + bobbing banknote stack
//   Airtel → expanding signal ripples from the logo (mobile-money ping)
//   TNM    → live equalizer bars (data/airtime waves)
// Amounts count up on load and the share bar animates its width.

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Banknote, Clock3 } from "lucide-react";

interface ChannelMix {
  channel: string;
  amount: number;
  count: number;
}

interface ChannelDef {
  key: string;
  label: string;
  sub: string;
  color: string;
  text: string;
  logo: string;
  logoAlt: string;
  motion: "shine" | "ripple" | "bars";
}

const CHANNEL_DEFS: ChannelDef[] = [
  {
    key: "TNMMpamba",
    label: "TNM Mpamba",
    sub: "Mobile money payments",
    color: "#007a7a",
    text: "#006464",
    logo: "/brands/tnm.png",
    logoAlt: "TNM Mpamba",
    motion: "bars",
  },
  {
    key: "AirtelMoney",
    label: "Airtel Money",
    sub: "Mobile money payments",
    color: "#e30613",
    text: "#b10410",
    logo: "/brands/airtel.png",
    logoAlt: "Airtel Money",
    motion: "ripple",
  },
  {
    key: "Cash",
    label: "Cash (collector)",
    sub: "Handed to field staff",
    color: "#b45309",
    text: "#8a3f07",
    logo: "/brands/cash.svg",
    logoAlt: "Cash",
    motion: "shine",
  },
];

function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const from = fromRef.current;
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(step);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

const mwk = (n: number) => `MK ${Math.round(n).toLocaleString("en-MW")}`;

export default function ChannelMixCards() {
  const [mix, setMix] = useState<ChannelMix[] | null>(null);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const load = () =>
      fetch("/api/dashboard")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!d) return;
          setMix(d.channels ?? []);
          setPending(d.pending_wallets ?? 0);
        })
        .catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const byChannel = (key: string) => mix?.find((m) => m.channel === key);
  const total = (mix ?? []).reduce((s, m) => s + m.amount, 0);

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-800">How the money arrived today</h2>
          <p className="text-xs text-gray-400">
            Today&apos;s market fees split by payment channel — cash, Airtel Money and TNM Mpamba
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-gray-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 msika-live-ping" />
            live
          </span>
          <span>refreshes every 30s</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CHANNEL_DEFS.map((def, idx) => {
          const data = byChannel(def.key);
          return (
            <ChannelCard
              key={def.key}
              def={def}
              amount={data?.amount ?? 0}
              count={data?.count ?? 0}
              total={total}
              pending={def.key === "Cash" ? 0 : pending}
              index={idx}
            />
          );
        })}
      </div>
    </section>
  );
}

function ChannelCard({
  def,
  amount,
  count,
  total,
  pending,
  index,
}: {
  def: ChannelDef;
  amount: number;
  count: number;
  total: number;
  pending: number;
  index: number;
}) {
  const animated = useCountUp(amount);
  const share = total > 0 ? Math.round((amount / total) * 100) : 0;

  return (
    <article
      className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 p-5 msika-rise"
      style={{ animationDelay: `${index * 90}ms` }}
    >
      {/* Signature motion layer */}
      {def.motion === "shine" && (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-y-0 -left-1/2 w-1/3 ch-shine bg-gradient-to-r from-transparent via-amber-200/60 to-transparent" />
          <span className="absolute bottom-3 right-4 ch-coin text-amber-400/70" style={{ animationDelay: "0s" }}>
            <Banknote size={16} />
          </span>
          <span className="absolute bottom-8 right-10 ch-coin text-amber-300/60" style={{ animationDelay: "1.1s" }}>
            <Banknote size={12} />
          </span>
        </div>
      )}

      {def.motion === "ripple" && (
        <div className="pointer-events-none absolute inset-0">
          <span className="absolute -right-6 -top-6 w-24 h-24 rounded-full ch-ripple" style={{ borderColor: def.color, animationDelay: "0s" }} />
          <span className="absolute -right-6 -top-6 w-24 h-24 rounded-full ch-ripple" style={{ borderColor: def.color, animationDelay: "1.2s" }} />
        </div>
      )}

      {def.motion === "bars" && (
        <div className="pointer-events-none absolute bottom-4 right-4 flex items-end gap-[3px] h-8 opacity-80">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="ch-bar w-[3px] rounded-full"
              style={{ backgroundColor: def.color, animationDelay: `${i * 120}ms` }}
            />
          ))}
        </div>
      )}

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="relative w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-white border border-gray-200 shadow-sm"
            title={def.logoAlt}
          >
            {/* Official brand logos (served from /public/brands) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={def.logo}
              alt={def.logoAlt}
              className="ch-icon h-9 w-9 object-contain"
            />
            {def.motion === "ripple" && (
              <span className="absolute inset-0 rounded-xl ch-ping" style={{ borderColor: def.color }} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 leading-snug">{def.label}</p>
            <p className="text-[11px] text-gray-400">{def.sub}</p>
          </div>
        </div>
        <ArrowUpRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
      </div>

      <p className="relative mt-4 text-[22px] font-extrabold text-gray-900 tabular-nums leading-none">
        {mwk(animated)}
      </p>

      <div className="relative mt-2 flex items-center justify-between text-[11px] text-gray-500">
        <span>
          {count} payment{count === 1 ? "" : "s"} · <span style={{ color: def.text, fontWeight: 600 }}>{share}%</span> of today
        </span>
        {pending > 0 && (
          <span className="inline-flex items-center gap-1 text-amber-600" title="Wallet payments awaiting provider confirmation">
            <Clock3 size={11} /> {pending} pending
          </span>
        )}
      </div>

      {/* Animated share bar */}
      <div className="relative mt-3 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-1000 ease-out"
          style={{ width: `${share}%`, backgroundColor: def.color }}
        />
      </div>
    </article>
  );
}
