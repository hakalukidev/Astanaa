import "server-only";

import { createHmac, randomInt } from "crypto";

/**
 * Stateless text captcha: no DB row needed. The code is signed with an HMAC
 * so the client can hold the (code, expiresAt, signature) triple and hand it
 * back on submit — we just recheck the signature instead of looking anything
 * up. Cheap bot deterrent, not a strong captcha (the code round-trips through
 * the client either way, since it's already shown on screen).
 */

const CAPTCHA_TTL_MS = 5 * 60 * 1000; // 5 minutes
// Characters chosen to avoid visual ambiguity (no 0/O, 1/I/L).
const CAPTCHA_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export type CaptchaChallenge = {
  code: string;
  expiresAt: number;
  signature: string;
};

export function getSigningSecret() {
  const secret = process.env.OTP_SIGNING_SECRET?.trim();

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("OTP_SIGNING_SECRET is not set. Add it to your environment before going live.");
  }

  console.warn(
    "[captcha] OTP_SIGNING_SECRET is not set — using an insecure dev-only fallback. Set it in .env.local."
  );

  return "dev-only-insecure-fallback-secret";
}

function sign(code: string, expiresAt: number) {
  return createHmac("sha256", getSigningSecret()).update(`${code}:${expiresAt}`).digest("hex");
}

export function generateCaptcha(): CaptchaChallenge {
  let code = "";

  for (let i = 0; i < 5; i += 1) {
    code += CAPTCHA_ALPHABET[randomInt(CAPTCHA_ALPHABET.length)];
  }

  const expiresAt = Date.now() + CAPTCHA_TTL_MS;

  return { code, expiresAt, signature: sign(code, expiresAt) };
}

export function verifyCaptcha(input: {
  code?: string;
  expiresAt?: number;
  signature?: string;
  answer?: string;
}): { ok: true } | { ok: false; error: string } {
  const { code, expiresAt, signature, answer } = input;

  if (!code || !expiresAt || !signature || !answer) {
    return { ok: false, error: "Captcha is required." };
  }

  if (Date.now() > expiresAt) {
    return { ok: false, error: "Captcha expired. Please try again." };
  }

  if (sign(code, expiresAt) !== signature) {
    return { ok: false, error: "Invalid captcha." };
  }

  if (answer.trim().toUpperCase() !== code) {
    return { ok: false, error: "Captcha does not match." };
  }

  return { ok: true };
}
