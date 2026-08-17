import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
  LISTINGS_COLLECTION,
  mapListingSnapshot,
  mapModerationLogSnapshot,
  MODERATION_LOG_COLLECTION,
  type BoostPaymentMethod,
  type Listing,
  type ListingInput,
  type ModerationLogEntry,
} from "@/lib/listings";
import { createListingStatusNotification } from "@/lib/notifications";

function getListingsCollection() {
  if (!db) {
    throw new Error("Listing data is not available.");
  }

  return collection(db, LISTINGS_COLLECTION);
}

export async function getAllListings(): Promise<Listing[]> {
  if (!db) {
    return [];
  }

  const listingsQuery = query(
    collection(db, LISTINGS_COLLECTION),
    where("status", "==", "active"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(listingsQuery);

  return snapshot.docs
    .map((docSnapshot) => mapListingSnapshot(docSnapshot))
    .filter((listing): listing is Listing => Boolean(listing));
}

export async function getListingById(id: string): Promise<Listing | null> {
  if (!db) {
    return null;
  }

  const snapshot = await getDoc(doc(db, LISTINGS_COLLECTION, id));

  if (!snapshot.exists()) {
    return null;
  }

  return mapListingSnapshot(snapshot);
}

export async function getListingsBySeller(sellerId: string): Promise<Listing[]> {
  if (!db) {
    return [];
  }

  const listingsQuery = query(
    collection(db, LISTINGS_COLLECTION),
    where("sellerId", "==", sellerId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(listingsQuery);

  return snapshot.docs
    .map((docSnapshot) => mapListingSnapshot(docSnapshot))
    .filter((listing): listing is Listing => Boolean(listing));
}

/** Used by the moderation queue — fetches listings in a given status, newest first. */
export function subscribeToListingsByStatus(
  status: Listing["status"],
  onChange: (listings: Listing[]) => void
) {
  if (!db) {
    onChange([]);
    return () => {};
  }

  const listingsQuery = query(
    collection(db, LISTINGS_COLLECTION),
    where("status", "==", status),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(listingsQuery, (snapshot) => {
    onChange(
      snapshot.docs
        .map((docSnapshot) => mapListingSnapshot(docSnapshot))
        .filter((listing): listing is Listing => Boolean(listing))
    );
  });
}

/**
 * Used by the "All Posts" admin page — every listing regardless of status,
 * newest first. Firestore security rules restrict this to staff/moderator
 * accounts (see canModerateListings() in firestore.rules); everyone else's
 * read is scoped to active listings + their own.
 */
export function subscribeToAllListingsForAdmin(
  onChange: (listings: Listing[]) => void
) {
  if (!db) {
    onChange([]);
    return () => {};
  }

  const listingsQuery = query(
    collection(db, LISTINGS_COLLECTION),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(listingsQuery, (snapshot) => {
    onChange(
      snapshot.docs
        .map((docSnapshot) => mapListingSnapshot(docSnapshot))
        .filter((listing): listing is Listing => Boolean(listing))
    );
  });
}

export function subscribeToActiveListings(
  onChange: (listings: Listing[]) => void
) {
  if (!db) {
    onChange([]);
    return () => {};
  }

  const listingsQuery = query(
    collection(db, LISTINGS_COLLECTION),
    where("status", "==", "active"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(listingsQuery, (snapshot) => {
    onChange(
      snapshot.docs
        .map((docSnapshot) => mapListingSnapshot(docSnapshot))
        .filter((listing): listing is Listing => Boolean(listing))
    );
  });
}

export async function createListing(input: ListingInput) {
  const listingsCollection = getListingsCollection();

  return addDoc(listingsCollection, {
    ...input,
    // Every new listing (client or promoter) waits for moderator/admin
    // approval before it's publicly visible.
    status: "pending",
    boost: {
      status: "none",
      method: null,
      transactionId: null,
      requestedAtMs: null,
      expiresAtMs: null,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateListing(id: string, input: Partial<ListingInput>) {
  if (!db) {
    throw new Error("Listing data is not available.");
  }

  return updateDoc(doc(db, LISTINGS_COLLECTION, id), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Permanently deletes a listing. When called with `moderator` (removal from
 * the moderation queue or admin posts page, as opposed to the owner deleting
 * their own listing), it also writes a moderationLog entry first — the
 * listing doc is about to disappear, so that's the only place left to record
 * who removed it and when. Powers the "removed" count on the Moderators
 * admin report.
 */
export async function deleteListing(
  listing: Pick<Listing, "id" | "sellerId" | "sellerName" | "title">,
  moderator?: { uid: string; name: string }
) {
  if (!db) {
    throw new Error("Listing data is not available.");
  }

  await deleteDoc(doc(db, LISTINGS_COLLECTION, listing.id));

  if (moderator) {
    // Best-effort — a failed log write shouldn't undo the deletion, which
    // already succeeded above.
    await addDoc(collection(db, MODERATION_LOG_COLLECTION), {
      listingId: listing.id,
      listingTitle: listing.title,
      sellerId: listing.sellerId,
      sellerName: listing.sellerName,
      moderatorUid: moderator.uid,
      moderatorName: moderator.name,
      createdAt: serverTimestamp(),
    }).catch(() => {});
  }
}

/** Used by the Moderators admin report — every removal a moderator logged, newest first. */
export function subscribeToModerationLog(
  onChange: (entries: ModerationLogEntry[]) => void
) {
  if (!db) {
    onChange([]);
    return () => {};
  }

  const logQuery = query(
    collection(db, MODERATION_LOG_COLLECTION),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(logQuery, (snapshot) => {
    onChange(
      snapshot.docs
        .map((docSnapshot) => mapModerationLogSnapshot(docSnapshot))
        .filter((entry): entry is ModerationLogEntry => Boolean(entry))
    );
  });
}

/**
 * Sets a listing's status. When called with `moderator` (approve/reject from
 * the moderation queue or admin posts page), it also records who did it and
 * when — powers the "who approved what, how fast" admin report — and notifies
 * the seller that their listing was approved/rejected.
 */
export async function markListingStatus(
  listing: Pick<Listing, "id" | "sellerId" | "title">,
  status: Listing["status"],
  moderator?: { uid: string; name: string }
) {
  if (!db) {
    throw new Error("Listing data is not available.");
  }

  const updates: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };

  const isModeratedDecision = moderator && (status === "active" || status === "rejected");

  if (isModeratedDecision) {
    updates.moderatedBy = moderator.uid;
    updates.moderatedByName = moderator.name;
    updates.moderatedAt = serverTimestamp();
  }

  await updateDoc(doc(db, LISTINGS_COLLECTION, listing.id), updates);

  if (isModeratedDecision) {
    // Best-effort — a failed notification shouldn't undo the moderation action.
    await createListingStatusNotification({
      userId: listing.sellerId,
      listingId: listing.id,
      listingTitle: listing.title,
      type: status === "active" ? "listing_approved" : "listing_rejected",
    }).catch(() => {});
  }
}

/**
 * Submits a boost request for a listing. This only records intent + the
 * chosen payment method (bKash / Nagad / Card) — no live payment gateway is
 * wired up yet, so the boost stays "pending" until it's verified and
 * activated manually (planned as part of the admin workflow).
 */
export async function requestListingBoost(
  id: string,
  method: BoostPaymentMethod,
  transactionId: string | null
) {
  if (!db) {
    throw new Error("Listing data is not available.");
  }

  return updateDoc(doc(db, LISTINGS_COLLECTION, id), {
    boost: {
      status: "pending",
      method,
      transactionId,
      requestedAtMs: Date.now(),
      expiresAtMs: null,
    },
    updatedAt: serverTimestamp(),
  });
}
