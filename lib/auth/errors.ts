/**
 * Carries a Firebase-Auth-style `.code` string (e.g. "auth/invalid-credential")
 * so existing UI code that switches on `error.code` keeps working unchanged
 * after the underlying auth system moved off Firebase.
 */
export class AuthError extends Error {
  code: string;

  constructor(code: string, message?: string) {
    super(message ?? code);
    this.name = "AuthError";
    this.code = code;
  }
}
