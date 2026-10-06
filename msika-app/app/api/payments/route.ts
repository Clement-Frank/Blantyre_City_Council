import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  businesses,
  businessTypes,
  collectors,
  markets,
  payments,
  revenueSummaries,
} from "@/src/db/schema";
import { getSessionUser } from "@/lib/session";
import { getScope, businessScopeSql, paymentScopeSql } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { notifyVendor, paymentReceiptContent } from "@/lib/notify";

// GET /api/payments — list payments with vendor info
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getScope(user);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search")?.trim();
  const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);

  const conditions: SQL[] = [];
  const payScope = paymentScopeSql(scope, {
    collectorId: payments.collector_id,
    businessId: payments.business_id,
  });
  if (payScope) conditions.push(payScope);
  if (status && status !== "All") conditions.push(eq(payments.status, status as "Completed"));
  if (search) {
    const like = `%${search}%`;
    const searchCondition = or(
      sql`${payments.transaction_ref} ilike ${like}`,
      sql`${businesses.business_name} ilike ${like}`,
      sql`${businesses.vendor_number} ilike ${like}`,
      sql`${businesses.owner_name} ilike ${like}`
    );
    if (searchCondition) conditions.push(searchCondition);
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

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
      owner_name: businesses.owner_name,
      market_name: markets.name,
      collector_name: collectors.full_name,
    })
    .from(payments)
    .leftJoin(businesses, eq(businesses.business_id, payments.business_id))
    .leftJoin(markets, eq(markets.market_id, businesses.market_id))
    .leftJoin(collectors, eq(collectors.collector_id, payments.collector_id))
    .where(where)
    .orderBy(desc(payments.created_at))
    .limit(limit);

  return NextResponse.json({
    payments: rows.map((p) => ({
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
      business: {
        vendor_number: p.vendor_number,
        business_name: p.business_name,
        owner_name: p.owner_name,
        market: p.market_name != null ? { name: p.market_name } : null,
      },
      collector: p.collector_name != null ? { full_name: p.collector_name } : null,
    })),
    count: rows.length,
  });
}

// POST /api/payments — record a payment (cash by collector, or wallet prompt)
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getScope(user);

  try {
    const body = await request.json();
    const { vendor_number, amount, payment_channel, fee_type } = body as Record<string, string | number | undefined>;
    const vendorNumberStr = vendor_number != null ? String(vendor_number) : "";

    if (!vendorNumberStr || !amount) {
      return NextResponse.json({ error: "vendor_number and amount are required" }, { status: 400 });
    }

    const bizScope = businessScopeSql(scope, {
      registeredBy: businesses.registered_by_collector_id,
      marketId: businesses.market_id,
    });
    const [business] = await db
      .select({
        business_id: businesses.business_id,
        vendor_number: businesses.vendor_number,
        business_name: businesses.business_name,
        owner_name: businesses.owner_name,
        phone_number: businesses.phone_number,
        council_id: businesses.council_id,
        market_id: businesses.market_id,
        type_name: businessTypes.name,
        fee_amount: businessTypes.fee_amount,
      })
      .from(businesses)
      .leftJoin(businessTypes, eq(businessTypes.business_type_id, businesses.business_type_id))
      .where(
        bizScope
          ? and(eq(businesses.vendor_number, vendorNumberStr.toUpperCase()), bizScope)
          : eq(businesses.vendor_number, vendorNumberStr.toUpperCase())
      )
      .limit(1);
    if (!business) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Idempotency: skip if this vendor already paid today
    const [alreadyPaid] = await db
      .select()
      .from(payments)
      .where(
        and(eq(payments.business_id, business.business_id), eq(payments.status, "Completed"), gte(payments.paid_at, today))
      )
      .limit(1);
    if (alreadyPaid) {
      return NextResponse.json(
        { error: "Vendor has already paid today", payment: alreadyPaid },
        { status: 409 }
      );
    }

    const amountNum = Number(amount);
    const channel = (payment_channel as "Cash" | "AirtelMoney" | "TNMMpamba" | "USSD" | "Bank") || "Cash";
    const feeType = fee_type != null ? String(fee_type) : amountNum >= 2000 ? "Kupikulisa Bulk Fee" : amountNum >= 500 ? "Restaurant/Butchery Fee" : "Standard Daily Fee";

    let collectorId: number | null = null;
    if (user.role === "Collector") {
      const [collector] = await db
        .select({ collector_id: collectors.collector_id })
        .from(collectors)
        .where(eq(collectors.username, user.username))
        .limit(1);
      collectorId = collector?.collector_id ?? null;
    }

    const refPrefix = channel === "AirtelMoney" ? "AM" : channel === "TNMMpamba" ? "TM" : "MS";
    const transactionRef = `${refPrefix}-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const created = await db.transaction(async (tx) => {
      const [payment] = await tx
        .insert(payments)
        .values({
          business_id: business.business_id,
          collector_id: collectorId,
          amount: String(amountNum),
          fee_type: feeType,
          payment_channel: channel,
          transaction_ref: transactionRef,
          status: channel === "Cash" ? "Completed" : "Pending",
          paid_at: channel === "Cash" ? new Date() : null,
        })
        .returning();

      // Revenue summary rollup
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      const summaryDay = day.toISOString().slice(0, 10);
      const [marketRow] = await tx
        .select({ sub_office_id: markets.sub_office_id })
        .from(markets)
        .where(eq(markets.market_id, business.market_id))
        .limit(1);
      await tx
        .insert(revenueSummaries)
        .values({
          council_id: business.council_id,
          sub_office_id: marketRow?.sub_office_id ?? 1,
          market_id: business.market_id,
          summary_date: summaryDay,
          total_amount: channel === "Cash" ? String(amountNum) : "0",
          total_transactions: 1,
          successful_count: channel === "Cash" ? 1 : 0,
        })
        .onConflictDoUpdate({
          target: [revenueSummaries.market_id, revenueSummaries.summary_date],
          set: {
            total_amount: sql`${revenueSummaries.total_amount} + ${channel === "Cash" ? String(amountNum) : "0"}`,
            total_transactions: sql`${revenueSummaries.total_transactions} + 1`,
            successful_count: sql`${revenueSummaries.successful_count} + ${channel === "Cash" ? 1 : 0}`,
          },
        });

      return payment;
    });

    await logAudit({
      councilId: business.council_id,
      actorType: "User",
      actorId: user.id,
      actorName: user.fullName,
      action: "PAYMENT",
      resource: "Payment",
      resourceId: String(created.payment_id),
      details: `Recorded ${channel} payment of MWK ${amountNum} for ${business.vendor_number} (${business.business_name})`,
    });

    // Automatic receipt — no staff action required. Sent instantly via SMS
    // when Twilio keys are configured, otherwise stored as a system receipt.
    if (channel === "Cash") {
      await notifyVendor({
        kind: "receipt",
        business,
        content: paymentReceiptContent(business.vendor_number, amountNum, channel),
      }).catch(() => undefined);
    }

    return NextResponse.json({
      success: true,
      payment: created,
      vendor: {
        vendor_number: business.vendor_number,
        business_name: business.business_name,
        paid_today: channel === "Cash",
      },
      message:
        channel === "Cash"
          ? "Cash payment recorded — vendor dot is now GREEN on the map"
          : "Wallet payment initiated — dot turns green once the provider webhook confirms",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Payment recording error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
