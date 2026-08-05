type SlideImageRef = {
  image?: string | null;
  imagePublicId?: string | null;
};

export type ManagedSlideImageDeleteResult =
  | { status: "deleted" }
  | { status: "not_found" }
  | { status: "skipped" };

function resolveSlideImagePublicId(image: SlideImageRef) {
  return image.imagePublicId?.trim() || null;
}

export async function deleteManagedSlideImage(image: SlideImageRef) {
  const publicId = resolveSlideImagePublicId(image);

  if (!publicId) {
    return { status: "skipped" } satisfies ManagedSlideImageDeleteResult;
  }

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
    return { status: "not_found" } satisfies ManagedSlideImageDeleteResult;
  }

  return { status: "deleted" } satisfies ManagedSlideImageDeleteResult;
}
