import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth/password";
import { revokeAllUserSessions } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { normalizeIdentifier, verifyOtp, type OtpChannel } from "@/lib/otp";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | { identifier?: string; channel?: OtpChannel; code?: string; newPassword?: string }
    | null;

  const channel = payload?.channel;

  if (channel !== "email" && channel !== "phone") {
    return NextResponse.json({ error: "Choose email or phone." }, { status: 400 });
  }

  const identifier = normalizeIdentifier(channel, payload?.identifier ?? "");
  const code = payload?.code?.trim();
  const newPassword = payload?.newPassword ?? "";

  if (!identifier || !code) {
    return NextResponse.json({ error: "Missing identifier or code." }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Password should be at least 6 characters." }, { status: 400 });
  }

  const otpResult = await verifyOtp({ identifier, purpose: "reset", code });

  if (!otpResult.ok) {
    return NextResponse.json({ error: otpResult.error }, { status: 400 });
  }

  const account =
    channel === "email"
      ? await db.user.findUnique({ where: { email: identifier } })
      : await db.user.findUnique({ where: { phone: identifier } });

  if (!account) {
    return NextResponse.json({ error: "Could not reset your password. Please try again." }, { status: 500 });
  }

  const passwordHash = await hashPassword(newPassword);

  await db.user.update({
    where: { id: account.id },
    data: { passwordHash, legacyScryptHash: null, legacyScryptSalt: null },
  });

  // Force any existing sessions (a device someone else is using, say) to
  // sign in again with the new password.
  await revokeAllUserSessions(account.id);

  return NextResponse.json({ success: true });
}
