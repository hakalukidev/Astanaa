import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { getAdminAuth, getAdminDb, isFirebaseAdminReady } from "@/lib/firebase-admin";

export const ADMIN_SESSION_COOKIE = "astanaa-admin-session";
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export type AdminRole = "super_admin" | "admin" | "moderator" | "promoter";

const VALID_ADMIN_ROLES: AdminRole[] = ["super_admin", "admin", "moderator", "promoter"];

export type AdminSession = {
  uid: string;
  email: string;
  role: AdminRole;
};

export const ADMINS_COLLECTION = "admins";

/** admin & super_admin can manage the whole catalog + moderate listings. */
export function isStaffAdmin(role: AdminRole) {
  return role === "super_admin" || role === "admin";
}

/** super_admin, admin, and moderator can all approve/reject/remove listings. */
export function canModerateListings(role: AdminRole) {
  return role === "super_admin" || role === "admin" || role === "moderator";
}

export function areAdminCredentialsConfigured() {
  return isFirebaseAdminReady();
}

/**
 * Exchanges a Firebase client ID token (from signInWithEmailAndPassword) for
 * a session cookie, but only if the signed-in user has an entry in the
 * `admins` Firestore collection. Anyone can have a Firebase Auth account —
 * only users listed in `admins` are allowed into the admin panel.
 */
export async function createAdminSessionCookie(
  idToken: string
): Promise<{ sessionCookie: string; session: AdminSession } | { error: string; status: number }> {
  if (!isFirebaseAdminReady()) {
    return {
      error: "Admin sign-in is not configured. Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env.local.",
      status: 500,
    };
  }

  const adminAuth = getAdminAuth();

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch {
    return { error: "Your sign-in expired. Please try again.", status: 401 };
  }

  const adminDoc = await getAdminDb().collection(ADMINS_COLLECTION).doc(decoded.uid).get();

  if (!adminDoc.exists) {
    return { error: "This account is not authorized for the admin panel.", status: 403 };
  }

  const role = adminDoc.data()?.role as AdminRole | undefined;

  if (!role || !VALID_ADMIN_ROLES.includes(role)) {
    return { error: "This account is not authorized for the admin panel.", status: 403 };
  }

  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_MS,
  });

  return {
    sessionCookie,
    session: {
      uid: decoded.uid,
      email: decoded.email ?? adminDoc.data()?.email ?? "",
      role,
    },
  };
}

export function setAdminSession(response: NextResponse, sessionCookie: string) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: sessionCookie,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS / 1000,
  });

  return response;
}

export function clearAdminSession(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}

/**
 * Reads the session cookie (if any), verifies it against Firebase Auth, and
 * re-checks the `admins` collection so a revoked admin is logged out on
 * their very next request.
 */
export async function getCurrentAdmin(): Promise<AdminSession | null> {
  if (!isFirebaseAdminReady()) {
    return null;
  }

  const sessionCookie = cookies().get(ADMIN_SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const adminDoc = await getAdminDb().collection(ADMINS_COLLECTION).doc(decoded.uid).get();

    if (!adminDoc.exists) {
      return null;
    }

    const role = adminDoc.data()?.role as AdminRole | undefined;

    if (!role || !VALID_ADMIN_ROLES.includes(role)) {
      return null;
    }

    return {
      uid: decoded.uid,
      email: decoded.email ?? adminDoc.data()?.email ?? "",
      role,
    };
  } catch {
    return null;
  }
}

export async function isAdminAuthenticated() {
  return (await getCurrentAdmin()) !== null;
}

export async function isSuperAdmin() {
  const admin = await getCurrentAdmin();
  return admin?.role === "super_admin";
}

/**
 * For legacy catalog pages (products/blog/slides/categories) and the
 * moderation queue — moderators and promoters don't get access, they're
 * bounced back to their own dashboard.
 */
export async function requireStaffAdmin(): Promise<AdminSession> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  if (!isStaffAdmin(admin.role)) {
    redirect(admin.role === "promoter" ? "/admin/my-posts" : "/admin/moderation");
  }

  return admin;
}

/** For the moderation queue — staff admins and moderators, not promoters. */
export async function requireModerator(): Promise<AdminSession> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  if (!canModerateListings(admin.role)) {
    redirect("/admin/my-posts");
  }

  return admin;
}
