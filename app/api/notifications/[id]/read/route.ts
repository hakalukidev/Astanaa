import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

type RouteContext = { params: { id: string } };

export async function PATCH(_request: Request, { params }: RouteContext) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // updateMany (not update) so a mismatched userId silently affects zero
  // rows instead of leaking a 404-vs-403 signal about someone else's data.
  await db.notification.updateMany({
    where: { id: params.id, userId: user.id },
    data: { read: true },
  });

  return NextResponse.json({ success: true });
}
