import { collection, doc, getDocs, increment, setDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";

export const VISITS_COLLECTION = "siteVisits";

const LAST_VISIT_KEY = "astanaa-last-visit-date";

function localDateId(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Client-only: counts this browser once per calendar day (not on every page
 * navigation) by remembering the last-counted date in localStorage. There's
 * no real analytics backend here — this is a lightweight daily counter, a
 * reasonable proxy for "how many people visited" without needing billing.
 */
export function recordVisit() {
  if (typeof window === "undefined" || !db) {
    return;
  }

  const today = localDateId(new Date());

  if (window.localStorage.getItem(LAST_VISIT_KEY) === today) {
    return;
  }

  window.localStorage.setItem(LAST_VISIT_KEY, today);

  setDoc(doc(db, VISITS_COLLECTION, today), { count: increment(1) }, { merge: true }).catch(() => {
    // Best-effort — a failed visit count shouldn't break the page for a visitor.
  });
}

export type VisitStats = {
  today: number;
  week: number;
  month: number;
  year: number;
  all: number;
};

/** Admin-only (enforced by firestore.rules) — sums the daily visit docs into period buckets. */
export async function getVisitStats(): Promise<VisitStats> {
  const stats: VisitStats = { today: 0, week: 0, month: 0, year: 0, all: 0 };

  if (!db) {
    return stats;
  }

  const snapshot = await getDocs(collection(db, VISITS_COLLECTION));
  const now = new Date();
  const todayId = localDateId(now);
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  snapshot.forEach((docSnapshot) => {
    const rawCount = docSnapshot.data().count;
    const count = typeof rawCount === "number" && Number.isFinite(rawCount) ? rawCount : 0;
    const docDate = new Date(`${docSnapshot.id}T00:00:00`);

    if (Number.isNaN(docDate.getTime())) {
      return;
    }

    stats.all += count;
    if (docSnapshot.id === todayId) stats.today += count;
    if (docDate >= startOfWeek) stats.week += count;
    if (docDate >= startOfMonth) stats.month += count;
    if (docDate >= startOfYear) stats.year += count;
  });

  return stats;
}
