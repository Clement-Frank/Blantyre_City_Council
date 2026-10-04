import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getScope } from "@/lib/permissions";
import { buildMarketIntel } from "@/lib/market-intel";

// GET /api/pulse — Market Pulse analytics, now served by the shared
// market-intel engine (same numbers as /api/market-intel). Kept for API
// compatibility; the UI lives in the Limbe Market Command Center.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getScope(user);
  return NextResponse.json(await buildMarketIntel(scope));
}
