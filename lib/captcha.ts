import "server-only";

/**
 * Cloudflare Turnstile verification (server-only). The widget itself runs
 * entirely client-side (components/auth/Captcha.tsx) — Cloudflare shows the
 * "Verify you are human" / green-check UI and hands back a one-time token.
 * All this does is ask Cloudflare's siteverify endpoint whether that token
 * is genuine and unused.
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Cloudflare's published "always passes" test secret key — used only when
// TURNSTILE_SECRET_KEY isn't set, so local dev has a working widget without
// a real Turnstile site registered in the Cloudflare dashboard. Pairs with
// the matching test site key in components/auth/Captcha.tsx.
const DEV_FALLBACK_SECRET_KEY = "1x0000000000000000000000000000000AA";

function getSecretKey() {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("TURNSTILE_SECRET_KEY is not set. Add it to your environment before going live.");
  }

  console.warn(
    "[captcha] TURNSTILE_SECRET_KEY is not set — using Cloudflare's dev-only test secret. Set it in .env.local."
  );

  return DEV_FALLBACK_SECRET_KEY;
}

export async function verifyCaptcha(
  token: string | undefined | null,
  remoteIp?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!token) {
    return { ok: false, error: "Please complete the captcha." };
  }

  const body = new URLSearchParams({ secret: getSecretKey(), response: token });
  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  try {
    const response = await fetch(VERIFY_URL, { method: "POST", body });
    const data = (await response.json().catch(() => null)) as { success?: boolean } | null;

    if (!data?.success) {
      return { ok: false, error: "Captcha verification failed. Please try again." };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Could not verify captcha. Please try again." };
  }
}
