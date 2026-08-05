import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "km-admin-session";

type AdminCredentials = {
  username: string;
  password: string;
};

function getAdminCredentials(): AdminCredentials | null {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();

  if (!username || !password) {
    return null;
  }

  return { username, password };
}

function buildSessionValue({ username, password }: AdminCredentials) {
  const signature = createHmac("sha256", password).update(username).digest("hex");

  return `${username}:${signature}`;
}

function isMatchingValue(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export function areAdminCredentialsConfigured() {
  return Boolean(getAdminCredentials());
}

export function validateAdminLogin(username: string, password: string) {
  const credentials = getAdminCredentials();

  if (!credentials) {
    return false;
  }

  return credentials.username === username.trim() && credentials.password === password;
}

export function setAdminSession(response: NextResponse) {
  const credentials = getAdminCredentials();

  if (!credentials) {
    return response;
  }

  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: buildSessionValue(credentials),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
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

export function isAdminAuthenticated() {
  const credentials = getAdminCredentials();

  if (!credentials) {
    return false;
  }

  const sessionValue = cookies().get(ADMIN_SESSION_COOKIE)?.value;

  if (!sessionValue) {
    return false;
  }

  return isMatchingValue(sessionValue, buildSessionValue(credentials));
}
