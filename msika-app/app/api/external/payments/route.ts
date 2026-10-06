import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses, payments } from "@/src/db/schema";
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

  let businessId: number | undefined;
  if (vendorNumber) {
    const [business] = await db
      .select({ business_id: businesses.business_id })
      .from(businesses)
      .where(eq(businesses.vendor_number, vendorNumber.toUpperCase()))
      .limit(1);
    if (!business) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    businessId = business.business_id;
  }

  const rows = await db
    .select({
      payment_id: payments.payment_id,
      business_id: payments.business_id,
      collector_id: payments.collector_id,
      amount: payments.amount,
      fee_type: payments.fee_type,
      payment_channel: payments.payment_channel,
      transaction_ref: payments.transaction_ref,
      provider_ref: payments.provider_ref,
      status: payments.status,
      paid_at: payments.paid_at,
      created_at: payments.created_at,
      sms_sent: payments.sms_sent,
      receipt_generated: payments.receipt_generated,
      vendor_number: businesses.vendor_number,
      business_name: businesses.business_name,
    })
    .from(payments)
    .leftJoin(businesses, eq(businesses.business_id, payments.business_id))
    .where(businessId != null ? eq(payments.business_id, businessId) : undefined)
    .orderBy(desc(payments.created_at))
    .limit(limit);

  return NextResponse.json({
    data: rows.map((p) => ({
      payment_id: p.payment_id,
      business_id: p.business_id,
      collector_id: p.collector_id,
      amount: p.amount,
      fee_type: p.fee_type,
      payment_channel: p.payment_channel,
      transaction_ref: p.transaction_ref,
      provider_ref: p.provider_ref,
      status: p.status,
      paid_at: p.paid_at,
      created_at: p.created_at,
      sms_sent: p.sms_sent,
      receipt_generated: p.receipt_generated,
      business: { vendor_number: p.vendor_number, business_name: p.business_name },
    })),
    count: rows.length,
    client: client.clientName,
  });
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
