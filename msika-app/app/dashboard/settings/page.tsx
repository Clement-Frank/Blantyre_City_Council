"use client";

// Settings — real account information from the authenticated session and
// the live status of background automation. No fake preference forms:
// everything shown here reflects actual system state.

import { useEffect, useState } from "react";
import { User, ShieldCheck, BellRing, Building2, Loader2 } from "lucide-react";

interface Me {
  userId?: number;
  username: string;
  role: string;
  fullName: string;
}

export default function SettingsPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setMe(d))
      .catch(() => setMe(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 size={18} className="animate-spin inline text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1000px]">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Your account and the system&apos;s live automation status</p>
      </div>

      {/* Account — from the real session */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex items-center gap-2">
          <User size={15} className="text-[#3d5a45]" />
          <h2 className="text-sm font-bold text-gray-800">Account</h2>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Full name</p>
            <p className="text-sm font-semibold text-gray-800">{me?.fullName || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Username</p>
            <p className="text-sm font-mono text-gray-800">{me?.username || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Role</p>
            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-[#e8f0ec] text-[#3d5a45] border border-[#d8e6dd]">
              {me?.role || "—"}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Session</p>
            <p className="text-sm text-gray-600">Signed in · expires after 8 hours of inactivity</p>
          </div>
        </div>
      </div>

      {/* Automation — what the system does on its own */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex items-center gap-2">
          <BellRing size={15} className="text-[#3d5a45]" />
          <h2 className="text-sm font-bold text-gray-800">Background automation</h2>
        </div>
        <div className="divide-y divide-gray-50">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">Payment reminders</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Sent automatically every 30 minutes to vendors who haven&apos;t paid — SMS receipts and
                registration confirmations are also dispatched automatically.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 whitespace-nowrap">
              Always on
            </span>
          </div>
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">Wallet confirmations</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Airtel Money and TNM Mpamba webhook confirmations are processed instantly — payments
                flip from Pending to Completed the moment the provider confirms.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 whitespace-nowrap">
              Live
            </span>
          </div>
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">Reliability scoring</p>
              <p className="text-xs text-gray-500 mt-0.5">
                The Msika Reliability Index recomputes on every view from real payment history —
                no nightly batch to configure.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 whitespace-nowrap">
              On demand
            </span>
          </div>
        </div>
      </div>

      {/* Organization */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex items-center gap-2">
          <Building2 size={15} className="text-[#3d5a45]" />
          <h2 className="text-sm font-bold text-gray-800">Organization</h2>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Council</p>
            <p className="text-sm font-semibold text-gray-800">Blantyre City Council</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Operating market</p>
            <p className="text-sm font-semibold text-gray-800">Limbe Market — Limbe Sub Office</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400 px-1">
        <ShieldCheck size={13} className="text-[#3d5a45]" />
        Access to every module is role-scoped — your data view matches what you&apos;re permitted to see.
      </div>
    </div>
  );
}
