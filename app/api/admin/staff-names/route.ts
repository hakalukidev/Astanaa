import { NextResponse } from "next/server";

import { canModerateListings, getCurrentAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

// GET - uid -> current display name for every admin-panel account (admin /
// super_admin / moderator / promoter).
//
// Listings freeze a promoter's/moderator's name onto the doc at the moment
// they post/approve/reject (sellerName, moderatedByName) — so renaming
// someone in the Moderators admin page never touched those old listings.
// Pages that show "who did this" (Promoters, Moderators, Reports, Posts,
// Payments, the moderation queue) call this to resolve the *current* name by
// uid instead, falling back to the frozen string only for uids that aren't
// staff (i.e. regular sellers).
export async function GET() {
  const currentAdmin = await getCurrentAdmin();

  if (!currentAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canModerateListings(currentAdmin.role)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const staff = await db.user.findMany({
    where: { role: { not: null } },
    select: { id: true, name: true, email: true },
  });

  const names: Record<string, string> = {};
  for (const person of staff) {
    const name = person.name || person.email;
    if (name) {
      names[person.id] = name;
    }
  }

  return NextResponse.json({ names });
}
