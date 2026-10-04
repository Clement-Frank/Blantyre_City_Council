"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, User, Phone, MapPin, Store, Hash, Crosshair, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface Market {
  market_id: number;
  name: string;
  sections: { section_id: number; section_name: string }[];
}
interface BusinessType {
  business_type_id: number;
  name: string;
  fee_amount: string;
}

interface RegisterResult {
  success?: boolean;
  error?: string;
  vendor_number?: string;
  location?: { lat: number; lng: number; source: string };
  geofence?: { inside: boolean; distanceMeters: number } | null;
}

export default function NewVendorPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [types, setTypes] = useState<BusinessType[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RegisterResult | null>(null);
  const [form, setForm] = useState({
    business_name: "",
    owner_name: "",
    phone_number: "",
    national_id: "",
    email: "",
    market_id: "",
    section_id: "",
    business_type_id: "",
    block: "",
    stall_number: "",
    gps_latitude: "",
    gps_longitude: "",
    use_gps: false,
    preferred_wallet: "AirtelMoney",
    wallet_number: "",
  });

  useEffect(() => {
    fetch("/api/markets")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setMarkets(d.markets || []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    // Load business types via markets-less endpoint (uses vendors list meta) —
    // simplest: derive from an exposed setup endpoint is overkill; fetch first vendor list.
    fetch("/api/setup/types")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setTypes(d.types || []))
      .catch(() => undefined);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const payload: Record<string, unknown> = { ...form };
      if (!form.use_gps) {
        delete payload.gps_latitude;
        delete payload.gps_longitude;
      }
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ error: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30 transition-all";
  const selectClass =
    "w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30 appearance-none";

  if (result?.success) {
    return (
      <div className="max-w-[800px] space-y-6">
        <div className="bg-white rounded-2xl p-10 border border-gray-100 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Vendor Registered!</h1>
          <p className="text-sm text-gray-500 mb-1">
            Unique vendor ID assigned:
          </p>
          <p className="text-3xl font-mono font-bold text-[#3d5a45] mb-6">{result.vendor_number}</p>

          <div className="bg-[#e8f0ec] rounded-xl p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-[#3d5a45] mb-2 flex items-center gap-2">
              <Crosshair size={16} /> Geo-fence location
            </p>
            <p className="text-xs text-[#3d5a45]/80">
              Pinned at [{result.location?.lat?.toFixed(5)}, {result.location?.lng?.toFixed(5)}]
              {result.location?.source === "derived"
                ? " — auto-derived inside the Limbe Market fence from the section."
                : " — GPS reading validated against the Limbe Market fence."}
            </p>
            {result.geofence && !result.geofence.inside && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <AlertTriangle size={12} /> GPS was outside the fence — snapped to the boundary edge.
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-center">
            <Link
              href={`/dashboard/vendors/${result.vendor_number}`}
              className="px-6 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] text-white text-sm font-medium rounded-xl transition-colors"
            >
              View Profile
            </Link>
            <Link
              href="/dashboard/map"
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors"
            >
              See on Map
            </Link>
            <button
              onClick={() => {
                setResult(null);
                setForm({ ...form, business_name: "", owner_name: "", phone_number: "", national_id: "", email: "", block: "", stall_number: "" });
              }}
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors"
            >
              Register Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[800px]">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/vendors" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Register Vendor</h1>
          <p className="text-sm text-gray-500 mt-1">Onboard a new market vendor with geo-fenced location</p>
        </div>
      </div>

      {result?.error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <p className="text-sm text-red-600">{result.error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={form.business_name}
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                placeholder="e.g. Grace Banda Traders"
                className={inputClass}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Owner Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={form.owner_name}
                onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                placeholder="e.g. Grace Banda"
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
                value={form.phone_number}
                onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                placeholder="e.g. 0991234567"
                className={inputClass}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Market</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={16} />
              <select
                value={form.market_id}
                onChange={(e) => {
                  setForm({ ...form, market_id: e.target.value, section_id: "" });
                }}
                className={selectClass}
                required
              >
                <option value="">Select Market</option>
                {markets.map((m) => (
                  <option key={m.market_id} value={m.market_id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={16} />
              <select
                value={form.section_id}
                onChange={(e) => setForm({ ...form, section_id: e.target.value })}
                className={selectClass}
              >
                <option value="">Select Section</option>
                {markets
                  .find((m) => String(m.market_id) === form.market_id)
                  ?.sections.map((s) => (
                    <option key={s.section_id} value={s.section_id}>
                      {s.section_name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Type (sets the daily fee)</label>
            <select
              value={form.business_type_id}
              onChange={(e) => setForm({ ...form, business_type_id: e.target.value })}
              className={selectClass}
              required
            >
              <option value="">Select Business Type</option>
              {types.map((t) => (
                <option key={t.business_type_id} value={t.business_type_id}>
                  {t.name} — MWK {Number(t.fee_amount).toLocaleString()}/day
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Block</label>
            <input
              type="text"
              value={form.block}
              onChange={(e) => setForm({ ...form, block: e.target.value })}
              placeholder="e.g. B3"
              className={inputClass.replace("pl-10", "px-4")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stall Number</label>
            <input
              type="text"
              value={form.stall_number}
              onChange={(e) => setForm({ ...form, stall_number: e.target.value })}
              placeholder="e.g. S-214"
              className={inputClass.replace("pl-10", "px-4")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Wallet</label>
            <select
              value={form.preferred_wallet}
              onChange={(e) => setForm({ ...form, preferred_wallet: e.target.value })}
              className={selectClass}
            >
              <option value="AirtelMoney">Airtel Money</option>
              <option value="TNMMpamba">TNM Mpamba</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Number</label>
            <input
              type="tel"
              value={form.wallet_number}
              onChange={(e) => setForm({ ...form, wallet_number: e.target.value })}
              placeholder="Defaults to mobile number"
              className={inputClass.replace("pl-10", "px-4")}
            />
          </div>

          {/* Geo-fence GPS capture */}
          <div className="md:col-span-2 p-4 bg-[#e8f0ec] rounded-xl border border-[#d4e5dc]">
            <label className="flex items-center gap-3 text-sm font-medium text-[#3d5a45] mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.use_gps}
                onChange={(e) => setForm({ ...form, use_gps: e.target.checked })}
                className="w-4 h-4 accent-[#3d5a45]"
              />
              <Crosshair size={16} />
              I have GPS readings for this stall (capture on-site)
            </label>
            {form.use_gps ? (
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="any"
                  value={form.gps_latitude}
                  onChange={(e) => setForm({ ...form, gps_latitude: e.target.value })}
                  placeholder="Latitude (e.g. -15.79870)"
                  className="w-full px-4 py-2.5 bg-white border border-[#d4e5dc] rounded-xl text-sm"
                  required={form.use_gps}
                />
                <input
                  type="number"
                  step="any"
                  value={form.gps_longitude}
                  onChange={(e) => setForm({ ...form, gps_longitude: e.target.value })}
                  placeholder="Longitude (e.g. 35.00580)"
                  className="w-full px-4 py-2.5 bg-white border border-[#d4e5dc] rounded-xl text-sm"
                  required={form.use_gps}
                />
                <p className="col-span-2 text-[11px] text-[#3d5a45]/70">
                  Readings are validated against the Limbe Market geo-fence. Points slightly outside are snapped to the boundary.
                </p>
              </div>
            ) : (
              <p className="text-xs text-[#3d5a45]/70">
                Leave unchecked and the system will auto-derive a stall position inside the fence from the selected section — the vendor still gets an exact map dot.
              </p>
            )}
          </div>
        </div>

        <div className="p-4 bg-[#e8f0ec] rounded-xl border border-[#d4e5dc]">
          <p className="text-sm font-medium text-[#3d5a45] mb-1">Vendor ID Preview</p>
          <p className="text-xs text-[#3d5a45]/70">A unique Vendor ID (e.g. V-00512) is generated automatically upon registration and used for all payments.</p>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
          <Link href="/dashboard/vendors" className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-[#3d5a45]/20 disabled:opacity-50"
          >
            <Save size={16} />
            {submitting ? "Registering..." : "Register Vendor"}
          </button>
        </div>
      </form>
    </div>
  );
}
