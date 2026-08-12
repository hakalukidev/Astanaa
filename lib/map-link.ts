/**
 * Turns a Google Maps URL a seller pasted (Share -> Copy link on the app, or
 * the address bar of maps.google.com) into an embeddable iframe src via the
 * `output=embed` trick — this needs no API key, unlike the official Maps
 * Embed API. Works for full google.com/maps URLs (place pages, @lat,lng
 * views, ?q= searches). Short maps.app.goo.gl / goo.gl/maps links resolve via
 * a redirect the browser refuses to follow inside an iframe, so those
 * correctly return null — callers should always also render a plain link to
 * the raw pasted URL as a fallback for that case.
 */
export function buildGoogleMapsEmbedSrc(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  const isGoogleHost = /^(www\.)?google\.[a-z.]+$/i.test(parsed.hostname);
  if (!isGoogleHost || !parsed.pathname.startsWith("/maps")) {
    return null;
  }

  parsed.searchParams.set("output", "embed");
  return parsed.toString();
}
