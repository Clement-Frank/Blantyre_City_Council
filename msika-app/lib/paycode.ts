import { createHash } from "crypto";
import { prisma } from "./prisma";
import { notifyVendor, paymentReceiptContent } from "./notify";

// Pay-code = stable, non-guessable token bound to a vendor. Printed as a QR
// on the stall; anyone who scans it lands on the public payment page for
// that exact vendor. Signed with JWT_SECRET so it cannot be forged.

export function makePayCode(vendorNumber: string): string {
  const secret = process.env.JWT_SECRET || "msika-dev-secret";
  return createHash("sha256").update(`paycode:${vendorNumber}:${secret}`).digest("hex").slice(0, 32);
}

export function verifyPayCode(vendorNumber: string, code: string): boolean {
  const expected = makePayCode(vendorNumber);
  // constant-time-ish compare
  if (code.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ code.charCodeAt(i);
  }
  return diff === 0;
}

interface PayWithCodeInput {
  vendor_number: string;
  code: string;
  amount: number;
  payment_channel: "AirtelMoney" | "TNMMpamba";
  transaction_ref?: string;
  payer_phone?: string;
}

/**
 * Pay a vendor's daily fee by scanning their QR pay-code.
 * Idempotent per vendor/day — a second attempt returns already_paid.
 */
export async function payWithCode(input: PayWithCodeInput): Promise<{
  ok: boolean;
  status: number;
  payload: Record<string, unknown>;
}> {
  const { vendor_number, code, amount, payment_channel, transaction_ref, payer_phone } = input;

  if (!vendor_number || !code || !amount) {
    return { ok: false, status: 400, payload: { error: "vendor_number, code and amount are required" } };
  }
  if (!verifyPayCode(vendor_number.toUpperCase(), code)) {
    return { ok: false, status: 403, payload: { error: "Invalid pay code for this vendor" } };
  }

  const business = await prisma.business.findUnique({
    where: { vendor_number: vendor_number.toUpperCase() },
    include: { business_type: true },
  });
  if (!business) {
    return { ok: false, status: 404, payload: { error: "Vendor not found" } };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const already = await prisma.payment.findFirst({
    where: { business_id: business.business_id, status: "Completed", paid_at: { gte: today } },
  });
  if (already) {
    return {
      ok: true,
      status: 200,
      payload: {
        already_paid: true,
        vendor_number: business.vendor_number,
        business_name: business.business_name,
        amount: Number(already.amount),
        paid_at: already.paid_at,
      },
    };
  }

  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return { ok: false, status: 400, payload: { error: "Invalid amount" } };
  }

  const ref =
    transaction_ref ||
    `QR-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;

  // Idempotency on external refs
  if (transaction_ref) {
    const dup = await prisma.payment.findFirst({ where: { transaction_ref } });
    if (dup) {
      return { ok: true, status: 200, payload: { already_paid: true, duplicate: true, payment_id: dup.payment_id } };
    }
  }

  const payment = await prisma.payment.create({
    data: {
      business_id: business.business_id,
      amount: amountNum,
      fee_type: amountNum >= 2000 ? "Kupikulisa Bulk Fee" : amountNum >= 500 ? "Restaurant/Butchery Fee" : "Standard Daily Fee",
      payment_channel,
      transaction_ref: ref,
      status: "Completed",
      paid_at: new Date(),
      sms_sent: true,
    },
  });

  // Revenue rollup
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  await prisma.revenueSummary.upsert({
    where: { market_id_summary_date: { market_id: business.market_id, summary_date: day } },
    update: {
      total_amount: { increment: amountNum },
      total_transactions: { increment: 1 },
      successful_count: { increment: 1 },
    },
    create: {
      council_id: business.council_id,
      sub_office_id:
        (await prisma.market.findUnique({ where: { market_id: business.market_id } }))?.sub_office_id ?? 1,
      market_id: business.market_id,
      summary_date: day,
      total_amount: amountNum,
      total_transactions: 1,
      successful_count: 1,
    },
  });

  // Automatic receipt — no staff action required
  await notifyVendor({
    kind: "receipt",
    business,
    content: paymentReceiptContent(business.vendor_number, amountNum, payment_channel),
  }).catch(() => undefined);

  return {
    ok: true,
    status: 201,
    payload: {
      paid: true,
      payment_id: payment.payment_id,
      vendor_number: business.vendor_number,
      business_name: business.business_name,
      amount: amountNum,
      receipt_ref: ref,
    },
  };
}
