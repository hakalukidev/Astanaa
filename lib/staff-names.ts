/**
 * Live uid -> name lookup for admin-panel staff (admin/super_admin/
 * moderator/promoter), used to resolve a promoter's or moderator's
 * *current* name wherever a listing only has the name that was frozen onto
 * it at post/approve/reject time (sellerName, moderatedByName). Renaming
 * someone in the Moderators page updates the `admins` doc, not those old
 * listings — so anywhere we display "who did this" should prefer this map
 * over the frozen string.
 */

export type StaffNames = Record<string, string>;

export const STAFF_NAMES_QUERY_KEY = ["admin-staff-names"];

export async function fetchStaffNames(): Promise<StaffNames> {
  const response = await fetch("/api/admin/staff-names", { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Could not load staff names.");
  }

  const data = (await response.json()) as { names: StaffNames };
  return data.names;
}

/** `uid`'s current name if they're staff, else `fallback` (the frozen name on the record). */
export function resolveStaffName(names: StaffNames, uid: string, fallback: string): string {
  return (uid && names[uid]) || fallback;
}
