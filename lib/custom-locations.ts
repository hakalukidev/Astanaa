import type { DocumentData, QueryDocumentSnapshot, Timestamp } from "firebase/firestore";
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp } from "firebase/firestore";

import { db } from "@/lib/firebase";

export const LOCATION_ENTRIES_COLLECTION = "locationEntries";

export type LocationLevel = "division" | "district" | "upazila" | "area";

export type CustomLocationEntry = {
  id: string;
  level: LocationLevel;
  /**
   * Joins the EN names of every ancestor with "/", e.g. "" for a division,
   * "Sylhet" for a district under Sylhet, "Sylhet/Moulvibazar" for an
   * upazila, "Sylhet/Moulvibazar/Kulaura" for an area/para-mohalla.
   */
  parentPath: string;
  en: string;
  bn: string;
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

function mapEntry(snapshot: QueryDocumentSnapshot<DocumentData>): CustomLocationEntry {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    level: (["division", "district", "upazila", "area"] as const).includes(data.level)
      ? data.level
      : "area",
    parentPath: typeof data.parentPath === "string" ? data.parentPath : "",
    en: typeof data.en === "string" ? data.en : "",
    bn: typeof data.bn === "string" ? data.bn : "",
    createdAtMs: getTimestampMs(data.createdAt),
  };
}

/**
 * Public — every visitor picking a location (post-ad form) needs to see
 * admin-added divisions/districts/upazilas/areas alongside the built-in
 * BD_LOCATIONS list. Small dataset, so a plain unfiltered subscription is
 * simplest (no composite index needed).
 */
export function subscribeToCustomLocations(callback: (entries: CustomLocationEntry[]) => void) {
  if (!db) {
    callback([]);
    return () => {};
  }

  return onSnapshot(collection(db, LOCATION_ENTRIES_COLLECTION), (snapshot) => {
    callback(snapshot.docs.map(mapEntry));
  });
}

/** Staff-admin only (enforced by firestore.rules). */
export async function addCustomLocationEntry(input: {
  level: LocationLevel;
  parentPath: string;
  en: string;
  bn: string;
}) {
  if (!db) {
    throw new Error("Location data is not available.");
  }

  await addDoc(collection(db, LOCATION_ENTRIES_COLLECTION), {
    ...input,
    createdAt: serverTimestamp(),
  });
}

/** Staff-admin only (enforced by firestore.rules). */
export async function deleteCustomLocationEntry(id: string) {
  if (!db) {
    throw new Error("Location data is not available.");
  }

  await deleteDoc(doc(db, LOCATION_ENTRIES_COLLECTION, id));
}
