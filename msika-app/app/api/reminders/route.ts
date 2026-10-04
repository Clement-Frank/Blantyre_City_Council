import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { getScope, businessScopeFilter, paymentScopeFilter } from "@/lib/permissions";
import { sendSMS } from "@/lib/sms";

// GET /api/reminders — today's unpaid vendors (reminder targets) + recent notifications
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getScope(user);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const paidBusinessIds = await prisma.payment.findMany({
    where: { AND: [{ status: "Completed", paid_at: { gte: today } }, paymentScopeFilter(scope)] },
    select: { business_id: true },
  });
  const paidSet = new Set(paidBusinessIds.map((p) => p.business_id));

  const allVendors = await prisma.business.findMany({
    where: { AND: [{ status: "Active" }, businessScopeFilter(scope)] },
    select: { business_id: true, vendor_number: true, business_name: true, owner_name: true, phone_number: true, market: { select: { name: true } } },
  });

  const unpaid = allVendors.filter((v) => !paidSet.has(v.business_id));

  const notifications = await prisma.notification.findMany({
    orderBy: { created_at: "desc" },
    take: 30,
  });

  return NextResponse.json({
    unpaid_vendors: unpaid,
    paid_count: paidSet.size,
    unpaid_count: unpaid.length,
    notifications,
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

    const paidBusinessIds = await prisma.payment.findMany({
      where: { AND: [{ status: "Completed", paid_at: { gte: today } }, paymentScopeFilter(scope)] },
      select: { business_id: true },
    });
    const paidSet = new Set(paidBusinessIds.map((p) => p.business_id));

    const where: Record<string, unknown> = { AND: [{ status: "Active" }, businessScopeFilter(scope)] };
    if (vendor_numbers?.length) {
      (where.AND as Record<string, unknown>[]).push({ vendor_number: { in: vendor_numbers.map((v) => v.toUpperCase()) } });
    }

    const targets = await prisma.business.findMany({
      where,
      select: { business_id: true, vendor_number: true, business_name: true, owner_name: true, phone_number: true },
    });

    const defaultMsg = (name: string, vn: string) =>
      message || `Dear ${name}, your daily market fee for ${vn} is due. Pay via Airtel Money or TNM Mpamba, or see any revenue collector. - Blantyre City Council`;

    let sentReal = 0;
    let logged = 0;

    for (const v of targets) {
      if (paidSet.has(v.business_id)) continue; // already paid — skip

      const content = defaultMsg(v.owner_name, v.vendor_number);

      // Record the notification
      await prisma.notification.create({
        data: {
          recipient_type: "Business",
          recipient_id: v.business_id,
          type: "SMS",
          channel: "Reminder",
          status: process.env.TWILIO_ACCOUNT_SID ? "Pending" : "Logged",
          content,
        },
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
