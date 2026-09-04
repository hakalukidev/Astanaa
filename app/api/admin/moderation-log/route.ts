import { NextResponse } from "next/server";

import { canModerateListings, getCurrentAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export async function GET() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canModerateListings(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db.moderationLog.findMany({ orderBy: { createdAt: "desc" } });

  return NextResponse.json({
    entries: rows.map((row) => ({
      id: row.id,
      listingId: row.listingId,
      listingTitle: row.listingTitle,
      sellerId: row.sellerId,
      sellerName: row.sellerName,
      moderatorUid: row.moderatorUid,
      moderatorName: row.moderatorName,
      createdAtMs: row.createdAt.getTime(),
    })),
  });
}
