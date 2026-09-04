import { NextResponse } from "next/server";

import { clearSessionCookie, destroySession, getSessionToken } from "@/lib/auth/session";

export async function POST() {
  const token = getSessionToken();

  if (token) {
    await destroySession(token);
  }

  return clearSessionCookie(NextResponse.json({ success: true }));
}
