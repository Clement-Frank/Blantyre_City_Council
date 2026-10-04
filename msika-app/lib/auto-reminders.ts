import { prisma } from "./prisma";
import { notifyVendor } from "./notify";

const REMINDER_COOLDOWN_MS = 6 * 60 * 60 * 1000; // one reminder per vendor per 6h
const MIN_RUN_INTERVAL_MS = 5 * 60 * 1000; // never run twice within 5 minutes
let lastRunAt = 0;

export interface AutoReminderResult {
  ran: boolean;
  reason?: string;
  unpaid_count: number;
  reminded: number;
  sent_sms: number;
  logged: number;
  skipped_cooldown: number;
}

/**
 * Automatically reminds every vendor who has not paid today's fee.
 * Runs itself — no user action needed:
 *  - triggered by the in-process scheduler (every 30 minutes)
 *  - also exposed at POST /api/cron/reminders for external cron/uptime pings
 * Each vendor is reminded at most once every 6 hours.
 */
export async function runAutoReminders(force = false): Promise<AutoReminderResult> {
  const now = Date.now();

  if (!force && now - lastRunAt < MIN_RUN_INTERVAL_MS) {
    return {
      ran: false,
      reason: "throttled",
      unpaid_count: 0,
      reminded: 0,
      sent_sms: 0,
      logged: 0,
      skipped_cooldown: 0,
    };
  }
  lastRunAt = now;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sixHoursAgo = new Date(now - REMINDER_COOLDOWN_MS);

  const [paidRows, activeVendors, recentReminders] = await Promise.all([
    prisma.payment.findMany({
      where: { status: "Completed", paid_at: { gte: today } },
      select: { business_id: true },
    }),
    prisma.business.findMany({
      where: { status: "Active" },
      select: {
        business_id: true,
        vendor_number: true,
        business_name: true,
        owner_name: true,
        phone_number: true,
      },
    }),
    // Reminders sent within the cooldown window, for per-vendor throttling
    prisma.notification.findMany({
      where: {
        channel: "Reminder",
        recipient_type: "Business",
        created_at: { gte: sixHoursAgo },
      },
      select: { recipient_id: true },
    }),
  ]);

  const paidSet = new Set(paidRows.map((p) => p.business_id));
  const recentlyReminded = new Set(recentReminders.map((n) => n.recipient_id));

  const targets = activeVendors.filter(
    (v) => !paidSet.has(v.business_id) && !recentlyReminded.has(v.business_id)
  );

  let reminded = 0;
  let sentSms = 0;
  let logged = 0;

  for (const v of targets) {
    const content = `Dear ${v.owner_name}, your daily market fee for stall ${v.vendor_number} at Limbe Market is due. Pay via Airtel Money or TNM Mpamba, or to any revenue collector. - Blantyre City Council`;

    try {
      const result = await notifyVendor({ kind: "reminder", business: v, content });
      reminded++;
      if (result.delivered) sentSms++;
      else logged++;
    } catch {
      logged++;
    }

    // Be gentle on the SMS provider and the dev server for large batches
    if (reminded % 5 === 0) {
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  return {
    ran: true,
    unpaid_count: paidSet.size + targets.length,
    reminded,
    sent_sms: sentSms,
    logged,
    skipped_cooldown: recentlyReminded.size,
  };
}
