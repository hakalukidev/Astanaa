import "server-only";

import { createHash, randomBytes } from "crypto";

// "Sign in with Google" via the OAuth 2.0 authorization-code flow with PKCE.
// Credentials come from Google Cloud Console → Google Auth Platform →
// Clients ("Astanaa Web"); its Authorized redirect URIs must list
// <site>/api/auth/google/callback for every origin we run on.

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

export const GOOGLE_STATE_COOKIE = "astanaa-google-state";
export const GOOGLE_VERIFIER_COOKIE = "astanaa-google-verifier";
export const GOOGLE_COOKIE_MAX_AGE_SECONDS = 10 * 60;

export type GoogleProfile = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
};

export function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return null;
  }

  return { clientId, clientSecret };
}

/**
 * Must match a redirect URI registered in Google Cloud exactly. nginx doesn't
 * forward the original scheme, so production is assumed to be https.
 */
export function getGoogleRedirectUri(request: Request) {
  const override = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (override) {
    return override;
  }

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

  return `${protocol}://${host}/api/auth/google/callback`;
}

function base64Url(buffer: Buffer) {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function createOAuthSecrets() {
  const state = base64Url(randomBytes(24));
  const codeVerifier = base64Url(randomBytes(48));
  const codeChallenge = base64Url(createHash("sha256").update(codeVerifier).digest());

  return { state, codeVerifier, codeChallenge };
}

export function buildGoogleAuthUrl(options: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}) {
  const url = new URL(AUTH_ENDPOINT);
  url.searchParams.set("client_id", options.clientId);
  url.searchParams.set("redirect_uri", options.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", options.state);
  url.searchParams.set("code_challenge", options.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");

  return url.toString();
}

/**
 * Exchanges the authorization code for tokens and reads the user's identity
 * from the ID token. The token comes straight from Google's token endpoint
 * over TLS (not from the browser), so its claims can be trusted without
 * re-verifying the signature.
 */
export async function fetchGoogleProfile(options: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
  codeVerifier: string;
}): Promise<GoogleProfile | null> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: options.clientId,
      client_secret: options.clientSecret,
      redirect_uri: options.redirectUri,
      code: options.code,
      code_verifier: options.codeVerifier,
      grant_type: "authorization_code",
    }).toString(),
    cache: "no-store",
  });

  const tokens = (await response.json().catch(() => null)) as { id_token?: string } | null;

  if (!response.ok || !tokens?.id_token) {
    console.error("Google token exchange failed:", response.status, tokens);
    return null;
  }

  const [, payload] = tokens.id_token.split(".");
  const claims = JSON.parse(Buffer.from(payload ?? "", "base64url").toString("utf8")) as {
    sub?: string;
    aud?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
  };

  if (!claims.sub || !claims.email || claims.aud !== options.clientId) {
    return null;
  }

  return {
    sub: claims.sub,
    email: claims.email.trim().toLowerCase(),
    emailVerified: claims.email_verified === true,
    name: claims.name?.trim() || null,
  };
}
