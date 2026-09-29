"use client";

// Live geo-fence map of Limbe Market with red/green vendor dots.
// Green dot = paid today, red dot = unpaid. Uses Leaflet + OpenStreetMap (no API key).
// Loaded via dynamic import (ssr: false) to avoid SSR window errors.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RefreshCw, MapPin, Filter, Locate, Crosshair, AlertTriangle, Banknote, Loader2, CheckCircle2 } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { useAuth } from "@/hooks/useAuth";

interface VendorDot {
  vendor_number: string;
  business_name: string;
  owner_name: string;
  section: string;
  business_type: string;
  daily_fee: number | null;
  lat: number;
  lng: number;
  paid_today: boolean;
  dot: "red" | "green";
}

interface MapData {
  center: { lat: number; lng: number };
  boundary: { lat: number; lng: number }[];
  vendors: VendorDot[];
  stats: { total: number; paid: number; unpaid: number; compliance: number };
}

export default function LiveMapPage() {
  const { user } = useAuth();
  const isCollector = user?.role === "Collector";
  const [data, setData] = useState<MapData | null>(null);
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const filterTouched = useRef(false);
  const [MapComponents, setMapComponents] = useState<{
    MapContainer: React.ElementType;
    TileLayer: React.ElementType;
    Polygon: React.ElementType;
    CircleMarker: React.ElementType;
    Popup: React.ElementType;
  } | null>(null);

  const load = (f: string) => {
    setLoading(true);
    fetch(`/api/map${f !== "all" ? `?filter=${f}` : ""}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    import("react-leaflet").then((m) => {
      if (!cancelled)
        setMapComponents({
          MapContainer: m.MapContainer,
          TileLayer: m.TileLayer,
          Polygon: m.Polygon,
          CircleMarker: m.CircleMarker,
          Popup: m.Popup,
        });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    load(filter);
  }, [filter]);

  // Collectors start focused on who still needs to pay (red dots)
  useEffect(() => {
    if (isCollector && !filterTouched.current) setFilter("unpaid");
  }, [isCollector]);

  // Auto-refresh every 30s for realtime monitoring
  useEffect(() => {
    const t = setInterval(() => load(filter), 30000);
    return () => clearInterval(t);
  }, [filter]);

  // Record a cash payment for an unpaid vendor straight from the map
  const recordPayment = async (vendorNumber: string, amount: number | null) => {
    setPaying(vendorNumber);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_number: vendorNumber,
          amount: amount ?? 300,
          payment_channel: "Cash",
        }),
      });
      const result = await res.json();
      if (res.ok || res.status === 409) {
        setToast({
          ok: true,
          msg:
            res.status === 409
              ? `${vendorNumber} already paid today`
              : `Payment recorded — ${vendorNumber} is now GREEN ✓`,
        });
        load(filter);
      } else {
        setToast({ ok: false, msg: result.error || "Failed to record payment" });
      }
    } catch {
      setToast({ ok: false, msg: "Network error while recording payment" });
    } finally {
      setPaying(null);
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isCollector ? "Collection Monitoring" : "Market Geo-Fence Map"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isCollector
              ? "Monitor who is paying and who is not — tap a red dot to record their fee"
              : "Limbe Market — live vendor locations with payment status"}
          </p>
        </div>
        <div className="flex gap-2">
          {(["all", "paid", "unpaid"] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                filterTouched.current = true;
                setFilter(f);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                filter === f
                  ? f === "unpaid"
                    ? "bg-red-500 text-white shadow-md"
                    : f === "paid"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "bg-[#3d5a45] text-white shadow-md"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {f === "paid" && <span className="w-2 h-2 rounded-full bg-emerald-300" />}
                {f === "unpaid" && <span className="w-2 h-2 rounded-full bg-red-300" />}
                {f === "all" ? "All vendors" : f === "paid" ? "Paid (green)" : "Unpaid (red)"}
              </span>
            </button>
          ))}
          <button
            onClick={() => load(filter)}
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-gray-400" : "text-gray-600"} />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e8f0ec] flex items-center justify-center">
            <MapPin size={18} className="text-[#3d5a45]" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-800">{data?.stats.total ?? "—"}</p>
            <p className="text-[11px] text-gray-500">Vendors in fence</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <p className="text-xl font-bold text-emerald-600">{data?.stats.paid ?? "—"}</p>
            <p className="text-[11px] text-gray-500">Paid today (green)</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <div>
            <p className="text-xl font-bold text-red-600">{data?.stats.unpaid ?? "—"}</p>
            <p className="text-[11px] text-gray-500">Unpaid (red)</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <Crosshair size={18} className="text-[#3d5a45]" />
          <div>
            <p className="text-xl font-bold text-gray-800">{data ? `${data.stats.compliance}%` : "—"}</p>
            <p className="text-[11px] text-gray-500">Compliance today</p>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="relative h-[560px]">
          {!MapComponents || loading || !data ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f6f8f7]">
              <div className="w-8 h-8 border-4 border-[#3d5a45] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-gray-500">
                {!MapComponents ? "Loading map..." : loading ? "Loading vendor dots..." : "No map data"}
              </p>
            </div>
          ) : (
            <MapComponents.MapContainer
              center={[data.center.lat, data.center.lng]}
              zoom={16}
              scrollWheelZoom
              style={{ height: "100%", width: "100%" }}
            >
              <MapComponents.TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* Geo-fence boundary */}
              <MapComponents.Polygon
                positions={data.boundary.map((p) => [p.lat, p.lng] as [number, number])}
                pathOptions={{ color: "#3d5a45", weight: 2, fillColor: "#3d5a45", fillOpacity: 0.05, dashArray: "6 4" }}
              />
              {/* Vendor dots */}
              {data.vendors.map((v) => (
                <MapComponents.CircleMarker
                  key={v.vendor_number}
                  center={[v.lat, v.lng]}
                  radius={8}
                  pathOptions={{
                    color: v.dot === "green" ? "#16a34a" : "#dc2626",
                    weight: 2,
                    fillColor: v.dot === "green" ? "#22c55e" : "#ef4444",
                    fillOpacity: 0.9,
                  }}
                >
                  <MapComponents.Popup>
                    <div style={{ minWidth: 180 }}>
                      <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{v.business_name}</p>
                      <p style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>
                        {v.vendor_number} • {v.owner_name}
                      </p>
                      <p style={{ fontSize: 11, marginBottom: 2 }}>
                        <strong>Section:</strong> {v.section || "—"}
                      </p>
                      <p style={{ fontSize: 11, marginBottom: 6 }}>
                        <strong>Daily fee:</strong> MWK {v.daily_fee ?? "—"}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: v.dot === "green" ? "#16a34a" : "#dc2626",
                          marginBottom: 8,
                        }}
                      >
                        {v.dot === "green" ? "● PAID TODAY" : "● NOT PAID TODAY"}
                      </p>
                      {v.dot === "red" && (
                        <button
                          onClick={() => recordPayment(v.vendor_number, v.daily_fee)}
                          disabled={paying === v.vendor_number}
                          style={{
                            width: "100%",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            padding: "8px 10px",
                            marginBottom: 8,
                            borderRadius: 10,
                            border: "none",
                            cursor: paying === v.vendor_number ? "wait" : "pointer",
                            background: "#16a34a",
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {paying === v.vendor_number ? (
                            <>
                              <Loader2 size={13} className="animate-spin" /> Recording...
                            </>
                          ) : (
                            <>
                              <Banknote size={13} /> Record MWK {v.daily_fee ?? 300} cash
                            </>
                          )}
                        </button>
                      )}
                      <Link
                        href={`/dashboard/vendors/${v.vendor_number}`}
                        style={{ fontSize: 12, color: "#3d5a45", fontWeight: 600 }}
                      >
                        View vendor profile →
                      </Link>
                    </div>
                  </MapComponents.Popup>
                </MapComponents.CircleMarker>
              ))}
            </MapComponents.MapContainer>
          )}
        </div>
        <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50 flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="inline-flex items-center gap-2 text-xs text-gray-600">
            <span className="w-3 h-3 rounded-full bg-emerald-500" /> Paid (green)
          </span>
          <span className="inline-flex items-center gap-2 text-xs text-gray-600">
            <span className="w-3 h-3 rounded-full bg-red-500" /> Not paid (red)
          </span>
          <span className="inline-flex items-center gap-2 text-xs text-gray-600">
            <span className="w-3 h-3 border-2 border-dashed border-[#3d5a45] rounded" /> Limbe Market geo-fence
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-gray-400">
            <AlertTriangle size={12} />
            Auto-refreshes every 30s • OSM tiles
          </span>
        </div>
      </div>

      {/* Toast feedback after recording a payment */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[1000] flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium ${
            toast.ok ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
