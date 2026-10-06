import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  businesses,
  businessTypes,
  marketSections,
  payments,
} from "@/src/db/schema";
import { getSessionUser } from "@/lib/session";
import { getScope, businessScopeSql } from "@/lib/permissions";
import { LIMBE_MARKET_BOUNDARY, LIMBE_MARKET_CENTER } from "@/lib/geofence";

// GET /api/map — vendors as red (unpaid) / green (paid) dots inside the fence
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getScope(user);

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter"); // "paid" | "unpaid" | undefined (all)

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bizScope = businessScopeSql(scope, {
    registeredBy: businesses.registered_by_collector_id,
    marketId: businesses.market_id,
  });

  const rows = await db
    .select({
      business_id: businesses.business_id,
      vendor_number: businesses.vendor_number,
      business_name: businesses.business_name,
      owner_name: businesses.owner_name,
      section_name: marketSections.section_name,
      type_name: businessTypes.name,
      fee_amount: businessTypes.fee_amount,
      gps_latitude: businesses.gps_latitude,
      gps_longitude: businesses.gps_longitude,
      status: businesses.status,
    })
    .from(businesses)
    .leftJoin(marketSections, eq(marketSections.section_id, businesses.section_id))
    .leftJoin(businessTypes, eq(businessTypes.business_type_id, businesses.business_type_id))
    .where(bizScope);

  const todayPayments = await db
    .select({ business_id: payments.business_id })
    .from(payments)
    .where(and(eq(payments.status, "Completed"), gte(payments.paid_at, today)));
  const paidSet = new Set(todayPayments.map((p) => p.business_id));

  const vendors = rows
    .filter((b) => b.gps_latitude != null && b.gps_longitude != null)
    .map((b) => {
      const paidToday = paidSet.has(b.business_id);
      return {
        vendor_number: b.vendor_number,
        business_name: b.business_name,
        owner_name: b.owner_name,
        section: b.section_name ?? undefined,
        business_type: b.type_name ?? undefined,
        daily_fee: b.fee_amount != null ? Number(b.fee_amount) : null,
        lat: Number(b.gps_latitude),
        lng: Number(b.gps_longitude),
        status: b.status,
        paid_today: paidToday,
        // red = unpaid, green = paid
        dot: paidToday ? "green" : "red",
      };
    })
    .filter((v) => (filter === "paid" ? v.paid_today : filter === "unpaid" ? !v.paid_today : true));

  const greenCount = vendors.filter((v) => v.paid_today).length;

  return NextResponse.json({
    center: LIMBE_MARKET_CENTER,
    boundary: LIMBE_MARKET_BOUNDARY,
    vendors,
    stats: {
      total: vendors.length,
      paid: greenCount,
      unpaid: vendors.length - greenCount,
      compliance: vendors.length ? Math.round((greenCount / vendors.length) * 100) : 0,
    },
  });
}
