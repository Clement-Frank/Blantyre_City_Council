import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { markets, subOffices, supervisors } from "@/src/db/schema";
import { getSessionUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import bcrypt from "bcryptjs";

// GET /api/supervisors — list supervisors with sub-office context (admin only)
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "Administrator") {
    return NextResponse.json({ error: "Forbidden — administrators only" }, { status: 403 });
  }

  const [supervisorRows, subOfficeRows, marketRows] = await Promise.all([
    db.select().from(supervisors).orderBy(asc(supervisors.supervisor_id)),
    db.select({ sub_office_id: subOffices.sub_office_id, name: subOffices.name }).from(subOffices),
    db.select({ sub_office_id: markets.sub_office_id, name: markets.name }).from(markets),
  ]);

  const data = supervisorRows.map((s) => {
    const office = subOfficeRows.find((o) => o.sub_office_id === s.sub_office_id);
    return {
      supervisor_id: s.supervisor_id,
      full_name: s.full_name,
      username: s.username,
      sub_office: office?.name ?? "Unassigned",
      markets: marketRows.filter((m) => m.sub_office_id === s.sub_office_id).map((m) => m.name),
      is_active: s.is_active,
    };
  });

  return NextResponse.json({ supervisors: data, count: data.length });
}

// POST /api/supervisors — add a supervisor (admin only)
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "Administrator") {
    return NextResponse.json({ error: "Forbidden — administrators only" }, { status: 403 });
  }

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

    const [existing] = await db
      .select({ supervisor_id: supervisors.supervisor_id })
      .from(supervisors)
      .where(eq(supervisors.username, usernameStr))
      .limit(1);
    if (existing) {
      return NextResponse.json(
        { error: "A supervisor with this username already exists" },
        { status: 409 }
      );
    }

    const hash = await bcrypt.hash(passwordStr, 10);

    const [supervisor] = await db
      .insert(supervisors)
      .values({
        council_id: 1,
        sub_office_id: sub_office_id != null && sub_office_id !== "" ? Number(sub_office_id) : null,
        full_name: fullName,
        username: usernameStr,
        password_hash: hash,
      })
      .returning({
        supervisor_id: supervisors.supervisor_id,
        full_name: supervisors.full_name,
        username: supervisors.username,
        sub_office_id: supervisors.sub_office_id,
        is_active: supervisors.is_active,
      });

    let officeName: string | undefined;
    if (supervisor.sub_office_id) {
      const [office] = await db
        .select({ name: subOffices.name })
        .from(subOffices)
        .where(eq(subOffices.sub_office_id, supervisor.sub_office_id))
        .limit(1);
      officeName = office?.name;
    }

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
        sub_office: officeName ?? "Unassigned",
        markets: [],
        is_active: supervisor.is_active,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/supervisors?id=123 — deactivate (soft delete) a supervisor (admin only)
export async function DELETE(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "Administrator") {
    return NextResponse.json({ error: "Forbidden — administrators only" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) {
    return NextResponse.json({ error: "Supervisor id is required (?id=)" }, { status: 400 });
  }

  const [supervisor] = await db
    .select({ username: supervisors.username, full_name: supervisors.full_name })
    .from(supervisors)
    .where(eq(supervisors.supervisor_id, id))
    .limit(1);
  if (!supervisor) {
    return NextResponse.json({ error: "Supervisor not found" }, { status: 404 });
  }

  await db
    .update(supervisors)
    .set({ is_active: false })
    .where(eq(supervisors.supervisor_id, id));

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
