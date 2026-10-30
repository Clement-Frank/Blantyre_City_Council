import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import bcrypt from "bcryptjs";

// POST /api/auth/change-password — change the signed-in staff member's password.
// Works for Administrator (User), Supervisor and Collector accounts: the
// session is resolved the same way login resolves callers.
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const currentPassword = typeof body.current_password === "string" ? body.current_password : "";
    const newPassword = typeof body.new_password === "string" ? body.new_password : "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "current_password and new_password are required" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }
    if (newPassword === currentPassword) {
      return NextResponse.json({ error: "New password must be different from the current one" }, { status: 400 });
    }

    // Resolve the account the same way login does (username is across tables).
    const hashFor = async (): Promise<{ id: number; password_hash: string; where: "User" | "Collector" | "Supervisor" } | null> => {
      const admin = await prisma.user.findUnique({ where: { username: user.username } });
      if (admin?.is_active) return { id: admin.user_id, password_hash: admin.password_hash, where: "User" };
      const supervisor = await prisma.supervisor.findUnique({ where: { username: user.username } });
      if (supervisor?.is_active) return { id: supervisor.supervisor_id, password_hash: supervisor.password_hash, where: "Supervisor" };
      const collector = await prisma.collector.findUnique({ where: { username: user.username } });
      if (collector?.is_active) return { id: collector.collector_id, password_hash: collector.password_hash, where: "Collector" };
      return null;
    };

    const account = await hashFor();
    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, account.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    const hash = await bcrypt.hash(newPassword, 10);

    if (account.where === "User") {
      await prisma.user.update({ where: { user_id: account.id }, data: { password_hash: hash } });
    } else if (account.where === "Supervisor") {
      await prisma.supervisor.update({ where: { supervisor_id: account.id }, data: { password_hash: hash } });
    } else {
      await prisma.collector.update({ where: { collector_id: account.id }, data: { password_hash: hash } });
    }

    await logAudit({
      actorType: "User",
      actorId: user.id,
      actorName: user.fullName,
      action: "UPDATE",
      resource: "Password",
      resourceId: user.username,
      details: "Password changed by the account owner",
    });

    return NextResponse.json({ success: true, message: "Password updated" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
