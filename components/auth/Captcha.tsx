"use client";

import { Loader2, RotateCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type CaptchaPayload = {
  code: string;
  expiresAt: number;
  signature: string;
  answer: string;
};

type Challenge = { code: string; expiresAt: number; signature: string };

/**
 * Text captcha: fetches a random code from /api/auth/captcha and reports the
 * full {code, expiresAt, signature, answer} payload back to the parent via
 * onChange, so the parent can attach it to whatever request it's guarding.
 * Pass a stable setState function as `onChange` to avoid re-fetch loops.
 */
export function Captcha({
  label,
  onChange,
}: {
  label: string;
  onChange: (payload: CaptchaPayload | null) => void;
}) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setAnswer("");
    setChallenge(null);

    try {
      const response = await fetch("/api/auth/captcha");
      const data = (await response.json()) as Challenge;
      setChallenge(data);
    } catch {
      setChallenge(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    onChange(challenge && answer ? { ...challenge, answer } : null);
  }, [challenge, answer, onChange]);

  return (
    <div className="space-y-2">
      <Label htmlFor="captcha">{label}</Label>
      <div className="flex items-center gap-2">
        <div className="flex h-10 min-w-[104px] select-none items-center justify-center rounded-md border border-gray-300 bg-gray-100 px-3 font-mono text-lg font-bold tracking-[0.3em] text-gray-700">
          {loading || !challenge ? <Loader2 className="h-4 w-4 animate-spin" /> : challenge.code}
        </div>
        <button
          type="button"
          onClick={refresh}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gray-300 text-gray-500 transition hover:bg-gray-50"
          aria-label="Refresh captcha"
        >
          <RotateCw className="h-4 w-4" />
        </button>
        <Input
          id="captcha"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Type the code above"
          className="flex-1"
          autoComplete="off"
          required
        />
      </div>
    </div>
  );
}
