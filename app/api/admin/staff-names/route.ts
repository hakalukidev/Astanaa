import { NextResponse } from "next/server";

import { ADMINS_COLLECTION, canModerateListings, getCurrentAdmin } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";

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

  const snapshot = await getAdminDb().collection(ADMINS_COLLECTION).get();

  const names: Record<string, string> = {};
  for (const docSnapshot of snapshot.docs) {
    const data = docSnapshot.data();
    const name = (data.name as string | undefined) || (data.email as string | undefined);
    if (name) {
      names[docSnapshot.id] = name;
    }
  }

  return NextResponse.json({ names });
}
