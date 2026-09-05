import { NextResponse } from "next/server";

import { verifyCaptcha } from "@/lib/captcha";
import { db } from "@/lib/db";
import { normalizeIdentifier, sendOtp, type OtpChannel } from "@/lib/otp";

// Sends a password-reset OTP, but only if an account for that identifier
// actually exists. Always returns a generic success message either way so
// the response can't be used to probe which emails/phones are registered.
export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | {
        identifier?: string;
        channel?: OtpChannel;
        captchaToken?: string;
      }
    | null;

  const channel = payload?.channel;

  if (channel !== "email" && channel !== "phone") {
    return NextResponse.json({ error: "Choose email or phone." }, { status: 400 });
  }

  const captchaResult = await verifyCaptcha(
    payload?.captchaToken,
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  );

  if (!captchaResult.ok) {
    return NextResponse.json({ error: captchaResult.error }, { status: 400 });
  }

  const identifier = normalizeIdentifier(channel, payload?.identifier ?? "");

  if (!identifier) {
    return NextResponse.json(
      { error: channel === "email" ? "Enter a valid email address." : "Enter a valid BD mobile number." },
      { status: 400 }
    );
  }

  const account =
    channel === "email"
      ? await db.user.findUnique({ where: { email: identifier } })
      : await db.user.findUnique({ where: { phone: identifier } });

  if (account) {
    const result = await sendOtp({ identifier, channel, purpose: "reset" });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 429 });
    }
  }

  return NextResponse.json({
    success: true,
    message:
      channel === "email"
        ? "If that email is registered, a code has been sent to it."
        : "If that number is registered, a code has been sent to it.",
  });
}
