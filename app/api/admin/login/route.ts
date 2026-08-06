import { NextResponse } from "next/server";

import { createAdminSessionCookie, setAdminSession } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { idToken?: string } | null;
  const idToken = payload?.idToken;

  if (!idToken) {
    return NextResponse.json({ message: "Missing sign-in token." }, { status: 400 });
  }

  const result = await createAdminSessionCookie(idToken);

  if ("error" in result) {
    return NextResponse.json({ message: result.error }, { status: result.status });
  }

  const response = NextResponse.json({ success: true, role: result.session.role });

  return setAdminSession(response, result.sessionCookie);
}
