import "server-only";

/**
 * Sends an email via Resend's HTTP API (no SDK dependency needed — it's one
 * POST request). Sign up at resend.com, verify a sending domain (or use
 * their onboarding@resend.dev sandbox while testing), and put the API key in
 * RESEND_API_KEY.
 *
 * If no RESEND_API_KEY is configured, the email is logged to the server
 * console instead of being sent — lets you build/test the OTP flow before
 * you have an account.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || "Astanaa.com <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn(`[mailer] RESEND_API_KEY not set — logging instead of sending. To ${to}: ${subject}\n${html}`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Resend responded with ${response.status}: ${body}`);
  }
}

export function otpEmailHtml(code: string) {
  return `
    <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto;">
      <h2 style="color: #16a34a;">Astanaa.com</h2>
      <p>Your verification code is:</p>
      <p style="font-size: 32px; font-weight: 700; letter-spacing: 6px;">${code}</p>
      <p style="color: #6b7280; font-size: 14px;">This code expires in 5 minutes. If you didn't request it, you can ignore this email.</p>
    </div>
  `;
}
