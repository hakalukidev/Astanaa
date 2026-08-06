// One-time bootstrap: creates the very first super admin so someone can log
// in to /admin and start creating more admin users from the panel itself.
//
// Usage:
//   npm run seed:admin -- you@example.com "a-strong-password"
//
// Requires .env.local to already have:
//   NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
// (npm run seed:admin loads .env.local automatically via `node --env-file`)

import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const [, , emailArg, passwordArg] = process.argv;

if (!emailArg || !passwordArg) {
  console.error("Usage: npm run seed:admin -- <email> <password>");
  process.exit(1);
}

const email = emailArg.trim().toLowerCase();
const password = passwordArg;

if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error(
    "Missing Firebase Admin credentials. Set NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local."
  );
  process.exit(1);
}

const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const auth = getAuth(app);
const db = getFirestore(app);

async function main() {
  let uid;

  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    console.log(`Found existing Firebase Auth user for ${email}, reusing it.`);
  } catch {
    const created = await auth.createUser({ email, password });
    uid = created.uid;
    console.log(`Created Firebase Auth user for ${email}.`);
  }

  await db.collection("admins").doc(uid).set(
    {
      email,
      role: "super_admin",
      createdAt: new Date(),
      createdBy: "seed-script",
    },
    { merge: true }
  );

  console.log(`\n✅ ${email} is now a super admin. Sign in at /admin/login.`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Failed to create the admin user:", error.message ?? error);
  process.exit(1);
});
