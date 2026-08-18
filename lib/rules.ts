import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import type { Language } from "@/contexts/LanguageContext";
import { db } from "@/lib/firebase";
import { SETTINGS_COLLECTION } from "@/lib/terms";

export const RULES_DOC_ID = "rulesAndRestrictions";

const DEFAULT_RULES: Record<Language, string> = {
  en: `1. Do not post fake, duplicate, or misleading listings.
2. Do not list a property you do not have the right to sell or rent out.
3. Do not share another person's contact details or photos without their consent.
4. Do not use abusive, discriminatory, or offensive language anywhere on the platform.
5. Do not attempt to scam, mislead, or defraud other users during a deal.
6. Do not spam listings, messages, or reviews.
7. Boosted posts must not contain content unrelated to the property itself.

Breaking these rules may lead to your listing being removed or your account being suspended.`,
  bn: `১. ভুয়া, ডুপ্লিকেট, বা বিভ্রান্তিকর লিস্টিং পোস্ট করবেন না।
২. যে প্রপার্টি বিক্রি বা ভাড়া দেওয়ার অধিকার আপনার নেই, তা লিস্ট করবেন না।
৩. অন্য কারও যোগাযোগের তথ্য বা ছবি তার সম্মতি ছাড়া শেয়ার করবেন না।
৪. প্ল্যাটফর্মের কোথাও অসম্মানজনক, বৈষম্যমূলক বা আপত্তিকর ভাষা ব্যবহার করবেন না।
৫. লেনদেনের সময় অন্য ব্যবহারকারীকে প্রতারিত বা বিভ্রান্ত করার চেষ্টা করবেন না।
৬. লিস্টিং, মেসেজ বা রিভিউতে স্প্যাম করবেন না।
৭. বুস্টেড পোস্টে প্রপার্টির সাথে সম্পর্কহীন কোনো কনটেন্ট রাখা যাবে না।

এই নিয়ম ভঙ্গ করলে আপনার লিস্টিং অপসারণ অথবা অ্যাকাউন্ট স্থগিত হতে পারে।`,
};

/** Publicly readable — shown to every visitor via the footer. */
export async function getRulesAndRestrictions(language: Language): Promise<string> {
  if (!db) {
    return DEFAULT_RULES[language];
  }

  const snapshot = await getDoc(doc(db, SETTINGS_COLLECTION, RULES_DOC_ID));

  if (!snapshot.exists()) {
    return DEFAULT_RULES[language];
  }

  const data = snapshot.data();
  const perLanguageContent = data?.[`content_${language}`];
  if (typeof perLanguageContent === "string" && perLanguageContent.trim()) {
    return perLanguageContent;
  }

  return DEFAULT_RULES[language];
}

/** Staff-admin only (enforced by firestore.rules) — updates the rules shown in the footer. */
export async function updateRulesAndRestrictions(content: Record<Language, string>) {
  if (!db) {
    throw new Error("Rules data is not available.");
  }

  await setDoc(
    doc(db, SETTINGS_COLLECTION, RULES_DOC_ID),
    {
      content_en: content.en,
      content_bn: content.bn,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
