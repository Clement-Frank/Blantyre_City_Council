import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import bcrypt from "bcryptjs";

// GET /api/supervisors — list supervisors with sub-office context
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supervisors = await prisma.supervisor.findMany({
    include: {
      sub_office: { select: { name: true, markets: { select: { name: true } } } },
    },
    orderBy: { supervisor_id: "asc" },
  });

  const data = supervisors.map((s) => ({
    supervisor_id: s.supervisor_id,
    full_name: s.full_name,
    username: s.username,
    sub_office: s.sub_office?.name ?? "Unassigned",
    markets: s.sub_office?.markets.map((m) => m.name) ?? [],
    is_active: s.is_active,
  }));

  return NextResponse.json({ supervisors: data, count: data.length });
}

// POST /api/supervisors — add a supervisor
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { full_name, username, password, sub_office_id } = body as Record<
      string,
      string | number | undefined
    >;
    const fullName = full_name != null ? String(full_name).trim() : "";
    const usernameStr = username != null ? String(username).trim().toLowerCase() : "";
    const passwordStr = password != null ? String(password) : "";

    if (!fullName || !usernameStr || !passwordStr) {
      return NextResponse.json(
        { error: "full_name, username and password are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.supervisor.findUnique({ where: { username: usernameStr } });
    if (existing) {
      return NextResponse.json(
        { error: "A supervisor with this username already exists" },
        { status: 409 }
      );
    }

    const hash = await bcrypt.hash(passwordStr, 10);

    const supervisor = await prisma.supervisor.create({
      data: {
        council_id: 1,
        sub_office_id: sub_office_id != null && sub_office_id !== "" ? Number(sub_office_id) : null,
        full_name: fullName,
        username: usernameStr,
        password_hash: hash,
      },
      include: { sub_office: { select: { name: true } } },
    });

    await logAudit({
      actorType: "User",
      actorId: user.id,
      actorName: user.fullName,
      action: "CREATE",
      resource: "Supervisor",
      resourceId: supervisor.username,
      details: `Added supervisor ${fullName} (@${supervisor.username})`,
    });

    return NextResponse.json({
      success: true,
      supervisor: {
        supervisor_id: supervisor.supervisor_id,
        full_name: supervisor.full_name,
        username: supervisor.username,
        sub_office: supervisor.sub_office?.name ?? "Unassigned",
        markets: [],
        is_active: supervisor.is_active,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/supervisors?id=123 — deactivate (soft delete) a supervisor
export async function DELETE(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) {
    return NextResponse.json({ error: "Supervisor id is required (?id=)" }, { status: 400 });
  }

  const supervisor = await prisma.supervisor.findUnique({ where: { supervisor_id: id } });
  if (!supervisor) {
    return NextResponse.json({ error: "Supervisor not found" }, { status: 404 });
  }

  await prisma.supervisor.update({
    where: { supervisor_id: id },
    data: { is_active: false },
  });

  await logAudit({
    actorType: "User",
    actorId: user.id,
    actorName: user.fullName,
    action: "DELETE",
    resource: "Supervisor",
    resourceId: supervisor.username,
    details: `Deactivated supervisor ${supervisor.full_name} (@${supervisor.username})`,
  });

  return NextResponse.json({ success: true });
}
