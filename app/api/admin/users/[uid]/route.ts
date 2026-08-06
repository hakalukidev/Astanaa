import { NextRequest, NextResponse } from "next/server";

import { ADMINS_COLLECTION, getCurrentAdmin } from "@/lib/admin-auth";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

type RouteContext = {
  params: { uid: string };
};

async function countSuperAdmins(excludingUid?: string) {
  const snapshot = await getAdminDb()
    .collection(ADMINS_COLLECTION)
    .where("role", "==", "super_admin")
    .get();

  return snapshot.docs.filter((docSnapshot) => docSnapshot.id !== excludingUid).length;
}

// PATCH - change an admin user's role. Super admin only.
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const currentAdmin = await getCurrentAdmin();

  if (!currentAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (currentAdmin.role !== "super_admin") {
    return NextResponse.json({ error: "Only super admins can change roles." }, { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as { role?: string } | null;
  const role = payload?.role;

  if (role !== "admin" && role !== "super_admin") {
    return NextResponse.json({ error: "Role must be 'admin' or 'super_admin'." }, { status: 400 });
  }

  const targetRef = getAdminDb().collection(ADMINS_COLLECTION).doc(params.uid);
  const targetDoc = await targetRef.get();

  if (!targetDoc.exists) {
    return NextResponse.json({ error: "Admin user not found." }, { status: 404 });
  }

  const isDemotingLastSuperAdmin =
    targetDoc.data()?.role === "super_admin" &&
    role === "admin" &&
    (await countSuperAdmins(params.uid)) === 0;

  if (isDemotingLastSuperAdmin) {
    return NextResponse.json(
      { error: "Cannot remove the last super admin. Promote another admin first." },
      { status: 400 }
    );
  }

  await targetRef.update({ role });

  return NextResponse.json({ success: true });
}

// DELETE - remove an admin user's access (Firebase Auth account + admins doc).
// Super admin only.
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const currentAdmin = await getCurrentAdmin();

  if (!currentAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (currentAdmin.role !== "super_admin") {
    return NextResponse.json({ error: "Only super admins can remove admin users." }, { status: 403 });
  }

  if (params.uid === currentAdmin.uid) {
    return NextResponse.json({ error: "You cannot remove your own admin access." }, { status: 400 });
  }

  const targetRef = getAdminDb().collection(ADMINS_COLLECTION).doc(params.uid);
  const targetDoc = await targetRef.get();

  if (!targetDoc.exists) {
    return NextResponse.json({ error: "Admin user not found." }, { status: 404 });
  }

  const isRemovingLastSuperAdmin =
    targetDoc.data()?.role === "super_admin" && (await countSuperAdmins(params.uid)) === 0;

  if (isRemovingLastSuperAdmin) {
    return NextResponse.json(
      { error: "Cannot remove the last super admin. Promote another admin first." },
      { status: 400 }
    );
  }

  await getAdminAuth()
    .deleteUser(params.uid)
    .catch(() => undefined); // already gone from Auth is fine, still clean up Firestore

  await targetRef.delete();

  return NextResponse.json({ success: true });
}
