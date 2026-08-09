import type { DocumentData, QueryDocumentSnapshot, Timestamp } from "firebase/firestore";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { BD_LOCATIONS } from "@/lib/bd-locations";

export const LOCATION_NODES_COLLECTION = "locationNodes";

/**
 * One node in an unlimited-depth location tree: Division -> District ->
 * Upazila -> Area -> (anything an admin wants — Road, Goli, whatever) -> ...
 * There's no "level" field on purpose — a node is just "a child of some
 * parent" (or top-level, parentId null), so admins can keep nesting as deep
 * as they like without the app needing to know what to call that depth.
 */
export type LocationNode = {
  id: string;
  parentId: string | null;
  en: string;
  bn: string;
  order: number;
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

function mapNode(snapshot: QueryDocumentSnapshot<DocumentData>): LocationNode {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    parentId: typeof data.parentId === "string" ? data.parentId : null,
    en: typeof data.en === "string" ? data.en : "",
    bn: typeof data.bn === "string" ? data.bn : "",
    order: typeof data.order === "number" ? data.order : 0,
    createdAtMs: getTimestampMs(data.createdAt),
  };
}

export function childrenOf(nodes: LocationNode[], parentId: string | null): LocationNode[] {
  return nodes
    .filter((node) => node.parentId === parentId)
    .sort((left, right) => left.order - right.order || left.en.localeCompare(right.en));
}

/**
 * Public — the post-ad location picker needs the full tree. Falls back to an
 * empty list on any read failure (rules not deployed yet, offline, etc.) so
 * the UI shows "no locations yet" instead of spinning forever.
 */
export function subscribeToLocationNodes(callback: (nodes: LocationNode[]) => void) {
  if (!db) {
    callback([]);
    return () => {};
  }

  return onSnapshot(
    collection(db, LOCATION_NODES_COLLECTION),
    (snapshot) => callback(snapshot.docs.map(mapNode)),
    () => callback([])
  );
}

/** Staff-admin only (enforced by firestore.rules). Appends as the last child of parentId. */
export async function addLocationNode(input: { parentId: string | null; en: string; bn: string }) {
  if (!db) {
    throw new Error("Location data is not available.");
  }

  // Only the siblings under this exact parent, not the whole (possibly 500+ node) tree.
  const siblings = await getDocs(
    query(collection(db, LOCATION_NODES_COLLECTION), where("parentId", "==", input.parentId))
  );
  const maxOrder = siblings.docs.reduce((max, docSnapshot) => {
    const order = docSnapshot.data().order;
    return Math.max(max, typeof order === "number" ? order : 0);
  }, -1);

  const newDocRef = doc(collection(db, LOCATION_NODES_COLLECTION));
  const batch = writeBatch(db);
  batch.set(newDocRef, {
    parentId: input.parentId,
    en: input.en,
    bn: input.bn,
    order: maxOrder + 1,
    createdAt: serverTimestamp(),
  });
  await batch.commit();

  return newDocRef.id;
}

/** Staff-admin only (enforced by firestore.rules). */
export async function updateLocationNode(id: string, input: { en: string; bn: string }) {
  if (!db) {
    throw new Error("Location data is not available.");
  }

  await updateDoc(doc(db, LOCATION_NODES_COLLECTION, id), { ...input });
}

/** Staff-admin only (enforced by firestore.rules). Caller is responsible for blocking deletes with children. */
export async function deleteLocationNode(id: string) {
  if (!db) {
    throw new Error("Location data is not available.");
  }

  await deleteDoc(doc(db, LOCATION_NODES_COLLECTION, id));
}

/**
 * One-time bulk import of the built-in Division -> District -> Upazila data
 * (lib/bd-locations.ts) into Firestore as editable tree nodes, called
 * automatically the first time an admin opens the Locations admin page and
 * finds the collection empty. Firestore batches cap at 500 writes, so this
 * chunks into multiple batches (~570 nodes for all of Bangladesh).
 */
export async function seedBuiltInLocations() {
  if (!db) {
    throw new Error("Location data is not available.");
  }

  const database = db;
  const ops: { id: string; parentId: string | null; en: string; bn: string; order: number }[] = [];

  BD_LOCATIONS.forEach((division, divisionIndex) => {
    const divisionId = doc(collection(database, LOCATION_NODES_COLLECTION)).id;
    ops.push({ id: divisionId, parentId: null, en: division.en, bn: division.bn, order: divisionIndex });

    division.districts.forEach((district, districtIndex) => {
      const districtId = doc(collection(database, LOCATION_NODES_COLLECTION)).id;
      ops.push({
        id: districtId,
        parentId: divisionId,
        en: district.en,
        bn: district.bn,
        order: districtIndex,
      });

      district.upazilas.forEach((upazila, upazilaIndex) => {
        const upazilaId = doc(collection(database, LOCATION_NODES_COLLECTION)).id;
        ops.push({
          id: upazilaId,
          parentId: districtId,
          en: upazila.en,
          bn: upazila.bn,
          order: upazilaIndex,
        });
      });
    });
  });

  const CHUNK_SIZE = 450;
  for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
    const batch = writeBatch(database);
    for (const op of ops.slice(i, i + CHUNK_SIZE)) {
      batch.set(doc(database, LOCATION_NODES_COLLECTION, op.id), {
        parentId: op.parentId,
        en: op.en,
        bn: op.bn,
        order: op.order,
        createdAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }
}
