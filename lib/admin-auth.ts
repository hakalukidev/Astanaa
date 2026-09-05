import "server-only";

import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { verifyUserPassword } from "@/lib/auth/password";
import {
  clearSessionCookie,
  createUserSession,
  destroySession,
  getSessionUser,
  getSessionToken,
  setSessionCookie,
} from "@/lib/auth/session";

export type AdminRole = "super_admin" | "admin" | "moderator" | "promoter";

const VALID_ADMIN_ROLES: AdminRole[] = ["super_admin", "admin", "moderator", "promoter"];

export type AdminSession = {
  uid: string;
  email: string;
  name: string;
  role: AdminRole;
};

/** admin & super_admin can manage the whole catalog + moderate listings. */
export function isStaffAdmin(role: AdminRole) {
  return role === "super_admin" || role === "admin";
}

/** super_admin, admin, and moderator can all approve/reject/remove listings. */
export function canModerateListings(role: AdminRole) {
  return role === "super_admin" || role === "admin" || role === "moderator";
}

export function areAdminCredentialsConfigured() {
  return true;
}

function toAdminRole(role: string | null): AdminRole | null {
  return role && VALID_ADMIN_ROLES.includes(role.toLowerCase() as AdminRole)
    ? (role.toLowerCase() as AdminRole)
    : null;
}

/**
 * Verifies an admin's email/password directly (no more Firebase ID token —
 * the client posts credentials straight to the login route, which calls
 * this), and mints a session cookie if they hold a staff-ish role. Anyone
 * can have a regular account; only accounts with a non-null `role` in the
 * unified `users` table are allowed into the admin panel.
 */
export async function createAdminSessionFromCredentials(
  email: string,
  password: string
): Promise<{ token: string; expiresAt: Date; session: AdminSession } | { error: string; status: number }> {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  if (!user || (!user.passwordHash && !user.legacyScryptHash)) {
    return { error: "Invalid email or password.", status: 401 };
  }

  const role = toAdminRole(user.role);

  if (!role) {
    return { error: "This account is not authorized for the admin panel.", status: 403 };
  }

  const validPassword = await verifyUserPassword(user, password);

  if (!validPassword) {
    return { error: "Invalid email or password.", status: 401 };
  }

  const { token, expiresAt } = await createUserSession(user.id);

  return {
    token,
    expiresAt,
    session: {
      uid: user.id,
      email: user.email,
      name: user.name || user.email,
      role,
    },
  };
}

export function setAdminSession(response: NextResponse, token: string, expiresAt: Date) {
  return setSessionCookie(response, token, expiresAt);
}

export async function clearAdminSession(response: NextResponse) {
  const token = getSessionToken();
  if (token) {
    await destroySession(token);
  }
  return clearSessionCookie(response);
}

/**
 * Reads the session cookie (if any) and returns the signed-in user's admin
 * role/profile, re-checking the live `users` row on every call so a revoked
 * admin (role cleared) is logged out on their very next request.
 */
export async function getCurrentAdmin(): Promise<AdminSession | null> {
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  const role = toAdminRole(user.role);

  if (!role) {
    return null;
  }

  return {
    uid: user.id,
    email: user.email,
    name: user.name || user.email,
    role,
  };
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

/**
 * For super-admin-only settings pages (listing purposes, property type
 * categories, About Us, Terms & Conditions, Rules & Restrictions, Footer) —
 * regular admins don't get access, they're bounced back to the posts list.
 */
export async function requireSuperAdmin(): Promise<AdminSession> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  if (admin.role !== "super_admin") {
    redirect(admin.role === "promoter" ? "/admin/my-posts" : admin.role === "moderator" ? "/admin/moderation" : "/admin/posts");
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

/** Staff-admin CRUD over admin accounts — used by app/api/admin/users/*. */
export async function listAdminUsers() {
  const users = await db.user.findMany({
    where: { role: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return users.map((user) => ({
    uid: user.id,
    email: user.email,
    name: user.name || user.email,
    role: (user.role as string).toLowerCase() as AdminRole,
    createdAtMs: user.createdAt.getTime(),
  }));
}

export async function countSuperAdmins() {
  return db.user.count({ where: { role: "SUPER_ADMIN" } });
}
