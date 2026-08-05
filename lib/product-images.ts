type ProductImageRef = {
  photoUrl?: string | null;
  photoPublicId?: string | null;
  photoUrls?: string[] | null;
  photoPublicIds?: string[] | null;
};

const CLOUDINARY_HOST = "res.cloudinary.com";
const CLOUDINARY_FOLDER_SEGMENTS = (
  process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER?.trim() ?? ""
)
  .split("/")
  .filter(Boolean);

function findSegmentSequenceIndex(
  segments: string[],
  targetSegments: string[],
  startIndex: number
) {
  if (targetSegments.length === 0) {
    return -1;
  }

  const lastStartIndex = segments.length - targetSegments.length;

  for (let index = startIndex; index <= lastStartIndex; index += 1) {
    const matches = targetSegments.every(
      (targetSegment, offset) => segments[index + offset] === targetSegment
    );

    if (matches) {
      return index;
    }
  }

  return -1;
}

function startsWithSegmentSequence(segments: string[], targetSegments: string[]) {
  return (
    targetSegments.length > 0 &&
    targetSegments.every((targetSegment, index) => segments[index] === targetSegment)
  );
}

function isLikelyTransformationSegment(segment: string) {
  return (
    segment.startsWith("t_") ||
    segment.startsWith("$") ||
    segment.includes(",") ||
    /^(?:a|ac|af|ar|b|bo|c|co|d|dl|dn|du|e|eo|f|fl|fn|g|h|ki|l|o|pg|q|r|so|sp|t|u|vc|vs|w|x|y|z)_/.test(
      segment
    )
  );
}

export function extractCloudinaryPublicId(photoUrl: string) {
  try {
    const parsedUrl = new URL(photoUrl);

    if (!parsedUrl.hostname.endsWith(CLOUDINARY_HOST)) {
      return null;
    }

    const segments = parsedUrl.pathname.split("/").filter(Boolean);
    const uploadIndex = segments.indexOf("upload");

    if (uploadIndex === -1 || uploadIndex === segments.length - 1) {
      return null;
    }

    const versionIndex = segments.findIndex(
      (segment, index) => index > uploadIndex && /^v\d+$/.test(segment)
    );
    let publicIdStartIndex = versionIndex >= 0 ? versionIndex + 1 : uploadIndex + 1;

    if (versionIndex === -1) {
      const configuredFolderIndex = findSegmentSequenceIndex(
        segments,
        CLOUDINARY_FOLDER_SEGMENTS,
        uploadIndex + 1
      );

      if (configuredFolderIndex >= 0) {
        publicIdStartIndex = configuredFolderIndex;
      } else {
        while (
          publicIdStartIndex < segments.length &&
          isLikelyTransformationSegment(segments[publicIdStartIndex])
        ) {
          publicIdStartIndex += 1;
        }
      }
    }

    const publicIdSegments = segments.slice(publicIdStartIndex);

    if (publicIdSegments.length === 0) {
      return null;
    }

    const lastSegment = publicIdSegments[publicIdSegments.length - 1];
    const extensionIndex = lastSegment.lastIndexOf(".");

    if (extensionIndex !== -1) {
      publicIdSegments[publicIdSegments.length - 1] = lastSegment.slice(
        0,
        extensionIndex
      );
    }

    return publicIdSegments.join("/");
  } catch {
    return null;
  }
}

export function resolveProductPhotoPublicId(image: ProductImageRef) {
  const savedPublicId = image.photoPublicId?.trim();
  const photoUrl = image.photoUrl?.trim();
  const extractedPublicId = photoUrl ? extractCloudinaryPublicId(photoUrl) : null;

  if (savedPublicId) {
    if (!extractedPublicId || savedPublicId === extractedPublicId) {
      return savedPublicId;
    }

    const savedPublicIdSegments = savedPublicId.split("/").filter(Boolean);

    if (
      isLikelyTransformationSegment(savedPublicIdSegments[0] ?? "") ||
      (CLOUDINARY_FOLDER_SEGMENTS.length > 0 &&
        !startsWithSegmentSequence(savedPublicIdSegments, CLOUDINARY_FOLDER_SEGMENTS) &&
        startsWithSegmentSequence(
          extractedPublicId.split("/").filter(Boolean),
          CLOUDINARY_FOLDER_SEGMENTS
        ))
    ) {
      return extractedPublicId;
    }

    return savedPublicId;
  }

  if (!photoUrl) {
    return null;
  }

  return extractedPublicId;
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
