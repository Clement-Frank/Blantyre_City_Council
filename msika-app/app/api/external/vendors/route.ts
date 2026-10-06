import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses, businessTypes, marketSections, markets, payments } from "@/src/db/schema";
import { validateApiKey } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";

// External API for wallet providers (Airtel, TNM).
// Auth: x-api-key header. Rate-limited per key.
//
// GET /api/external/vendors?vendor_number=V-01001 — single vendor + paid_today
// GET /api/external/vendors — list vendors

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "API Key required" }, { status: 401 });
  }

  const client = await validateApiKey(apiKey);
  if (!client) {
    return NextResponse.json({ error: "Invalid or expired API Key" }, { status: 401 });
  }

  if (!checkRateLimit(`api_${client.apiClientId}`, client.rateLimit)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const vendorNumber = searchParams.get("vendor_number");

  if (vendorNumber) {
    const [business] = await db
      .select({
        business_id: businesses.business_id,
        vendor_number: businesses.vendor_number,
        business_name: businesses.business_name,
        owner_name: businesses.owner_name,
        wallet_number: businesses.wallet_number,
        status: businesses.status,
        market_name: markets.name,
        section_name: marketSections.section_name,
        type_name: businessTypes.name,
        fee_amount: businessTypes.fee_amount,
      })
      .from(businesses)
      .leftJoin(markets, eq(markets.market_id, businesses.market_id))
      .leftJoin(marketSections, eq(marketSections.section_id, businesses.section_id))
      .leftJoin(businessTypes, eq(businessTypes.business_type_id, businesses.business_type_id))
      .where(eq(businesses.vendor_number, vendorNumber.toUpperCase()))
      .limit(1);
    if (!business) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [todayPayment] = await db
      .select({ payment_id: payments.payment_id })
      .from(payments)
      .where(
        and(eq(payments.business_id, business.business_id), eq(payments.status, "Completed"), gte(payments.paid_at, today))
      )
      .limit(1);

    return NextResponse.json({
      vendor_number: business.vendor_number,
      business_name: business.business_name,
      owner_name: business.owner_name,
      market: business.market_name,
      section: business.section_name,
      business_type: business.type_name,
      daily_fee: business.fee_amount != null ? Number(business.fee_amount) : null,
      wallet_number: business.wallet_number,
      status: business.status,
      paid_today: Boolean(todayPayment),
    });
  }

  const rows = await db
    .select({
      business_id: businesses.business_id,
      vendor_number: businesses.vendor_number,
      council_id: businesses.council_id,
      market_id: businesses.market_id,
      section_id: businesses.section_id,
      business_type_id: businesses.business_type_id,
      registered_by_collector_id: businesses.registered_by_collector_id,
      business_name: businesses.business_name,
      owner_name: businesses.owner_name,
      phone_number: businesses.phone_number,
      national_id: businesses.national_id,
      email: businesses.email,
      block: businesses.block,
      stall_number: businesses.stall_number,
      gps_latitude: businesses.gps_latitude,
      gps_longitude: businesses.gps_longitude,
      preferred_wallet: businesses.preferred_wallet,
      wallet_number: businesses.wallet_number,
      status: businesses.status,
      registration_date: businesses.registration_date,
      market_name: markets.name,
    })
    .from(businesses)
    .leftJoin(markets, eq(markets.market_id, businesses.market_id))
    .orderBy(asc(businesses.business_id))
    .limit(100);

  const data = rows.map(({ market_name, ...b }) => ({
    ...b,
    market: market_name != null ? { name: market_name } : null,
  }));

  return NextResponse.json({
    success: true,
    data,
    meta: { count: data.length, client: client.clientName },
  });
}
