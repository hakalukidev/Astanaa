import "server-only";

import { createHash, createHmac, randomInt } from "crypto";

import { getSigningSecret } from "@/lib/captcha";
import { getAdminDb } from "@/lib/firebase-admin";
import { otpEmailHtml, sendEmail } from "@/lib/mailer";
import { normalizeBdPhone, sendSms, toGatewayFormat } from "@/lib/sms";

export type OtpChannel = "email" | "phone";
export type OtpPurpose = "signup" | "reset";

const OTP_COLLECTION = "otps";
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute between sends

/** Normalizes a raw email/phone into the identifier we key OTP docs and lookups by. */
export function normalizeIdentifier(channel: OtpChannel, raw: string): string | null {
  if (channel === "email") {
    const email = raw.trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
  }

  return normalizeBdPhone(raw);
}

function docId(purpose: OtpPurpose, identifier: string) {
  return `${purpose}_${identifier}`;
}

function hashCode(identifier: string, purpose: OtpPurpose, code: string) {
  return createHash("sha256").update(`${identifier}:${purpose}:${code}:${getSigningSecret()}`).digest("hex");
}

export async function sendOtp(input: {
  identifier: string;
  channel: OtpChannel;
  purpose: OtpPurpose;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { identifier, channel, purpose } = input;
  const db = getAdminDb();
  const ref = db.collection(OTP_COLLECTION).doc(docId(purpose, identifier));

  const existing = await ref.get();
  const existingData = existing.data();

  if (existingData && Date.now() - existingData.createdAt < RESEND_COOLDOWN_MS) {
    return { ok: false, error: "Please wait a moment before requesting another code." };
  }

  const code = randomInt(100000, 1000000).toString();

  await ref.set({
    channel,
    codeHash: hashCode(identifier, purpose, code),
    attempts: 0,
    createdAt: Date.now(),
    expiresAt: Date.now() + OTP_TTL_MS,
  });

  try {
    if (channel === "email") {
      await sendEmail(identifier, "Your Astanaa.com verification code", otpEmailHtml(code));
    } else {
      await sendSms(toGatewayFormat(identifier), `Your Astanaa.com verification code is ${code}. It expires in 5 minutes.`);
    }
  } catch (error) {
    await ref.delete().catch(() => undefined);
    console.error(`[otp] failed to send via ${channel}:`, error);
    return { ok: false, error: "Could not send the code. Please try again." };
  }

  return { ok: true };
}

export async function verifyOtp(input: {
  identifier: string;
  purpose: OtpPurpose;
  code: string;
}): Promise<{ ok: true; verifiedToken: string } | { ok: false; error: string }> {
  const { identifier, purpose, code } = input;
  const db = getAdminDb();
  const ref = db.collection(OTP_COLLECTION).doc(docId(purpose, identifier));
  const snapshot = await ref.get();
  const data = snapshot.data();

  if (!data) {
    return { ok: false, error: "Request a new code first." };
  }

  if (Date.now() > data.expiresAt) {
    await ref.delete().catch(() => undefined);
    return { ok: false, error: "Code expired. Please request a new one." };
  }

  if (data.attempts >= MAX_ATTEMPTS) {
    await ref.delete().catch(() => undefined);
    return { ok: false, error: "Too many attempts. Please request a new code." };
  }

  if (data.codeHash !== hashCode(identifier, purpose, code)) {
    await ref.update({ attempts: data.attempts + 1 });
    return { ok: false, error: "Incorrect code. Please try again." };
  }

  await ref.delete();

  return { ok: true, verifiedToken: issueVerifiedToken(identifier, purpose) };
}

// Short-lived signed token proving `identifier` completed OTP verification
// for `purpose`, so a later step (finishing signup, resetting the password)
// doesn't need the raw code resubmitted.
const VERIFIED_TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function issueVerifiedToken(identifier: string, purpose: OtpPurpose): string {
  const expiresAt = Date.now() + VERIFIED_TOKEN_TTL_MS;
  const payload = `${identifier}:${purpose}:${expiresAt}`;
  const signature = createHmac("sha256", getSigningSecret()).update(payload).digest("hex");

  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export function checkVerifiedToken(token: string, identifier: string, purpose: OtpPurpose): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [tokenIdentifier, tokenPurpose, expiresAtRaw, signature] = decoded.split(":");
    const expiresAt = Number(expiresAtRaw);
    const payload = `${tokenIdentifier}:${tokenPurpose}:${expiresAtRaw}`;
    const expected = createHmac("sha256", getSigningSecret()).update(payload).digest("hex");

    return (
      tokenIdentifier === identifier &&
      tokenPurpose === purpose &&
      Date.now() <= expiresAt &&
      signature === expected
    );
  } catch {
    return false;
  }
}
