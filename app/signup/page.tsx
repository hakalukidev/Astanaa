"use client";

import { Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsContent, setTermsContent] = useState("");
  const [isTermsLoading, setIsTermsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getTermsAndConditions()
      .then(setTermsContent)
      .finally(() => setIsTermsLoading(false));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!agreedToTerms) {
      setErrorMessage(t.termsRequiredError);
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
              <Label htmlFor="phone">{t.phone}</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="01XXXXXXXXX"
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
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.password}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t.passwordPlaceholder}
                minLength={6}
                required
              />
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
              disabled={isSubmitting || !agreedToTerms}
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
