import { NextResponse } from "next/server";

import {
  buildGoogleAuthUrl,
  createOAuthSecrets,
  getGoogleConfig,
  getGoogleRedirectUri,
  GOOGLE_COOKIE_MAX_AGE_SECONDS,
  GOOGLE_STATE_COOKIE,
  GOOGLE_VERIFIER_COOKIE,
} from "@/lib/auth/google";

// GET - starts "Sign in with Google": remembers a one-time state + PKCE
// verifier in short-lived cookies, then sends the browser to Google.
export async function GET(request: Request) {
  const config = getGoogleConfig();

  if (!config) {
    return NextResponse.redirect(new URL("/login?error=google-not-configured", request.url));
  }

  const { state, codeVerifier, codeChallenge } = createOAuthSecrets();
  const response = NextResponse.redirect(
    buildGoogleAuthUrl({
      clientId: config.clientId,
      redirectUri: getGoogleRedirectUri(request),
      state,
      codeChallenge,
    })
  );

  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth/google",
    maxAge: GOOGLE_COOKIE_MAX_AGE_SECONDS,
  };
  response.cookies.set({ name: GOOGLE_STATE_COOKIE, value: state, ...cookieOptions });
  response.cookies.set({ name: GOOGLE_VERIFIER_COOKIE, value: codeVerifier, ...cookieOptions });

  return response;
}
