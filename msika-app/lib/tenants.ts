import { prisma } from "./prisma";
import { cookies } from "next/headers";

export async function getCurrentCouncilId(): Promise<number | null> {
  const cookieStore = await cookies();
  const councilId = cookieStore.get("council_id")?.value;
  return councilId ? parseInt(councilId) : null;
}

export async function setCurrentCouncilId(councilId: number) {
  const cookieStore = await cookies();
  cookieStore.set("council_id", councilId.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function getTenantWhere(councilId?: number | null) {
  const cid = councilId ?? (await getCurrentCouncilId());
  return cid ? { council_id: cid } : {};
}

export async function assertTenantAccess(requestedCouncilId: number) {
  const current = await getCurrentCouncilId();
  const userRole = (await cookies()).get("user_role")?.value;
  
  // Super Admin can access all councils
  if (userRole === "Super Administrator") return;
  
  if (current !== requestedCouncilId) {
    throw new Error("Unauthorized: Cross-tenant access denied");
  }
}