import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { getScope, businessScopeFilter, paymentScopeFilter } from "@/lib/permissions";

// GET /api/payments/verify?vendor_number=V-01001
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getScope(user);

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("vendor_number")?.trim();
  if (!q) return NextResponse.json({ error: "vendor_number is required" }, { status: 400 });

  const business = await prisma.business.findFirst({
    where: {
      AND: [
        { OR: [{ vendor_number: q.toUpperCase() }, { phone_number: q }] },
        businessScopeFilter(scope),
      ],
    },
    include: {
      market: { select: { name: true } },
      section: { select: { section_name: true } },
      business_type: { select: { fee_amount: true } },
    },
  });

  if (!business) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayPayment = await prisma.payment.findFirst({
    where: { business_id: business.business_id, status: "Completed", paid_at: { gte: today } },
    orderBy: { paid_at: "desc" },
  });

  const history = await prisma.payment.findMany({
    where: { business_id: business.business_id, ...paymentScopeFilter(scope) },
    orderBy: { paid_at: "desc" },
    take: 10,
  });

  return NextResponse.json({
    vendor: {
      vendor_number: business.vendor_number,
      business_name: business.business_name,
      owner_name: business.owner_name,
      market: business.market?.name,
      section: business.section?.section_name,
      daily_fee: business.business_type?.fee_amount,
      paid_today: Boolean(todayPayment),
      today_payment: todayPayment,
      history,
    },
  });
}
