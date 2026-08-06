import { NextResponse } from "next/server";

import { clearAdminSession, getCurrentAdmin } from "@/lib/admin-auth";
import { getAdminAuth, isFirebaseAdminReady } from "@/lib/firebase-admin";

export async function POST() {
  const admin = await getCurrentAdmin();

  if (admin && isFirebaseAdminReady()) {
    // Revoke refresh tokens too, so the session cookie can't be reused even
    // if it hasn't expired yet.
    await getAdminAuth()
      .revokeRefreshTokens(admin.uid)
      .catch(() => undefined);
  }

  const response = NextResponse.json({ success: true });

  return clearAdminSession(response);
}
