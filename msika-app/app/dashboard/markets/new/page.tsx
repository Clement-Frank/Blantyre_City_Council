"use client";

// Add Market — register a new council market and its sub-office.
// The market is created live through POST /api/markets (admin only);
// sections/submarkets are added afterwards on the market card.

import { useEffect, useState } from "react";
import { ArrowLeft, Save, Store, MapPin, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewMarketPage() {
  const [form, setForm] = useState({ name: "", subOffice: "", location: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [offices, setOffices] = useState<{ sub_office_id: number; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/markets")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setOffices((d?.sub_offices ?? []) as { sub_office_id: number; name: string }[]))
      .catch(() => setOffices([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const office = offices.find((o) => String(o.sub_office_id) === form.subOffice);
      const res = await fetch("/api/markets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          location: form.location,
          sub_office_id: office ? office.sub_office_id : undefined,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setMsg({ ok: true, text: `${form.name} registered — add its submarkets from the market card.` });
      } else {
        setMsg({ ok: false, text: d.error || "Failed to register market" });
      }
    } catch {
      setMsg({ ok: false, text: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[800px]">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/markets" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Add Market</h1>
          <p className="text-sm text-gray-500 mt-1">Register a new council market</p>
        </div>
      </div>

      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Market Name</label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Limbe Market"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sub Office</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={form.subOffice}
                onChange={(e) => setForm({ ...form, subOffice: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30 appearance-none"
                required
              >
                <option value="">Select Sub Office</option>
                {offices.map((o) => (
                  <option key={o.sub_office_id} value={o.sub_office_id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Location / Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Limbe Township, near bus depot"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30"
                required
              />
            </div>
          </div>
        </div>

        <p className="text-[11px] text-gray-400">
          After registering the market, add its submarkets (sections) from the market card — vendors are
          registered into a market and a submarket.
        </p>

        <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
          <Link href="/dashboard/markets" className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-[#3d5a45]/20 disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Add Market
          </button>
        </div>
      </form>
    </div>
  );
}
