import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
    const business = await prisma.business.findUnique({
      where: { vendor_number: vendorNumber.toUpperCase() },
      include: {
        market: { select: { name: true } },
        section: { select: { section_name: true } },
        business_type: { select: { name: true, fee_amount: true } },
      },
    });
    if (!business) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPayment = await prisma.payment.findFirst({
      where: { business_id: business.business_id, status: "Completed", paid_at: { gte: today } },
    });

    return NextResponse.json({
      vendor_number: business.vendor_number,
      business_name: business.business_name,
      owner_name: business.owner_name,
      market: business.market?.name,
      section: business.section?.section_name,
      business_type: business.business_type?.name,
      daily_fee: business.business_type ? Number(business.business_type.fee_amount) : null,
      wallet_number: business.wallet_number,
      status: business.status,
      paid_today: Boolean(todayPayment),
    });
  }

  const businesses = await prisma.business.findMany({
    include: { market: { select: { name: true } } },
    take: 100,
  });

  return NextResponse.json({
    success: true,
    data: businesses,
    meta: { count: businesses.length, client: client.clientName },
  });
}
