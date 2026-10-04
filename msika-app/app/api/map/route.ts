import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { getScope, businessScopeFilter } from "@/lib/permissions";
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

  const businesses = await prisma.business.findMany({
    where: businessScopeFilter(scope),
    include: {
      section: { select: { section_name: true } },
      business_type: { select: { name: true, fee_amount: true } },
      payments: {
        where: { status: "Completed", paid_at: { gte: today } },
        select: { payment_id: true, amount: true, paid_at: true, payment_channel: true },
        take: 1,
      },
    },
  });

  const vendors = businesses
    .filter((b) => b.gps_latitude != null && b.gps_longitude != null)
    .map((b) => {
      const paidToday = b.payments.length > 0;
      return {
        vendor_number: b.vendor_number,
        business_name: b.business_name,
        owner_name: b.owner_name,
        section: b.section?.section_name,
        business_type: b.business_type?.name,
        daily_fee: b.business_type ? Number(b.business_type.fee_amount) : null,
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
