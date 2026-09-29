import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { resolveVendorLocation, checkGeofence } from "@/lib/geofence";

// GET /api/vendors — list businesses with payment status for today
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const marketId = searchParams.get("market_id");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { business_name: { contains: search, mode: "insensitive" } },
      { owner_name: { contains: search, mode: "insensitive" } },
      { vendor_number: { contains: search, mode: "insensitive" } },
      { phone_number: { contains: search } },
    ];
  }
  if (marketId) where.market_id = parseInt(marketId);

  const businesses = await prisma.business.findMany({
    where,
    include: {
      market: { select: { name: true } },
      section: { select: { section_name: true } },
      business_type: { select: { name: true, fee_amount: true } },
      payments: {
        where: { status: "Completed", paid_at: { gte: today } },
        select: { payment_id: true, amount: true, paid_at: true, payment_channel: true },
        orderBy: { paid_at: "desc" },
        take: 1,
      },
    },
    orderBy: { vendor_number: "asc" },
    take: 500,
  });

  const data = businesses.map((b) => ({
    business_id: b.business_id,
    vendor_number: b.vendor_number,
    business_name: b.business_name,
    owner_name: b.owner_name,
    phone_number: b.phone_number,
    national_id: b.national_id,
    email: b.email,
    market: b.market,
    section: b.section,
    business_type: b.business_type,
    block: b.block,
    stall_number: b.stall_number,
    gps_latitude: b.gps_latitude,
    gps_longitude: b.gps_longitude,
    preferred_wallet: b.preferred_wallet,
    wallet_number: b.wallet_number,
    status: b.status,
    registration_date: b.registration_date,
    paid_today: b.payments.length > 0,
    latest_payment: b.payments[0] ?? null,
  }));

  return NextResponse.json({ businesses: data, count: data.length });
}

// POST /api/vendors — register a vendor (with geo-fence validation)
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const {
      business_name,
      owner_name,
      phone_number,
      national_id,
      email,
      market_id,
      section_id,
      business_type_id,
      block,
      stall_number,
      gps_latitude,
      gps_longitude,
      preferred_wallet,
      wallet_number,
    } = body as Record<string, string | number | undefined>;

    const businessName = business_name != null ? String(business_name) : "";
    const ownerName = owner_name != null ? String(owner_name) : "";
    const phoneNumber = phone_number != null ? String(phone_number) : "";
    const nationalId = national_id != null ? String(national_id) : null;
    const emailStr = email != null ? String(email) : null;
    const blockStr = block != null ? String(block) : null;
    const stallNumber = stall_number != null ? String(stall_number) : null;
    const preferredWallet = preferred_wallet != null ? String(preferred_wallet) : "AirtelMoney";
    const walletNumber = wallet_number != null && wallet_number !== "" ? String(wallet_number) : phoneNumber;

    if (!businessName || !ownerName || !phoneNumber || !market_id || !business_type_id) {
      return NextResponse.json(
        { error: "business_name, owner_name, phone_number, market_id and business_type_id are required" },
        { status: 400 }
      );
    }

    const market = await prisma.market.findUnique({ where: { market_id: Number(market_id) } });
    if (!market) return NextResponse.json({ error: "Market not found" }, { status: 404 });

    const section = section_id
      ? await prisma.marketSection.findUnique({ where: { section_id: Number(section_id) } })
      : null;

    // ---- Geo-fence vendor location algorithm ----
    let lat: number | null = null;
    let lng: number | null = null;
    let locationSource = "none";
    let geofence: { inside: boolean; distanceMeters: number } | null = null;

    const latRaw = gps_latitude != null ? Number(gps_latitude) : NaN;
    const lngRaw = gps_longitude != null ? Number(gps_longitude) : NaN;

    if (Number.isFinite(latRaw) && Number.isFinite(lngRaw) && (latRaw !== 0 || lngRaw !== 0)) {
      const resolved = resolveVendorLocation("PENDING", section?.section_name || "", { lat: latRaw, lng: lngRaw });
      lat = resolved.location.lat;
      lng = resolved.location.lng;
      locationSource = "gps";
      geofence = checkGeofence(resolved.location);
    }

    // Generate a unique vendor number
    let vendorNumber = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = `V-${String(Math.floor(10000 + Math.random() * 89999))}`;
      const exists = await prisma.business.findUnique({ where: { vendor_number: candidate } });
      if (!exists) {
        vendorNumber = candidate;
        break;
      }
    }
    if (!vendorNumber) vendorNumber = `V-${Date.now()}`;

    // If GPS was not supplied, derive a stable position from the vendor number.
    if (lat === null || lng === null) {
      const resolved = resolveVendorLocation(vendorNumber, section?.section_name || "", null);
      lat = resolved.location.lat;
      lng = resolved.location.lng;
      locationSource = "derived";
      geofence = checkGeofence(resolved.location);
    }

    const business = await prisma.business.create({
      data: {
        vendor_number: vendorNumber,
        council_id: market.council_id,
        market_id: market.market_id,
        section_id: section?.section_id ?? null,
        business_type_id: Number(business_type_id),
        business_name: businessName,
        owner_name: ownerName,
        phone_number: phoneNumber,
        national_id: nationalId,
        email: emailStr,
        block: blockStr,
        stall_number: stallNumber,
        gps_latitude: lat,
        gps_longitude: lng,
        preferred_wallet: preferredWallet,
        wallet_number: walletNumber,
        status: "Active",
      },
    });

    // Optionally link the registering collector
    let collectorId: number | null = null;
    if (user.role === "Collector") {
      const collector = await prisma.collector.findUnique({ where: { username: user.username } });
      collectorId = collector?.collector_id ?? null;
    }
    if (collectorId) {
      await prisma.business.update({
        where: { business_id: business.business_id },
        data: { registered_by_collector_id: collectorId },
      });
    }

    await logAudit({
      councilId: market.council_id,
      actorType: "User",
      actorId: user.id,
      actorName: user.fullName,
      action: "CREATE",
      resource: "Business",
      resourceId: vendorNumber,
      details: `Registered vendor ${businessName} at [${lat?.toFixed(5)}, ${lng?.toFixed(5)}] (${locationSource})`,
    });

    return NextResponse.json({
      success: true,
      business,
      vendor_number: vendorNumber,
      location: { lat, lng, source: locationSource },
      geofence,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Vendor registration error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
