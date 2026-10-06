import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses, collectors, payments, subOffices } from "@/src/db/schema";
import { getSessionUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import bcrypt from "bcryptjs";

// GET /api/collectors — list collectors with performance stats (admin only)
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "Administrator") {
    return NextResponse.json({ error: "Forbidden — administrators only" }, { status: 403 });
  }

  const [collectorRows, businessRows, paymentRows, subOfficeRows] = await Promise.all([
    db.select().from(collectors).orderBy(asc(collectors.collector_id)),
    db.select({ registered_by_collector_id: businesses.registered_by_collector_id }).from(businesses),
    db
      .select({
        collector_id: payments.collector_id,
        payment_id: payments.payment_id,
        amount: payments.amount,
      })
      .from(payments)
      .where(eq(payments.status, "Completed")),
    db.select({ sub_office_id: subOffices.sub_office_id, name: subOffices.name }).from(subOffices),
  ]);

  const data = collectorRows.map((c) => {
    const cPayments = paymentRows.filter((p) => p.collector_id === c.collector_id);
    return {
      collector_id: c.collector_id,
      full_name: c.full_name,
      username: c.username,
      mobile_number: c.mobile_number,
      sub_office: subOfficeRows.find((s) => s.sub_office_id === c.sub_office_id)?.name,
      vendors_registered: businessRows.filter((b) => b.registered_by_collector_id === c.collector_id).length,
      payments_recorded: cPayments.length,
      cash_collected: cPayments.reduce((sum, p) => sum + Number(p.amount), 0),
      is_active: c.is_active,
    };
  });

  return NextResponse.json({ collectors: data });
}

// POST /api/collectors — register a revenue collector (admin only)
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "Administrator") {
    return NextResponse.json({ error: "Forbidden — administrators only" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { full_name, username, mobile_number, password, sub_office_id } = body as Record<string, string | number | undefined>;
    const fullName = full_name != null ? String(full_name) : "";
    const usernameStr = username != null ? String(username) : "";
    const passwordStr = password != null ? String(password) : "";

    if (!fullName || !usernameStr || !passwordStr) {
      return NextResponse.json({ error: "full_name, username and password are required" }, { status: 400 });
    }

    const normalizedUsername = usernameStr.trim().toLowerCase();
    const [existing] = await db
      .select({ collector_id: collectors.collector_id })
      .from(collectors)
      .where(eq(collectors.username, normalizedUsername))
      .limit(1);
    if (existing) {
      return NextResponse.json({ error: "A collector with this username already exists" }, { status: 409 });
    }

    const hash = await bcrypt.hash(passwordStr, 10);

    const [collector] = await db
      .insert(collectors)
      .values({
        council_id: 1,
        sub_office_id: sub_office_id ? Number(sub_office_id) : null,
        full_name: fullName,
        mobile_number: mobile_number != null ? String(mobile_number) : "",
        username: normalizedUsername,
        password_hash: hash,
      })
      .returning({ collector_id: collectors.collector_id, username: collectors.username });

    await logAudit({
      actorType: "User",
      actorId: user.id,
      actorName: user.fullName,
      action: "CREATE",
      resource: "Collector",
      resourceId: collector.username,
      details: `Registered collector ${fullName} (@${collector.username})`,
    });

    return NextResponse.json({
      success: true,
      collector: { collector_id: collector.collector_id, full_name: fullName, username: collector.username },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
