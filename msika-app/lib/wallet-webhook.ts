import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import { businesses, markets, payments, revenueSummaries } from "@/src/db/schema";
import { logAudit } from "./audit";
import { notifyVendor, paymentReceiptContent } from "./notify";

export interface WalletWebhookBody {
  transaction_ref?: string;
  provider_ref?: string;
  vendor_number?: string;
  business_id?: number | string;
  amount?: number | string;
  status?: string;
  timestamp?: string;
  payer_phone?: string;
  message?: string;
}

// Shared realtime wallet-webhook processor for Airtel Money and TNM Mpamba.
// When a vendor pays with a mobile wallet, the provider calls this webhook and
// the vendor's dot flips from red to green on the dashboard map in realtime.
export async function processWalletWebhook(
  channel: "AirtelMoney" | "TNMMpamba",
  body: WalletWebhookBody
): Promise<{ ok: boolean; status: number; payload: Record<string, unknown> }> {
  const {
    transaction_ref,
    provider_ref,
    vendor_number,
    business_id,
    amount,
    status,
    timestamp,
    payer_phone,
  } = body;

  if (!transaction_ref || !amount || !status) {
    return { ok: false, status: 400, payload: { error: "transaction_ref, amount and status are required" } };
  }

  const isAirtel = channel === "AirtelMoney";
  const successCodes = isAirtel ? ["SUCCESS", "SUCCESSFUL", "COMPLETED", "TS"] : ["TS", "SUCCESS", "COMPLETED"];
  const failCodes = isAirtel ? ["FAILED", "TF"] : ["TF", "FAILED"];
  const completed = successCodes.includes(status.toUpperCase());
  const failed = failCodes.includes(status.toUpperCase());

  // Idempotency: skip if this transaction_ref was already processed
  const [existing] = await db
    .select({ payment_id: payments.payment_id })
    .from(payments)
    .where(eq(payments.transaction_ref, transaction_ref))
    .limit(1);
  if (existing) {
    return {
      ok: true,
      status: 200,
      payload: { received: true, payment_id: existing.payment_id, duplicate: true },
    };
  }

  // Resolve the vendor: prefer vendor_number, fallback to business_id, then payer phone.
  let business:
    | {
        business_id: number;
        vendor_number: string;
        business_name: string;
        owner_name: string;
        phone_number: string;
        market_id: number;
        council_id: number;
      }
    | undefined;
  if (vendor_number) {
    [business] = await db
      .select({
        business_id: businesses.business_id,
        vendor_number: businesses.vendor_number,
        business_name: businesses.business_name,
        owner_name: businesses.owner_name,
        phone_number: businesses.phone_number,
        market_id: businesses.market_id,
        council_id: businesses.council_id,
      })
      .from(businesses)
      .where(eq(businesses.vendor_number, String(vendor_number).toUpperCase()))
      .limit(1);
  }
  if (!business && business_id) {
    [business] = await db
      .select({
        business_id: businesses.business_id,
        vendor_number: businesses.vendor_number,
        business_name: businesses.business_name,
        owner_name: businesses.owner_name,
        phone_number: businesses.phone_number,
        market_id: businesses.market_id,
        council_id: businesses.council_id,
      })
      .from(businesses)
      .where(eq(businesses.business_id, Number(business_id)))
      .limit(1);
  }
  if (!business && payer_phone) {
    [business] = await db
      .select({
        business_id: businesses.business_id,
        vendor_number: businesses.vendor_number,
        business_name: businesses.business_name,
        owner_name: businesses.owner_name,
        phone_number: businesses.phone_number,
        market_id: businesses.market_id,
        council_id: businesses.council_id,
      })
      .from(businesses)
      .where(eq(businesses.wallet_number, payer_phone))
      .limit(1);
  }
  if (!business) {
    return { ok: false, status: 404, payload: { error: "Vendor not found for this payment" } };
  }

  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return { ok: false, status: 400, payload: { error: "Invalid amount" } };
  }

  const feeType = amountNum >= 2000 ? "Kupikulisa Bulk Fee" : amountNum >= 500 ? "Restaurant/Butchery Fee" : "Standard Daily Fee";

  const [payment] = await db
    .insert(payments)
    .values({
      business_id: business.business_id,
      amount: String(amountNum),
      fee_type: feeType,
      payment_channel: channel,
      transaction_ref,
      provider_ref: provider_ref || null,
      status: completed ? "Completed" : failed ? "Failed" : "Pending",
      paid_at: completed ? new Date(timestamp || Date.now()) : null,
      sms_sent: completed, // receipt SMS queued
    })
    .returning({ payment_id: payments.payment_id, status: payments.status });

  // Revenue summary rollup for completed payments
  if (completed) {
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

    // Automatic receipt — sent instantly via SMS when Twilio keys are
    // configured, otherwise stored in the system as proof of notification.
    await notifyVendor({
      kind: "receipt",
      business,
      content: paymentReceiptContent(business.vendor_number, amountNum, isAirtel ? "AirtelMoney" : "TNMMpamba"),
    }).catch(() => undefined);
  }

  await logAudit({
    councilId: business.council_id,
    actorType: "ApiClient",
    actorName: isAirtel ? "Airtel Money" : "TNM Mpamba",
    action: "PAYMENT",
    resource: "Payment",
    resourceId: String(payment.payment_id),
    details: `${channel} webhook: ${status} MWK ${amountNum} for ${business.vendor_number}`,
  });

  return {
    ok: true,
    status: 200,
    payload: {
      received: true,
      payment_id: payment.payment_id,
      vendor_number: business.vendor_number,
      payment_status: payment.status,
    },
  };
}
