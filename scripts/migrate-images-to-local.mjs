// One-time migration: moves every Cloudinary image referenced in Postgres onto
// the VPS disk (from the backup made by scripts/backup-cloudinary.mjs) and
// rewrites the stored URLs to /uploads/<public_id>.webp.
//
// Public ids are kept as-is, so photo_public_ids / image_public_id columns
// don't change and admin image deletes keep working.
//
// Dry run by default — nothing is written until you pass --apply.
//
// Usage (on the VPS, after copying the backup to $UPLOADS_DIR/_cloudinary):
//   node --env-file=.env --env-file=.env.local scripts/migrate-images-to-local.mjs
//   node --env-file=.env --env-file=.env.local scripts/migrate-images-to-local.mjs --apply

import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";

const apply = process.argv.includes("--apply");
const uploadsDir = path.resolve(
  process.env.UPLOADS_DIR?.trim() || path.join(process.cwd(), "public", "uploads"),
);
const backupDir = path.join(uploadsDir, "_cloudinary");
const db = new PrismaClient();

const manifest = JSON.parse(await readFile(path.join(backupDir, "manifest.json"), "utf8"));
const manifestByPublicId = new Map(
  manifest
    .filter((entry) => entry.resource_type === "image" && entry.status !== "failed")
    .map((entry) => [entry.public_id, entry]),
);

function isCloudinaryUrl(value) {
  return typeof value === "string" && value.includes("res.cloudinary.com/");
}

// ".../image/upload/w_100,c_fill/v1712345/listings/abc.jpg" -> "listings/abc"
function publicIdFromUrl(url) {
  let segments;
  try {
    segments = new URL(url).pathname.split("/").filter(Boolean).map(decodeURIComponent);
  } catch {
    return null;
  }

  const uploadIndex = segments.indexOf("upload");
  if (uploadIndex === -1) return null;

  const rest = segments.slice(uploadIndex + 1);
  const versionIndex = rest.findIndex((segment) => /^v\d+$/.test(segment));
  const candidates = versionIndex >= 0 ? [rest.slice(versionIndex + 1)] : [];

  // No version segment: transformations may prefix the id, so try every suffix.
  for (let start = 0; start < rest.length; start++) candidates.push(rest.slice(start));

  for (const candidate of candidates) {
    if (candidate.length === 0) continue;
    const publicId = candidate.join("/").replace(/\.[a-z0-9]+$/i, "");
    if (manifestByPublicId.has(publicId)) return publicId;
  }

  return null;
}

const converted = new Map();
const missing = new Set();
const stats = { converted: 0, alreadyThere: 0 };

async function exists(filePath) {
  return Boolean(await stat(filePath).catch(() => null));
}

/** Returns the new /uploads URL for a Cloudinary URL, or null if unknown. */
async function localUrlFor(cloudinaryUrl) {
  const publicId = publicIdFromUrl(cloudinaryUrl);

  if (!publicId) {
    missing.add(cloudinaryUrl);
    return null;
  }

  if (converted.has(publicId)) return converted.get(publicId);

  const newUrl = `/uploads/${publicId}.webp`;
  const mainPath = path.join(uploadsDir, `${publicId}.webp`);
  const thumbnailPath = path.join(uploadsDir, `${publicId}-thumb.webp`);

  if (await exists(mainPath)) {
    stats.alreadyThere++;
  } else if (apply) {
    const source = await readFile(
      path.join(backupDir, manifestByPublicId.get(publicId).local_path),
    );
    // Same output as lib/local-uploads.ts so old and new images look alike.
    const main = await sharp(source)
      .rotate()
      .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    const thumbnail = await sharp(source)
      .rotate()
      .resize(300, 300, { fit: "cover" })
      .webp({ quality: 75 })
      .toBuffer();

    await mkdir(path.dirname(mainPath), { recursive: true });
    await writeFile(mainPath, main);
    await writeFile(thumbnailPath, thumbnail);
    stats.converted++;
  } else {
    stats.converted++;
  }

  converted.set(publicId, newUrl);
  return newUrl;
}

async function replaceUrl(value) {
  if (!isCloudinaryUrl(value)) return value;
  return (await localUrlFor(value)) ?? value;
}

async function replaceInJson(value) {
  if (typeof value === "string") return replaceUrl(value);
  if (Array.isArray(value)) return Promise.all(value.map(replaceInJson));
  if (value && typeof value === "object") {
    const entries = await Promise.all(
      Object.entries(value).map(async ([key, inner]) => [key, await replaceInJson(inner)]),
    );
    return Object.fromEntries(entries);
  }
  return value;
}

async function main() {
  console.log(`${apply ? "APPLYING" : "DRY RUN"} — uploads dir: ${uploadsDir}\n`);
  const updated = { listings: 0, chats: 0, slides: 0, settings: 0 };

  const listings = await db.listing.findMany({ select: { id: true, photoUrls: true } });
  for (const listing of listings) {
    if (!listing.photoUrls.some(isCloudinaryUrl)) continue;
    const photoUrls = [];
    for (const url of listing.photoUrls) photoUrls.push(await replaceUrl(url));
    if (apply) await db.listing.update({ where: { id: listing.id }, data: { photoUrls } });
    updated.listings++;
  }

  const chats = await db.chat.findMany({
    where: { listingPhotoUrl: { contains: "res.cloudinary.com/" } },
    select: { id: true, listingPhotoUrl: true },
  });
  for (const chat of chats) {
    const listingPhotoUrl = await replaceUrl(chat.listingPhotoUrl);
    if (apply) await db.chat.update({ where: { id: chat.id }, data: { listingPhotoUrl } });
    updated.chats++;
  }

  const slides = await db.slide.findMany({
    where: { image: { contains: "res.cloudinary.com/" } },
    select: { id: true, image: true },
  });
  for (const slide of slides) {
    const image = await replaceUrl(slide.image);
    if (apply) await db.slide.update({ where: { id: slide.id }, data: { image } });
    updated.slides++;
  }

  const settings = await db.siteSetting.findMany();
  for (const setting of settings) {
    if (!JSON.stringify(setting.value).includes("res.cloudinary.com/")) continue;
    const value = await replaceInJson(setting.value);
    if (apply) await db.siteSetting.update({ where: { key: setting.key }, data: { value } });
    updated.settings++;
  }

  console.log("Rows with Cloudinary URLs:", updated);
  console.log(
    `Images: ${stats.converted} ${apply ? "converted" : "to convert"}, ${stats.alreadyThere} already on disk`,
  );

  if (missing.size > 0) {
    console.log(`\n${missing.size} URL(s) not found in the backup (left unchanged):`);
    for (const url of missing) console.log(`  ${url}`);
  }

  if (!apply) console.log("\nNothing was written. Re-run with --apply to migrate.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
