import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

function mapNotification(row: {
  id: string;
  userId: string;
  type: "LISTING_APPROVED" | "LISTING_REJECTED";
  listingId: string | null;
  listingTitle: string;
  read: boolean;
  createdAt: Date;
}) {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type === "LISTING_REJECTED" ? "listing_rejected" : "listing_approved",
    listingId: row.listingId ?? "",
    listingTitle: row.listingTitle,
    read: row.read,
    createdAtMs: row.createdAt.getTime(),
  };
}

// GET - the signed-in user's own notifications, newest first, capped at 50
// (matches the old Firestore query's limit).
export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ notifications: [] });
  }

  const rows = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ notifications: rows.map(mapNotification) });
}
