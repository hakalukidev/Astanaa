import { NextResponse } from "next/server";

import { getAdminAuth, getAdminDb, isFirebaseAdminReady } from "@/lib/firebase-admin";
import { normalizeIdentifier, verifyOtp, type OtpChannel } from "@/lib/otp";

const USERS_COLLECTION = "users";

export async function POST(request: Request) {
  if (!isFirebaseAdminReady()) {
    return NextResponse.json({ error: "Password reset is not configured on the server yet." }, { status: 500 });
  }

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

  try {
    const adminAuth = getAdminAuth();
    let uid: string;

    if (channel === "email") {
      uid = (await adminAuth.getUserByEmail(identifier)).uid;
    } else {
      const snapshot = await getAdminDb()
        .collection(USERS_COLLECTION)
        .where("phone", "==", identifier)
        .limit(1)
        .get();

      if (snapshot.empty) {
        throw new Error("No account for this phone number.");
      }

      uid = snapshot.docs[0].id;
    }

    await adminAuth.updateUser(uid, { password: newPassword });
  } catch (error) {
    console.error("[forgot-password/confirm] failed to update password:", error);
    return NextResponse.json({ error: "Could not reset your password. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
