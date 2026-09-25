import { NextRequest, NextResponse } from "next/server";

import { canModerateListings, getCurrentAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { mapListingRow, STATUS_TO_DB } from "@/lib/listing-mappers";
import type { ListingStatus } from "@/lib/listings";

// GET - moderator+ feed of listings, optionally filtered by ?status=.
// Powers the moderation queue and every "all posts" style admin page
// (subscribeToListingsByStatus / subscribeToAllListingsForAdmin), now
// polled instead of a live Firestore listener.
export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canModerateListings(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const statusParam = request.nextUrl.searchParams.get("status") as ListingStatus | null;

  const rows = await db.listing.findMany({
    where: statusParam ? { status: STATUS_TO_DB[statusParam] } : undefined,
    orderBy: { createdAt: "desc" },
    include: { seller: { select: { email: true } } },
  });

  // Staff-only: the seller's account email, so admins can search posts by it.
  // Kept out of the public listing APIs.
  return NextResponse.json({
    listings: rows.map((row) => ({
      ...mapListingRow(row),
      sellerAccountEmail: row.seller.email ?? "",
    })),
  });
}
