export type FooterSettings = {
  aboutTextEn: string;
  aboutTextBn: string;
  address: string;
  phone: string;
  email: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
};

/**
 * Ships with the site — shown until an admin saves real values, and also
 * used as the fallback if a field is left blank (so a half-filled form never
 * breaks the live footer).
 */
export const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
  aboutTextEn:
    "Buy, sell, and rent apartments across Bangladesh — post your own ad in minutes.",
  aboutTextBn:
    "বাংলাদেশ জুড়ে অ্যাপার্টমেন্ট কিনুন, বিক্রি করুন ও ভাড়া দিন — মিনিটেই নিজের বিজ্ঞাপন পোস্ট করুন।",
  address: "Dhaka, Bangladesh",
  phone: "+88 01897914480-83",
  email: "info@astanaa.com",
  facebookUrl: "",
  instagramUrl: "",
  twitterUrl: "",
  youtubeUrl: "",
  tiktokUrl: "",
};

function mergeWithDefaults(data: Record<string, unknown> | null): FooterSettings {
  const merged = { ...DEFAULT_FOOTER_SETTINGS };

  for (const key of Object.keys(merged) as (keyof FooterSettings)[]) {
    const value = data?.[key];
    if (typeof value === "string" && value.trim()) {
      merged[key] = value;
    }
  }

  return merged;
}

/** Publicly readable — the footer is shown on every page, signed in or not. */
export async function getFooterSettings(): Promise<FooterSettings> {
  try {
    const response = await fetch("/api/settings/footer");
    if (!response.ok) return DEFAULT_FOOTER_SETTINGS;
    const data = (await response.json()) as { value: Record<string, unknown> | null };
    return mergeWithDefaults(data.value);
  } catch {
    return DEFAULT_FOOTER_SETTINGS;
  }
}

/** Super-admin only (enforced server-side) — updates the live footer content. */
export async function updateFooterSettings(settings: FooterSettings) {
  await fetch("/api/settings/footer", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
}
