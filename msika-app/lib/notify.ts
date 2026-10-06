import { db } from "./db";
import { notifications } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { sendSMS } from "./sms";

export type NotificationKind = "receipt" | "reminder" | "registration" | "system";

interface NotifyVendorInput {
  kind: NotificationKind;
  business: {
    business_id: number;
    vendor_number: string;
    owner_name: string;
    phone_number: string;
    business_name?: string;
  };
  content: string;
}

/**
 * Single entry point for all vendor notifications.
 * Creates the Notification row and IMMEDIATELY attempts delivery via SMS
 * (Twilio when keys are configured, otherwise logged-only).
 */
export async function notifyVendor({ kind, business, content }: NotifyVendorInput) {
  const hasTwilio = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);

  const [row] = await db
    .insert(notifications)
    .values({
      recipient_type: "Business",
      recipient_id: business.business_id,
      type: "SMS",
      channel: kind === "receipt" ? "Payment" : kind === "reminder" ? "Reminder" : "Registration",
      status: "Pending",
      content,
    })
    .returning({ notification_id: notifications.notification_id });

  let delivered = false;
  let provider: "twilio" | "logged" = "logged";

  if (business.phone_number) {
    const result = await sendSMS(business.phone_number, content);
    delivered = result.sent;
    provider = result.provider;
  }

  await db
    .update(notifications)
    .set({
      status: delivered ? "Sent" : hasTwilio ? "Failed" : "Logged",
      sent_at: delivered ? new Date() : null,
    })
    .where(eq(notifications.notification_id, row.notification_id));

  return { delivered, provider, notification_id: row.notification_id };
}

/** Delivery receipt text used for both cash and wallet payments. */
export function paymentReceiptContent(vendorNumber: string, amount: number, channel: string) {
  const channelLabel =
    channel === "Cash"
      ? "cash payment"
      : channel === "AirtelMoney"
        ? "Airtel Money payment"
        : channel === "TNMMpamba"
          ? "TNM Mpamba payment"
          : "payment";
  return `Payment received: MWK ${amount} (${channelLabel}) for ${vendorNumber}. Your market fee for today is settled. Thank you. - Blantyre City Council`;
}
