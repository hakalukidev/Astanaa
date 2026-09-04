import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth/password";
import { createUserSession, setSessionCookie } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | { name?: string; phone?: string; email?: string; password?: string }
    | null;

  const name = payload?.name?.trim();
  const phone = payload?.phone?.trim();
  const email = payload?.email?.trim().toLowerCase();
  const password = payload?.password;

  if (!name || !phone || !email || !password) {
    return NextResponse.json({ code: "auth/invalid-email" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ code: "auth/weak-password" }, { status: 400 });
  }

  const [emailTaken, phoneTaken] = await Promise.all([
    db.user.findUnique({ where: { email } }),
    db.user.findUnique({ where: { phone } }),
  ]);

  if (emailTaken || phoneTaken) {
    return NextResponse.json({ code: "auth/email-already-in-use" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({ data: { name, phone, email, passwordHash } });

  const { token, expiresAt } = await createUserSession(user.id);
  const response = NextResponse.json({
    user: { uid: user.id, name: user.name, phone: user.phone, email: user.email },
  });

  return setSessionCookie(response, token, expiresAt);
}
