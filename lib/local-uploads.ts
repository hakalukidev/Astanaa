import "server-only";

import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

import {
  LOCAL_UPLOADS_URL_PREFIX,
  getLocalUploadThumbnailPath,
} from "@/lib/local-upload-urls";

// Images live on the VPS disk and nginx serves them at /uploads/. In local
// dev there is no nginx, so the default falls back to public/uploads, which
// `next dev` serves directly.
const UPLOADS_DIR = path.resolve(
  process.env.UPLOADS_DIR?.trim() || path.join(process.cwd(), "public", "uploads")
);

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_DIMENSION = 1920;
const THUMBNAIL_SIZE = 300;
const PUBLIC_ID_PATTERN = /^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/;

export type SavedUpload = { url: string; publicId: string };

export class UploadValidationError extends Error {}

function resolveInsideUploadsDir(relativePath: string) {
  const absolutePath = path.resolve(UPLOADS_DIR, relativePath);

  if (!absolutePath.startsWith(UPLOADS_DIR + path.sep)) {
    throw new UploadValidationError("Invalid image path.");
  }

  return absolutePath;
}

/**
 * Stores the image as a resized webp plus a square thumbnail. The public id
 * is the path without extension (e.g. "listings/2026/09/<uuid>"), which
 * mirrors how Cloudinary public ids looked so the DB columns keep working.
 */
export async function saveImageUpload(file: File, folder: string): Promise<SavedUpload> {
  if (!file.type.startsWith("image/") && !/\.(png|jpe?g|webp)$/i.test(file.name)) {
    throw new UploadValidationError("File must be an image.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadValidationError("File size must be less than 8MB.");
  }

  const input = Buffer.from(await file.arrayBuffer());
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const publicId = `${folder}/${now.getFullYear()}/${month}/${randomUUID()}`;

  let main: Buffer;
  let thumbnail: Buffer;

  try {
    // .rotate() applies EXIF orientation so phone photos aren't sideways.
    main = await sharp(input)
      .rotate()
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    thumbnail = await sharp(input)
      .rotate()
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: "cover" })
      .webp({ quality: 75 })
      .toBuffer();
  } catch {
    throw new UploadValidationError("The image could not be processed.");
  }

  const mainPath = resolveInsideUploadsDir(`${publicId}.webp`);
  await mkdir(path.dirname(mainPath), { recursive: true });
  await writeFile(mainPath, main);
  await writeFile(resolveInsideUploadsDir(getLocalUploadThumbnailPath(`${publicId}.webp`)), thumbnail);

  return { url: `${LOCAL_UPLOADS_URL_PREFIX}/${publicId}.webp`, publicId };
}

/** Returns "ok" when the image existed, "not found" otherwise (same as Cloudinary). */
export async function deleteImageUpload(publicId: string): Promise<"ok" | "not found"> {
  if (!PUBLIC_ID_PATTERN.test(publicId)) {
    throw new UploadValidationError("Invalid image id.");
  }

  const mainPath = resolveInsideUploadsDir(`${publicId}.webp`);
  const thumbnailPath = resolveInsideUploadsDir(getLocalUploadThumbnailPath(`${publicId}.webp`));

  const results = await Promise.allSettled([unlink(mainPath), unlink(thumbnailPath)]);
  const [mainResult] = results;

  for (const result of results) {
    if (result.status === "rejected" && (result.reason as NodeJS.ErrnoException)?.code !== "ENOENT") {
      throw result.reason;
    }
  }

  return mainResult.status === "fulfilled" ? "ok" : "not found";
}
