// One-time data migration: pulls every Firebase Auth user's scrypt
// passwordHash + passwordSalt via the Admin SDK's listUsers() (no
// interactive `firebase login`/CLI export needed — the existing service
// account credentials already have access) and stores them on the matching
// Postgres User row as legacyScryptHash/legacyScryptSalt. The actual
// verification (and transparent upgrade to argon2 on first successful
// login) lives in lib/auth/password.ts's verifyUserPassword().
//
// Requires FIREBASE_SCRYPT_SIGNER_KEY / FIREBASE_SCRYPT_SALT_SEPARATOR /
// FIREBASE_SCRYPT_ROUNDS / FIREBASE_SCRYPT_MEM_COST to already be set in
// .env (from Firebase Console -> Authentication -> Users -> "Password Hash
// Parameters") — this script doesn't need them itself, but login won't work
// for migrated accounts until they're set.
//
// Usage (on the VPS):
//   node --env-file=.env --env-file=.env.local scripts/migrate-passwords-to-postgres.mjs

import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { PrismaClient } from "@prisma/client";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim().replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing Firebase Admin credentials.");
  process.exit(1);
}

const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const auth = getAuth(app);
const db = new PrismaClient();

async function main() {
  let pageToken;
  let totalUsers = 0;
  let withHash = 0;
  let updated = 0;
  let created = 0;
  let skipped = 0;

  do {
    const page = await auth.listUsers(1000, pageToken);
    pageToken = page.pageToken;

    for (const record of page.users) {
      totalUsers++;

      if (!record.passwordHash || !record.passwordSalt) {
        continue; // no password on this account (OAuth-only, or never set)
      }
      withHash++;

      const existing = await db.user.findUnique({ where: { id: record.uid } });

      if (existing) {
        await db.user.update({
          where: { id: record.uid },
          data: { legacyScryptHash: record.passwordHash, legacyScryptSalt: record.passwordSalt },
        });
        updated++;
        continue;
      }

      // Auth account exists but no Postgres row at all — this happens when
      // the Firestore `users` profile doc was never written (e.g. a quota
      // outage interrupted signup right after the Auth account was
      // created). Create a minimal row from the Auth record itself so the
      // account isn't lost; name/phone stay unset since nothing recorded
      // them anywhere reachable.
      if (!record.email) {
        console.warn(`passwords: uid ${record.uid} has no email on the Auth record — skipping.`);
        skipped++;
        continue;
      }

      try {
        await db.user.create({
          data: {
            id: record.uid,
            email: record.email.toLowerCase(),
            name: record.displayName || null,
            phone: record.phoneNumber || null,
            legacyScryptHash: record.passwordHash,
            legacyScryptSalt: record.passwordSalt,
          },
        });
        created++;
      } catch (error) {
        console.warn(`passwords: could not create a row for uid ${record.uid} (${record.email}) — ${error.message}`);
        skipped++;
      }
    }
  } while (pageToken);

  console.log(`Firebase Auth users seen: ${totalUsers}`);
  console.log(`With a password hash: ${withHash}`);
  console.log(`Updated existing Postgres rows: ${updated}`);
  console.log(`Created missing Postgres rows: ${created}`);
  console.log(`Skipped: ${skipped}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
