import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import type { Language } from "@/contexts/LanguageContext";
import { db } from "@/lib/firebase";

export const SETTINGS_COLLECTION = "settings";
export const TERMS_DOC_ID = "termsAndConditions";

const DEFAULT_TERMS: Record<Language, string> = {
  en: `1. You must provide accurate information about yourself and the property you list.
2. Astanaa.com is a listing platform only — it is not a party to any sale, rental, or payment between buyers and sellers.
3. Every listing is reviewed by our team before it goes live; we may reject or remove listings that are misleading, fraudulent, or violate these terms.
4. You are responsible for all communication and transactions you make with other users through the platform.
5. Boosted (paid) listings are non-refundable once activated.
6. We may suspend or remove accounts that post fraudulent, duplicate, or abusive content.

Astanaa.com reserves the right to update these terms at any time.`,
  bn: `১. আপনার এবং আপনার লিস্ট করা প্রপার্টি সম্পর্কে সঠিক তথ্য প্রদান করতে হবে।
২. Astanaa.com শুধুমাত্র একটি লিস্টিং প্ল্যাটফর্ম — ক্রেতা ও বিক্রেতার মধ্যে কোনো বিক্রয়, ভাড়া বা পেমেন্টের পক্ষ এটি নয়।
৩. প্রতিটি লিস্টিং লাইভ হওয়ার আগে আমাদের টিম পর্যালোচনা করে; বিভ্রান্তিকর, প্রতারণামূলক বা এই শর্তাবলী লঙ্ঘনকারী লিস্টিং আমরা প্রত্যাখ্যান বা অপসারণ করতে পারি।
৪. প্ল্যাটফর্মের মাধ্যমে অন্য ব্যবহারকারীদের সাথে করা সকল যোগাযোগ ও লেনদেনের দায়িত্ব আপনার।
৫. বুস্টেড (পেইড) লিস্টিং একবার সক্রিয় হলে তা ফেরতযোগ্য নয়।
৬. প্রতারণামূলক, ডুপ্লিকেট বা আপত্তিকর কনটেন্ট পোস্ট করা অ্যাকাউন্ট আমরা স্থগিত বা অপসারণ করতে পারি।

Astanaa.com যেকোনো সময় এই শর্তাবলী পরিবর্তন করার অধিকার রাখে।`,
};

/** Publicly readable — anyone can view the current terms before agreeing to them at signup. */
export async function getTermsAndConditions(language: Language): Promise<string> {
  if (!db) {
    return DEFAULT_TERMS[language];
  }

  const snapshot = await getDoc(doc(db, SETTINGS_COLLECTION, TERMS_DOC_ID));

  if (!snapshot.exists()) {
    return DEFAULT_TERMS[language];
  }

  const data = snapshot.data();
  const perLanguageContent = data?.[`content_${language}`];
  if (typeof perLanguageContent === "string" && perLanguageContent.trim()) {
    return perLanguageContent;
  }

  // Fall back to the legacy single-language field for documents saved before
  // the bn/en split existed, so nothing breaks for either language.
  const legacyContent = data?.content;
  if (typeof legacyContent === "string" && legacyContent.trim()) {
    return legacyContent;
  }

  return DEFAULT_TERMS[language];
}

/** Staff-admin only (enforced by firestore.rules) — updates the terms shown at signup. */
export async function updateTermsAndConditions(content: Record<Language, string>) {
  if (!db) {
    throw new Error("Terms data is not available.");
  }

  await setDoc(
    doc(db, SETTINGS_COLLECTION, TERMS_DOC_ID),
    {
      content_en: content.en,
      content_bn: content.bn,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
