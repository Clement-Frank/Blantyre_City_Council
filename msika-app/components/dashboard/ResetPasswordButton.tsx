"use client";

// Administrator-only staff password reset. Opens a small modal, posts to
// /api/staff/reset-password and reports the result inline. Every reset is
// written to the audit trail by the API.

import { useState } from "react";
import { KeyRound, X, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

export default function ResetPasswordButton({
  username,
  fullName,
  label = "Reset password",
}: {
  username: string;
  fullName: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/staff/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, new_password: password }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, text: data.message || "Password reset" });
        setPassword("");
      } else {
        setResult({ ok: false, text: data.error || "Reset failed" });
      }
    } catch {
      setResult({ ok: false, text: "Network error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          setResult(null);
        }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-medium rounded-lg transition-colors"
        title={`${label} for ${fullName}`}
      >
        <KeyRound size={13} />
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-800">Reset password</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {fullName} · @{username}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
                aria-label="Close"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            {result && (
              <div
                className={`mb-4 flex items-start gap-2 rounded-xl px-3 py-2 text-xs ${
                  result.ok
                    ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                    : "bg-red-50 border border-red-100 text-red-600"
                }`}
              >
                {result.ok ? <CheckCircle2 size={14} className="mt-0.5" /> : <AlertTriangle size={14} className="mt-0.5" />}
                {result.text}
              </div>
            )}

            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Temporary password</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                  placeholder="At least 8 characters"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3d5a45]/30"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Share it once with the officer — they change it in Settings → Security.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3d5a45] hover:bg-[#2d4335] disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  {busy && <Loader2 size={12} className="animate-spin" />}
                  Set temporary password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
