// One-time data migration: copies propertyTypeCategories, listingPurposes,
// and locationNodes from Firestore into Postgres. Same-id preservation as
// migrate-listings-to-postgres.mjs (location nodes especially need this —
// their parentId references stay valid without any remapping).
//
// Usage (on the VPS):
//   node --env-file=.env --env-file=.env.local scripts/migrate-categories-to-postgres.mjs

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { PrismaClient } from "@prisma/client";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim().replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing Firebase Admin credentials.");
  process.exit(1);
}

const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const firestore = getFirestore(app);
const db = new PrismaClient();

function tsToDate(value) {
  if (!value) return new Date();
  if (typeof value.toDate === "function") return value.toDate();
  if (typeof value === "number") return new Date(value);
  return new Date();
}

async function migratePropertyTypeCategories() {
  const snapshot = await firestore.collection("propertyTypeCategories").get();
  let count = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const existing = await db.propertyTypeCategory.findUnique({ where: { id: doc.id } });
    if (existing) continue;
    await db.propertyTypeCategory.create({
      data: {
        id: doc.id,
        purpose: data.purpose || "sale",
        en: data.en || "",
        bn: data.bn || "",
        icon: data.icon || "Building2",
        order: typeof data.order === "number" ? data.order : 0,
        createdAt: tsToDate(data.createdAt),
      },
    });
    count++;
  }
  console.log(`propertyTypeCategories: migrated ${count} of ${snapshot.size}`);
}

async function migrateListingPurposes() {
  const snapshot = await firestore.collection("listingPurposes").get();
  let count = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const existing = await db.listingPurpose.findUnique({ where: { id: doc.id } });
    if (existing) continue;
    await db.listingPurpose.create({
      data: {
        id: doc.id,
        key: data.key || doc.id,
        en: data.en || "",
        bn: data.bn || "",
        icon: data.icon || "Tag",
        order: typeof data.order === "number" ? data.order : 0,
        createdAt: tsToDate(data.createdAt),
      },
    });
    count++;
  }
  console.log(`listingPurposes: migrated ${count} of ${snapshot.size}`);
}

async function migrateLocationNodes() {
  const snapshot = await firestore.collection("locationNodes").get();
  let count = 0;
  // Insert parents before children so the self-referencing FK never points
  // at a not-yet-existing row — sort by whether parentId is null first,
  // then rely on retrying failed inserts in a second pass for deeper levels.
  const docs = snapshot.docs;
  const pending = new Map(docs.map((d) => [d.id, d]));

  let progressed = true;
  while (pending.size > 0 && progressed) {
    progressed = false;
    for (const [id, doc] of [...pending]) {
      const data = doc.data();
      const parentId = typeof data.parentId === "string" ? data.parentId : null;

      if (parentId && pending.has(parentId)) {
        continue; // parent not inserted yet, try again next pass
      }

      const existing = await db.locationNode.findUnique({ where: { id } });
      if (!existing) {
        await db.locationNode.create({
          data: {
            id,
            parentId,
            en: data.en || "",
            bn: data.bn || "",
            order: typeof data.order === "number" ? data.order : 0,
            manualOrder: data.manualOrder === true,
            createdAt: tsToDate(data.createdAt),
          },
        });
        count++;
      }
      pending.delete(id);
      progressed = true;
    }
  }

  if (pending.size > 0) {
    console.warn(`locationNodes: ${pending.size} nodes skipped — parent never resolved (orphaned parentId).`);
  }
  console.log(`locationNodes: migrated ${count} of ${snapshot.size}`);
}

async function main() {
  await migratePropertyTypeCategories();
  await migrateListingPurposes();
  await migrateLocationNodes();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
