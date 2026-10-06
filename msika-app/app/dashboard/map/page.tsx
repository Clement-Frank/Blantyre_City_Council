"use client";

// Live geo-fence monitor for Limbe Market.
// The map is LOCKED to the Limbe Market boundary: no scrolling away, tight
// zoom bounds, and a shaded fence so collectors always see the market only.
// Unpaid vendors are attention-grabbing pulsing red dots with stall labels;
// the side panel traces every unpaid stall for one-tap follow-up.

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, MapPin, Crosshair, AlertTriangle, Banknote, Loader2, CheckCircle2, Navigation, ListFilter, Satellite } from "lucide-react";
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

type FilterKey = "all" | "paid" | "unpaid";

const RED = "#ef4444";
const GREEN = "#22c55e";

export default function LiveMapPage() {
  const { user } = useAuth();
  const isCollector = user?.role === "Collector";

  const [data, setData] = useState<MapData | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  // Satellite basemap (Google/Esri tiles) with a streets fallback
  const [satellite, setSatellite] = useState(true);
  const [mapLib, setMapLib] = useState<{
    L: typeof import("leaflet");
    reactLeaflet: typeof import("react-leaflet");
  } | null>(null);
  const filterTouched = useRef(false);

  // Collectors land straight on the unpaid trace list
  useEffect(() => {
    if (isCollector && !filterTouched.current) setFilter("unpaid");
  }, [isCollector]);

  const load = useCallback((f: string) => {
    setLoading(true);
    fetch(`/api/map${f !== "all" ? `?filter=${f}` : ""}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  // Auto-refresh every 30s for realtime monitoring
  useEffect(() => {
    const t = setInterval(() => load(filter), 30000);
    return () => clearInterval(t);
  }, [filter, load]);

  // Load leaflet + react-leaflet once on the client
  useEffect(() => {
    let cancelled = false;
    Promise.all([import("leaflet"), import("react-leaflet")]).then(([L, rl]) => {
      if (!cancelled) setMapLib({ L, reactLeaflet: rl });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const recordPayment = async (vendorNumber: string, amount: number | null) => {
    setPaying(vendorNumber);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_number: vendorNumber, amount: amount ?? 300, payment_channel: "Cash" }),
      });
      const result = await res.json();
      if (res.ok || res.status === 409) {
        setToast({
          ok: true,
          msg: res.status === 409 ? `${vendorNumber} already paid today` : `${vendorNumber} paid — dot is now GREEN ✓`,
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

  const unpaidList = data?.vendors.filter((v) => !v.paid_today) ?? [];
  const shownVendors = data?.vendors ?? [];

  const FILTERS: { key: FilterKey; label: string; activeClass: string; dotClass: string }[] = [
    { key: "all", label: "All stalls", activeClass: "bg-[#3d5a45] text-white shadow-md", dotClass: "bg-gray-300" },
    { key: "paid", label: "Paid (green)", activeClass: "bg-emerald-600 text-white shadow-md", dotClass: "bg-emerald-300" },
    { key: "unpaid", label: "Unpaid (red)", activeClass: "bg-red-500 text-white shadow-md", dotClass: "bg-red-300" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Navigation size={20} className="text-[#3d5a45]" />
            {isCollector ? "Trace Unpaid Stalls" : "Limbe Market Geo-Fence"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isCollector
              ? "Pulsing red dots are stalls that have not paid — tap one to record their fee"
              : "The map is locked to the market boundary — every dot is a stall inside the fence"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                filterTouched.current = true;
                setFilter(f.key);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all inline-flex items-center gap-1.5 ${
                filter === f.key ? f.activeClass : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${f.dotClass}`} />
              {f.label}
            </button>
          ))}
          <button
            onClick={() => setSatellite((s) => !s)}
            className={`p-2 rounded-xl border transition-colors ${
              satellite
                ? "bg-[#0E0E0B] border-[#0E0E0B] text-[#AFE607]"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
            title={satellite ? "Switch to street map" : "Switch to satellite view"}
          >
            <Satellite size={16} />
          </button>
          <button
            onClick={() => load(filter)}
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-gray-400" : "text-gray-600"} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* ===== Map ===== */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="relative h-[560px]">
            {!mapLib || loading || !data ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f6f8f7]">
                <div className="w-8 h-8 border-4 border-[#3d5a45] border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm text-gray-500">
                  {!mapLib ? "Loading map…" : loading ? "Loading stall dots…" : "No map data"}
                </p>
              </div>
            ) : (
              <mapLib.reactLeaflet.MapContainer
                center={[data.center.lat, data.center.lng]}
                zoom={17}
                minZoom={16}
                maxZoom={19}
                zoomControl={false}
                scrollWheelZoom
                doubleClickZoom="center"
                // Lock the view to the market area — no wandering off
                maxBounds={
                  [
                    [data.center.lat - 0.004, data.center.lng - 0.004],
                    [data.center.lat + 0.004, data.center.lng + 0.004],
                  ] as [number, number][]
                }
                maxBoundsViscosity={1.0}
                style={{ height: "100%", width: "100%", background: "#e8ecea" }}
              >
                {satellite ? (
                  <mapLib.reactLeaflet.TileLayer
                    attribution='Imagery &copy; <a href="https://www.google.com/maps">Google</a>, tiles &copy; Esri'
                    url="https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}"
                  />
                ) : (
                  <mapLib.reactLeaflet.TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                )}

                {/* Geo-fence: shaded market boundary */}
                <mapLib.reactLeaflet.Polygon
                  positions={data.boundary.map((p) => [p.lat, p.lng] as [number, number])}
                  pathOptions={{
                    color: "#3d5a45",
                    weight: 3,
                    fillColor: "#3d5a45",
                    fillOpacity: 0.07,
                    dashArray: "1",
                  }}
                />

                {/* Stall dots with pulse halos for unpaid */}
                {shownVendors.map((v) => (
                  <MapDot
                    key={`${filter}-${v.vendor_number}`}
                    reactLeaflet={mapLib.reactLeaflet}
                    vendor={v}
                    isPaying={paying === v.vendor_number}
                    isSelected={selected === v.vendor_number}
                    onSelect={() => {
                      setSelected(v.vendor_number);
                      recordPayment(v.vendor_number, v.daily_fee);
                    }}
                  />
                ))}
              </mapLib.reactLeaflet.MapContainer>
            )}

            {/* Floating stat chips over the map */}
            {data && (
              <div className="absolute top-3 left-3 z-[500] flex flex-wrap gap-2">
                <div className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur shadow-md text-xs font-semibold text-gray-700 inline-flex items-center gap-1.5">
                  <MapPin size={12} className="text-[#3d5a45]" /> {data.stats.total} stalls
                </div>
                <div className="px-3 py-1.5 rounded-full bg-emerald-600/95 text-white shadow-md text-xs font-semibold inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse" /> {data.stats.paid} paid
                </div>
                <div className="px-3 py-1.5 rounded-full bg-red-500/95 text-white shadow-md text-xs font-semibold inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-200 animate-pulse" /> {data.stats.unpaid} unpaid
                </div>
                <div className="px-3 py-1.5 rounded-full bg-[#0E0E0B]/90 text-white shadow-md text-xs font-semibold inline-flex items-center gap-1.5">
                  <Crosshair size={12} className="text-[#AFE607]" /> {data.stats.compliance}% compliance
                </div>
              </div>
            )}
          </div>

          <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50 flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="inline-flex items-center gap-2 text-xs text-gray-600">
              <span className="w-3 h-3 rounded-full bg-emerald-500" /> Paid
            </span>
            <span className="inline-flex items-center gap-2 text-xs text-gray-600">
              <span className="relative w-3 h-3 rounded-full bg-red-500">
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-60" />
              </span>
              Not paid (pulsing)
            </span>
            <span className="inline-flex items-center gap-2 text-xs text-gray-600">
              <span className="w-3 h-3 border-2 border-dashed border-[#3d5a45] rounded" /> Limbe Market boundary
            </span>
            <span className="ml-auto text-[11px] text-gray-400">View locked to the market fence • refreshes every 30s</span>
          </div>
        </div>

        {/* ===== Unpaid trace panel ===== */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <ListFilter size={15} className="text-red-500" /> Trace unpaid stalls
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {unpaidList.length} stall{unpaidList.length === 1 ? "" : "s"} still to collect
            </p>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[480px] divide-y divide-gray-50">
            {unpaidList.length === 0 && (
              <div className="p-8 text-center">
                <CheckCircle2 size={28} className="mx-auto text-emerald-500 mb-2" />
                <p className="text-sm text-gray-500 font-medium">All stalls have paid 🎉</p>
              </div>
            )}
            {unpaidList.map((v) => (
              <div
                key={v.vendor_number}
                className={`px-4 py-3 hover:bg-red-50/40 transition-colors ${selected === v.vendor_number ? "bg-red-50/60" : ""}`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="relative mt-1.5 w-2.5 h-2.5 rounded-full bg-red-500 shrink-0">
                    <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-60" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{v.business_name}</p>
                    <p className="text-[11px] text-gray-500">
                      {v.vendor_number} • {v.section || "—"} • MWK {v.daily_fee ?? 300}
                    </p>
                  </div>
                  <button
                    onClick={() => recordPayment(v.vendor_number, v.daily_fee)}
                    disabled={paying === v.vendor_number}
                    className="mt-0.5 inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[11px] font-bold rounded-lg transition-colors shrink-0"
                    title="Record cash payment"
                  >
                    {paying === v.vendor_number ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <Banknote size={11} />
                    )}
                    Collect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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

// ===== Map dot with pulse halo =====
function MapDot({
  reactLeaflet,
  vendor,
  isPaying,
  isSelected,
  onSelect,
}: {
  reactLeaflet: typeof import("react-leaflet");
  vendor: VendorDot;
  isPaying: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { CircleMarker, Popup, Tooltip } = reactLeaflet;
  const color = vendor.dot === "green" ? GREEN : RED;

  return (
    <>
      {/* Pulse halo for unpaid stalls — draws the eye */}
      {vendor.dot === "red" && (
        <CircleMarker
          center={[vendor.lat, vendor.lng]}
          radius={16}
          pathOptions={{ color: RED, weight: 2, fill: false, opacity: 0.7, className: "msika-dot-pulse" }}
          interactive={false}
        />
      )}

      <CircleMarker
        center={[vendor.lat, vendor.lng]}
        radius={isSelected ? 10 : 8}
        pathOptions={{
          color: "#fff",
          weight: isSelected ? 3 : 2,
          fillColor: color,
          fillOpacity: 0.95,
          className: vendor.dot === "green" ? "msika-pop" : undefined,
        }}
        eventHandlers={{ click: onSelect }}
      >
        {/* Hover label so collectors can trace the stall without opening it */}
        <Tooltip direction="top" offset={[0, -6]} opacity={1}>
          <span style={{ fontWeight: 700, fontSize: 12 }}>{vendor.business_name}</span>
          <br />
          <span style={{ fontSize: 11, color: "#555" }}>
            {vendor.vendor_number} • {vendor.dot === "green" ? "PAID ✓" : "NOT PAID"}
          </span>
        </Tooltip>

        <Popup>
          <div style={{ minWidth: 190 }}>
            <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{vendor.business_name}</p>
            <p style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>
              {vendor.vendor_number} • {vendor.owner_name}
            </p>
            <p style={{ fontSize: 11, marginBottom: 2 }}>
              <strong>Section:</strong> {vendor.section || "—"}
            </p>
            <p style={{ fontSize: 11, marginBottom: 6 }}>
              <strong>Daily fee:</strong> MWK {vendor.daily_fee ?? "—"}
            </p>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: vendor.dot === "green" ? "#16a34a" : "#dc2626",
                marginBottom: 8,
              }}
            >
              {vendor.dot === "green" ? "● PAID TODAY" : "● NOT PAID TODAY"}
            </p>
            {vendor.dot === "red" && (
              <button
                onClick={onSelect}
                disabled={isPaying}
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
                  cursor: isPaying ? "wait" : "pointer",
                  background: "#16a34a",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {isPaying ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Recording…
                  </>
                ) : (
                  <>Record MWK {vendor.daily_fee ?? 300} cash</>
                )}
              </button>
            )}
            <a
              href={`/dashboard/vendors/${vendor.vendor_number}`}
              style={{ fontSize: 12, color: "#3d5a45", fontWeight: 600 }}
            >
              View vendor profile →
            </a>
          </div>
        </Popup>
      </CircleMarker>
    </>
  );
}
