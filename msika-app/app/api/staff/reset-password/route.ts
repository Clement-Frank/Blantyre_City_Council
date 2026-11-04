import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { can, CAPABILITY_DENIED } from "@/lib/capabilities";
import { logAudit } from "@/lib/audit";
import bcrypt from "bcryptjs";

// POST /api/staff/reset-password — an Administrator sets a temporary password
// for a collector, supervisor or another staff account. Audited, so every
// reset is attributable; the officer then changes it from Settings → Security.
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!can(user.role, "manage_users")) {
    return NextResponse.json({ error: CAPABILITY_DENIED.manage_users }, { status: 403 });
  }

  try {
    const body = await request.json();
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const newPassword = typeof body.new_password === "string" ? body.new_password : "";

    if (!username || !newPassword) {
      return NextResponse.json({ error: "username and new_password are required" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Temporary password must be at least 8 characters" }, { status: 400 });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    let target: "User" | "Supervisor" | "Collector" | null = null;

    const staffUser = await prisma.user.findUnique({ where: { username } });
    if (staffUser) {
      await prisma.user.update({ where: { user_id: staffUser.user_id }, data: { password_hash: hash } });
      target = "User";
    } else {
      const supervisor = await prisma.supervisor.findUnique({ where: { username } });
      if (supervisor) {
        await prisma.supervisor.update({
          where: { supervisor_id: supervisor.supervisor_id },
          data: { password_hash: hash },
        });
        target = "Supervisor";
      } else {
        const collector = await prisma.collector.findUnique({ where: { username } });
        if (collector) {
          await prisma.collector.update({
            where: { collector_id: collector.collector_id },
            data: { password_hash: hash },
          });
          target = "Collector";
        }
      }
    }

    if (!target) return NextResponse.json({ error: "Staff account not found" }, { status: 404 });

    await logAudit({
      actorType: "User",
      actorId: user.id,
      actorName: user.fullName,
      action: "UPDATE",
      resource: "Password",
      resourceId: username,
      details: `Administrator reset the password for @${username} (${target})`,
    });

    return NextResponse.json({ success: true, message: `Password reset for @${username}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
