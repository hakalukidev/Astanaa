import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";

export const SETTINGS_COLLECTION = "settings";
export const TERMS_DOC_ID = "termsAndConditions";

const DEFAULT_TERMS = `1. You must provide accurate information about yourself and the property you list.
2. Astanaa.com is a listing platform only — it is not a party to any sale, rental, or payment between buyers and sellers.
3. Every listing is reviewed by our team before it goes live; we may reject or remove listings that are misleading, fraudulent, or violate these terms.
4. You are responsible for all communication and transactions you make with other users through the platform.
5. Boosted (paid) listings are non-refundable once activated.
6. We may suspend or remove accounts that post fraudulent, duplicate, or abusive content.

Astanaa.com reserves the right to update these terms at any time.`;

/** Publicly readable — anyone can view the current terms before agreeing to them at signup. */
export async function getTermsAndConditions(): Promise<string> {
  if (!db) {
    return DEFAULT_TERMS;
  }

  const snapshot = await getDoc(doc(db, SETTINGS_COLLECTION, TERMS_DOC_ID));

  if (!snapshot.exists()) {
    return DEFAULT_TERMS;
  }

  const content = snapshot.data()?.content;

  return typeof content === "string" && content.trim() ? content : DEFAULT_TERMS;
}

/** Staff-admin only (enforced by firestore.rules) — updates the terms shown at signup. */
export async function updateTermsAndConditions(content: string) {
  if (!db) {
    throw new Error("Terms data is not available.");
  }

  await setDoc(
    doc(db, SETTINGS_COLLECTION, TERMS_DOC_ID),
    { content, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
