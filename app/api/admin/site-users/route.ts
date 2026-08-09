import { NextResponse } from "next/server";

import { getCurrentAdmin, isStaffAdmin } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";

const USERS_COLLECTION = "users";

// GET - list every signed-up site user (buyers/sellers), oldest first.
// Staff admin only (admin / super_admin) — goes through the Admin SDK so we
// don't have to widen the client-side Firestore rule that keeps each user's
// profile doc readable only by themselves.
export async function GET() {
  const currentAdmin = await getCurrentAdmin();

  if (!currentAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStaffAdmin(currentAdmin.role)) {
    return NextResponse.json({ error: "Only admins can view the user list." }, { status: 403 });
  }

  const snapshot = await getAdminDb().collection(USERS_COLLECTION).orderBy("createdAt", "asc").get();

  const users = snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data();
    const createdAt = data.createdAt?.toDate?.() ?? null;

    return {
      uid: docSnapshot.id,
      name: (data.name as string | undefined) ?? "",
      phone: (data.phone as string | undefined) ?? "",
      email: (data.email as string | undefined) ?? "",
      createdAtMs: createdAt ? createdAt.getTime() : null,
    };
  });

  return NextResponse.json({ users });
}
