"use client";

// API Management — real integration surface for external providers
// (Airtel Money, TNM Mpamba, USSD aggregators). Registered clients hold
// API keys consumed by /api/external/*. Plaintext keys are shown exactly
// once at creation; only SHA-256 hashes are stored server-side.

import { useCallback, useEffect, useState } from "react";
import { Plus, Key, Copy, Check, X, RefreshCw, ShieldCheck, Power } from "lucide-react";

interface ApiKeyRow {
  api_key_id: number;
  name: string;
  permissions: string[];
  rate_limit: number;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface ApiClientRow {
  api_client_id: number;
  name: string;
  contact_email: string;
  contact_phone: string | null;
  is_active: boolean;
  created_at: string;
  keys: ApiKeyRow[];
}

export default function ApiManagementPage() {
  const [clients, setClients] = useState<ApiClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [creating, setCreating] = useState(false);
  const [formMsg, setFormMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [freshKey, setFreshKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/api-clients")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setClients(d?.clients ?? []))
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormMsg(null);
    try {
      const res = await fetch("/api/api-clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contact_email: email, contact_phone: phone }),
      });
      const d = await res.json();
      if (res.ok) {
        setFreshKey(d.api_key.plaintext);
        setShowCreate(false);
        setName("");
        setEmail("");
        setPhone("");
        load();
      } else {
        setFormMsg({ ok: false, text: d.error || "Failed to register client" });
      }
    } catch {
      setFormMsg({ ok: false, text: "Network error" });
    } finally {
      setCreating(false);
    }
  };

  const toggleKey = async (keyId: number, isActive: boolean) => {
    setToggling(keyId);
    try {
      await fetch("/api/api-clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key_id: keyId, is_active: !isActive }),
      });
      load();
    } finally {
      setToggling(null);
    }
  };

  const copyKey = () => {
    if (freshKey) navigator.clipboard.writeText(freshKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalKeys = clients.reduce((a, c) => a + c.keys.length, 0);
  const activeKeys = clients.reduce((a, c) => a + c.keys.filter((k) => k.is_active).length, 0);

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">API Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            External provider integrations feeding /api/external — keys are hashed, shown once
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreate(true);
            setFormMsg(null);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-[#3d5a45]/20"
        >
          <Plus size={16} />
          Register API Client
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Registered clients</p>
          <p className="text-2xl font-bold text-gray-800">{clients.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Active keys</p>
          <p className="text-2xl font-bold text-[#3d5a45]">
            {activeKeys} <span className="text-sm text-gray-400 font-medium">of {totalKeys}</span>
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Endpoints served</p>
          <p className="text-2xl font-bold text-gray-800 text-sm pt-2 font-mono">
            /external/payments · /external/vendors
          </p>
        </div>
      </div>

      {/* Freshly minted key — shown once */}
      {freshKey && (
        <div className="bg-[#0E0E0B] rounded-2xl p-6 text-white shadow-xl border border-[#AFE607]/30">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={16} className="text-[#AFE607]" />
            <p className="text-sm font-bold">API key created — copy it now, it will not be shown again</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <code className="flex-1 px-4 py-3 bg-[#1A1A16] border border-[#2A2A24] rounded-xl text-xs font-mono text-[#AFE607] break-all">
              {freshKey}
            </code>
            <button
              onClick={copyKey}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-[#AFE607] hover:bg-[#C5F92E] text-[#0E0E0B] text-sm font-bold rounded-xl transition-colors shrink-0"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={() => setFreshKey(null)}
              className="px-3 py-3 text-white/50 hover:text-white transition-colors shrink-0"
              title="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Create client modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-800">Register API Client</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            {formMsg && (
              <div className={`rounded-xl px-4 py-3 mb-4 text-sm ${formMsg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                {formMsg.text}
              </div>
            )}
            <form onSubmit={createClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Provider name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Airtel Money Malawi"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="api@provider.mw"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact phone (optional)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0999xxxxxx"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full py-3 bg-[#3d5a45] hover:bg-[#2d4335] text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {creating ? "Creating..." : "Register & generate key"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Clients & keys */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-sm text-gray-400">
            Loading API clients...
          </div>
        ) : clients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-sm text-gray-400">
            No API clients registered yet — wallet webhooks (Airtel/TNM) use signed routes, external providers use keys from here.
          </div>
        ) : (
          clients.map((c) => (
            <div key={c.api_client_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-[#e8f0ec] text-[#3d5a45] flex items-center justify-center">
                    <Key size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-500">
                      {c.contact_email}
                      {c.contact_phone ? ` · ${c.contact_phone}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${c.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-gray-50 text-gray-500 border-gray-100"}`}>
                    {c.is_active ? "Active" : "Disabled"}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    registered {new Date(c.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {c.keys.map((k) => (
                  <div key={k.api_key_id} className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-gray-50/40">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 font-medium">{k.name}</p>
                      <p className="text-[11px] text-gray-400 font-mono">
                        key #{k.api_key_id} · {k.permissions.join(", ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-gray-400">
                        {k.last_used_at
                          ? `last used ${new Date(k.last_used_at).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`
                          : "never used"}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${k.is_active ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                        {k.is_active ? "ACTIVE" : "REVOKED"}
                      </span>
                      <button
                        onClick={() => toggleKey(k.api_key_id, k.is_active)}
                        disabled={toggling === k.api_key_id}
                        className={`p-1.5 rounded-lg transition-colors ${k.is_active ? "text-gray-400 hover:text-red-500 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"}`}
                        title={k.is_active ? "Revoke key" : "Re-enable key"}
                      >
                        {toggling === k.api_key_id ? <RefreshCw size={14} className="animate-spin" /> : <Power size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
                {c.keys.length === 0 && (
                  <div className="px-5 py-3.5 text-xs text-gray-400">No keys — register a new client to mint one.</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
