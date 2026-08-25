"use client";

import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { Captcha, type CaptchaPayload } from "@/components/auth/Captcha";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { translations } from "@/lib/site-translations";
import { getTermsAndConditions } from "@/lib/terms";

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

  // Signup-verification OTP: filling the form (including the captcha) and
  // pressing "Sign up" is what sends the code — it's only after that click
  // that a modal opens asking for it. Verifying the code in that modal is
  // also what actually creates the account, so a success there goes
  // straight to the home page.
  const [captchaToken, setCaptchaToken] = useState<CaptchaPayload | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    setIsTermsLoading(true);
    getTermsAndConditions(language)
      .then(setTermsContent)
      .finally(() => setIsTermsLoading(false));
  }, [language]);

  async function sendSignupOtp() {
    setOtpError("");
    setIsSendingCode(true);

    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: phone, channel: "phone", captchaToken }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setErrorMessage(data?.error ?? t.otpSendError);
        return;
      }

      setOtpCode("");
      setIsOtpModalOpen(true);
    } catch {
      setErrorMessage(t.otpSendError);
    } finally {
      setIsSendingCode(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage(t.passwordMismatch);
      return;
    }

    if (!agreedToTerms) {
      setErrorMessage(t.termsRequiredError);
      return;
    }

    if (!captchaToken) {
      setErrorMessage(t.otpSendError);
      return;
    }

    await sendSignupOtp();
  }

  async function handleVerifyAndCreateAccount() {
    setOtpError("");
    setIsVerifying(true);

    try {
      const verifyResponse = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: phone, channel: "phone", code: otpCode }),
      });
      const verifyData = (await verifyResponse.json().catch(() => null)) as
        | { error?: string; verifiedToken?: string }
        | null;

      if (!verifyResponse.ok || !verifyData?.verifiedToken) {
        setOtpError(verifyData?.error ?? t.otpInvalid);
        return;
      }

      await signUp({ name, phone, email, password });
      toast({ title: t.accountCreatedTitle, description: t.accountCreatedDesc });
      setIsOtpModalOpen(false);
      router.replace("/");
      router.refresh();
    } catch (error) {
      const code = (error as { code?: string })?.code ?? "";

      // The code was already verified at this point — a failure past here
      // is about the account fields (email taken, weak password), not the
      // phone, so close the modal and surface it on the main form instead
      // of leaving an error sitting under an already-consumed OTP input.
      setIsOtpModalOpen(false);

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
      setIsVerifying(false);
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
                disabled={isOtpModalOpen}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t.phone}</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="01XXXXXXXXX"
                disabled={isOtpModalOpen}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                disabled={isOtpModalOpen}
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
                  disabled={isOtpModalOpen}
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
                  disabled={isOtpModalOpen}
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

            <Captcha label={t.captchaLabel} onChange={setCaptchaToken} />

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
                  disabled={isOtpModalOpen}
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
              disabled={isSendingCode || isOtpModalOpen}
            >
              {isSendingCode ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSendingCode ? t.sendingCode : t.submit}
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

      <Dialog open={isOtpModalOpen} onOpenChange={(open) => !isVerifying && setIsOtpModalOpen(open)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.otpModalTitle}</DialogTitle>
            <DialogDescription>
              {t.codeSentTo} {phone}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Input
              value={otpCode}
              onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ""))}
              placeholder={t.codePlaceholder}
              inputMode="numeric"
              maxLength={6}
              autoFocus
            />
            {otpError ? <p className="text-xs font-medium text-red-600">{otpError}</p> : null}
            <button
              type="button"
              onClick={sendSignupOtp}
              disabled={isSendingCode || isVerifying}
              className="text-xs font-medium text-green-600 hover:underline disabled:opacity-50"
            >
              {isSendingCode ? t.sendingCode : t.resendCode}
            </button>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOtpModalOpen(false)}
              disabled={isVerifying}
            >
              {t.cancel}
            </Button>
            <Button
              type="button"
              onClick={handleVerifyAndCreateAccount}
              disabled={isVerifying || otpCode.length < 4}
              className="bg-green-600 hover:bg-green-700"
            >
              {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t.verifyCode}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
