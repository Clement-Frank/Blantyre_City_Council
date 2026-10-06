import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { businessTypes, businesses, markets, payments } from "@/src/db/schema";
import { makePayCode } from "@/lib/paycode";

// GET /api/public/pay-status?vendor_number=V-01001
// Public data for the QR payment page — deliberately minimal: stall identity,
// today's fee, and whether today is already settled. No personal data beyond
// what is printed on the stall badge.
export async function GET(request: NextRequest) {
  const vendorNumber = request.nextUrl.searchParams.get("vendor_number")?.toUpperCase();
  if (!vendorNumber) {
    return NextResponse.json({ error: "vendor_number is required" }, { status: 400 });
  }

  const [business] = await db
    .select({
      business_id: businesses.business_id,
      vendor_number: businesses.vendor_number,
      business_name: businesses.business_name,
      owner_name: businesses.owner_name,
      market_name: markets.name,
      fee_amount: businessTypes.fee_amount,
    })
    .from(businesses)
    .leftJoin(markets, eq(markets.market_id, businesses.market_id))
    .leftJoin(businessTypes, eq(businessTypes.business_type_id, businesses.business_type_id))
    .where(eq(businesses.vendor_number, vendorNumber))
    .limit(1);

  if (!business) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [paid] = await db
    .select({ amount: payments.amount, paid_at: payments.paid_at })
    .from(payments)
    .where(
      and(eq(payments.business_id, business.business_id), eq(payments.status, "Completed"), gte(payments.paid_at, today))
    )
    .limit(1);

  return NextResponse.json({
    vendor_number: business.vendor_number,
    business_name: business.business_name,
    owner_name: business.owner_name,
    market: business.market_name,
    fee: business.fee_amount != null ? Number(business.fee_amount) : null,
    paid_today: Boolean(paid),
    paid_amount: paid ? Number(paid.amount) : null,
    code: makePayCode(business.vendor_number),
  });
}
