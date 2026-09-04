import type { DocumentData, QueryDocumentSnapshot, Timestamp } from "firebase/firestore";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { getOrFetch } from "@/lib/browser-cache";
import { db } from "@/lib/firebase";
import type { ListingPurpose } from "@/lib/listings";
import { DEFAULT_PROPERTY_TYPE_ICON } from "@/lib/property-type-icons";

const CATEGORIES_CACHE_KEY = "astanaa-property-type-categories-cache";
const CATEGORIES_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export const PROPERTY_TYPE_CATEGORIES_COLLECTION = "propertyTypeCategories";

export type PropertyTypeCategory = {
  id: string;
  purpose: ListingPurpose;
  en: string;
  bn: string;
  icon: string;
  order: number;
  createdAtMs: number | null;
};

export type PropertyTypeCategoryInput = {
  purpose: ListingPurpose;
  en: string;
  bn: string;
  icon?: string;
};

/**
 * The site's original hardcoded categories — used as a starting point the
 * first time an admin opens the Categories admin page (seeded into
 * Firestore then), and as a safety-net fallback everywhere else in case the
 * collection is ever empty (e.g. this feature deployed but nobody's visited
 * the admin page yet).
 */
export const DEFAULT_PROPERTY_TYPE_CATEGORIES: PropertyTypeCategoryInput[] = [
  { purpose: "rent", en: "Flat Rent", bn: "ফ্ল্যাট ভাড়া", icon: "Building2" },
  { purpose: "rent", en: "Sublet", bn: "সাবলেট", icon: "DoorOpen" },
  { purpose: "rent", en: "Roommate", bn: "রুমমেট", icon: "Users" },
  { purpose: "rent", en: "Shop", bn: "দোকান", icon: "Store" },
  { purpose: "rent", en: "Office/Commercial Space", bn: "অফিস/কমার্শিয়াল স্পেস", icon: "Briefcase" },
  { purpose: "rent", en: "Sublet Office", bn: "সাবলেট অফিস", icon: "DoorOpen" },
  { purpose: "rent", en: "Warehouse", bn: "গুদাম", icon: "Warehouse" },
  { purpose: "rent", en: "Motorcycle Garage", bn: "মোটরসাইকেল গ্যারেজ", icon: "Bike" },
  { purpose: "rent", en: "Car Garage", bn: "কার গ্যারেজ", icon: "Car" },
  { purpose: "sale", en: "Flat Sell", bn: "ফ্ল্যাট বিক্রি", icon: "Building2" },
  { purpose: "sale", en: "Shop Sell", bn: "দোকান বিক্রি", icon: "Store" },
  { purpose: "sale", en: "Office/Commercial Space Sell", bn: "অফিস/কমার্শিয়াল স্পেস বিক্রি", icon: "Briefcase" },
  { purpose: "sale", en: "Warehouse", bn: "গুদাম", icon: "Warehouse" },
  { purpose: "sale", en: "Building With Land Sell", bn: "জমিসহ ভবন বিক্রি", icon: "Building" },
  { purpose: "sale", en: "Land Sell", bn: "জমি বিক্রি", icon: "Trees" },
  { purpose: "sale", en: "Motorcycle Garage Sell", bn: "মোটরসাইকেল গ্যারেজ বিক্রি", icon: "Bike" },
  { purpose: "sale", en: "Car Garage Sell", bn: "কার গ্যারেজ বিক্রি", icon: "Car" },
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

function mapCategory(snapshot: QueryDocumentSnapshot<DocumentData>): PropertyTypeCategory {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    purpose: typeof data.purpose === "string" && data.purpose ? data.purpose : "sale",
    en: typeof data.en === "string" ? data.en : "",
    bn: typeof data.bn === "string" ? data.bn : "",
    icon: typeof data.icon === "string" && data.icon ? data.icon : DEFAULT_PROPERTY_TYPE_ICON,
    order: typeof data.order === "number" ? data.order : 0,
    createdAtMs: getTimestampMs(data.createdAt),
  };
}

