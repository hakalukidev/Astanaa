export type SiteUser = {
  uid: string;
  name: string;
  phone: string;
  email: string;
  createdAtMs: number | null;
  /** Sequential display ID, e.g. "ABC-0001" ... "ABC-0999", then "ABD-0000" ... */
  displayId: string;
};

const FIRST_PREFIX = "ABC";
const FIRST_BLOCK_SIZE = 999; // ABC-0001 .. ABC-0999
const BLOCK_SIZE = 1000; // every block after that: XXX-0000 .. XXX-0999

function lettersToNumber(letters: string) {
  return letters
    .split("")
    .reduce((total, letter) => total * 26 + (letter.charCodeAt(0) - 65), 0);
}

function numberToLetters(value: number, length: number) {
  let n = value;
  let result = "";

  for (let i = 0; i < length; i += 1) {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }

  return result;
}

/**
 * Sequential user-facing ID: the 1st user is ABC-0001, the 999th is ABC-0999,
 * the 1000th rolls over to ABD-0000, the 1999th is ABD-0999, the 2000th is
 * ABE-0000, and so on (3-letter prefix incremented like a base-26 counter).
 */
export function getUserDisplayId(sequenceNumber: number): string {
  let prefixOffset: number;
  let numberInBlock: number;

  if (sequenceNumber <= FIRST_BLOCK_SIZE) {
    prefixOffset = 0;
    numberInBlock = sequenceNumber;
  } else {
    const rest = sequenceNumber - FIRST_BLOCK_SIZE - 1;
    prefixOffset = 1 + Math.floor(rest / BLOCK_SIZE);
    numberInBlock = rest % BLOCK_SIZE;
  }

  const prefix = numberToLetters(lettersToNumber(FIRST_PREFIX) + prefixOffset, FIRST_PREFIX.length);
  return `${prefix}-${String(numberInBlock).padStart(4, "0")}`;
}

type RawSiteUser = {
  uid: string;
  name: string;
  phone: string;
  email: string;
  createdAtMs: number | null;
};

/** Admin-only — fetches every site user via the server API route (Admin SDK), oldest first. */
export async function fetchSiteUsers(): Promise<SiteUser[]> {
  const response = await fetch("/api/admin/site-users", { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Could not load users.");
  }

  const data = (await response.json()) as { users: RawSiteUser[] };

  return data.users.map((user, index) => ({
    ...user,
    displayId: getUserDisplayId(index + 1),
  }));
}

export type UserPeriodStats = {
  today: number;
  week: number;
  month: number;
  year: number;
  all: number;
};

export function computeUserPeriodStats(users: SiteUser[]): UserPeriodStats {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - now.getDay()
  ).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

  const stats: UserPeriodStats = { today: 0, week: 0, month: 0, year: 0, all: 0 };

  for (const user of users) {
    if (user.createdAtMs === null) {
      continue;
    }

    stats.all += 1;
    if (user.createdAtMs >= startOfYear) stats.year += 1;
    if (user.createdAtMs >= startOfMonth) stats.month += 1;
    if (user.createdAtMs >= startOfWeek) stats.week += 1;
    if (user.createdAtMs >= startOfToday) stats.today += 1;
  }

  return stats;
}

export type ChartGranularity = "day" | "week" | "month" | "year";

export type ChartBucket = {
  label: string;
  count: number;
};

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** New-signups-per-bucket, oldest to newest, for the growth chart. */
export function bucketUsersByGranularity(
  users: SiteUser[],
  granularity: ChartGranularity
): ChartBucket[] {
  const withDates = users.filter((user) => user.createdAtMs !== null);

  if (withDates.length === 0) {
    return [];
  }

  const now = new Date();

  if (granularity === "day") {
    const days = 14;
    const buckets: ChartBucket[] = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const nextDate = new Date(date.getTime());
      nextDate.setDate(nextDate.getDate() + 1);
      const count = withDates.filter(
        (user) => user.createdAtMs! >= date.getTime() && user.createdAtMs! < nextDate.getTime()
      ).length;
      buckets.push({ label: `${date.getDate()}/${date.getMonth() + 1}`, count });
    }
    return buckets;
  }

  if (granularity === "week") {
    const weeks = 12;
    const buckets: ChartBucket[] = [];
    const currentWeekStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - now.getDay()
    );
    for (let i = weeks - 1; i >= 0; i -= 1) {
      const start = new Date(currentWeekStart.getTime());
      start.setDate(start.getDate() - i * 7);
      const end = new Date(start.getTime());
      end.setDate(end.getDate() + 7);
      const count = withDates.filter(
        (user) => user.createdAtMs! >= start.getTime() && user.createdAtMs! < end.getTime()
      ).length;
      buckets.push({ label: `${start.getDate()}/${start.getMonth() + 1}`, count });
    }
    return buckets;
  }

  if (granularity === "month") {
    const months = 12;
    const buckets: ChartBucket[] = [];
    for (let i = months - 1; i >= 0; i -= 1) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = withDates.filter(
        (user) => user.createdAtMs! >= start.getTime() && user.createdAtMs! < end.getTime()
      ).length;
      buckets.push({ label: MONTH_LABELS[start.getMonth()], count });
    }
    return buckets;
  }

  // year
  const firstYear = new Date(Math.min(...withDates.map((user) => user.createdAtMs!))).getFullYear();
  const lastYear = now.getFullYear();
  const buckets: ChartBucket[] = [];
  for (let year = firstYear; year <= lastYear; year += 1) {
    const start = new Date(year, 0, 1).getTime();
    const end = new Date(year + 1, 0, 1).getTime();
    const count = withDates.filter(
      (user) => user.createdAtMs! >= start && user.createdAtMs! < end
    ).length;
    buckets.push({ label: String(year), count });
  }
  return buckets;
}
