/**
 * Tiny localStorage-backed TTL cache for reference data (property type
 * categories, listing purposes, ...) that rarely changes but was previously
 * being re-read from Firestore by every component that needed it — e.g. every
 * listing card on a page independently opened its own live listener. Wrap a
 * fetch with `getOrFetch` so repeat reads within the TTL window, and
 * concurrent callers on the same page, only cost one Firestore read total.
 */

type CacheEntry<T> = { data: T; cachedAtMs: number };

function readCache<T>(key: string, ttlMs: number): T | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.cachedAtMs > ttlMs) {
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const entry: CacheEntry<T> = { data, cachedAtMs: Date.now() };
    window.localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Storage full/unavailable/private-mode — caching is a pure
    // optimization, so just skip it rather than fail the caller.
  }
}

/** Drops a cached value so the next `getOrFetch` for `key` hits the network. */
export function clearCache(key: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage unavailable — nothing cached to clear.
  }
}

const inFlightRequests = new Map<string, Promise<unknown>>();

/**
 * Returns the cached value for `key` if it's within `ttlMs`; otherwise calls
 * `fetcher()` (deduped — concurrent callers for the same key share one
 * in-flight request), caches the result, and returns it.
 */
export async function getOrFetch<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = readCache<T>(key, ttlMs);
  if (cached !== null) {
    return cached;
  }

  const inFlight = inFlightRequests.get(key) as Promise<T> | undefined;
  if (inFlight) {
    return inFlight;
  }

  const request = fetcher()
    .then((data) => {
      writeCache(key, data);
      return data;
    })
    .finally(() => {
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, request);
  return request;
}
