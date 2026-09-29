"use client";

// Reminders — send payment reminders (SMS via Twilio when keys are set,
// otherwise logged as Notification rows) to vendors who have not paid today.

import { useCallback, useEffect, useState } from "react";
import { BellRing, Send, Loader2, CheckCircle2, MessageSquare, Users } from "lucide-react";

interface UnpaidVendor {
  business_id: number;
  vendor_number: string;
  business_name: string;
  owner_name: string;
  phone_number: string;
  market: { name: string };
}

interface NotificationRow {
  notification_id: number;
  recipient_type: string;
  recipient_id: number;
  type: string;
  channel: string;
  status: string;
  content: string;
  created_at: string;
}

export default function RemindersPage() {
  const [unpaid, setUnpaid] = useState<UnpaidVendor[]>([]);
  const [counts, setCounts] = useState({ paid_count: 0, unpaid_count: 0 });
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState(
    "Mwalandira bwino? This is a reminder from Blantyre City Council that your daily market fee is due. Pay via Airtel Money, TNM Mpamba or cash to a revenue collector."
  );
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/reminders");
    if (!res.ok) return;
    const d = await res.json();
    setUnpaid(d.unpaid_vendors ?? []);
    setCounts({ paid_count: d.paid_count ?? 0, unpaid_count: d.unpaid_count ?? 0 });
    setNotifications(d.notifications ?? []);
    setSelected(new Set((d.unpaid_vendors ?? []).map((v: UnpaidVendor) => v.vendor_number)));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (vn: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(vn)) next.delete(vn);
      else next.add(vn);
      return next;
    });
  };

  const send = async () => {
    if (selected.size === 0) return;
    setSending(true);
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_numbers: [...selected], message }),
      });
      const d = await res.json();
      setToast(d.message || (res.ok ? "Reminders sent" : "Failed to send reminders"));
      load();
    } finally {
      setSending(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BellRing size={22} className="text-[#3d5a45]" /> Payment Reminders
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Remind vendors who have not paid today&apos;s market fee
          </p>
        </div>
        <div className="flex gap-3 text-center">
          <div className="px-5 py-2.5 bg-white border border-gray-100 rounded-xl shadow-sm">
            <p className="text-lg font-bold text-emerald-600 leading-none">{counts.paid_count}</p>
            <p className="text-[10px] text-gray-500 mt-1">Paid today</p>
          </div>
          <div className="px-5 py-2.5 bg-white border border-gray-100 rounded-xl shadow-sm">
            <p className="text-lg font-bold text-red-500 leading-none">{counts.unpaid_count}</p>
            <p className="text-[10px] text-gray-500 mt-1">Unpaid</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Unpaid vendor picker */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Users size={15} className="text-gray-400" /> Unpaid vendors
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">{selected.size} selected</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelected(new Set(unpaid.map((v) => v.vendor_number)))}
                className="px-3 py-1.5 text-xs font-medium text-[#3d5a45] bg-[#e8f0ec] rounded-lg hover:bg-[#d8e6dd]"
              >
                Select all
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
            {unpaid.length === 0 && (
              <div className="p-10 text-center text-sm text-gray-400">
                🎉 Every vendor has paid today — nobody to remind.
              </div>
            )}
            {unpaid.map((v) => (
              <label
                key={v.vendor_number}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.has(v.vendor_number)}
                  onChange={() => toggle(v.vendor_number)}
                  className="w-4 h-4 accent-[#3d5a45]"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {v.business_name}{" "}
                    <span className="text-xs font-normal text-gray-400">({v.vendor_number})</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {v.owner_name} • {v.market?.name}
                  </p>
                </div>
                <span className="text-xs text-gray-400 font-mono">{v.phone_number}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Composer + recent notifications */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
              <MessageSquare size={15} className="text-gray-400" /> Message
            </h2>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30 resize-none"
            />
            <p className="text-[11px] text-gray-400 mt-1 mb-4">{message.length} characters</p>
            <button
              onClick={send}
              disabled={sending || selected.size === 0}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#3d5a45] hover:bg-[#2d4335] text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Send to {selected.size} vendor{selected.size === 1 ? "" : "s"}
            </button>
            <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
              Sent via SMS when Twilio keys are configured; otherwise reminders are recorded in the
              system so nothing is lost.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-800 mb-3">Recent reminders</h2>
            <div className="space-y-2.5 max-h-[260px] overflow-y-auto">
              {notifications.length === 0 && (
                <p className="text-xs text-gray-400">No reminders sent yet.</p>
              )}
              {notifications.map((n) => (
                <div key={n.notification_id} className="flex items-start gap-2.5 text-xs">
                  <CheckCircle2
                    size={13}
                    className={`mt-0.5 shrink-0 ${n.status === "Sent" ? "text-emerald-500" : "text-gray-300"}`}
                  />
                  <div className="min-w-0">
                    <p className="text-gray-700 line-clamp-2">{n.content}</p>
                    <p className="text-gray-400 mt-0.5">
                      {new Date(n.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl bg-[#0E0E0B] text-white text-sm font-medium">
          <CheckCircle2 size={16} className="text-[#AFE607]" />
          {toast}
        </div>
      )}
    </div>
  );
}
