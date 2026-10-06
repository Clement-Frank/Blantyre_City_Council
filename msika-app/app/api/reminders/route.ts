import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses, markets, notifications, payments } from "@/src/db/schema";
import { getSessionUser } from "@/lib/session";
import { getScope, businessScopeSql, paymentScopeSql } from "@/lib/permissions";
import { sendSMS } from "@/lib/sms";

// GET /api/reminders — today's unpaid vendors (reminder targets) + recent notifications
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getScope(user);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const paidRows = await db
    .select({ business_id: payments.business_id })
    .from(payments)
    .where(
      and(
        eq(payments.status, "Completed"),
        gte(payments.paid_at, today),
        paymentScopeSql(scope, { collectorId: payments.collector_id, businessId: payments.business_id })
      )
    );
  const paidSet = new Set(paidRows.map((p) => p.business_id));

  const vendorRows = await db
    .select({
      business_id: businesses.business_id,
      vendor_number: businesses.vendor_number,
      business_name: businesses.business_name,
      owner_name: businesses.owner_name,
      phone_number: businesses.phone_number,
      market_name: markets.name,
    })
    .from(businesses)
    .leftJoin(markets, eq(markets.market_id, businesses.market_id))
    .where(
      and(
        eq(businesses.status, "Active"),
        businessScopeSql(scope, {
          registeredBy: businesses.registered_by_collector_id,
          marketId: businesses.market_id,
        })
      )
    );

  const unpaid = vendorRows
    .filter((v) => !paidSet.has(v.business_id))
    .map((v) => ({
      business_id: v.business_id,
      vendor_number: v.vendor_number,
      business_name: v.business_name,
      owner_name: v.owner_name,
      phone_number: v.phone_number,
      market: v.market_name != null ? { name: v.market_name } : null,
    }));

  const notificationRows = await db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.created_at))
    .limit(30);

  return NextResponse.json({
    unpaid_vendors: unpaid,
    paid_count: paidSet.size,
    unpaid_count: unpaid.length,
    notifications: notificationRows,
  });
}

// POST /api/reminders — send payment reminders to unpaid vendors
// body: { vendor_numbers?: string[], message?: string }  (omit vendor_numbers = remind all unpaid)
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getScope(user);

  try {
    const body = await request.json().catch(() => ({}));
    const { vendor_numbers, message } = body as { vendor_numbers?: string[]; message?: string };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const paidRows = await db
      .select({ business_id: payments.business_id })
      .from(payments)
      .where(
        and(
          eq(payments.status, "Completed"),
          gte(payments.paid_at, today),
          paymentScopeSql(scope, { collectorId: payments.collector_id, businessId: payments.business_id })
        )
      );
    const paidSet = new Set(paidRows.map((p) => p.business_id));

    const bizScope = businessScopeSql(scope, {
      registeredBy: businesses.registered_by_collector_id,
      marketId: businesses.market_id,
    });
    const conditions: SQL[] = [eq(businesses.status, "Active")];
    if (bizScope) conditions.push(bizScope);
    if (vendor_numbers?.length) {
      conditions.push(inArray(businesses.vendor_number, vendor_numbers.map((v) => v.toUpperCase())));
    }

    const targets = await db
      .select({
        business_id: businesses.business_id,
        vendor_number: businesses.vendor_number,
        business_name: businesses.business_name,
        owner_name: businesses.owner_name,
        phone_number: businesses.phone_number,
      })
      .from(businesses)
      .where(and(...conditions));

    const defaultMsg = (name: string, vn: string) =>
      message || `Dear ${name}, your daily market fee for ${vn} is due. Pay via Airtel Money or TNM Mpamba, or see any revenue collector. - Blantyre City Council`;

    let sentReal = 0;
    let logged = 0;

    for (const v of targets) {
      if (paidSet.has(v.business_id)) continue; // already paid — skip

      const content = defaultMsg(v.owner_name, v.vendor_number);

      // Record the notification
      await db.insert(notifications).values({
        recipient_type: "Business",
        recipient_id: v.business_id,
        type: "SMS",
        channel: "Reminder",
        status: process.env.TWILIO_ACCOUNT_SID ? "Pending" : "Logged",
        content,
      });

      const result = await sendSMS(v.phone_number, content);
      if (result.sent) sentReal++;
      else logged++;
    }

    return NextResponse.json({
      success: true,
      reminded: targets.length,
      sms_sent: sentReal,
      logged: logged,
      note: process.env.TWILIO_ACCOUNT_SID
        ? "SMS sent via Twilio"
        : "Notifications stored (add Twilio keys to send real SMS)",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
