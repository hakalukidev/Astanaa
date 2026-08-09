import type {
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
} from "firebase/firestore";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export const NOTIFICATIONS_COLLECTION = "notifications";

export type NotificationType = "listing_approved" | "listing_rejected";

export type AppNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  listingId: string;
  listingTitle: string;
  read: boolean;
  createdAtMs: number | null;
};

function getTimestampMs(value: unknown) {
  if (!value) {
    return null;
  }

  if (typeof value === "object" && value !== null && "toMillis" in value) {
    return (value as Timestamp).toMillis();
  }

  return typeof value === "number" ? value : null;
}

function mapNotification(
  snapshot: QueryDocumentSnapshot<DocumentData>
): AppNotification {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    userId: typeof data.userId === "string" ? data.userId : "",
    type: data.type === "listing_rejected" ? "listing_rejected" : "listing_approved",
    listingId: typeof data.listingId === "string" ? data.listingId : "",
    listingTitle: typeof data.listingTitle === "string" ? data.listingTitle : "",
    read: data.read === true,
    createdAtMs: getTimestampMs(data.createdAt),
  };
}

/**
 * Real-time subscription to the signed-in user's own notifications, newest
 * first. Firestore rules restrict this to `userId == request.auth.uid`, so
 * there's no risk of ever seeing someone else's.
 */
export function subscribeToUserNotifications(
  userId: string,
  callback: (notifications: AppNotification[]) => void
) {
  if (!db || !userId) {
    callback([]);
    return () => {};
  }

  const notificationsQuery = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(notificationsQuery, (snapshot) => {
    callback(snapshot.docs.map(mapNotification));
  });
}

/** Moderator+ only (enforced by firestore.rules) — fires when a listing is approved/rejected. */
export async function createListingStatusNotification(input: {
  userId: string;
  listingId: string;
  listingTitle: string;
  type: NotificationType;
}) {
  if (!db || !input.userId) {
    return;
  }

  await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
    userId: input.userId,
    type: input.type,
    listingId: input.listingId,
    listingTitle: input.listingTitle,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function markNotificationRead(id: string) {
  if (!db) {
    return;
  }

  await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, id), { read: true });
}

export async function markAllNotificationsRead(ids: string[]) {
  if (!db || ids.length === 0) {
    return;
  }

  const batch = writeBatch(db);
  for (const id of ids) {
    batch.update(doc(db, NOTIFICATIONS_COLLECTION, id), { read: true });
  }
  await batch.commit();
}
