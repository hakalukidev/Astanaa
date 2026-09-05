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
  if (typeof window === "undefined") {
    return;
  }

  const today = localDateId(new Date());

  if (window.localStorage.getItem(LAST_VISIT_KEY) === today) {
    return;
  }

  window.localStorage.setItem(LAST_VISIT_KEY, today);

  fetch("/api/visits", { method: "POST" }).catch(() => {
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

/** Admin-only (enforced server-side) — sums the daily visit counts into period buckets. */
export async function getVisitStats(): Promise<VisitStats> {
  const empty: VisitStats = { today: 0, week: 0, month: 0, year: 0, all: 0 };

  try {
    const response = await fetch("/api/visits/stats");
    if (!response.ok) return empty;
    return (await response.json()) as VisitStats;
  } catch {
    return empty;
  }
}
