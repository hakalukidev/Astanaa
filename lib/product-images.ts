import { extractLocalUploadPublicId } from "@/lib/local-upload-urls";

type ProductImageRef = {
  photoUrl?: string | null;
  photoPublicId?: string | null;
  photoUrls?: string[] | null;
  photoPublicIds?: string[] | null;
};

export function extractImagePublicId(photoUrl: string) {
  return extractLocalUploadPublicId(photoUrl);
}

export function resolveProductPhotoPublicId(image: ProductImageRef) {
  const savedPublicId = image.photoPublicId?.trim();

  if (savedPublicId) {
    return savedPublicId;
  }

  const photoUrl = image.photoUrl?.trim();

  return photoUrl ? extractImagePublicId(photoUrl) : null;
}

export function resolveProductPhotoPublicIds(image: ProductImageRef) {
  const savedPublicIds = Array.isArray(image.photoPublicIds)
    ? image.photoPublicIds.map((value) => value.trim()).filter(Boolean)
    : [];
  const photoUrls = Array.isArray(image.photoUrls)
    ? image.photoUrls.map((value) => value.trim()).filter(Boolean)
    : [];
  const legacyPublicId = image.photoPublicId?.trim() ?? "";
  const legacyPhotoUrl = image.photoUrl?.trim() ?? "";
  const values = new Set<string>();

  for (const savedPublicId of savedPublicIds) {
    values.add(savedPublicId);
  }

  for (const photoUrl of photoUrls) {
    const resolvedPublicId = resolveProductPhotoPublicId({ photoUrl });

    if (resolvedPublicId) {
      values.add(resolvedPublicId);
    }
  }

  const legacyResolvedPublicId = resolveProductPhotoPublicId({
    photoPublicId: legacyPublicId,
    photoUrl: legacyPhotoUrl,
  });

  if (legacyResolvedPublicId) {
    values.add(legacyResolvedPublicId);
  }

  return Array.from(values);
}
