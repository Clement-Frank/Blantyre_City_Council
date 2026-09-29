// ============================================================
// Geo-fencing engine for Blantyre City Council markets.
// The Limbe Market fence is an approximate boundary polygon of
// the Limbe trading area (market + surrounding vendor streets).
// Coordinates: [latitude, longitude].
// ============================================================

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeofenceResult {
  inside: boolean;
  distanceMeters: number;
}

// Approximate boundary of Limbe Market trading area, Blantyre, Malawi.
// Traced around the market core + adjacent vendor streets.
export const LIMBE_MARKET_CENTER: LatLng = { lat: -15.7987, lng: 35.0058 };

export const LIMBE_MARKET_BOUNDARY: LatLng[] = [
  { lat: -15.7945, lng: 35.0012 },
  { lat: -15.7941, lng: 35.0096 },
  { lat: -15.7978, lng: 35.0122 },
  { lat: -15.8028, lng: 35.0114 },
  { lat: -15.8052, lng: 35.0078 },
  { lat: -15.8041, lng: 35.0028 },
  { lat: -15.7988, lng: 35.0002 },
  { lat: -15.7958, lng: 35.0006 },
];

// Section anchor points inside the fence — used to auto-place a
// vendor's stall when GPS is not supplied at registration.
export const LIMBE_SECTION_ANCHORS: Record<string, LatLng> = {
  Vegetables: { lat: -15.7962, lng: 35.0034 },
  Fish: { lat: -15.7971, lng: 35.0049 },
  Textiles: { lat: -15.7989, lng: 35.0061 },
  Hardware: { lat: -15.8002, lng: 35.0072 },
  Groceries: { lat: -15.8011, lng: 35.0051 },
  Restaurants: { lat: -15.7995, lng: 35.0039 },
};

// Ray-casting point-in-polygon test.
export function pointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
}

// Haversine distance in meters.
export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Full geo-fence check: is a point inside the Limbe Market fence?
export function checkGeofence(point: LatLng): GeofenceResult {
  const distance = distanceMeters(point, LIMBE_MARKET_CENTER);
  return {
    inside: pointInPolygon(point, LIMBE_MARKET_BOUNDARY),
    distanceMeters: Math.round(distance),
  };
}

// Snap a point to the nearest position inside the fence (used when a
// collector records a GPS reading slightly outside the boundary).
export function snapToBoundary(point: LatLng): LatLng {
  if (pointInPolygon(point, LIMBE_MARKET_BOUNDARY)) return point;

  let closest: LatLng = LIMBE_MARKET_BOUNDARY[0];
  let best = Infinity;
  for (let i = 0; i < LIMBE_MARKET_BOUNDARY.length; i++) {
    const a = LIMBE_MARKET_BOUNDARY[i];
    const b = LIMBE_MARKET_BOUNDARY[(i + 1) % LIMBE_MARKET_BOUNDARY.length];
    // project point onto segment a-b
    const ax = a.lng, ay = a.lat, bx = b.lng, by = b.lat, px = point.lng, py = point.lat;
    const dx = bx - ax, dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const cx = ax + t * dx;
    const cy = ay + t * dy;
    const d = distanceMeters(point, { lat: cy, lng: cx });
    if (d < best) {
      best = d;
      closest = { lat: cy, lng: cx };
    }
  }
  return closest;
}

// Vendor location algorithm:
// - If GPS is provided: validate against fence, snap if slightly off.
// - If GPS is missing: derive a deterministic stall position from the
//   section anchor + vendor number hash so every vendor gets a stable,
//   unique dot on the map.
export function resolveVendorLocation(
  vendorNumber: string,
  section: string,
  gps?: { lat: number; lng: number } | null
): { location: LatLng; source: "gps" | "derived"; insideFence: boolean } {
  if (gps && gps.lat !== 0 && gps.lng !== 0) {
    const inside = pointInPolygon(gps, LIMBE_MARKET_BOUNDARY);
    const snapped = inside ? gps : snapToBoundary(gps);
    return { location: snapped, source: "gps", insideFence: inside };
  }

  const anchor = LIMBE_SECTION_ANCHORS[section] || LIMBE_MARKET_CENTER;

  // Deterministic jitter from the vendor number so the same vendor
  // always maps to the same stall position.
  let hash = 0;
  for (let i = 0; i < vendorNumber.length; i++) {
    hash = (hash * 31 + vendorNumber.charCodeAt(i)) | 0;
  }
  const dLat = ((hash % 100) - 50) / 100000; // ~±55m north-south
  const dLng = (((hash >> 7) % 100) - 50) / 100000; // ~±54m east-west

  const derived: LatLng = { lat: anchor.lat + dLat, lng: anchor.lng + dLng };
  const inside = pointInPolygon(derived, LIMBE_MARKET_BOUNDARY);
  return {
    location: inside ? derived : snapToBoundary(derived),
    source: "derived",
    insideFence: true,
  };
}

// Generic fence check for other markets (used when more markets are added).
export const MARKET_FENCES: Record<string, LatLng[]> = {
  "Limbe Market": LIMBE_MARKET_BOUNDARY,
};
