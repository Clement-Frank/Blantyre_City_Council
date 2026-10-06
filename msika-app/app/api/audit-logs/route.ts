import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLogs } from "@/src/db/schema";
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

  const conditions: SQL[] = [];
  if (action !== "All") conditions.push(eq(auditLogs.action, action));
  if (search) {
    const like = `%${search}%`;
    const searchCondition = or(
      ilike(auditLogs.actor_name, like),
      ilike(auditLogs.resource, like),
      ilike(auditLogs.resource_id, like),
      ilike(auditLogs.details, like)
    );
    if (searchCondition) conditions.push(searchCondition);
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [logs, totalRows, actionCounts] = await Promise.all([
    db
      .select()
      .from(auditLogs)
      .where(where)
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit),
    db.select({ count: sql<number>`count(*)::int` }).from(auditLogs).where(where),
    // Kept unfiltered to match the previous aggregate over the whole trail.
    db
      .select({ action: auditLogs.action, count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .groupBy(auditLogs.action),
  ]);
  const total = totalRows[0]?.count ?? 0;

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
    action_counts: actionCounts.map((a) => ({ action: a.action, count: a.count })),
  });
}
