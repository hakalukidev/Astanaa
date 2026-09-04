"use client";

import type { BoostPaymentMethod, Listing, ListingInput, ModerationLogEntry } from "@/lib/listings";

const POLL_INTERVAL_MS = 5000;

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error((data as { error?: string } | null)?.error ?? "Request failed");
  }

  return data as T;
}

/** Generic "poll an endpoint every few seconds" — replaces the old
 * Firestore onSnapshot listeners for the admin/moderation feeds. Returns an
 * unsubscribe function with the same shape the components already expect. */
function poll<T>(url: string, onChange: (data: T[]) => void, extractKey: string) {
  let cancelled = false;

  async function tick() {
    try {
      const data = await fetchJson<Record<string, T[]>>(url);
      if (!cancelled) {
        onChange(data[extractKey] ?? []);
      }
    } catch {
      // Transient network/poll failure — keep the previous data, try again
      // next tick rather than clearing the list out from under the viewer.
    }
  }

  tick();
  const interval = setInterval(tick, POLL_INTERVAL_MS);

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}

export async function getActiveListingCountsByPropertyType(
  propertyTypes: string[]
): Promise<Record<string, number>> {
  if (propertyTypes.length === 0) {
    return {};
  }

  const data = await fetchJson<{ counts: Record<string, number> }>(
    `/api/listings/counts?types=${encodeURIComponent(propertyTypes.join(","))}`
  );

  return data.counts;
}

export async function getListingsBySeller(_sellerId: string): Promise<Listing[]> {
  // The sellerId argument is kept for call-site compatibility, but the
  // server always scopes this to the session's own user — a client can
  // never fetch someone else's listings by passing a different id.
  const data = await fetchJson<{ listings: Listing[] }>("/api/listings/mine");
  return data.listings;
}

export function subscribeToListingsByStatus(
  status: Listing["status"],
  onChange: (listings: Listing[]) => void
) {
  return poll(`/api/admin/listings?status=${status}`, onChange, "listings");
}

export function subscribeToAllListingsForAdmin(onChange: (listings: Listing[]) => void) {
  return poll("/api/admin/listings", onChange, "listings");
}

export function subscribeToActiveListings(onChange: (listings: Listing[]) => void) {
  return poll("/api/listings", onChange, "listings");
}

export function subscribeToModerationLog(onChange: (entries: ModerationLogEntry[]) => void) {
  return poll("/api/admin/moderation-log", onChange, "entries");
}

export async function createListing(input: ListingInput) {
  const data = await fetchJson<{ listing: Listing }>("/api/listings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return data.listing;
}

export async function updateListing(
  id: string,
  input: Partial<ListingInput> & { status?: Listing["status"] }
) {
  const data = await fetchJson<{ listing: Listing }>(`/api/listings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return data.listing;
}

/**
 * Permanently deletes a listing. The `moderator` argument is accepted for
 * call-site compatibility but no longer trusted — the server derives who's
 * actually deleting it from the session and logs accordingly.
 */
export async function deleteListing(
  listing: Pick<Listing, "id" | "sellerId" | "sellerName" | "title">,
  _moderator?: { uid: string; name: string }
) {
  await fetchJson(`/api/listings/${listing.id}`, { method: "DELETE" });
}

/** Approve/reject a pending listing. `moderator` is kept for call-site
 * compatibility — the server stamps the actual signed-in moderator. */
export async function markListingStatus(
  listing: Pick<Listing, "id" | "sellerId" | "title">,
  status: Listing["status"],
  _moderator?: { uid: string; name: string }
) {
  if (status !== "active" && status !== "rejected") {
    throw new Error("markListingStatus only supports 'active' or 'rejected'.");
  }
  const data = await fetchJson<{ listing: Listing }>(`/api/listings/${listing.id}/moderate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return data.listing;
}

export async function requestListingBoost(
  id: string,
  method: BoostPaymentMethod,
  transactionId: string | null
) {
  const data = await fetchJson<{ listing: Listing }>(`/api/listings/${id}/boost`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method, transactionId }),
  });
  return data.listing;
}
