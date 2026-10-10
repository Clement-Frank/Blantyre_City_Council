import { NextRequest, NextResponse } from "next/server";
import { runAutoReminders } from "@/lib/auto-reminders";

// GET/POST /api/cron/reminders — Vercel Cron and authenticated external trigger.
// If CRON_SECRET is set, requests must send "Authorization: Bearer <CRON_SECRET>".
async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Cron is not configured" }, { status: 503 });
  }
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const force = request.nextUrl.searchParams.get("force") === "1";
  const result = await runAutoReminders(force);

  return NextResponse.json({ success: true, ...result });
}

export { handle as GET, handle as POST };
