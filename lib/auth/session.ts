import "server-only";

import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import { db } from "@/lib/db";

export const SESSION_COOKIE = "astanaa-session";
// Matches how long Firebase's own client-side session persistence kept
// people signed in in practice — effectively "stays logged in".
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

export type SessionUser = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string;
  role: "PROMOTER" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN" | null;
};

const SESSION_USER_SELECT = {
  id: true,
  name: true,
  phone: true,
  email: true,
  role: true,
} as const;

export async function createUserSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

  await db.session.create({ data: { id: token, userId, expiresAt } });

  return { token, expiresAt };
}

export function setSessionCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return response;
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE,
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
 * Reads the session cookie (if any) and returns the signed-in user, or null.
 * A live DB lookup rather than a stateless token, so logout/revocation and
 * role changes take effect on the very next request — no blocklist needed.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = await db.session.findUnique({
    where: { id: token },
    select: { expiresAt: true, user: { select: SESSION_USER_SELECT } },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return session.user;
}

export function getSessionToken(): string | null {
  return cookies().get(SESSION_COOKIE)?.value ?? null;
}

export async function destroySession(token: string) {
  await db.session.delete({ where: { id: token } }).catch(() => {});
}

/** Kicks every device a user is currently signed in on — used when their
 * password is reset by an admin, mirroring Firebase's revokeRefreshTokens(). */
export async function revokeAllUserSessions(userId: string) {
  await db.session.deleteMany({ where: { userId } });
}
