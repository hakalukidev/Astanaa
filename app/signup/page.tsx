"use client";

import { CheckCircle2, Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { Captcha, type CaptchaPayload } from "@/components/auth/Captcha";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { translations } from "@/lib/site-translations";
import { getTermsAndConditions } from "@/lib/terms";

type OtpChannel = "email" | "phone";
type OtpStage = "idle" | "sent" | "verified";

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language].signup;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsContent, setTermsContent] = useState("");
  const [isTermsLoading, setIsTermsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Signup-verification OTP: the channel is picked automatically (phone if
  // the user gave one, otherwise email) instead of asking again — and the
  // "Create account" button stays locked until that code is verified.
  const [captchaToken, setCaptchaToken] = useState<CaptchaPayload | null>(null);
  const [otpStage, setOtpStage] = useState<OtpStage>("idle");
  const [otpCode, setOtpCode] = useState("");
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);
  const [otpError, setOtpError] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const channel: OtpChannel = phone.trim() ? "phone" : "email";
  const contactValue = channel === "email" ? email : phone;

  useEffect(() => {
    getTermsAndConditions()
      .then(setTermsContent)
      .finally(() => setIsTermsLoading(false));
  }, []);

  function resetOtpState() {
    setOtpStage("idle");
    setOtpCode("");
    setVerifiedToken(null);
    setOtpError("");
  }

  function handlePhoneChange(value: string) {
    setPhone(value);
    if (otpStage !== "idle") resetOtpState();
  }

  function handleEmailChange(value: string) {
    setEmail(value);
    if (otpStage !== "idle") resetOtpState();
  }

  async function handleSendCode() {
    setOtpError("");

    if (!contactValue.trim() || !captchaToken) {
      setOtpError(t.otpSendError);
      return;
    }

    setIsSendingCode(true);

    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: contactValue, channel, captchaToken }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setOtpError(data?.error ?? t.otpSendError);
        return;
      }

      setOtpStage("sent");
      setOtpCode("");
    } catch {
      setOtpError(t.otpSendError);
    } finally {
      setIsSendingCode(false);
    }
  }

  async function handleVerifyCode() {
    setOtpError("");
    setIsVerifyingCode(true);

    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: contactValue, channel, code: otpCode }),
      });
      const data = (await response.json().catch(() => null)) as
        | { error?: string; verifiedToken?: string }
        | null;

      if (!response.ok || !data?.verifiedToken) {
        setOtpError(data?.error ?? t.otpInvalid);
        return;
      }

      setVerifiedToken(data.verifiedToken);
      setOtpStage("verified");
    } catch {
      setOtpError(t.otpInvalid);
    } finally {
      setIsVerifyingCode(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setErrorMessage(t.passwordMismatch);
      return;
    }

    if (!agreedToTerms) {
      setErrorMessage(t.termsRequiredError);
      return;
    }

    if (otpStage !== "verified" || !verifiedToken) {
      setErrorMessage(t.verifyRequiredError);
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await signUp({ name, phone, email, password });
      toast({ title: t.accountCreatedTitle, description: t.accountCreatedDesc });
      router.replace("/");
      router.refresh();
    } catch (error) {
      const code = (error as { code?: string })?.code ?? "";

      if (code === "auth/email-already-in-use") {
        setErrorMessage(t.emailInUse);
      } else if (code === "auth/weak-password") {
        setErrorMessage(t.weakPassword);
      } else if (code === "auth/invalid-email") {
        setErrorMessage(t.invalidEmail);
      } else {
        setErrorMessage(t.genericError);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
            <UserPlus size={22} />
          </div>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>
            {t.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t.fullName}</Label>
              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t.fullNamePlaceholder}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t.phoneOptional}</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) => handlePhoneChange(event.target.value)}
                placeholder="01XXXXXXXXX"
                disabled={otpStage === "verified" && channel === "phone"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => handleEmailChange(event.target.value)}
                placeholder="you@example.com"
                disabled={otpStage === "verified" && channel === "email"}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.password}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t.passwordPlaceholder}
                  minLength={6}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? t.hidePassword : t.showPassword}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder={t.confirmPasswordPlaceholder}
                  minLength={6}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showConfirmPassword ? t.hidePassword : t.showPassword}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-3 rounded-md border border-gray-200 p-3">
              {otpStage === "verified" ? (
                <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-green-600">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {t.verifiedBadge} · {contactValue}
                  <button
                    type="button"
                    onClick={resetOtpState}
                    className="ml-1 text-xs font-normal text-gray-500 hover:underline"
                  >
                    {t.changeContact}
                  </button>
                </p>
              ) : (
                <>
                  <Captcha label={t.captchaLabel} onChange={setCaptchaToken} />

                  {otpStage === "idle" ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleSendCode}
                      disabled={isSendingCode}
                    >
                      {isSendingCode ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {isSendingCode ? t.sendingCode : t.sendCode}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">
                        {t.codeSentTo} {contactValue}
                      </p>
                      <div className="flex gap-2">
                        <Input
                          value={otpCode}
                          onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ""))}
                          placeholder={t.codePlaceholder}
                          inputMode="numeric"
                          maxLength={6}
                        />
                        <Button
                          type="button"
                          onClick={handleVerifyCode}
                          disabled={isVerifyingCode || otpCode.length < 4}
                        >
                          {isVerifyingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : t.verifyCode}
                        </Button>
                      </div>
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={isSendingCode}
                        className="text-xs font-medium text-green-600 hover:underline disabled:opacity-50"
                      >
                        {t.resendCode}
                      </button>
                    </div>
                  )}

                  {otpError ? <p className="text-xs font-medium text-red-600">{otpError}</p> : null}
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t.termsTitle}</Label>
              <div className="h-32 overflow-y-auto rounded-md border border-gray-300 bg-gray-50 p-3 text-xs leading-relaxed text-gray-600 whitespace-pre-line">
                {isTermsLoading ? (
                  <span className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t.loadingTerms}
                  </span>
                ) : (
                  termsContent
                )}
              </div>
              <label htmlFor="agreedToTerms" className="flex items-start gap-2 text-sm text-gray-600">
                <input
                  id="agreedToTerms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(event) => setAgreedToTerms(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                {t.termsCheckboxLabel}
              </label>
            </div>

            {errorMessage ? (
              <p className="text-sm font-medium text-red-600">{errorMessage}</p>
            ) : null}

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isSubmitting || !agreedToTerms || otpStage !== "verified"}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t.submit}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {t.haveAccount}{" "}
            <Link href="/login" className="font-semibold text-green-600 hover:underline">
              {t.logIn}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
