import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import type { Language } from "@/contexts/LanguageContext";
import { db } from "@/lib/firebase";
import { translations } from "@/lib/site-translations";
import { SETTINGS_COLLECTION } from "@/lib/terms";

export const ABOUT_DOC_ID = "about";

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

function mergeWithDefaults(data: Record<string, unknown> | undefined): AboutSettings {
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
  if (!db) {
    return DEFAULT_ABOUT_SETTINGS;
  }

  const snapshot = await getDoc(doc(db, SETTINGS_COLLECTION, ABOUT_DOC_ID));

  if (!snapshot.exists()) {
    return DEFAULT_ABOUT_SETTINGS;
  }

  return mergeWithDefaults(snapshot.data());
}

/** Staff-admin only (enforced by firestore.rules) — updates the live About page content. */
export async function updateAboutSettings(settings: AboutSettings) {
  if (!db) {
    throw new Error("About page settings are not available.");
  }

  await setDoc(
    doc(db, SETTINGS_COLLECTION, ABOUT_DOC_ID),
    { en: settings.en, bn: settings.bn, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
