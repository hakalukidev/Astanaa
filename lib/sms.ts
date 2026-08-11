import "server-only";

/**
 * Sends an SMS via a BD SMS gateway. Defaults to BulkSMSBD's plain HTTP API
 * (bulksmsbd.net) — sign up there, recharge, and put the API key in
 * SMS_API_KEY. Switching providers (SSL Wireless, Alpha SMS, ...) usually
 * just means changing SMS_API_URL and the query params below to match that
 * provider's docs.
 *
 * If no SMS_API_KEY is configured, the message is logged to the server
 * console instead of being sent — lets you build/test the OTP flow before
 * you have a gateway account.
 */
export async function sendSms(phone: string, message: string): Promise<void> {
  const apiKey = process.env.SMS_API_KEY?.trim();
  const senderId = process.env.SMS_SENDER_ID?.trim();
  const apiUrl = process.env.SMS_API_URL?.trim() || "http://bulksmsbd.net/api/smsapi";

  if (!apiKey) {
    console.warn(`[sms] SMS_API_KEY not set — logging instead of sending. To ${phone}: ${message}`);
    return;
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    type: "text",
    number: phone,
    senderid: senderId ?? "",
    message,
  });

  const response = await fetch(`${apiUrl}?${params.toString()}`, { method: "GET" });

  if (!response.ok) {
    throw new Error(`SMS gateway responded with ${response.status}`);
  }

  const body = await response.text().catch(() => "");
  // BulkSMSBD returns a numeric response_code as plain text/JSON; "202" means
  // submitted. Non-2xx codes indicate a failure (bad number, low balance...).
  if (body && /"?response_code"?\s*[:=]\s*(\d+)/.test(body)) {
    const code = body.match(/"?response_code"?\s*[:=]\s*(\d+)/)?.[1];

    if (code && code !== "202") {
      throw new Error(`SMS gateway rejected the message (code ${code}).`);
    }
  }
}

/** Normalizes a BD mobile number to the 01XXXXXXXXX form used as the OTP identifier. */
export function normalizeBdPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  const local = digits.startsWith("880")
    ? `0${digits.slice(3)}`
    : digits.startsWith("0")
      ? digits
      : `0${digits}`;

  return /^01[3-9]\d{8}$/.test(local) ? local : null;
}

/** BulkSMSBD (and most BD gateways) want the 880-prefixed form without the leading zero. */
export function toGatewayFormat(localPhone: string): string {
  return `880${localPhone.slice(1)}`;
}
