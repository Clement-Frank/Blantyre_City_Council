// Next.js instrumentation — runs once when the server process starts.
// Starts the automatic notification scheduler so reminders go out with
// zero manual action from council staff.
//
// Behaviour:
//  - Every 30 minutes, vendors who have NOT paid today's fee automatically
//    receive a payment reminder (SMS via Twilio when keys are configured,
//    otherwise stored in the system as evidence of the reminder).
//  - Each vendor is reminded at most once every 6 hours.
//  - Never runs during `next build`.

const REMINDER_INTERVAL_MS = 30 * 60 * 1000;

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  console.log("[scheduler] automatic reminder engine registered (every 30 min)");

  const tick = async () => {
    try {
      const { runAutoReminders } = await import("./lib/auto-reminders");
      const result = await runAutoReminders();
      if (result.ran && result.reminded > 0) {
        console.log(
          `[scheduler] auto-reminders: reminded ${result.reminded} unpaid vendor(s), sms=${result.sent_sms}, logged=${result.logged}`
        );
      }
    } catch (err) {
      // Never crash the server because of the scheduler
      console.error("[scheduler] auto-reminder run failed:", err instanceof Error ? err.message : err);
    }
  };

  // First run 90s after boot (lets the dev server settle), then every 30 min
  setTimeout(tick, 90_000);
  setInterval(tick, REMINDER_INTERVAL_MS);
}
