import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transaction_ref, business_id, amount, status, timestamp, provider_ref } = body;

    // Validate required fields
    if (!transaction_ref || !business_id || !amount || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Idempotency check
    const existing = await prisma.payment.findFirst({
      where: { transaction_ref },
    });

    if (existing) {
      return NextResponse.json({ received: true, payment_id: existing.payment_id, message: "Duplicate webhook" });
    }

    // Find or create payment
    const payment = await prisma.payment.create({
      data: {
        business_id: parseInt(business_id),
        amount: parseFloat(amount),
        payment_channel: "AirtelMoney",
        transaction_ref,
        provider_ref: provider_ref || null,
        status: status === "SUCCESS" ? "Completed" : status === "FAILED" ? "Failed" : "Pending",
        fee_type: "Standard Daily Fee",
        paid_at: status === "SUCCESS" ? new Date(timestamp || Date.now()) : null,
      },
    });

    // Update revenue summary if completed
    if (status === "SUCCESS") {
      const business = await prisma.business.findUnique({
        where: { business_id: parseInt(business_id) },
        include: { market: true },
      });

      if (business) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await prisma.revenueSummary.upsert({
          where: {
            market_id_summary_date: {
              market_id: business.market_id,
              summary_date: today,
            },
          },
          update: {
            total_amount: { increment: parseFloat(amount) },
            total_transactions: { increment: 1 },
            successful_count: { increment: 1 },
          },
          create: {
            council_id: business.market.council_id,
            sub_office_id: business.market.sub_office_id,
            market_id: business.market_id,
            summary_date: today,
            total_amount: parseFloat(amount),
            total_transactions: 1,
            successful_count: 1,
          },
        });
      }
    }

    // Audit log
    await logAudit({
      actorType: "ApiClient",
      actorName: "Airtel Money",
      action: "PAYMENT",
      resource: "Payment",
      resourceId: payment.payment_id.toString(),
      details: `Airtel webhook: ${status} for MWK ${amount}`,
    });

    return NextResponse.json({ received: true, payment_id: payment.payment_id });
  } catch (error: any) {
    console.error("Airtel webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
