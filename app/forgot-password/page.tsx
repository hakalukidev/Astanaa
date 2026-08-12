"use client";

import { KeyRound, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Captcha, type CaptchaPayload } from "@/components/auth/Captcha";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { translations } from "@/lib/site-translations";

type OtpChannel = "email" | "phone";
type Step = "request" | "confirm";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language].forgotPassword;

  const [step, setStep] = useState<Step>("request");
  const [channel, setChannel] = useState<OtpChannel>("email");
  const [identifier, setIdentifier] = useState("");
  const [captchaToken, setCaptchaToken] = useState<CaptchaPayload | null>(null);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  async function handleRequestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!identifier.trim() || !captchaToken) {
      setErrorMessage(t.genericError);
      return;
    }

    setIsRequesting(true);

    try {
      const response = await fetch("/api/auth/forgot-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, channel, captchaToken }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setErrorMessage(data?.error ?? t.genericError);
        return;
      }

      setStep("confirm");
    } catch {
      setErrorMessage(t.genericError);
    } finally {
      setIsRequesting(false);
    }
  }

  async function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (newPassword !== confirmPassword) {
      setErrorMessage(t.passwordMismatch);
      return;
    }

    setIsConfirming(true);

    try {
      const response = await fetch("/api/auth/forgot-password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, channel, code, newPassword }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setErrorMessage(data?.error ?? t.genericError);
        return;
      }

      toast({ title: t.successTitle, description: t.successDesc });
      router.replace("/login");
    } catch {
      setErrorMessage(t.genericError);
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
            <KeyRound size={22} />
          </div>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          {step === "request" ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div className="flex gap-4 text-sm text-gray-700">
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="reset-channel"
                    checked={channel === "email"}
                    onChange={() => setChannel("email")}
                  />
                  {t.channelEmail}
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="reset-channel"
                    checked={channel === "phone"}
                    onChange={() => setChannel("phone")}
                  />
                  {t.channelPhone}
                </label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="identifier">
                  {channel === "email" ? t.identifierLabelEmail : t.identifierLabelPhone}
                </Label>
                <Input
                  id="identifier"
                  type={channel === "email" ? "email" : "tel"}
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder={channel === "email" ? "you@example.com" : "01XXXXXXXXX"}
                  required
                />
              </div>

              <Captcha label={t.captchaLabel} onChange={setCaptchaToken} />

              {errorMessage ? (
                <p className="text-sm font-medium text-red-600">{errorMessage}</p>
              ) : null}

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isRequesting}>
                {isRequesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isRequesting ? t.sendingCode : t.sendCode}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleConfirm} className="space-y-4">
              <p className="text-sm text-gray-500">
                {t.codeSentTo} {identifier}
              </p>

              <div className="space-y-2">
                <Label htmlFor="code">{t.codeLabel}</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                  placeholder={t.codePlaceholder}
                  inputMode="numeric"
                  maxLength={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">{t.newPassword}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder={t.newPasswordPlaceholder}
                  minLength={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder={t.confirmPasswordPlaceholder}
                  minLength={6}
                  required
                />
              </div>

              {errorMessage ? (
                <p className="text-sm font-medium text-red-600">{errorMessage}</p>
              ) : null}

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isConfirming}>
                {isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isConfirming ? t.submitting : t.submit}
              </Button>

              <button
                type="button"
                onClick={() => setStep("request")}
                className="w-full text-center text-xs font-medium text-green-600 hover:underline"
              >
                {t.resendCode}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-500">
            <Link href="/login" className="font-semibold text-green-600 hover:underline">
              {t.backToLogin}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
