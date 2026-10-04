import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { getScope, paymentScopeFilter, businessScopeFilter } from "@/lib/permissions";
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

  const where: Record<string, unknown> = { ...paymentScopeFilter(scope) };
  if (status && status !== "All") where.status = status;
  if (search) {
    where.OR = [
      { transaction_ref: { contains: search, mode: "insensitive" } },
      { business: { business_name: { contains: search, mode: "insensitive" } } },
      { business: { vendor_number: { contains: search, mode: "insensitive" } } },
      { business: { owner_name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const payments = await prisma.payment.findMany({
    where,
    include: {
      business: {
        select: { vendor_number: true, business_name: true, owner_name: true, market: { select: { name: true } } },
      },
      collector: { select: { full_name: true } },
    },
    orderBy: { created_at: "desc" },
    take: limit,
  });

  return NextResponse.json({ payments, count: payments.length });
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

    const business = await prisma.business.findFirst({
      where: {
        AND: [
          { vendor_number: vendorNumberStr.toUpperCase() },
          businessScopeFilter(scope),
        ],
      },
      include: { business_type: true },
    });
    if (!business) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Idempotency: skip if this vendor already paid today
    const alreadyPaid = await prisma.payment.findFirst({
      where: { business_id: business.business_id, status: "Completed", paid_at: { gte: today } },
    });
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
      const collector = await prisma.collector.findUnique({ where: { username: user.username } });
      collectorId = collector?.collector_id ?? null;
    }

    const refPrefix = channel === "AirtelMoney" ? "AM" : channel === "TNMMpamba" ? "TM" : "MS";
    const transactionRef = `${refPrefix}-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const payment = await prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          business_id: business.business_id,
          collector_id: collectorId,
          amount: amountNum,
          fee_type: feeType,
          payment_channel: channel,
          transaction_ref: transactionRef,
          status: channel === "Cash" ? "Completed" : "Pending",
          paid_at: channel === "Cash" ? new Date() : null,
        },
      });

      // Revenue summary rollup
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      await tx.revenueSummary.upsert({
        where: { market_id_summary_date: { market_id: business.market_id, summary_date: day } },
        update: {
          total_amount: { increment: channel === "Cash" ? amountNum : 0 },
          total_transactions: { increment: 1 },
          successful_count: { increment: channel === "Cash" ? 1 : 0 },
        },
        create: {
          council_id: business.council_id,
          sub_office_id: (await tx.market.findUnique({ where: { market_id: business.market_id } }))?.sub_office_id ?? 1,
          market_id: business.market_id,
          summary_date: day,
          total_amount: channel === "Cash" ? amountNum : 0,
          total_transactions: 1,
          successful_count: channel === "Cash" ? 1 : 0,
        },
      });

      return created;
    });

    await logAudit({
      councilId: business.council_id,
      actorType: "User",
      actorId: user.id,
      actorName: user.fullName,
      action: "PAYMENT",
      resource: "Payment",
      resourceId: String(payment.payment_id),
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
      payment,
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
