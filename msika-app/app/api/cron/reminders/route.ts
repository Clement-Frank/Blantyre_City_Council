import { NextRequest, NextResponse } from "next/server";
import { runAutoReminders } from "@/lib/auto-reminders";

// GET/POST /api/cron/reminders — external trigger for automatic reminders.
// Backup to the in-process scheduler for platform cron / uptime pingers.
// If CRON_SECRET is set, requests must send "Authorization: Bearer <CRON_SECRET>".
async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
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
