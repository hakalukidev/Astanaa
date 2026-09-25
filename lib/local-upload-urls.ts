// Client-safe helpers for images stored on our own server (see
// lib/local-uploads.ts for the server-side storage).

export const LOCAL_UPLOADS_URL_PREFIX = "/uploads";

export function isLocalUploadUrl(url: string) {
  return url.startsWith(`${LOCAL_UPLOADS_URL_PREFIX}/`);
}

/** "listings/x.webp" -> "listings/x-thumb.webp" (works on paths and URLs). */
export function getLocalUploadThumbnailPath(pathOrUrl: string) {
  return pathOrUrl.replace(/\.webp$/, "-thumb.webp");
}

/** "/uploads/listings/2026/09/abc.webp" -> "listings/2026/09/abc" */
export function extractLocalUploadPublicId(url: string) {
  if (!isLocalUploadUrl(url)) {
    return null;
  }

  const relativePath = url.slice(LOCAL_UPLOADS_URL_PREFIX.length + 1).split(/[?#]/)[0];

  if (!relativePath.endsWith(".webp") || relativePath.endsWith("-thumb.webp")) {
    return null;
  }

  return relativePath.slice(0, -".webp".length);
}
