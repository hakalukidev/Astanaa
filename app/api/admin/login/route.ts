import { NextResponse } from "next/server";

import { createAdminSessionFromCredentials, setAdminSession } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;

  const email = payload?.email?.trim();
  const password = payload?.password;

  if (!email || !password) {
    return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
  }

  const result = await createAdminSessionFromCredentials(email, password);

  if ("error" in result) {
    return NextResponse.json({ message: result.error }, { status: result.status });
  }

  const response = NextResponse.json({ success: true, role: result.session.role });

  return setAdminSession(response, result.token, result.expiresAt);
}
