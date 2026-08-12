import { NextResponse } from "next/server";

import { verifyCaptcha } from "@/lib/captcha";
import { isFirebaseAdminReady } from "@/lib/firebase-admin";
import { normalizeIdentifier, sendOtp, type OtpChannel } from "@/lib/otp";

// Sends a signup-verification OTP to an email or phone. Forgot-password OTPs
// go through /api/auth/forgot-password/request instead, since that flow also
// needs to confirm an account actually exists for the identifier.
export async function POST(request: Request) {
  if (!isFirebaseAdminReady()) {
    return NextResponse.json({ error: "OTP sign-up is not configured on the server yet." }, { status: 500 });
  }

  const payload = (await request.json().catch(() => null)) as
    | {
        identifier?: string;
        channel?: OtpChannel;
        captchaToken?: string;
      }
    | null;

  const channel = payload?.channel;

  if (channel !== "email" && channel !== "phone") {
    return NextResponse.json({ error: "Choose email or phone to verify." }, { status: 400 });
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

  const result = await sendOtp({ identifier, channel, purpose: "signup" });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 429 });
  }

  return NextResponse.json({ success: true, identifier });
}
