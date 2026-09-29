import { NextRequest, NextResponse } from "next/server";
import { processWalletWebhook } from "@/lib/wallet-webhook";

// Realtime Airtel Money payment webhook.
// POST { transaction_ref, vendor_number | business_id, amount, status, timestamp, provider_ref, payer_phone }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await processWalletWebhook("AirtelMoney", body);
    return NextResponse.json(result.payload, { status: result.status });
  } catch (error) {
    console.error("Airtel webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
