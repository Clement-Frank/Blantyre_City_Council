import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { processWalletWebhook } from "@/lib/wallet-webhook";
import type { WalletWebhookBody } from "@/lib/wallet-webhook";

// External API for wallet providers (Airtel, TNM).
// Auth: x-api-key header.
//
// GET  /api/external/payments?vendor_number=V-01001&limit=50 — payment history
// POST /api/external/payments — submit a realtime wallet payment
//      body: { transaction_ref, vendor_number | business_id | payer_phone, amount, status, timestamp?, provider_ref? }
//      status: SUCCESS / TS (completed), FAILED / TF (failed)

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
  const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);

  const where: Record<string, unknown> = {};
  if (vendorNumber) {
    const business = await prisma.business.findUnique({
      where: { vendor_number: vendorNumber.toUpperCase() },
    });
    if (!business) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    where.business_id = business.business_id;
  }

  const payments = await prisma.payment.findMany({
    where,
    include: { business: { select: { vendor_number: true, business_name: true } } },
    orderBy: { created_at: "desc" },
    take: limit,
  });

  return NextResponse.json({ data: payments, count: payments.length, client: client.clientName });
}

export async function POST(request: NextRequest) {
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

  try {
    const body = (await request.json()) as WalletWebhookBody;
    const isAirtel = client.clientName.toLowerCase().includes("airtel");
    const result = await processWalletWebhook(isAirtel ? "AirtelMoney" : "TNMMpamba", body);
    return NextResponse.json(result.payload, { status: result.status });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
