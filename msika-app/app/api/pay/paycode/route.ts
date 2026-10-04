import { NextRequest, NextResponse } from "next/server";
import { payWithCode } from "@/lib/paycode";

// POST /api/pay/paycode — public endpoint for QR-code payments.
// A vendor (or their customer) scans the stall QR and posts here — no login,
// no dashboard. The dot flips green instantly and a receipt is auto-sent.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await payWithCode({
      vendor_number: String(body.vendor_number ?? ""),
      code: String(body.code ?? ""),
      amount: Number(body.amount ?? 0),
      payment_channel: body.payment_channel === "TNMMpamba" ? "TNMMpamba" : "AirtelMoney",
      transaction_ref: body.transaction_ref ? String(body.transaction_ref) : undefined,
      payer_phone: body.payer_phone ? String(body.payer_phone) : undefined,
    });

    return NextResponse.json(result.payload, { status: result.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
