import { NextResponse } from "next/server";

import { isFirebaseAdminReady } from "@/lib/firebase-admin";
import { normalizeIdentifier, verifyOtp, type OtpChannel } from "@/lib/otp";

export async function POST(request: Request) {
  if (!isFirebaseAdminReady()) {
    return NextResponse.json({ error: "OTP sign-up is not configured on the server yet." }, { status: 500 });
  }

  const payload = (await request.json().catch(() => null)) as
    | { identifier?: string; channel?: OtpChannel; code?: string }
    | null;

  const channel = payload?.channel;

  if (channel !== "email" && channel !== "phone") {
    return NextResponse.json({ error: "Choose email or phone to verify." }, { status: 400 });
  }

  const identifier = normalizeIdentifier(channel, payload?.identifier ?? "");
  const code = payload?.code?.trim();

  if (!identifier || !code) {
    return NextResponse.json({ error: "Missing identifier or code." }, { status: 400 });
  }

  const result = await verifyOtp({ identifier, purpose: "signup", code });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, verifiedToken: result.verifiedToken });
}
