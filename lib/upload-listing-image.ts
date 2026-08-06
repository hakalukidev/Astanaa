import type { User } from "firebase/auth";

export async function uploadListingImage(file: File, user: User) {
  const idToken = await user.getIdToken();

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/listings/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
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
