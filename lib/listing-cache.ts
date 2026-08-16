import "server-only";

import { unstable_cache } from "next/cache";

import { getAllListings } from "@/lib/listing-service";

export const listingsCacheTag = "listings";

// Server Components with no dynamic APIs render statically at build time, so
// without this the homepage/listings page would keep serving whatever was
// active at build time and never pick up newly approved posts in production.
// unstable_cache + revalidateTag (see /api/revalidate-listings) lets
// moderation actions bust the cache immediately, with this interval as a
// fallback safety net.
const listingsCacheRevalidateSeconds = 5 * 60;

export const getCachedListings = unstable_cache(
  async () => getAllListings(),
  ["listings-list"],
  {
    revalidate: listingsCacheRevalidateSeconds,
    tags: [listingsCacheTag],
  }
);
