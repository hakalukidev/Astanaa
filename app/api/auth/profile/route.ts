import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function PATCH(request: Request) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as
    | { name?: string; phone?: string; email?: string }
    | null;

  const name = payload?.name?.trim();
  const phone = payload?.phone?.trim();
  const email = payload?.email?.trim().toLowerCase();

  if (!name || !phone || !email) {
    return NextResponse.json({ code: "auth/invalid-email" }, { status: 400 });
  }

  if (email !== sessionUser.email) {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ code: "auth/email-already-in-use" }, { status: 409 });
    }
  }

  if (phone !== sessionUser.phone) {
    const existing = await db.user.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json({ code: "auth/phone-already-in-use" }, { status: 409 });
    }
  }

  const user = await db.user.update({
    where: { id: sessionUser.id },
    data: { name, phone, email },
  });

  return NextResponse.json({
    user: { uid: user.id, name: user.name, phone: user.phone, email: user.email },
  });
}
