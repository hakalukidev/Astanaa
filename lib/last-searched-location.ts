"use client";

// Remembers the last location text a visitor searched/filtered by (from the
// TopBar location picker, or a shared "/listings?search=..." link) so the
// listing detail page can recommend other posts from that same area even
// though it's a separate page with no access to the /listings URL. Browser
// storage only — never read server-side.
const LAST_SEARCHED_LOCATION_KEY = "astanaa:last-searched-location";

export function getLastSearchedLocation(): string | null {
  try {
    return window.localStorage.getItem(LAST_SEARCHED_LOCATION_KEY);
  } catch {
    return null;
  }
}

export function setLastSearchedLocation(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return;
  }

  try {
    window.localStorage.setItem(LAST_SEARCHED_LOCATION_KEY, trimmed);
  } catch {
    // Storage disabled/full — recommendations just fall back to "none".
  }
}
