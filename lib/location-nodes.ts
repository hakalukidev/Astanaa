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
  /** Set the first time an admin manually reorders this node's sibling group
   * (see reorderLocationSiblings). Once any sibling in a group has this,
   * childrenOf sorts that whole group by `order` instead of alphabetically —
   * so a group stays auto-alphabetical until an admin deliberately takes
   * over, and from then on stays exactly where they put it. */
  manualOrder: boolean;
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
    manualOrder: data.manualOrder === true,
    createdAtMs: getTimestampMs(data.createdAt),
  };
}

/**
 * Default (no admin override yet): a division's own headquarters district
 * (and similarly a district's own "Sadar" upazila) is often literally named
 * after its parent — e.g. the Barishal division contains a Barishal
 * district. That one is pinned first; everything else sorts alphabetically
 * (dictionary order) by English name, regardless of the order nodes were
 * added in.
 *
 * Once an admin manually reorders anything in a sibling group (see
 * reorderLocationSiblings), that whole group switches to sorting strictly by
 * `order` instead — admin's explicit choice always wins over the automatic
 * alphabetical/pinned default.
 */
export function childrenOf(nodes: LocationNode[], parentId: string | null): LocationNode[] {
  const siblings = nodes.filter((node) => node.parentId === parentId);

  if (siblings.some((node) => node.manualOrder)) {
    return [...siblings].sort((left, right) => left.order - right.order || left.en.localeCompare(right.en));
  }

  const parentName = parentId ? nodes.find((node) => node.id === parentId)?.en : undefined;

  return siblings.sort((left, right) => {
    const leftPinned = parentName !== undefined && left.en === parentName;
    const rightPinned = parentName !== undefined && right.en === parentName;
    if (leftPinned !== rightPinned) {
      return leftPinned ? -1 : 1;
    }
    return left.en.localeCompare(right.en);
  });
}

/** Every fallback node's id starts with this — lets callers tell "seed data" from real Firestore docs. */
const FALLBACK_ID_PREFIX = "seed-";

export function isFallbackNode(node: LocationNode) {
  return node.id.startsWith(FALLBACK_ID_PREFIX);
}

/**
 * Division -> District -> Upazila from the built-in BD_LOCATIONS, flattened
 * into the same LocationNode shape, used whenever Firestore has nothing yet
 * (or a read fails) so the picker is never empty. Every id is prefixed
 * "seed-" so callers (like the admin page) can tell this apart from real,
 * editable Firestore docs and trigger the one-time import instead of trying
 * to edit/delete a node that doesn't actually exist yet.
 */
const FALLBACK_LOCATION_NODES: LocationNode[] = (() => {
  const nodes: LocationNode[] = [];

  BD_LOCATIONS.forEach((division, divisionIndex) => {
    const divisionId = `${FALLBACK_ID_PREFIX}division-${divisionIndex}`;
    nodes.push({
      id: divisionId,
      parentId: null,
      en: division.en,
      bn: division.bn,
      order: divisionIndex,
      manualOrder: false,
      createdAtMs: null,
    });

    division.districts.forEach((district, districtIndex) => {
      const districtId = `${FALLBACK_ID_PREFIX}district-${divisionIndex}-${districtIndex}`;
      nodes.push({
        id: districtId,
        parentId: divisionId,
        en: district.en,
        bn: district.bn,
        order: districtIndex,
        manualOrder: false,
        createdAtMs: null,
      });

      district.upazilas.forEach((upazila, upazilaIndex) => {
        nodes.push({
          id: `${FALLBACK_ID_PREFIX}upazila-${divisionIndex}-${districtIndex}-${upazilaIndex}`,
          parentId: districtId,
          en: upazila.en,
          bn: upazila.bn,
          order: upazilaIndex,
          manualOrder: false,
          createdAtMs: null,
        });
      });
    });
  });

  return nodes;
})();

/**
 * Public — the post-ad location picker needs the full tree. Falls back to
 * the built-in Division/District/Upazila list (see FALLBACK_LOCATION_NODES
 * above) if Firestore has nothing yet or the read fails for any reason
 * (rules not deployed, offline, etc.) — the picker must never come back
 * empty, or posting an ad becomes impossible.
 */
export function subscribeToLocationNodes(callback: (nodes: LocationNode[]) => void) {
  if (!db) {
    callback(FALLBACK_LOCATION_NODES);
    return () => {};
  }

  return onSnapshot(
    collection(db, LOCATION_NODES_COLLECTION),
    (snapshot) => {
      if (snapshot.empty) {
        callback(FALLBACK_LOCATION_NODES);
        return;
      }
      callback(snapshot.docs.map(mapNode));
    },
    () => callback(FALLBACK_LOCATION_NODES)
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
 * Staff-admin only (enforced by firestore.rules). Persists an admin-chosen
 * order for an entire sibling group at once — pass every sibling's id in
 * the order they should now appear in. Marks all of them `manualOrder: true`,
 * so childrenOf switches that group from alphabetical to this exact order
 * from now on (including for any new sibling added later, until an admin
 * repositions it too).
 */
export async function reorderLocationSiblings(orderedIds: string[]) {
  if (!db) {
    throw new Error("Location data is not available.");
  }
  const database = db;

  const batch = writeBatch(database);
  orderedIds.forEach((id, index) => {
    batch.update(doc(database, LOCATION_NODES_COLLECTION, id), { order: index, manualOrder: true });
  });
  await batch.commit();
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
