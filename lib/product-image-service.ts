import { resolveProductPhotoPublicIds } from "@/lib/product-images";

type ProductImageRef = {
  photoUrl?: string | null;
  photoPublicId?: string | null;
  photoUrls?: string[] | null;
  photoPublicIds?: string[] | null;
};

export type ManagedProductImageDeleteStatus = "deleted" | "not_found" | "skipped";

export type ManagedProductImageDeleteResult = {
  deletedCount: number;
  notFoundCount: number;
  skippedCount: number;
  status: ManagedProductImageDeleteStatus;
};

export async function deleteManagedProductImages(image: ProductImageRef) {
  const publicIds = resolveProductPhotoPublicIds(image);

  if (publicIds.length === 0) {
    return {
      deletedCount: 0,
      notFoundCount: 0,
      skippedCount: 1,
      status: "skipped",
    } satisfies ManagedProductImageDeleteResult;
  }

  let deletedCount = 0;
  let notFoundCount = 0;

  for (const publicId of publicIds) {
    const response = await fetch("/api/admin/cloudinary/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publicId }),
    });
    const payload = (await response.json().catch(() => null)) as
      | { message?: string; result?: string }
      | null;

    if (!response.ok) {
      throw new Error(payload?.message ?? "Image cleanup failed.");
    }

    if (payload?.result === "not found") {
      notFoundCount += 1;
      continue;
    }

    deletedCount += 1;
  }

  return {
    deletedCount,
    notFoundCount,
    skippedCount: 0,
    status: deletedCount > 0 ? "deleted" : "not_found",
  } satisfies ManagedProductImageDeleteResult;
}
