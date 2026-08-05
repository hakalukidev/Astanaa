import { NextResponse } from "next/server";

import {
  areAdminCredentialsConfigured,
  setAdminSession,
  validateAdminLogin,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!areAdminCredentialsConfigured()) {
    return NextResponse.json(
      { message: "Admin credentials are missing in .env.local." },
      { status: 500 }
    );
  }

  const payload = (await request.json().catch(() => null)) as
    | { username?: string; password?: string }
    | null;

  const username = payload?.username ?? "";
  const password = payload?.password ?? "";

  if (!validateAdminLogin(username, password)) {
    return NextResponse.json(
      { message: "Invalid username or password." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ success: true });

  return setAdminSession(response);
}
