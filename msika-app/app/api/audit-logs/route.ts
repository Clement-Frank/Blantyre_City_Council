import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

// GET /api/audit-logs — real audit trail (admin only)
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "Administrator") {
    return NextResponse.json({ error: "Forbidden — administrators only" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("search") || "").trim();
  const action = searchParams.get("action") || "All";
  const limit = Math.min(Number(searchParams.get("limit")) || 200, 500);

  const where: Record<string, unknown> = {};
  if (action !== "All") where.action = action;
  if (search) {
    where.OR = [
      { actor_name: { contains: search, mode: "insensitive" } },
      { resource: { contains: search, mode: "insensitive" } },
      { resource_id: { contains: search, mode: "insensitive" } },
      { details: { contains: search, mode: "insensitive" } },
    ];
  }

  const [logs, total, actionCounts] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.groupBy({
      by: ["action"],
      _count: { action: true },
    }),
  ]);

  return NextResponse.json({
    logs: logs.map((l) => ({
      log_id: l.log_id,
      actor_type: l.actor_type,
      actor_name: l.actor_name,
      action: l.action,
      resource: l.resource,
      resource_id: l.resource_id,
      details: l.details,
      ip_address: l.ip_address,
      timestamp: l.timestamp,
    })),
    total,
    action_counts: actionCounts.map((a) => ({ action: a.action, count: a._count.action })),
  });
}
