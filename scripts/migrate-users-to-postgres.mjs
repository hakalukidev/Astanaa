// One-time data migration: copies the real `users` (buyer/seller profile:
// name/phone/email) and `admins` (role) Firestore collections into
// Postgres, overwriting the placeholder "shadow" rows that earlier
// migration passes (listings/chat/buyRequests) created using only whatever
// name was frozen on those documents and a synthesized placeholder email.
//
// Does NOT migrate passwords — that's a separate pass (needs `firebase
// auth:export`, see scripts/migrate-passwords-to-postgres.mjs).
//
// Usage (on the VPS):
//   node --env-file=.env --env-file=.env.local scripts/migrate-users-to-postgres.mjs

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

const ROLE_TO_ENUM = {
  super_admin: "SUPER_ADMIN",
  admin: "ADMIN",
  moderator: "MODERATOR",
  promoter: "PROMOTER",
};

async function migrateUsers() {
  const snapshot = await firestore.collection("users").get();
  let updated = 0;
  let created = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const email = typeof data.email === "string" && data.email.trim() ? data.email.trim().toLowerCase() : null;
    const phone = typeof data.phone === "string" && data.phone.trim() ? data.phone.trim() : null;
    const name = typeof data.name === "string" ? data.name : null;

    if (!email) {
      console.warn(`users: skipping ${doc.id} — no email on the Firestore doc.`);
      skipped++;
      continue;
    }

    try {
      const existing = await db.user.findUnique({ where: { id: doc.id } });

      if (existing) {
        await db.user.update({ where: { id: doc.id }, data: { name, phone, email } });
        updated++;
      } else {
        await db.user.create({
          data: { id: doc.id, name, phone, email, createdAt: tsToDate(data.createdAt) },
        });
        created++;
      }
    } catch (error) {
      console.warn(`users: skipping ${doc.id} (${email}) — ${error.message}`);
      skipped++;
    }
  }

  console.log(`users: ${updated} updated, ${created} created, ${skipped} skipped (of ${snapshot.size})`);
}

async function migrateAdmins() {
  const snapshot = await firestore.collection("admins").get();
  let updated = 0;
  let created = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const email = typeof data.email === "string" && data.email.trim() ? data.email.trim().toLowerCase() : null;
    const role = ROLE_TO_ENUM[data.role];

    if (!role) {
      console.warn(`admins: skipping ${doc.id} — unrecognized role "${data.role}".`);
      skipped++;
      continue;
    }

    try {
      const existing = await db.user.findUnique({ where: { id: doc.id } });

      if (existing) {
        await db.user.update({ where: { id: doc.id }, data: { role, name: data.name || existing.name } });
        updated++;
      } else if (email) {
        await db.user.create({
          data: { id: doc.id, email, name: data.name || null, role, createdAt: tsToDate(data.createdAt) },
        });
        created++;
      } else {
        console.warn(`admins: skipping ${doc.id} — no matching users doc and no email to create one.`);
        skipped++;
      }
    } catch (error) {
      console.warn(`admins: skipping ${doc.id} — ${error.message}`);
      skipped++;
    }
  }

  console.log(`admins: ${updated} updated, ${created} created, ${skipped} skipped (of ${snapshot.size})`);
}

async function main() {
  await migrateUsers();
  await migrateAdmins();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
