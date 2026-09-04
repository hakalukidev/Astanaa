import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ user: null, adminRole: null });
  }

  return NextResponse.json({
    user: { uid: user.id, name: user.name, phone: user.phone, email: user.email },
    adminRole: user.role ? user.role.toLowerCase() : null,
  });
}
