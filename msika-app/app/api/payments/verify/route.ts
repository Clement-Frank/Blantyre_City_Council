import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  businesses,
  businessTypes,
  marketSections,
  markets,
  payments,
} from "@/src/db/schema";
import { getSessionUser } from "@/lib/session";
import { getScope, businessScopeSql, paymentScopeSql } from "@/lib/permissions";

// GET /api/payments/verify?vendor_number=V-01001
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getScope(user);

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("vendor_number")?.trim();
  if (!q) return NextResponse.json({ error: "vendor_number is required" }, { status: 400 });

  const bizScope = businessScopeSql(scope, {
    registeredBy: businesses.registered_by_collector_id,
    marketId: businesses.market_id,
  });
  const idCondition = or(eq(businesses.vendor_number, q.toUpperCase()), eq(businesses.phone_number, q));

  const [business] = await db
    .select({
      business_id: businesses.business_id,
      vendor_number: businesses.vendor_number,
      business_name: businesses.business_name,
      owner_name: businesses.owner_name,
      market_name: markets.name,
      section_name: marketSections.section_name,
      fee_amount: businessTypes.fee_amount,
    })
    .from(businesses)
    .leftJoin(markets, eq(markets.market_id, businesses.market_id))
    .leftJoin(marketSections, eq(marketSections.section_id, businesses.section_id))
    .leftJoin(businessTypes, eq(businessTypes.business_type_id, businesses.business_type_id))
    .where(bizScope ? and(idCondition, bizScope) : idCondition)
    .limit(1);

  if (!business) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayPayment] = await db
    .select()
    .from(payments)
    .where(
      and(eq(payments.business_id, business.business_id), eq(payments.status, "Completed"), gte(payments.paid_at, today))
    )
    .orderBy(desc(payments.paid_at))
    .limit(1);

  const history = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.business_id, business.business_id),
        paymentScopeSql(scope, {
          collectorId: payments.collector_id,
          businessId: payments.business_id,
        }) ?? sql`true`
      )
    )
    .orderBy(desc(payments.paid_at))
    .limit(10);

  return NextResponse.json({
    vendor: {
      vendor_number: business.vendor_number,
      business_name: business.business_name,
      owner_name: business.owner_name,
      market: business.market_name,
      section: business.section_name,
      daily_fee: business.fee_amount,
      paid_today: Boolean(todayPayment),
      today_payment: todayPayment ?? null,
      history,
    },
  });
}
