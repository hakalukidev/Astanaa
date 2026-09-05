// One-time data migration: copies the settings/{about,footer,
// rulesAndRestrictions,termsAndConditions} docs and the siteVisits
// collection from Firestore into Postgres.
//
// Usage (on the VPS):
//   node --env-file=.env --env-file=.env.local scripts/migrate-settings-to-postgres.mjs

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

const SETTINGS_DOC_TO_KEY = {
  about: "about",
  footer: "footer",
  rulesAndRestrictions: "rules",
  termsAndConditions: "terms",
};

async function migrateSettings() {
  let count = 0;
  for (const [docId, key] of Object.entries(SETTINGS_DOC_TO_KEY)) {
    const snapshot = await firestore.collection("settings").doc(docId).get();
    if (!snapshot.exists) continue;

    const data = snapshot.data();
    const { updatedAt, ...value } = data;

    await db.siteSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
    count++;
  }
  console.log(`settings: migrated ${count} of ${Object.keys(SETTINGS_DOC_TO_KEY).length}`);
}

async function migrateSiteVisits() {
  const snapshot = await firestore.collection("siteVisits").get();
  let count = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const rawCount = typeof data.count === "number" ? data.count : 0;

    await db.siteVisit.upsert({
      where: { date: doc.id },
      create: { date: doc.id, count: rawCount },
      update: { count: rawCount },
    });
    count++;
  }
  console.log(`siteVisits: migrated ${count} of ${snapshot.size}`);
}

async function main() {
  await migrateSettings();
  await migrateSiteVisits();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
