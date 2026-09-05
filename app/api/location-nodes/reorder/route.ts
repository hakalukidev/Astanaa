import { NextRequest, NextResponse } from "next/server";

import { getCurrentAdmin, isStaffAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

// POST - staff-admin only. Persists an admin-chosen order for one sibling
// group at once — body is every sibling's id in the order they should
// appear, marks them all manualOrder: true.
export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();

  if (!admin || !isStaffAdmin(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const input = (await request.json().catch(() => null)) as { orderedIds?: string[] } | null;

  if (!input?.orderedIds || input.orderedIds.length === 0) {
    return NextResponse.json({ error: "Missing orderedIds." }, { status: 400 });
  }

  await db.$transaction(
    input.orderedIds.map((id, index) =>
      db.locationNode.update({ where: { id }, data: { order: index, manualOrder: true } })
    )
  );

  return NextResponse.json({ success: true });
}
