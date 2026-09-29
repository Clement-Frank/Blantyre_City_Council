"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, User, Phone, MapPin, Lock, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface SubOffice {
  sub_office_id: number;
  name: string;
}

export default function NewCollectorPage() {
  const [subOffices, setSubOffices] = useState<SubOffice[]>([]);
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    mobile_number: "",
    password: "",
    sub_office_id: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Sub offices come embedded in the markets endpoint payload — but that
    // requires auth only, fine here. Fall back to Limbe default.
    fetch("/api/markets")
      .then((r) => (r.ok ? r.json() : null))
      .then(() => setSubOffices([{ sub_office_id: 1, name: "Limbe Sub Office" }]))
      .catch(() => setSubOffices([{ sub_office_id: 1, name: "Limbe Sub Office" }]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/collectors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          sub_office_id: form.sub_office_id ? Number(form.sub_office_id) : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.collector?.username || form.username);
      } else {
        setError(data.error || "Failed to register collector");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30 transition-all";

  if (success) {
    return (
      <div className="max-w-[800px]">
        <div className="bg-white rounded-2xl p-10 border border-gray-100 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Collector Registered!</h1>
          <p className="text-sm text-gray-500 mb-1">Username:</p>
          <p className="text-2xl font-mono font-bold text-[#3d5a45] mb-6">@{success}</p>
          <p className="text-xs text-gray-400 mb-6">They can now log in to record cash payments and register vendors.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard/collectors" className="px-6 py-2.5 bg-[#3d5a45] text-white text-sm font-medium rounded-xl">
              View Collectors
            </Link>
            <button
              onClick={() => {
                setSuccess(null);
                setForm({ full_name: "", username: "", mobile_number: "", password: "", sub_office_id: "" });
              }}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl"
            >
              Add Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[800px]">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/collectors" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Register Collector</h1>
          <p className="text-sm text-gray-500 mt-1">Add a new revenue collector to the system</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="e.g. John Phiri"
                className={inputClass}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
                placeholder="e.g. j.phiri"
                className={inputClass}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="tel"
                value={form.mobile_number}
                onChange={(e) => setForm({ ...form, mobile_number: e.target.value })}
                placeholder="e.g. 0881234567"
                className={inputClass}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Temporary Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min 6 characters"
                className={inputClass}
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sub Office</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={16} />
              <select
                value={form.sub_office_id}
                onChange={(e) => setForm({ ...form, sub_office_id: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30 appearance-none"
              >
                <option value="">Select Sub Office</option>
                {subOffices.map((s) => (
                  <option key={s.sub_office_id} value={s.sub_office_id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
          <Link
            href="/dashboard/collectors"
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-[#3d5a45]/20 disabled:opacity-50"
          >
            <Save size={16} />
            {submitting ? "Registering..." : "Register Collector"}
          </button>
        </div>
      </form>
    </div>
  );
}
