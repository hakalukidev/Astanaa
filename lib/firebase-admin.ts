import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Server-only Firebase Admin SDK. Used for verifying login sessions and for
 * managing admin users (create/list/update role/delete) from API routes.
 *
 * Needs a Firebase service account:
 *   Firebase Console → Project Settings → Service Accounts → Generate new private key
 * Put the values in .env.local:
 *   FIREBASE_CLIENT_EMAIL=...
 *   FIREBASE_PRIVATE_KEY="...."   (keep the \n escapes, see .env.example)
 */
function getAdminCredentials() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim().replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return { projectId, clientEmail, privateKey };
}

let cachedApp: App | null | undefined;

function getAdminApp(): App | null {
  if (cachedApp !== undefined) {
    return cachedApp;
  }

  const credentials = getAdminCredentials();

  if (!credentials) {
    cachedApp = null;
    return cachedApp;
  }

  cachedApp = getApps()[0] ?? initializeApp({ credential: cert(credentials) });

  return cachedApp;
}

export function isFirebaseAdminReady() {
  return Boolean(getAdminApp());
}

export function getAdminAuth() {
  const app = getAdminApp();

  if (!app) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env.local."
    );
  }

  return getAuth(app);
}

export function getAdminDb() {
  const app = getAdminApp();

  if (!app) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env.local."
    );
  }

  return getFirestore(app);
}
