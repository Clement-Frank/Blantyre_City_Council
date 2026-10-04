"use client";

// Public QR payment page — what a vendor sees when they scan the QR badge
// on their stall. No login required. Shows today's payment status and lets
// them self-pay via wallet; the dashboard dot flips green instantly.

import { use, useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Smartphone, ShieldCheck, MapPin } from "lucide-react";
import CouncilLogo from "@/components/CouncilLogo";

interface PayStatus {
  vendor_number: string;
  code: string;
  business_name: string;
  owner_name: string;
  market?: string;
  fee: number | null;
}

type Phase = "loading" | "ready" | "paying" | "done" | "already" | "error";

export default function PayByQrPage({ params }: { params: Promise<{ vendorNumber: string }> }) {
  const { vendorNumber } = use(params);
  const [vendor, setVendor] = useState<PayStatus | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<{ amount: number; ref: string } | null>(null);

  const checkStatus = useCallback(async () => {
    const res = await fetch(`/api/public/pay-status?vendor_number=${encodeURIComponent(vendorNumber)}`);
    if (!res.ok) {
      setPhase("error");
      setError(res.status === 404 ? "This stall is not registered in Msika." : "Could not load stall details.");
      return;
    }
    const d = await res.json();
    setVendor(d);
    if (d.paid_today) {
      setPhase("already");
    } else {
      setPhase("ready");
    }
  }, [vendorNumber]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const pay = async () => {
    if (!vendor) return;
    setPhase("paying");
    setError("");
    try {
      const res = await fetch("/api/pay/paycode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_number: vendor.vendor_number,
          code: vendor.code,
          amount: vendor.fee ?? 300,
          payment_channel: "AirtelMoney",
        }),
      });
      const d = await res.json();
      if (d.already_paid) {
        setPhase("already");
      } else if (d.paid) {
        setReceipt({ amount: d.amount, ref: d.receipt_ref });
        setPhase("done");
      } else {
        setError(d.error || "Payment failed. Please try again.");
        setPhase("ready");
      }
    } catch {
      setError("Network error. Please try again.");
      setPhase("ready");
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0B] flex flex-col items-center justify-center p-5">
      <div className="absolute top-[-120px] right-[-80px] w-[320px] h-[320px] rounded-full bg-[#AFE607]/10 blur-3xl" />

      <div className="relative w-full max-w-[420px]">
        <div className="flex flex-col items-center mb-6">
          <CouncilLogo className="w-20 h-auto" />
          <p className="mt-2 text-[11px] font-bold text-white tracking-[0.2em] text-center">BLANTYRE CITY COUNCIL</p>
        </div>

        <div className="bg-[#1A1A16] border border-[#2A2A24] rounded-3xl p-7 shadow-2xl">
          {phase === "loading" && (
            <div className="py-12 flex flex-col items-center text-white/60">
              <Loader2 size={28} className="animate-spin text-[#AFE607]" />
              <p className="mt-3 text-sm">Loading your stall…</p>
            </div>
          )}

          {phase === "error" && (
            <div className="py-10 text-center">
              <p className="text-red-400 text-sm mb-4">{error}</p>
              <a href="/login" className="text-[#AFE607] text-sm font-semibold">Go to Msika login →</a>
            </div>
          )}

          {vendor && phase !== "loading" && phase !== "error" && (
            <>
              <div className="text-center mb-6">
                <p className="text-[11px] uppercase tracking-widest text-[#AFE607] font-bold">Stall payment</p>
                <h1 className="text-2xl font-extrabold text-white mt-1">{vendor.business_name}</h1>
                <p className="text-sm text-white/40 mt-1">
                  {vendor.vendor_number} • {vendor.owner_name}
                </p>
                {vendor.market && (
                  <p className="inline-flex items-center gap-1 text-xs text-white/30 mt-2">
                    <MapPin size={11} /> {vendor.market}
                  </p>
                )}
              </div>

              {(phase === "ready" || phase === "paying") && (
                <>
                  <div className="bg-[#0E0E0B] rounded-2xl p-5 text-center mb-5 border border-[#2A2A24]">
                    <p className="text-[11px] uppercase tracking-wider text-white/40">Today&apos;s market fee</p>
                    <p className="text-4xl font-extrabold text-[#AFE607] mt-1">
                      MWK {vendor.fee != null ? vendor.fee.toLocaleString() : 300}
                    </p>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 mb-4">
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={pay}
                    disabled={phase === "paying"}
                    className="w-full py-4 bg-[#AFE607] hover:bg-[#9AD106] text-[#0E0E0B] font-extrabold rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 inline-flex items-center justify-center gap-2 text-[15px]"
                  >
                    {phase === "paying" ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Processing payment…
                      </>
                    ) : (
                      <>
                        <Smartphone size={18} /> Pay with Airtel Money
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-white/30 text-center mt-4 leading-relaxed">
                    Paying confirms your stall has settled today&apos;s fee — your dot turns green on the
                    council dashboard immediately and a receipt SMS is sent to you.
                  </p>
                </>
              )}

              {phase === "done" && receipt && (
                <div className="text-center py-4">
                  <CheckCircle2 size={56} className="mx-auto text-[#AFE607] mb-4" />
                  <h2 className="text-xl font-extrabold text-white">You&apos;re paid! 🎉</h2>
                  <p className="text-sm text-white/50 mt-2">
                    MWK {receipt.amount.toLocaleString()} received. Your stall is now marked{" "}
                    <span className="text-emerald-400 font-bold">GREEN (paid)</span> on the council map.
                  </p>
                  <div className="mt-5 bg-[#0E0E0B] border border-[#2A2A24] rounded-xl px-4 py-3">
                    <p className="text-[10px] uppercase tracking-wider text-white/30">Receipt reference</p>
                    <p className="text-sm font-mono text-[#AFE607]">{receipt.ref}</p>
                  </div>
                  <p className="text-[11px] text-white/30 mt-4">Keep this page as your proof of payment.</p>
                </div>
              )}

              {phase === "already" && (
                <div className="text-center py-4">
                  <CheckCircle2 size={56} className="mx-auto text-emerald-400 mb-4" />
                  <h2 className="text-xl font-extrabold text-white">Already paid today ✓</h2>
                  <p className="text-sm text-white/50 mt-2">
                    This stall has settled today&apos;s market fee. Nothing more to pay — see you tomorrow!
                  </p>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-[#2A2A24] flex items-center justify-center gap-1.5 text-[11px] text-white/30">
                <ShieldCheck size={12} className="text-[#AFE607]" />
                Secured by Msika · Blantyre City Council
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
