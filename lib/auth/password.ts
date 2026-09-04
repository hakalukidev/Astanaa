import "server-only";

import argon2 from "argon2";

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

/**
 * Verifies a password against a Firebase-Auth-exported scrypt hash, for the
 * one-time first login of an account imported from `firebase auth:export`
 * (see Phase 6 of the migration plan). NOT implemented yet — Firebase's
 * modified scrypt parameters need real exported test data to verify against
 * before this can be trusted with live logins, so it's deferred until the
 * actual user export happens rather than guessed at now.
 */
export async function verifyLegacyFirebasePassword(): Promise<boolean> {
  throw new Error(
    "verifyLegacyFirebasePassword is not implemented yet — see Phase 6 in the migration plan."
  );
}
