import { prisma } from "./prisma";
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

    await prisma.auditLog.create({
      data: {
        council_id: params.councilId,
        user_id: params.userId,
        actor_type: params.actorType,
        actor_id: params.actorId,
        actor_name: params.actorName,
        action: params.action,
        resource: params.resource,
        resource_id: params.resourceId,
        details: params.details,
        ip_address: ip,
        user_agent: userAgent,
      },
    });
  } catch (error) {
    console.error("Audit log failed:", error);
  }
}   