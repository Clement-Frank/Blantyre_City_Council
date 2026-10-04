import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getScope } from "@/lib/permissions";
import { buildMarketIntel } from "@/lib/market-intel";

// GET /api/market-intel — the one analytics feed for the whole system.
// Powers the Limbe Market Center module AND the dashboard focus panel from a
// single engine (lib/market-intel.ts), so no two screens can disagree.
// Includes the Msika Reliability Index (MRI) vendor scoring algorithm.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scope = await getScope(user);
  return NextResponse.json(await buildMarketIntel(scope));
}
