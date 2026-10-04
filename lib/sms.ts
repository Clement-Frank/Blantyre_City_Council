// SMS helper. Uses Twilio when TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN /
// TWILIO_PHONE_NUMBER are configured. Without keys, sends are "logged"
// (stored as notifications) so the system still works end-to-end.
//
// To enable real SMS: install the twilio package (`bun add twilio`) and set
// the three TWILIO_* env vars.

export async function sendSMS(to: string, body: string): Promise<{ sent: boolean; provider: "twilio" | "logged"; error?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    console.log(`[SMS:logged] to=${to} body=${body}`);
    return { sent: false, provider: "logged" };
  }

  try {
    const twilio = await import("twilio");
    const client = twilio.default(sid, token);
    await client.messages.create({
      body,
      from,
      to: to.startsWith("+") ? to : `+265${to.replace(/^0/, "")}`,
    });
    return { sent: true, provider: "twilio" };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown SMS error";
    console.error("SMS error:", msg);
    return { sent: false, provider: "twilio", error: msg };
  }
}
