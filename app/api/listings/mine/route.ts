import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { mapListingRow } from "@/lib/listing-mappers";

// GET - the signed-in user's own listings, any status. Firestore rules used
// to enforce "sellerId == auth.uid" at the DB level — here that's enforced
// by simply always querying with the session's own id, never a client-
// supplied one.
export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db.listing.findMany({
    where: { sellerId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ listings: rows.map(mapListingRow) });
}
