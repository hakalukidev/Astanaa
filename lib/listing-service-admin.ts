import "server-only";

import type { DocumentSnapshot } from "firebase/firestore";

import { getAdminDb, isFirebaseAdminReady } from "@/lib/firebase-admin";
import { LISTINGS_COLLECTION, mapListingSnapshot, type Listing } from "@/lib/listings";

/**
 * Server-only counterpart to lib/listing-service.ts's getListingById, for use
 * from Server Components (app/listings/[id]/page.tsx). A Server Component
 * has no Firebase Auth session to attach to the client SDK, so a plain
 * client-SDK read runs as an anonymous request — that's fine for an "active"
 * listing (publicly readable) but firestore.rules denies everything else
 * ("Missing or insufficient permissions"), including a listing a moderator
 * just clicked from the pending queue. The Admin SDK bypasses security rules
 * entirely (trusted server context), so it can always fetch the doc; the
 * page itself is what decides what to show once ListingDetailClient knows
 * the signed-in viewer (owner vs moderator vs stranger).
 *
 * Falls back to null (same as "not found") if the Admin SDK isn't
 * configured, rather than throwing — matches getListingById's `!db` guard.
 */
export async function getListingByIdAdmin(id: string): Promise<Listing | null | undefined> {
  if (!isFirebaseAdminReady()) {
    // undefined = "couldn't even try" (caller should fall back to the
    // client-SDK read), as opposed to null = "tried, doc doesn't exist".
    return undefined;
  }

  const snapshot = await getAdminDb().collection(LISTINGS_COLLECTION).doc(id).get();

  if (!snapshot.exists) {
    return null;
  }

  return mapListingSnapshot(snapshot as unknown as DocumentSnapshot);
}
