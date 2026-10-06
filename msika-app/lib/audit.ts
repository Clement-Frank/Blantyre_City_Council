import { db } from "./db";
import { auditLogs } from "@/src/db/schema";
import { headers } from "next/headers";

interface AuditParams {
  councilId?: number | null;
  userId?: number | null;
  actorType: "User" | "ApiClient" | "System";
  actorId?: number | null;
  actorName: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "PAYMENT" | "VERIFY" | "EXPORT";
  resource: string;
  resourceId?: string | null;
  details?: string | null;
}

export async function logAudit(params: AuditParams) {
  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    await db.insert(auditLogs).values({
      council_id: params.councilId ?? null,
      user_id: params.userId ?? null,
      actor_type: params.actorType,
      actor_id: params.actorId ?? null,
      actor_name: params.actorName,
      action: params.action,
      resource: params.resource,
      resource_id: params.resourceId ?? null,
      details: params.details ?? null,
      ip_address: ip,
      user_agent: userAgent,
    });
  } catch (error) {
    console.error("Audit log failed:", error);
  }
}
