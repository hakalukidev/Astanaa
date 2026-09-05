import { NextRequest, NextResponse } from "next/server";

import { getCurrentAdmin, isStaffAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

type RouteContext = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const admin = await getCurrentAdmin();

  if (!admin || !isStaffAdmin(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const input = (await request.json().catch(() => null)) as { en?: string; bn?: string } | null;

  if (!input?.en || !input?.bn) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  await db.locationNode.update({ where: { id: params.id }, data: { en: input.en, bn: input.bn } });

  return NextResponse.json({ success: true });
}

// DELETE - staff-admin only. The Postgres FK is ON DELETE CASCADE, so
// deleting a node also deletes its whole subtree — the admin UI is
// responsible for confirming that with the user before calling this.
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const admin = await getCurrentAdmin();

  if (!admin || !isStaffAdmin(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.locationNode.delete({ where: { id: params.id } }).catch(() => {});

  return NextResponse.json({ success: true });
}
