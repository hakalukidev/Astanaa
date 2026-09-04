import "server-only";

import { db } from "@/lib/db";
import { mapListingRow } from "@/lib/listing-mappers";
import type { Listing } from "@/lib/listings";

/** Used by the homepage/listings catalog (via lib/listing-cache.ts). */
export async function getAllListings(): Promise<Listing[]> {
  const rows = await db.listing.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });

  return rows.map(mapListingRow);
}

/**
 * Server Component listing-detail/edit read. Unlike the old Firestore-rules
 * world (which needed a separate Admin-SDK bypass for non-active listings
 * read anonymously), a direct Prisma query has no built-in row-level
 * security to work around — the page itself decides what to show once it
 * knows the signed-in viewer, so this can just always return the row.
 */
export async function getListingById(id: string): Promise<Listing | null> {
  const row = await db.listing.findUnique({ where: { id } });
  return row ? mapListingRow(row) : null;
}
