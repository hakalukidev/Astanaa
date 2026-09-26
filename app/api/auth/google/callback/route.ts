import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  fetchGoogleProfile,
  getGoogleConfig,
  getGoogleRedirectUri,
  GOOGLE_STATE_COOKIE,
  GOOGLE_VERIFIER_COOKIE,
} from "@/lib/auth/google";
import { createUserSession, setSessionCookie } from "@/lib/auth/session";
import { db } from "@/lib/db";

function redirectTo(request: Request, path: string) {
  // Build on the registered redirect URI's origin — behind nginx request.url
  // is plain http even when the visitor is on https.
  const response = NextResponse.redirect(new URL(path, getGoogleRedirectUri(request)));
  response.cookies.delete({ name: GOOGLE_STATE_COOKIE, path: "/api/auth/google" });
  response.cookies.delete({ name: GOOGLE_VERIFIER_COOKIE, path: "/api/auth/google" });
  return response;
}

// GET - Google sends the browser back here. Finds the account by Google id,
// else links it to an existing account with the same (Google-verified)
// email, else creates a new one — then signs in like the password login.
export async function GET(request: Request) {
  const config = getGoogleConfig();
  const params = new URL(request.url).searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const savedState = cookies().get(GOOGLE_STATE_COOKIE)?.value;
  const codeVerifier = cookies().get(GOOGLE_VERIFIER_COOKIE)?.value;

  if (!config || !code || !state || !savedState || state !== savedState || !codeVerifier) {
    return redirectTo(request, "/login?error=google");
  }

  const profile = await fetchGoogleProfile({
    ...config,
    redirectUri: getGoogleRedirectUri(request),
    code,
    codeVerifier,
  });

  if (!profile || !profile.emailVerified) {
    return redirectTo(request, "/login?error=google");
  }

  let user = await db.user.findUnique({ where: { googleId: profile.sub } });

  if (!user) {
    const existing = await db.user.findUnique({ where: { email: profile.email } });

    user = existing
      ? await db.user.update({
          where: { id: existing.id },
          data: { googleId: profile.sub, name: existing.name ?? profile.name },
        })
      : await db.user.create({
          data: { email: profile.email, name: profile.name, googleId: profile.sub },
        });
  }

  const { token, expiresAt } = await createUserSession(user.id);

  return setSessionCookie(redirectTo(request, "/"), token, expiresAt);
}