function sortCategories(categories: PropertyTypeCategory[]) {
  return [...categories].sort((left, right) => {
    if (left.purpose !== right.purpose) {
      return left.purpose.localeCompare(right.purpose);
    }
    if (left.order !== right.order) {
      return left.order - right.order;
    }
    return left.en.localeCompare(right.en);
  });
}

const FALLBACK_CATEGORIES: PropertyTypeCategory[] = DEFAULT_PROPERTY_TYPE_CATEGORIES.map(
  (entry, index) => ({
    id: `default-${index}`,
    order: index,
    createdAtMs: null,
    ...entry,
    icon: entry.icon ?? DEFAULT_PROPERTY_TYPE_ICON,
  })
);

/**
 * Public — the Browse menu, post-ad form, and listings filter all need this.
 * Falls back to the built-in defaults if the collection is empty (nobody has
 * opened the admin Categories page yet) OR if the read fails for any reason
 * (rules not deployed yet, offline, etc.) — the property-type list must
 * never come back empty, or the Browse menu looks broken.
 */
export function subscribeToPropertyTypeCategories(
  callback: (categories: PropertyTypeCategory[]) => void
) {
  if (!db) {
    callback(FALLBACK_CATEGORIES);
    return () => {};
  }

  return onSnapshot(
    collection(db, PROPERTY_TYPE_CATEGORIES_COLLECTION),
    (snapshot) => {
      if (snapshot.empty) {
        callback(FALLBACK_CATEGORIES);
        return;
      }
      callback(sortCategories(snapshot.docs.map(mapCategory)));
    },
    () => {
      callback(FALLBACK_CATEGORIES);
    }
  );
}

/**
 * Read-only, cached alternative to `subscribeToPropertyTypeCategories` for
 * public pages that just need to *display* category labels (listing cards,
 * listing detail, the post-ad picker, the TopBar browse menu). Each of these
 * used to mount its own live `onSnapshot` listener — every listing card on a
 * page independently re-reading the whole collection — which multiplied
 * Firestore reads by however many were on screen at once. Categories change
 * rarely (an admin editing them), so this fetches once and caches in
 * localStorage for `CATEGORIES_CACHE_TTL_MS`, deduping concurrent callers.
 * The admin Categories page still uses the live subscription below so edits
 * show up immediately while editing.
 */
export async function getPropertyTypeCategoriesCached(): Promise<PropertyTypeCategory[]> {
  return getOrFetch(CATEGORIES_CACHE_KEY, CATEGORIES_CACHE_TTL_MS, async () => {
    if (!db) {
      return FALLBACK_CATEGORIES;
    }
    try {
      const snapshot = await getDocs(collection(db, PROPERTY_TYPE_CATEGORIES_COLLECTION));
      return snapshot.empty ? FALLBACK_CATEGORIES : sortCategories(snapshot.docs.map(mapCategory));
    } catch {
      return FALLBACK_CATEGORIES;
    }
  });
}

/** Buckets categories by their purpose key. Purposes with no categories yet
 * simply won't have an entry — callers should fall back to `[]` (e.g.
 * `grouped[purposeKey] ?? []`) rather than assuming `rent`/`sale` exist. */
export function groupCategoriesByPurpose(
  categories: PropertyTypeCategory[]
): Record<string, PropertyTypeCategory[]> {
  const grouped: Record<string, PropertyTypeCategory[]> = {};
  for (const category of categories) {
    (grouped[category.purpose] ??= []).push(category);
  }
  return grouped;
}

/** Resolves a listing's `propertyType` (stored as the category's English
 * label, e.g. "Flat Rent") to its display label, with the same fallback
 * chain as getListingPurposeLabel(): the live categories list, then the
 * built-in defaults (covers the moment before the list has loaded), then
 * the raw value itself so nothing ever renders blank. */
