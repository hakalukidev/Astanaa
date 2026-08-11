import { NextResponse } from "next/server";

import { verifyCaptcha } from "@/lib/captcha";
import { getAdminAuth, getAdminDb, isFirebaseAdminReady } from "@/lib/firebase-admin";
import { normalizeIdentifier, sendOtp, type OtpChannel } from "@/lib/otp";

const USERS_COLLECTION = "users";

// Sends a password-reset OTP, but only if an account for that identifier
// actually exists. Always returns a generic success message either way so
// the response can't be used to probe which emails/phones are registered.
export async function POST(request: Request) {
  if (!isFirebaseAdminReady()) {
    return NextResponse.json({ error: "Password reset is not configured on the server yet." }, { status: 500 });
  }

  const payload = (await request.json().catch(() => null)) as
    | {
        identifier?: string;
        channel?: OtpChannel;
        captcha?: { code?: string; expiresAt?: number; signature?: string; answer?: string };
      }
    | null;

  const channel = payload?.channel;

  if (channel !== "email" && channel !== "phone") {
    return NextResponse.json({ error: "Choose email or phone." }, { status: 400 });
  }

  const captchaResult = verifyCaptcha(payload?.captcha ?? {});

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

  let accountExists = false;

  try {
    if (channel === "email") {
      await getAdminAuth().getUserByEmail(identifier);
      accountExists = true;
    } else {
      const snapshot = await getAdminDb()
        .collection(USERS_COLLECTION)
        .where("phone", "==", identifier)
        .limit(1)
        .get();
      accountExists = !snapshot.empty;
    }
  } catch {
    accountExists = false;
  }

  if (accountExists) {
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
