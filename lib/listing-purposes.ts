import type { DocumentData, QueryDocumentSnapshot, Timestamp } from "firebase/firestore";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { DEFAULT_PROPERTY_TYPE_ICON } from "@/lib/property-type-icons";

export const LISTING_PURPOSES_COLLECTION = "listingPurposes";

/**
 * A top-level "purpose" (For Rent, For Sale, and whatever an admin adds
 * beyond those) that Property Type Categories hang off of. `key` is the
 * stable, machine-readable id stored on every listing (`listing.purpose`)
 * and category (`category.purpose`) — it's generated once from the English
 * name at creation time and never changes, so renaming a purpose's display
 * text later can't orphan listings that already reference it. `en`/`bn`/
 * `icon` are the editable display bits.
 */
export type ListingPurposeRecord = {
  id: string;
  key: string;
  en: string;
  bn: string;
  icon: string;
  order: number;
  createdAtMs: number | null;
};

export type ListingPurposeInput = {
  en: string;
  bn: string;
  icon?: string;
};

/** The site's original two purposes — seeded into Firestore the first time
 * an admin opens the Listing Purposes admin page, and used as a safety-net
 * fallback everywhere else if the collection is ever empty. */
export const DEFAULT_LISTING_PURPOSES: (ListingPurposeInput & { key: string })[] = [
  { key: "rent", en: "For Rent", bn: "ভাড়ার জন্য", icon: "KeyRound" },
  { key: "sale", en: "For Sale", bn: "বিক্রির জন্য", icon: "Tag" },
];

function getTimestampMs(value: unknown) {
  if (!value) {
    return null;
  }
  if (typeof value === "object" && value !== null && "toMillis" in value) {
    return (value as Timestamp).toMillis();
  }
  return typeof value === "number" ? value : null;
}

function mapPurpose(snapshot: QueryDocumentSnapshot<DocumentData>): ListingPurposeRecord {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    key: typeof data.key === "string" && data.key ? data.key : snapshot.id,
    en: typeof data.en === "string" ? data.en : "",
    bn: typeof data.bn === "string" ? data.bn : "",
    icon: typeof data.icon === "string" && data.icon ? data.icon : DEFAULT_PROPERTY_TYPE_ICON,
    order: typeof data.order === "number" ? data.order : 0,
    createdAtMs: getTimestampMs(data.createdAt),
  };
}

function sortPurposes(purposes: ListingPurposeRecord[]) {
  return [...purposes].sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }
    return left.en.localeCompare(right.en);
  });
}

const FALLBACK_PURPOSES: ListingPurposeRecord[] = DEFAULT_LISTING_PURPOSES.map((entry, index) => ({
  id: `default-${index}`,
  order: index,
  createdAtMs: null,
  icon: entry.icon ?? DEFAULT_PROPERTY_TYPE_ICON,
  ...entry,
}));

export function isFallbackPurpose(purpose: ListingPurposeRecord) {
  return purpose.id.startsWith("default-");
}

/** Public — the Browse menu, post-ad form, and listings filter all need this.
 * Falls back to the built-in rent/sale pair if the collection is empty
 * (nobody has opened the admin Listing Purposes page yet) OR if the read
 * fails for any reason — the purpose list must never come back empty, or
 * the Browse menu and post-ad form have nothing to show. */
export function subscribeToListingPurposes(callback: (purposes: ListingPurposeRecord[]) => void) {
  if (!db) {
    callback(FALLBACK_PURPOSES);
    return () => {};
  }

  return onSnapshot(
    collection(db, LISTING_PURPOSES_COLLECTION),
    (snapshot) => {
      if (snapshot.empty) {
        callback(FALLBACK_PURPOSES);
        return;
      }
      callback(sortPurposes(snapshot.docs.map(mapPurpose)));
    },
    () => {
      callback(FALLBACK_PURPOSES);
    }
  );
}

/** Resolves a listing's/category's purpose `key` to its display label, with a
 * sensible fallback chain: the live (possibly admin-edited) purposes list,
 * then the built-in rent/sale defaults (covers the moment before the list
 * has loaded), then the raw key itself so nothing ever renders blank. */
export function getListingPurposeLabel(
  purposes: ListingPurposeRecord[],
  key: string,
  language: "en" | "bn"
): string {
  const match = purposes.find((item) => item.key === key);
  if (match) {
    return language === "bn" ? match.bn : match.en;
  }
  const fallback = DEFAULT_LISTING_PURPOSES.find((item) => item.key === key);
  if (fallback) {
    return language === "bn" ? fallback.bn : fallback.en;
  }
  return key;
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "purpose";
}

/** Staff-admin only (enforced by firestore.rules). Generates a stable `key`
 * from the English name, disambiguated against existing keys so two
 * purposes can never collide (and silently overwrite each other's listings). */
export async function addListingPurpose(input: ListingPurposeInput) {
  if (!db) {
    throw new Error("Purpose data is not available.");
  }

  const existing = await getDocs(collection(db, LISTING_PURPOSES_COLLECTION));
  const existingKeys = new Set(existing.docs.map((docSnapshot) => docSnapshot.data().key));
  const maxOrder = existing.docs.reduce(
    (max, docSnapshot) => Math.max(max, typeof docSnapshot.data().order === "number" ? docSnapshot.data().order : 0),
    -1
  );

  const baseKey = slugify(input.en);
  let key = baseKey;
  let suffix = 2;
  while (existingKeys.has(key)) {
    key = `${baseKey}-${suffix}`;
    suffix += 1;
  }

  await addDoc(collection(db, LISTING_PURPOSES_COLLECTION), {
    key,
    en: input.en,
    bn: input.bn,
    icon: input.icon ?? DEFAULT_PROPERTY_TYPE_ICON,
    order: maxOrder + 1,
    createdAt: serverTimestamp(),
  });
}

/** Staff-admin only. Only the display bits (en/bn/icon) are editable — `key`
 * is set once at creation and left alone so existing listings/categories
 * that reference it keep matching. */
export async function updateListingPurpose(id: string, input: ListingPurposeInput) {
  if (!db) {
    throw new Error("Purpose data is not available.");
  }

  await updateDoc(doc(db, LISTING_PURPOSES_COLLECTION, id), {
    en: input.en,
    bn: input.bn,
    icon: input.icon ?? DEFAULT_PROPERTY_TYPE_ICON,
  });
}

/** Staff-admin only. */
export async function deleteListingPurpose(id: string) {
  if (!db) {
    throw new Error("Purpose data is not available.");
  }

  await deleteDoc(doc(db, LISTING_PURPOSES_COLLECTION, id));
}

/** One-time bulk write of the built-in rent/sale pair, called automatically
 * by the admin Listing Purposes page the first time it finds the collection
 * empty. After this, Firestore is the sole source of truth. */
export async function seedDefaultListingPurposes() {
  if (!db) {
    throw new Error("Purpose data is not available.");
  }
  const firestore = db;

  const batch = writeBatch(firestore);

  DEFAULT_LISTING_PURPOSES.forEach((entry, index) => {
    const docRef = doc(collection(firestore, LISTING_PURPOSES_COLLECTION));
    batch.set(docRef, { ...entry, order: index, createdAt: serverTimestamp() });
  });

  await batch.commit();
}
