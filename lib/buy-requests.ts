import type { DocumentData, QueryDocumentSnapshot, Timestamp } from "firebase/firestore";
import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export const BUY_REQUESTS_COLLECTION = "buyRequests";

export type BuyRequestStatus = "pending" | "accepted" | "declined";

export type BuyRequest = {
  id: string;
  listingId: string;
  listingTitle: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  sellerId: string;
  status: BuyRequestStatus;
  createdAtMs: number | null;
};

function getTimestampMs(value: unknown) {
  if (!value) return null;
  if (typeof value === "object" && value !== null && "toMillis" in value) {
    return (value as Timestamp).toMillis();
  }
  return typeof value === "number" ? value : null;
}

function mapBuyRequest(
  snapshot: QueryDocumentSnapshot<DocumentData>
): BuyRequest {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    listingId: typeof data.listingId === "string" ? data.listingId : "",
    listingTitle: typeof data.listingTitle === "string" ? data.listingTitle : "",
    buyerId: typeof data.buyerId === "string" ? data.buyerId : "",
    buyerName: typeof data.buyerName === "string" ? data.buyerName : "",
    buyerPhone: typeof data.buyerPhone === "string" ? data.buyerPhone : "",
    sellerId: typeof data.sellerId === "string" ? data.sellerId : "",
    status:
      data.status === "accepted" || data.status === "declined"
        ? data.status
        : "pending",
    createdAtMs: getTimestampMs(data.createdAt),
  };
}

export async function createBuyRequest(input: {
  listingId: string;
  listingTitle: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  sellerId: string;
}) {
  if (!db) {
    throw new Error("Buy requests are not available.");
  }

  // Avoid duplicate "buy" requests from the same buyer for the same listing.
  const existingQuery = query(
    collection(db, BUY_REQUESTS_COLLECTION),
    where("listingId", "==", input.listingId),
    where("buyerId", "==", input.buyerId)
  );
  const existing = await getDocs(existingQuery);

  if (!existing.empty) {
    return mapBuyRequest(existing.docs[0]);
  }

  const docRef = await addDoc(collection(db, BUY_REQUESTS_COLLECTION), {
    ...input,
    status: "pending",
    createdAt: serverTimestamp(),
  });

  return { ...input, id: docRef.id, status: "pending" as const, createdAtMs: Date.now() };
}

export function subscribeToSellerBuyRequests(
  sellerId: string,
  onChange: (requests: BuyRequest[]) => void
) {
  if (!db) {
    onChange([]);
    return () => {};
  }

  const requestsQuery = query(
    collection(db, BUY_REQUESTS_COLLECTION),
    where("sellerId", "==", sellerId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(requestsQuery, (snapshot) => {
    onChange(snapshot.docs.map(mapBuyRequest));
  });
}
