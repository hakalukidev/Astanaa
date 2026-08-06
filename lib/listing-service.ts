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
  type BoostPaymentMethod,
  type Listing,
  type ListingInput,
} from "@/lib/listings";

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

export async function deleteListing(id: string) {
  if (!db) {
    throw new Error("Listing data is not available.");
  }

  return deleteDoc(doc(db, LISTINGS_COLLECTION, id));
}

export async function markListingStatus(
  id: string,
  status: Listing["status"]
) {
  if (!db) {
    throw new Error("Listing data is not available.");
  }

  return updateDoc(doc(db, LISTINGS_COLLECTION, id), {
    status,
    updatedAt: serverTimestamp(),
  });
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