export function getPropertyTypeLabel(
  categories: PropertyTypeCategory[],
  propertyType: string,
  language: "en" | "bn"
): string {
  const match = categories.find((item) => item.en === propertyType);
  if (match) {
    return language === "bn" ? match.bn : match.en;
  }
  const fallback = DEFAULT_PROPERTY_TYPE_CATEGORIES.find((item) => item.en === propertyType);
  if (fallback) {
    return language === "bn" ? fallback.bn : fallback.en;
  }
  return propertyType;
}

/** Staff-admin only (enforced by firestore.rules). */
export async function addPropertyTypeCategory(input: PropertyTypeCategoryInput) {
  if (!db) {
    throw new Error("Category data is not available.");
  }

  const existing = await getDocs(collection(db, PROPERTY_TYPE_CATEGORIES_COLLECTION));
  const maxOrder = existing.docs
    .map((docSnapshot) => docSnapshot.data())
    .filter((data) => data.purpose === input.purpose)
    .reduce((max, data) => Math.max(max, typeof data.order === "number" ? data.order : 0), -1);

  await addDoc(collection(db, PROPERTY_TYPE_CATEGORIES_COLLECTION), {
    ...input,
    icon: input.icon ?? DEFAULT_PROPERTY_TYPE_ICON,
    order: maxOrder + 1,
    createdAt: serverTimestamp(),
  });
}

/**
 * Renaming a category's `en` label would otherwise strand every listing that
 * already stored the old label as its `propertyType` (listings reference
 * categories by that string, not by id) — they'd silently vanish from that
 * category's browse/filter/count views. This rewrites `propertyType` on every
 * matching listing to the new label so old posts stay put.
 */
async function migrateListingsPropertyType(previousEn: string, nextEn: string) {
  if (previousEn === nextEn) {
    return;
  }

  // Listings live in Postgres now (categories themselves haven't migrated
  // yet) — this cascade is a bulk UPDATE behind an API route instead of a
  // direct Firestore batch write.
  await fetch("/api/admin/listings/migrate-property-type", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ previousEn, nextEn }),
  });
}

/** Staff-admin only (enforced by firestore.rules). */
export async function updatePropertyTypeCategory(id: string, input: PropertyTypeCategoryInput) {
  if (!db) {
    throw new Error("Category data is not available.");
  }

  const categoryRef = doc(db, PROPERTY_TYPE_CATEGORIES_COLLECTION, id);
  const existingSnapshot = await getDoc(categoryRef);
  const previousEn = existingSnapshot.exists() ? (existingSnapshot.data().en as string | undefined) : undefined;

  await updateDoc(categoryRef, {
    ...input,
    icon: input.icon ?? DEFAULT_PROPERTY_TYPE_ICON,
  });

  if (previousEn && previousEn !== input.en) {
    await migrateListingsPropertyType(previousEn, input.en);
  }
}

/** Staff-admin only (enforced by firestore.rules). */
export async function deletePropertyTypeCategory(id: string) {
  if (!db) {
    throw new Error("Category data is not available.");
  }

  await deleteDoc(doc(db, PROPERTY_TYPE_CATEGORIES_COLLECTION, id));
}

/**
 * One-time bulk write of the built-in defaults, called automatically by the
 * admin Categories page the first time it finds the collection empty. After
 * this, Firestore is the sole source of truth and admins can add/edit/delete
 * freely.
 */
export async function seedDefaultPropertyTypeCategories() {
  if (!db) {
    throw new Error("Category data is not available.");
  }

  const batch = writeBatch(db);
  const byPurposeCounter: Record<string, number> = { rent: 0, sale: 0 };

  for (const entry of DEFAULT_PROPERTY_TYPE_CATEGORIES) {
    const order = byPurposeCounter[entry.purpose]++;
    const docRef = doc(collection(db, PROPERTY_TYPE_CATEGORIES_COLLECTION));
    batch.set(docRef, { ...entry, order, createdAt: serverTimestamp() });
  }

  await batch.commit();
}
