import { createHash } from "crypto";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "./db";
import {
  businesses,
  businessTypes,
  markets,
  payments,
  revenueSummaries,
} from "@/src/db/schema";
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

  const [business] = await db
    .select({
      business_id: businesses.business_id,
      vendor_number: businesses.vendor_number,
      business_name: businesses.business_name,
      owner_name: businesses.owner_name,
      phone_number: businesses.phone_number,
      market_id: businesses.market_id,
      council_id: businesses.council_id,
      fee_amount: businessTypes.fee_amount,
    })
    .from(businesses)
    .leftJoin(businessTypes, eq(businessTypes.business_type_id, businesses.business_type_id))
    .where(eq(businesses.vendor_number, vendor_number.toUpperCase()))
    .limit(1);
  if (!business) {
    return { ok: false, status: 404, payload: { error: "Vendor not found" } };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [already] = await db
    .select({ payment_id: payments.payment_id, amount: payments.amount, paid_at: payments.paid_at })
    .from(payments)
    .where(
      and(
        eq(payments.business_id, business.business_id),
        eq(payments.status, "Completed"),
        gte(payments.paid_at, today)
      )
    )
    .limit(1);
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
    const [dup] = await db
      .select({ payment_id: payments.payment_id })
      .from(payments)
      .where(eq(payments.transaction_ref, transaction_ref))
      .limit(1);
    if (dup) {
      return { ok: true, status: 200, payload: { already_paid: true, duplicate: true, payment_id: dup.payment_id } };
    }
  }

  const [payment] = await db
    .insert(payments)
    .values({
      business_id: business.business_id,
      amount: String(amountNum),
      fee_type: amountNum >= 2000 ? "Kupikulisa Bulk Fee" : amountNum >= 500 ? "Restaurant/Butchery Fee" : "Standard Daily Fee",
      payment_channel,
      transaction_ref: ref,
      status: "Completed",
      paid_at: new Date(),
      sms_sent: true,
    })
    .returning({ payment_id: payments.payment_id });

  // Revenue rollup
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  const summaryDay = day.toISOString().slice(0, 10);
  const [marketRow] = await db
    .select({ sub_office_id: markets.sub_office_id })
    .from(markets)
    .where(eq(markets.market_id, business.market_id))
    .limit(1);
  await db
    .insert(revenueSummaries)
    .values({
      council_id: business.council_id,
      sub_office_id: marketRow?.sub_office_id ?? 1,
      market_id: business.market_id,
      summary_date: summaryDay,
      total_amount: String(amountNum),
      total_transactions: 1,
      successful_count: 1,
    })
    .onConflictDoUpdate({
      target: [revenueSummaries.market_id, revenueSummaries.summary_date],
      set: {
        total_amount: sql`${revenueSummaries.total_amount} + ${String(amountNum)}`,
        total_transactions: sql`${revenueSummaries.total_transactions} + 1`,
        successful_count: sql`${revenueSummaries.successful_count} + 1`,
      },
    });

  // Automatic receipt — no staff action required
  await notifyVendor({
    kind: "receipt",
    business: {
      business_id: business.business_id,
      vendor_number: business.vendor_number,
      owner_name: business.owner_name,
      phone_number: business.phone_number,
      business_name: business.business_name,
    },
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
