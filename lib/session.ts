import { cookies } from "next/headers";
import { verifyToken } from "./auth";

export interface SessionUser {
  id: number;
  username: string;
  fullName: string;
  role: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) return null;
    const payload = await verifyToken(token);
    return {
      id: Number(payload.sub) || 0,
      username: String(payload.username || ""),
      fullName: String(payload.fullName || ""),
      role: String(payload.role || ""),
    };
  } catch {
    return null;
  }
}
