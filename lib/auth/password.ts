import "server-only";

import argon2 from "argon2";
import { FirebaseScrypt } from "firebase-scrypt";

import { db } from "@/lib/db";

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

let cachedScrypt: FirebaseScrypt | null | undefined;

/**
 * Firebase's project-wide scrypt parameters (Firebase Console -> Authentication
 * -> Users -> "Password Hash Parameters"). Not user secrets by themselves —
 * they're meaningless without a specific user's hash+salt — but still kept
 * server-only in env, never committed.
 */
function getLegacyScrypt(): FirebaseScrypt | null {
  if (cachedScrypt !== undefined) {
    return cachedScrypt;
  }

  const signerKey = process.env.FIREBASE_SCRYPT_SIGNER_KEY?.trim();
  const saltSeparator = process.env.FIREBASE_SCRYPT_SALT_SEPARATOR?.trim();
  const rounds = Number(process.env.FIREBASE_SCRYPT_ROUNDS);
  const memCost = Number(process.env.FIREBASE_SCRYPT_MEM_COST);

  if (!signerKey || !saltSeparator || !Number.isFinite(rounds) || !Number.isFinite(memCost)) {
    cachedScrypt = null;
    return cachedScrypt;
  }

  cachedScrypt = new FirebaseScrypt({ signerKey, saltSeparator, rounds, memCost });
  return cachedScrypt;
}

/**
 * Verifies a password against a Firebase-Auth-exported scrypt hash, for the
 * one-time first login of an account imported during Phase 6 of the
 * migration (see scripts/migrate-passwords-to-postgres.mjs). Returns false
 * (rather than throwing) if the project's scrypt parameters aren't
 * configured, so a login attempt just falls through to "invalid credentials"
 * instead of a 500.
 */
export async function verifyLegacyFirebasePassword(
  hash: string,
  salt: string,
  password: string
): Promise<boolean> {
  const scrypt = getLegacyScrypt();

  if (!scrypt) {
    return false;
  }

  try {
    return await scrypt.verify(password, salt, hash);
  } catch {
    return false;
  }
}

type PasswordBearingUser = {
  id: string;
  passwordHash: string | null;
  legacyScryptHash: string | null;
  legacyScryptSalt: string | null;
};

/**
 * Verifies a login attempt against whichever hash the account actually has.
 * New/already-migrated accounts just check the argon2 hash. An account
 * imported during Phase 6 (legacyScryptHash/Salt set, no argon2 hash yet)
 * is checked against the old Firebase scrypt hash instead — and on success,
 * transparently re-hashed with argon2 so every login after the first one
 * is a normal argon2 check and the legacy fields are cleared for good.
 */
export async function verifyUserPassword(user: PasswordBearingUser, password: string): Promise<boolean> {
  if (user.passwordHash) {
    return verifyPassword(user.passwordHash, password);
  }

  if (user.legacyScryptHash && user.legacyScryptSalt) {
    const valid = await verifyLegacyFirebasePassword(user.legacyScryptHash, user.legacyScryptSalt, password);

    if (valid) {
      const passwordHash = await hashPassword(password);
      await db.user.update({
        where: { id: user.id },
        data: { passwordHash, legacyScryptHash: null, legacyScryptSalt: null },
      });
    }

    return valid;
  }

  return false;
}
