import type { Language } from "@/contexts/LanguageContext";
import { translations } from "@/lib/site-translations";

export type AboutContent = {
  heroTitle: string;
  heroSubtitle: string;
  heroBody: string;
  overviewTitle: string;
  overviewP1: string;
  overviewP2: string;
  overviewP3: string;
  badgeFreeToPost: string;
  badgeDirectChat: string;
  badgeNoMiddleman: string;
  badgeBoost: string;
  missionTitle: string;
  missionBody: string;
  visionTitle: string;
  visionBody: string;
  howItWorksTitle: string;
  howItWorksSubtitle: string;
  step1Title: string;
  step1Body: string;
  step2Title: string;
  step2Body: string;
  step3Title: string;
  step3Body: string;
  ctaTitle: string;
  ctaButton: string;
};

export type AboutSettings = Record<Language, AboutContent>;

const ABOUT_FIELD_KEYS = Object.keys(translations.en.about) as (keyof AboutContent)[];

/**
 * Ships with the site — shown until an admin saves real values, and also
 * used as the fallback if a field is left blank. Seeded from the original
 * static copy so nothing changes until someone edits it in Admin.
 */
export const DEFAULT_ABOUT_SETTINGS: AboutSettings = {
  en: { ...translations.en.about },
  bn: { ...translations.bn.about },
};

function mergeWithDefaults(data: Record<string, unknown> | null): AboutSettings {
  const merged: AboutSettings = {
    en: { ...DEFAULT_ABOUT_SETTINGS.en },
    bn: { ...DEFAULT_ABOUT_SETTINGS.bn },
  };

  (["en", "bn"] as Language[]).forEach((language) => {
    const languageData = data?.[language] as Record<string, unknown> | undefined;
    for (const key of ABOUT_FIELD_KEYS) {
      const value = languageData?.[key];
      if (typeof value === "string" && value.trim()) {
        merged[language][key] = value;
      }
    }
  });

  return merged;
}

/** Publicly readable — the About page is shown to every visitor. */
export async function getAboutSettings(): Promise<AboutSettings> {
  try {
    const response = await fetch("/api/settings/about");
    if (!response.ok) return DEFAULT_ABOUT_SETTINGS;
    const data = (await response.json()) as { value: Record<string, unknown> | null };
    return mergeWithDefaults(data.value);
  } catch {
    return DEFAULT_ABOUT_SETTINGS;
  }
}

/** Super-admin only (enforced server-side) — updates the live About page content. */
export async function updateAboutSettings(settings: AboutSettings) {
  await fetch("/api/settings/about", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ en: settings.en, bn: settings.bn }),
  });
}
