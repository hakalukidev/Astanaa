"use client";

const POLL_INTERVAL_MS = 8000;

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

/** `buyerId` is kept for call-site compatibility — the server always uses
 * the session's own user id. Deduped per (listing, buyer) pair server-side. */
export async function createBuyRequest(input: {
  listingId: string;
  listingTitle: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  sellerId: string;
}): Promise<BuyRequest> {
  const response = await fetch("/api/buy-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Could not send buy request.");
  }

  const data = (await response.json()) as { request: BuyRequest };
  return data.request;
}

/** Polls buy requests addressed to the signed-in seller. `sellerId` is kept
 * for call-site compatibility — the server always scopes to the session. */
export function subscribeToSellerBuyRequests(
  _sellerId: string,
  onChange: (requests: BuyRequest[]) => void
) {
  let cancelled = false;

  async function tick() {
    try {
      const response = await fetch("/api/buy-requests/mine");
      const data = (await response.json()) as { requests: BuyRequest[] };
      if (!cancelled) onChange(data.requests);
    } catch {
      // Transient poll failure — keep showing whatever we had.
    }
  }

  tick();
  const interval = setInterval(tick, POLL_INTERVAL_MS);

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}
