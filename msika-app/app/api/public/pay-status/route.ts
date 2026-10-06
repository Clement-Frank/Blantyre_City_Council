import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

  const business = await prisma.business.findUnique({
    where: { vendor_number: vendorNumber },
    select: {
      business_id: true,
      vendor_number: true,
      business_name: true,
      owner_name: true,
      market: { select: { name: true } },
      business_type: { select: { fee_amount: true } },
    },
  });

  if (!business) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const paid = await prisma.payment.findFirst({
    where: { business_id: business.business_id, status: "Completed", paid_at: { gte: today } },
    select: { amount: true, paid_at: true },
  });

  return NextResponse.json({
    vendor_number: business.vendor_number,
    business_name: business.business_name,
    owner_name: business.owner_name,
    market: business.market?.name,
    fee: business.business_type ? Number(business.business_type.fee_amount) : null,
    paid_today: Boolean(paid),
    paid_amount: paid ? Number(paid.amount) : null,
    code: makePayCode(business.vendor_number),
  });
}
