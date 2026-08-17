/** Shared by the admin Promoters/Moderators reports for their "search by date" filter. */

export function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDayRangeMs(dateInputValue: string) {
  const [year, month, day] = dateInputValue.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const start = new Date(year, month - 1, day).getTime();
  const end = start + 24 * 60 * 60 * 1000;
  return { start, end };
}

export function formatTime(ms: number | null) {
  if (ms === null) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ms));
}
