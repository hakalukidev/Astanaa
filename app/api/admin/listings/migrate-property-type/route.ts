import { NextRequest, NextResponse } from "next/server";

import { getCurrentAdmin, isStaffAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

// POST - rewrites every listing's propertyType from the old category label
// to the new one after an admin renames a category. Staff-admin only
// (mirrors updatePropertyTypeCategory's own gate). Postgres handles this as
// one bulk UPDATE — no 500-row batching needed like the old Firestore path.
export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();

  if (!admin || !isStaffAdmin(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | { previousEn?: string; nextEn?: string }
    | null;

  if (!body?.previousEn || !body?.nextEn || body.previousEn === body.nextEn) {
    return NextResponse.json({ success: true, updated: 0 });
  }

  const result = await db.listing.updateMany({
    where: { propertyType: body.previousEn },
    data: { propertyType: body.nextEn },
  });

  return NextResponse.json({ success: true, updated: result.count });
}
