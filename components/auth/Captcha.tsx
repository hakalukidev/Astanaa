"use client";

import { useEffect, useId, useRef } from "react";

import { Label } from "@/components/ui/label";

/** The token string a solved Turnstile challenge hands back — sent to the
 * server as-is; lib/captcha.ts checks it with Cloudflare on submit. */
export type CaptchaPayload = string;

// Cloudflare's published "always passes" test site key — used only when
// NEXT_PUBLIC_TURNSTILE_SITE_KEY isn't set, so local dev renders a working
// widget without a real Turnstile site registered in Cloudflare's
// dashboard. Pairs with the matching test secret key in lib/captcha.ts.
const DEV_FALLBACK_SITE_KEY = "1x00000000000000000000AA";
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || DEV_FALLBACK_SITE_KEY;

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

type TurnstileRenderOptions = {
  sitekey: string;
  callback: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
      remove: (widgetId: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

// Loaded once and shared across every <Captcha> on the page (e.g. if a form
// somehow mounts more than one), instead of injecting the script tag again.
let scriptLoadPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.turnstile) {
    return Promise.resolve();
  }

  if (!scriptLoadPromise) {
    scriptLoadPromise = new Promise((resolve) => {
      window.onloadTurnstileCallback = () => resolve();
      const script = document.createElement("script");
      script.src = `${SCRIPT_SRC}?onload=onloadTurnstileCallback&render=explicit`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    });
  }

  return scriptLoadPromise;
}

/**
 * Cloudflare Turnstile widget: proves the visitor isn't a bot (usually just
 * a quiet "Success!" check, occasionally a small challenge) without a code
 * to type. Reports the resulting one-time token back to the parent via
 * onChange so it can attach it to whatever request it's guarding — null
 * whenever there isn't currently a valid token (not yet solved, expired, or
 * errored). Pass a stable setState function as `onChange` to avoid
 * re-render loops.
 */
export function Captcha({
  label,
  onChange,
}: {
  label: string;
  onChange: (token: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const id = useId();

  useEffect(() => {
    let cancelled = false;

    loadTurnstileScript().then(() => {
      if (cancelled || !containerRef.current || !window.turnstile) {
        return;
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token) => onChange(token),
        "expired-callback": () => onChange(null),
        "error-callback": () => onChange(null),
      });
    });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      onChange(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div id={id} ref={containerRef} />
    </div>
  );
}
