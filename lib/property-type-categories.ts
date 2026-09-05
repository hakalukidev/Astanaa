"use client";

import { getOrFetch } from "@/lib/browser-cache";
import type { ListingPurpose } from "@/lib/listings";

const CATEGORIES_CACHE_KEY = "astanaa-property-type-categories-cache";
const CATEGORIES_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const POLL_INTERVAL_MS = 5000;

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
 * The site's original hardcoded categories — used as a fallback if the API
 * read ever fails (offline, etc.), so the property-type list is never
 * empty and the Browse menu doesn't look broken.
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

const FALLBACK_CATEGORIES: PropertyTypeCategory[] = DEFAULT_PROPERTY_TYPE_CATEGORIES.map(
  (entry, index) => ({
    id: `default-${index}`,
    order: index,
    createdAtMs: null,
    ...entry,
    icon: entry.icon ?? "Building2",
  })
);

async function fetchCategories(): Promise<PropertyTypeCategory[]> {
  try {
    const response = await fetch("/api/property-type-categories");
    if (!response.ok) return FALLBACK_CATEGORIES;
    const data = (await response.json()) as { categories: PropertyTypeCategory[] };
    return data.categories.length > 0 ? data.categories : FALLBACK_CATEGORIES;
  } catch {
    return FALLBACK_CATEGORIES;
  }
}

/** Public — the Browse menu, post-ad form, and listings filter all need this.
 * Live-ish via polling (categories rarely change, but the admin Categories
 * page needs edits to show up without a manual refresh). */
export function subscribeToPropertyTypeCategories(
  callback: (categories: PropertyTypeCategory[]) => void
) {
  let cancelled = false;

  async function tick() {
    const categories = await fetchCategories();
    if (!cancelled) callback(categories);
  }

  tick();
  const interval = setInterval(tick, POLL_INTERVAL_MS);

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}

/**
 * Read-only, cached alternative to `subscribeToPropertyTypeCategories` for
 * public pages that just need to *display* category labels (listing cards,
 * listing detail, the post-ad picker, the TopBar browse menu) — fetches
 * once and caches in localStorage for CATEGORIES_CACHE_TTL_MS.
 */
export async function getPropertyTypeCategoriesCached(): Promise<PropertyTypeCategory[]> {
  return getOrFetch(CATEGORIES_CACHE_KEY, CATEGORIES_CACHE_TTL_MS, fetchCategories);
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
 * label, e.g. "Flat Rent") to its display label, with a fallback chain: the
 * live categories list, then the built-in defaults, then the raw value
 * itself so nothing ever renders blank. */
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

/** Staff-admin only (enforced server-side). */
export async function addPropertyTypeCategory(input: PropertyTypeCategoryInput) {
  await fetch("/api/property-type-categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

/** Staff-admin only. Renaming `en` cascades to every listing that already
 * used the old label as its propertyType — handled atomically server-side. */
export async function updatePropertyTypeCategory(id: string, input: PropertyTypeCategoryInput) {
  await fetch(`/api/property-type-categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

/** Staff-admin only. */
export async function deletePropertyTypeCategory(id: string) {
  await fetch(`/api/property-type-categories/${id}`, { method: "DELETE" });
}

/**
 * Kept for interface compatibility with the admin Categories page's
 * "seed if empty" bootstrap — a no-op now since the migration script
 * already backfilled Postgres with the real category data (see
 * scripts/migrate-categories-to-postgres.mjs), so the table is never
 * actually empty in practice.
 */
export async function seedDefaultPropertyTypeCategories() {
  return;
}
