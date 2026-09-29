"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Plus, Shield, MapPin, Store, Trash2, UserCog, Loader2 } from "lucide-react";

interface Supervisor {
  supervisor_id: number;
  full_name: string;
  username: string;
  sub_office: string;
  markets: string[];
  is_active: boolean;
}

export default function SupervisorsPage() {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ full_name: "", username: "", password: "", sub_office_id: "" });
  const [subOffices, setSubOffices] = useState<{ sub_office_id: number; name: string }[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/supervisors");
      const data = await res.json();
      setSupervisors(data.supervisors ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    fetch("/api/markets")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        // markets API also returns sub offices context if available
        if (d?.sub_offices) setSubOffices(d.sub_offices);
      })
      .catch(() => {});
  }, [load]);

  const filtered = supervisors.filter(
    (s) =>
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.username.toLowerCase().includes(search.toLowerCase())
  );

  const addSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/supervisors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add supervisor");
        return;
      }
      setShowAdd(false);
      setForm({ full_name: "", username: "", password: "", sub_office_id: "" });
      load();
    } finally {
      setSaving(false);
    }
  };

  const deleteSupervisor = async (s: Supervisor) => {
    if (!confirm(`Remove supervisor ${s.full_name}? They will no longer be able to sign in.`)) return;
    const res = await fetch(`/api/supervisors?id=${s.supervisor_id}`, { method: "DELETE" });
    if (res.ok) load();
  };

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Supervisors</h1>
          <p className="text-sm text-gray-500 mt-1">Add or remove market supervisors across sub-offices</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-[#3d5a45]/20"
        >
          <Plus size={16} />
          Add Supervisor
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search supervisors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-10 flex items-center justify-center text-gray-400 text-sm gap-2">
            <Loader2 size={16} className="animate-spin" /> Loading supervisors...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Supervisor</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Sub Office</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Markets</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">
                      No supervisors found.
                    </td>
                  </tr>
                )}
                {filtered.map((s) => (
                  <tr key={s.supervisor_id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#5a9e8f] to-[#7bc4b5] flex items-center justify-center text-white text-xs font-bold">
                          {s.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{s.full_name}</p>
                          <p className="text-xs text-gray-500">@{s.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <MapPin size={13} className="text-gray-400" />
                        {s.sub_office}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {s.markets.length === 0 && <span className="text-xs text-gray-400">—</span>}
                        {s.markets.map((m) => (
                          <span key={m} className="inline-flex items-center gap-1 px-2 py-1 bg-[#e8f0ec] text-[#3d5a45] rounded-lg text-[11px] font-medium">
                            <Store size={10} />
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${s.is_active ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                        {s.is_active ? "Active" : "Removed"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {s.is_active && (
                        <button
                          onClick={() => deleteSupervisor(s)}
                          title="Remove supervisor"
                          className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add supervisor modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#3d5a45]/10 text-[#3d5a45] flex items-center justify-center">
                <UserCog size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Add Supervisor</h2>
                <p className="text-xs text-gray-500">Creates a sign-in account for a market supervisor</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-2.5 mb-4">{error}</div>
            )}

            <form onSubmit={addSupervisor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="e.g. James Moyo"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="e.g. j.moyo"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Sub Office</label>
                <select
                  value={form.sub_office_id}
                  onChange={(e) => setForm({ ...form, sub_office_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30"
                >
                  <option value="">Unassigned</option>
                  {subOffices.map((so) => (
                    <option key={so.sub_office_id} value={so.sub_office_id}>
                      {so.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] text-white rounded-xl text-sm font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  Add Supervisor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
