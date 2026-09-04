export async function uploadListingImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/listings/upload", {
    method: "POST",
    // Session cookie is httpOnly and same-origin, so the browser attaches
    // it automatically — no bearer token to thread through by hand.
    body: formData,
  });

  const payload = (await response.json()) as {
    url?: string;
    publicId?: string;
    error?: string;
  };

  if (!response.ok || !payload.url || !payload.publicId) {
    throw new Error(payload.error ?? "Image upload failed");
  }

  return { url: payload.url, publicId: payload.publicId };
}
