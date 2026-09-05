import { NextResponse } from "next/server";

import { verifyUserPassword } from "@/lib/auth/password";
import { createUserSession, setSessionCookie } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;

  const email = payload?.email?.trim().toLowerCase();
  const password = payload?.password;

  if (!email || !password) {
    return NextResponse.json({ code: "auth/invalid-credential" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email } });

  if (!user || (!user.passwordHash && !user.legacyScryptHash)) {
    return NextResponse.json({ code: "auth/invalid-credential" }, { status: 401 });
  }

  const valid = await verifyUserPassword(user, password);

  if (!valid) {
    return NextResponse.json({ code: "auth/invalid-credential" }, { status: 401 });
  }

  const { token, expiresAt } = await createUserSession(user.id);
  const response = NextResponse.json({
    user: { uid: user.id, name: user.name, phone: user.phone, email: user.email },
  });

  return setSessionCookie(response, token, expiresAt);
}
