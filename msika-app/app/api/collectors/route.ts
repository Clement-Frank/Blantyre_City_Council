import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

  const collectors = await prisma.collector.findMany({
    include: {
      sub_office: { select: { name: true } },
      businesses: { select: { business_id: true } },
      payments: { where: { status: "Completed" }, select: { payment_id: true, amount: true } },
    },
    orderBy: { collector_id: "asc" },
  });

  const data = collectors.map((c) => ({
    collector_id: c.collector_id,
    full_name: c.full_name,
    username: c.username,
    mobile_number: c.mobile_number,
    sub_office: c.sub_office?.name,
    vendors_registered: c.businesses.length,
    payments_recorded: c.payments.length,
    cash_collected: c.payments.reduce((sum, p) => sum + Number(p.amount), 0),
    is_active: c.is_active,
  }));

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
    const existing = await prisma.collector.findUnique({ where: { username: normalizedUsername } });
    if (existing) {
      return NextResponse.json({ error: "A collector with this username already exists" }, { status: 409 });
    }

    const hash = await bcrypt.hash(passwordStr, 10);

    const collector = await prisma.collector.create({
      data: {
        council_id: 1,
        sub_office_id: sub_office_id ? Number(sub_office_id) : null,
        full_name: fullName,
        mobile_number: mobile_number != null ? String(mobile_number) : "",
        username: normalizedUsername,
        password_hash: hash,
      },
    });

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
