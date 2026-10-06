import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, gte, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  businesses as businessesTable,
  businessTypes,
  collectors,
  marketSections,
  markets,
  payments,
} from "@/src/db/schema";
import { getSessionUser } from "@/lib/session";
import { getScope, businessScopeSql, paymentScopeSql } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { resolveVendorLocation, checkGeofence } from "@/lib/geofence";

// GET /api/vendors — list businesses with payment status for today
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getScope(user);

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const marketId = searchParams.get("market_id");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const conditions: SQL[] = [];
  const bizScope = businessScopeSql(scope, {
    registeredBy: businessesTable.registered_by_collector_id,
    marketId: businessesTable.market_id,
  });
  if (bizScope) conditions.push(bizScope);
  if (search) {
    const like = `%${search}%`;
    const searchCondition = or(
      sql`${businessesTable.business_name} ilike ${like}`,
      sql`${businessesTable.owner_name} ilike ${like}`,
      sql`${businessesTable.vendor_number} ilike ${like}`,
      sql`${businessesTable.phone_number} like ${like}`
    );
    if (searchCondition) conditions.push(searchCondition);
  }
  if (marketId) conditions.push(eq(businessesTable.market_id, parseInt(marketId)));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      business_id: businessesTable.business_id,
      vendor_number: businessesTable.vendor_number,
      business_name: businessesTable.business_name,
      owner_name: businessesTable.owner_name,
      phone_number: businessesTable.phone_number,
      national_id: businessesTable.national_id,
      email: businessesTable.email,
      market_name: markets.name,
      section_name: marketSections.section_name,
      type_name: businessTypes.name,
      fee_amount: businessTypes.fee_amount,
      block: businessesTable.block,
      stall_number: businessesTable.stall_number,
      gps_latitude: businessesTable.gps_latitude,
      gps_longitude: businessesTable.gps_longitude,
      preferred_wallet: businessesTable.preferred_wallet,
      wallet_number: businessesTable.wallet_number,
      status: businessesTable.status,
      registration_date: businessesTable.registration_date,
    })
    .from(businessesTable)
    .leftJoin(markets, eq(markets.market_id, businessesTable.market_id))
    .leftJoin(marketSections, eq(marketSections.section_id, businessesTable.section_id))
    .leftJoin(businessTypes, eq(businessTypes.business_type_id, businessesTable.business_type_id))
    .where(where)
    .orderBy(asc(businessesTable.vendor_number))
    .limit(500);

  const todayPayments = await db
    .select({
      business_id: payments.business_id,
      payment_id: payments.payment_id,
      amount: payments.amount,
      paid_at: payments.paid_at,
      payment_channel: payments.payment_channel,
    })
    .from(payments)
    .where(
      and(
        eq(payments.status, "Completed"),
        gte(payments.paid_at, today),
        paymentScopeSql(scope, { collectorId: payments.collector_id, businessId: payments.business_id })
      )
    )
    .orderBy(desc(payments.paid_at));

  const data = rows.map((b) => {
    const bPayments = todayPayments.filter((p) => p.business_id === b.business_id);
    const latest = bPayments[0];
    return {
      business_id: b.business_id,
      vendor_number: b.vendor_number,
      business_name: b.business_name,
      owner_name: b.owner_name,
      phone_number: b.phone_number,
      national_id: b.national_id,
      email: b.email,
      market: b.market_name != null ? { name: b.market_name } : null,
      section: b.section_name != null ? { section_name: b.section_name } : null,
      business_type:
        b.type_name != null && b.fee_amount != null
          ? { name: b.type_name, fee_amount: b.fee_amount }
          : null,
      block: b.block,
      stall_number: b.stall_number,
      gps_latitude: b.gps_latitude,
      gps_longitude: b.gps_longitude,
      preferred_wallet: b.preferred_wallet,
      wallet_number: b.wallet_number,
      status: b.status,
      registration_date: b.registration_date,
      paid_today: bPayments.length > 0,
      latest_payment: latest ?? null,
    };
  });

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

    const [market] = await db
      .select()
      .from(markets)
      .where(eq(markets.market_id, Number(market_id)))
      .limit(1);
    if (!market) return NextResponse.json({ error: "Market not found" }, { status: 404 });

    let section: { section_id: number; section_name: string } | undefined;
    if (section_id) {
      const [row] = await db
        .select({ section_id: marketSections.section_id, section_name: marketSections.section_name })
        .from(marketSections)
        .where(eq(marketSections.section_id, Number(section_id)))
        .limit(1);
      section = row;
    }

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
      const [exists] = await db
        .select({ business_id: businessesTable.business_id })
        .from(businessesTable)
        .where(eq(businessesTable.vendor_number, candidate))
        .limit(1);
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

    const [business] = await db
      .insert(businessesTable)
      .values({
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
        gps_latitude: lat != null ? String(lat) : null,
        gps_longitude: lng != null ? String(lng) : null,
        preferred_wallet: preferredWallet,
        wallet_number: walletNumber,
        status: "Active",
      })
      .returning();

    // Optionally link the registering collector
    let collectorId: number | null = null;
    if (user.role === "Collector") {
      const [collector] = await db
        .select({ collector_id: collectors.collector_id })
        .from(collectors)
        .where(eq(collectors.username, user.username))
        .limit(1);
      collectorId = collector?.collector_id ?? null;
    }
    if (collectorId) {
      await db
        .update(businessesTable)
        .set({ registered_by_collector_id: collectorId })
        .where(eq(businessesTable.business_id, business.business_id));
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
