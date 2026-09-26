"use client";

import { getOrFetch } from "@/lib/browser-cache";

const PURPOSES_CACHE_KEY = "astanaa-listing-purposes-cache";
const PURPOSES_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const POLL_INTERVAL_MS = 5000;

/**
 * A top-level "purpose" (For Rent, For Sale, and whatever an admin adds
 * beyond those) that Property Type Categories hang off of. `key` is the
 * stable, machine-readable id stored on every listing (`listing.purpose`)
 * and category (`category.purpose`) — generated once from the English name
 * at creation time and never changes.
 */
export type ListingPurposeRecord = {
  id: string;
  key: string;
  en: string;
  bn: string;
  icon: string;
  iconColor: string;
  order: number;
  createdAtMs: number | null;
};

export type ListingPurposeInput = {
  en: string;
  bn: string;
  icon?: string;
  iconColor?: string;
};

/** The site's original two purposes — used as a fallback if the API read
 * ever fails, so the Browse menu/post-ad form never has nothing to show. */
export const DEFAULT_LISTING_PURPOSES: (ListingPurposeInput & { key: string })[] = [
  { key: "rent", en: "For Rent", bn: "ভাড়ার জন্য", icon: "KeyRound" },
  { key: "sale", en: "For Sale", bn: "বিক্রির জন্য", icon: "Tag" },
];

const FALLBACK_PURPOSES: ListingPurposeRecord[] = DEFAULT_LISTING_PURPOSES.map((entry, index) => ({
  id: `default-${index}`,
  order: index,
  createdAtMs: null,
  ...entry,
  icon: entry.icon ?? "Tag",
  iconColor: entry.iconColor ?? "",
}));

export function isFallbackPurpose(purpose: ListingPurposeRecord) {
  return purpose.id.startsWith("default-");
}

async function fetchPurposes(): Promise<ListingPurposeRecord[]> {
  try {
    const response = await fetch("/api/listing-purposes");
    if (!response.ok) return FALLBACK_PURPOSES;
    const data = (await response.json()) as { purposes: ListingPurposeRecord[] };
    return data.purposes.length > 0 ? data.purposes : FALLBACK_PURPOSES;
  } catch {
    return FALLBACK_PURPOSES;
  }
}

/** Public — the Browse menu, post-ad form, and listings filter all need
 * this. Polled so admin edits show up without a manual refresh. */
export function subscribeToListingPurposes(callback: (purposes: ListingPurposeRecord[]) => void) {
  let cancelled = false;

  async function tick() {
    const purposes = await fetchPurposes();
    if (!cancelled) callback(purposes);
  }

  tick();
  const interval = setInterval(tick, POLL_INTERVAL_MS);

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}

/** Read-only, cached alternative to `subscribeToListingPurposes` for public
 * pages that just need to *display* purpose labels. */
export async function getListingPurposesCached(): Promise<ListingPurposeRecord[]> {
  return getOrFetch(PURPOSES_CACHE_KEY, PURPOSES_CACHE_TTL_MS, fetchPurposes);
}

/** Resolves a listing's/category's purpose `key` to its display label, with
 * a fallback chain: the live purposes list, then the built-in rent/sale
 * defaults, then the raw key itself so nothing ever renders blank. */
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

/** Staff-admin only (enforced server-side). Generates a stable `key` from
 * the English name, disambiguated against existing keys. */
export async function addListingPurpose(input: ListingPurposeInput) {
  await fetch("/api/listing-purposes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

/** Staff-admin only. Only the display bits (en/bn/icon) are editable —
 * `key` is set once at creation. */
export async function updateListingPurpose(id: string, input: ListingPurposeInput) {
  await fetch(`/api/listing-purposes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

/** Staff-admin only. */
export async function deleteListingPurpose(id: string) {
  await fetch(`/api/listing-purposes/${id}`, { method: "DELETE" });
}

/** Kept for interface compatibility — a no-op now that Postgres is
 * pre-seeded by the migration script. */
export async function seedDefaultListingPurposes() {
  return;
}
