// One-time data migration: copies the `slides` Firestore collection (the
// live homepage hero/promotional banner carousel) into Postgres.
//
// Usage (on the VPS):
//   node --env-file=.env --env-file=.env.local scripts/migrate-slides-to-postgres.mjs

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

async function main() {
  const snapshot = await firestore.collection("slides").get();
  let migrated = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const existing = await db.slide.findUnique({ where: { id: doc.id } });

    if (existing) {
      skipped++;
      continue;
    }

    await db.slide.create({
      data: {
        id: doc.id,
        title: String(data.title ?? ""),
        image: String(data.image ?? ""),
        imagePublicId: String(data.imagePublicId ?? ""),
        order: Number(data.order ?? 0),
        isActive: Boolean(data.isActive ?? true),
        tag: String(data.tag ?? "Featured"),
        cta: String(data.cta ?? "VIEW PRODUCTS"),
        ctaHref: String(data.ctaHref ?? "/products"),
        bg: String(data.bg ?? "bg-slate-100"),
        createdAt: tsToDate(data.createdAt),
        updatedAt: tsToDate(data.updatedAt),
      },
    });
    migrated++;
  }

  console.log(`slides: migrated ${migrated}, skipped ${skipped} already-migrated (of ${snapshot.size})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
