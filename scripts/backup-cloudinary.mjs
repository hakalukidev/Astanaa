// One-time backup: downloads every original asset from the Cloudinary account
// to local disk, plus a manifest.json mapping public_id -> local file, so the
// images survive the Cloudinary plan limit and can be moved onto the VPS.
//
// Safe to re-run: files already downloaded (same byte size) are skipped.
//
// Usage:
//   node --env-file=.env --env-file=.env.local scripts/backup-cloudinary.mjs
//   ... scripts/backup-cloudinary.mjs --out=/var/www/astanaa-uploads/_cloudinary
//   ... scripts/backup-cloudinary.mjs --folder=astanaa   (only that asset folder)

import { createHash } from "node:crypto";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    return [key, rest.join("=") || "true"];
  }),
);

const cloudName = (
  process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
)?.trim();
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

if (!cloudName || !apiKey || !apiSecret) {
  console.error(
    "Missing Cloudinary credentials. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
  );
  process.exit(1);
}

const outDir = path.resolve(args.out ?? "cloudinary-backup");
const folderFilter = args.folder?.replace(/^\/+|\/+$/g, "") || null;
const RESOURCE_TYPES = ["image", "video", "raw"];
const CONCURRENCY = 5;
const authHeader = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;

async function listResources(resourceType) {
  const resources = [];
  let cursor = null;

  do {
    const url = new URL(
      `https://api.cloudinary.com/v1_1/${cloudName}/resources/${resourceType}/upload`,
    );
    url.searchParams.set("max_results", "500");
    if (cursor) url.searchParams.set("next_cursor", cursor);

    const response = await fetch(url, { headers: { Authorization: authHeader } });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        `Listing ${resourceType} failed (${response.status}): ${data?.error?.message ?? "unknown error"}`,
      );
    }

    resources.push(...(data.resources ?? []));
    cursor = data.next_cursor ?? null;
    console.log(`  ${resourceType}: listed ${resources.length} so far...`);
  } while (cursor);

  return resources;
}

function matchesFolder(resource) {
  if (!folderFilter) return true;
  const assetFolder = resource.asset_folder ?? resource.folder ?? "";
  return (
    assetFolder === folderFilter ||
    assetFolder.startsWith(`${folderFilter}/`) ||
    resource.public_id.startsWith(`${folderFilter}/`)
  );
}

function localPathFor(resource) {
  const safeSegments = resource.public_id
    .split("/")
    .filter((segment) => segment && segment !== "." && segment !== "..");
  const hasExtension = resource.resource_type === "raw" || !resource.format;
  const fileName = hasExtension
    ? safeSegments.pop()
    : `${safeSegments.pop()}.${resource.format}`;

  return path.join(outDir, resource.resource_type, ...safeSegments, fileName);
}

// Fallback when normal CDN delivery is blocked: a signed download URL served
// through the API host instead of res.cloudinary.com.
function signedDownloadUrl(resource) {
  const params = {
    public_id: resource.public_id,
    timestamp: Math.floor(Date.now() / 1000).toString(),
    type: resource.type ?? "upload",
  };
  if (resource.format && resource.resource_type !== "raw") params.format = resource.format;

  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  const signature = createHash("sha1").update(toSign + apiSecret).digest("hex");

  const url = new URL(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resource.resource_type}/download`,
  );
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("signature", signature);
  return url;
}

async function fetchBytes(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function downloadResource(resource) {
  const filePath = localPathFor(resource);
  const existing = await stat(filePath).catch(() => null);

  if (existing && (!resource.bytes || existing.size === resource.bytes)) {
    return { status: "skipped", filePath };
  }

  let bytes;
  let lastError;
  for (let attempt = 1; attempt <= 3 && !bytes; attempt++) {
    try {
      bytes = await fetchBytes(resource.secure_url);
    } catch (cdnError) {
      try {
        bytes = await fetchBytes(signedDownloadUrl(resource));
      } catch (apiError) {
        lastError = `cdn: ${cdnError.message}, api: ${apiError.message}`;
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  if (!bytes) return { status: "failed", filePath, error: lastError };

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, bytes);
  return { status: "downloaded", filePath };
}

async function main() {
  console.log(`Backing up Cloudinary account "${cloudName}" to ${outDir}`);
  if (folderFilter) console.log(`Only asset folder: ${folderFilter}`);

  const resources = [];
  for (const resourceType of RESOURCE_TYPES) {
    const listed = await listResources(resourceType);
    resources.push(...listed.filter(matchesFolder));
  }

  console.log(`\nFound ${resources.length} assets. Downloading...\n`);

  const manifest = [];
  const counts = { downloaded: 0, skipped: 0, failed: 0 };
  let next = 0;

  async function worker() {
    while (next < resources.length) {
      const index = next++;
      const resource = resources[index];
      const result = await downloadResource(resource);
      counts[result.status]++;

      manifest.push({
        public_id: resource.public_id,
        resource_type: resource.resource_type,
        format: resource.format ?? null,
        asset_folder: resource.asset_folder ?? resource.folder ?? null,
        bytes: resource.bytes ?? null,
        width: resource.width ?? null,
        height: resource.height ?? null,
        secure_url: resource.secure_url,
        local_path: path.relative(outDir, result.filePath),
        status: result.status,
        error: result.error ?? null,
      });

      const label = result.status === "failed" ? `FAILED (${result.error})` : result.status;
      console.log(`[${index + 1}/${resources.length}] ${label}: ${resource.public_id}`);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  await mkdir(outDir, { recursive: true });
  manifest.sort((a, b) => a.public_id.localeCompare(b.public_id));
  await writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log(
    `\nDone. downloaded=${counts.downloaded} skipped=${counts.skipped} failed=${counts.failed}`,
  );
  console.log(`Manifest: ${path.join(outDir, "manifest.json")}`);
  if (counts.failed > 0) {
    console.log("Some downloads failed — re-run the same command to retry them.");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
