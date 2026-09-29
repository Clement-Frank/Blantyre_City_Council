import { prisma } from "./prisma";
import { logAudit } from "./audit";

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
  const failCodes = isAirtel ? ["FAILED", "FAILED", "TF"] : ["TF", "FAILED", "FAILED"];
  const completed = successCodes.includes(status.toUpperCase());
  const failed = failCodes.includes(status.toUpperCase());

  // Idempotency: skip if this transaction_ref was already processed
  const existing = await prisma.payment.findFirst({ where: { transaction_ref } });
  if (existing) {
    return {
      ok: true,
      status: 200,
      payload: { received: true, payment_id: existing.payment_id, duplicate: true },
    };
  }

  // Resolve the vendor: prefer vendor_number, fallback to business_id, then payer phone.
  let business = null as null | Awaited<ReturnType<typeof prisma.business.findFirst>>;
  if (vendor_number) {
    business = await prisma.business.findUnique({
      where: { vendor_number: String(vendor_number).toUpperCase() },
    });
  }
  if (!business && business_id) {
    business = await prisma.business.findUnique({ where: { business_id: Number(business_id) } });
  }
  if (!business && payer_phone) {
    business = await prisma.business.findFirst({ where: { wallet_number: payer_phone } });
  }
  if (!business) {
    return { ok: false, status: 404, payload: { error: "Vendor not found for this payment" } };
  }

  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return { ok: false, status: 400, payload: { error: "Invalid amount" } };
  }

  const feeType = amountNum >= 2000 ? "Kupikulisa Bulk Fee" : amountNum >= 500 ? "Restaurant/Butchery Fee" : "Standard Daily Fee";

  const payment = await prisma.payment.create({
    data: {
      business_id: business.business_id,
      amount: amountNum,
      fee_type: feeType,
      payment_channel: channel,
      transaction_ref,
      provider_ref: provider_ref || null,
      status: completed ? "Completed" : failed ? "Failed" : "Pending",
      paid_at: completed ? new Date(timestamp || Date.now()) : null,
      sms_sent: completed, // receipt SMS queued
    },
  });

  // Revenue summary rollup for completed payments
  if (completed) {
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
        sub_office_id: (
          await prisma.market.findUnique({ where: { market_id: business.market_id } })
        )?.sub_office_id ?? 1,
        market_id: business.market_id,
        summary_date: day,
        total_amount: amountNum,
        total_transactions: 1,
        successful_count: 1,
      },
    });

    // Notify the vendor (stored notification; SMS sent if Twilio keys configured)
    await prisma.notification.create({
      data: {
        recipient_type: "Business",
        recipient_id: business.business_id,
        type: "SMS",
        channel: "Payment",
        status: process.env.TWILIO_ACCOUNT_SID ? "Pending" : "Logged",
        content: `Payment received: MWK ${amountNum} for ${business.vendor_number}. Thank you.`,
      },
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
