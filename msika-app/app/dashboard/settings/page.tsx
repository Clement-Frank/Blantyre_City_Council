"use client";

import { useState } from "react";
import { Save, Bell, Shield, User, Building2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "organization", label: "Organization", icon: Building2 },
];

const inputClass =
  "w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3d5a45]/30";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const { user } = useAuth();

  // Security tab state (wired to POST /api/auth/change-password)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPassword !== confirmPassword) {
      setPwMsg({ ok: false, text: "New passwords do not match" });
      return;
    }
    setSavingPw(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMsg({ ok: true, text: data.message || "Password updated" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPwMsg({ ok: false, text: data.error || "Failed to change password" });
      }
    } catch {
      setPwMsg({ ok: false, text: "Network error" });
    } finally {
      setSavingPw(false);
    }
  };

  const displayName = user?.fullName || "";
  const firstName = displayName.split(" ")[0] || "";
  const lastName = displayName.split(" ").slice(1).join(" ");

  return (
    <div className="space-y-6 max-w-[1000px]">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and system preferences</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto" role="tablist">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-[#3d5a45] text-[#3d5a45]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === "profile" && (
            <div className="space-y-5 max-w-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                  <input type="text" value={firstName} readOnly className={`${inputClass} text-gray-700 bg-gray-100`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                  <input type="text" value={lastName} readOnly className={`${inputClass} text-gray-700 bg-gray-100`} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                <input type="text" value={user?.username ?? ""} readOnly className={`${inputClass} text-gray-700 bg-gray-100`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <input type="text" value={user?.role ?? ""} disabled className={`${inputClass} text-gray-500`} />
              </div>
              <p className="text-xs text-gray-400">
                Names and roles are managed by the council administrators. Use Security to change your password.
              </p>
            </div>
          )}

          {activeTab === "security" && (
            <form onSubmit={changePassword} className="space-y-5 max-w-lg">
              {pwMsg && (
                <div
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm ${
                    pwMsg.ok
                      ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                      : "bg-red-50 border border-red-100 text-red-600"
                  }`}
                >
                  {pwMsg.ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                  {pwMsg.text}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={inputClass}
                />
                <p className="text-xs text-gray-400 mt-1">At least 8 characters.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={savingPw}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
              >
                <Shield size={15} />
                {savingPw ? "Updating…" : "Update Password"}
              </button>
            </form>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-4 max-w-lg">
              {["Payment confirmations", "Daily revenue summary", "Failed payment alerts", "New vendor registrations"].map((item) => (
                <div key={item} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item}</p>
                    <p className="text-xs text-gray-500">Receive via email and SMS</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-[#3d5a45]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3d5a45]"></div>
                  </label>
                </div>
              ))}
            </div>
          )}

          {activeTab === "organization" && (
            <div className="space-y-5 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Council Name</label>
                <input type="text" defaultValue="Blantyre City Council" readOnly className={`${inputClass} text-gray-700 bg-gray-100`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Default Market</label>
                <select className={inputClass} defaultValue="Limbe Market">
                  <option>Limbe Market</option>
                  <option>Mpemba Market</option>
                  <option>Chadzunda Market</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
