import { NextRequest, NextResponse } from "next/server";

import { ADMINS_COLLECTION, getCurrentAdmin, type AdminRole } from "@/lib/admin-auth";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

const VALID_ROLES: AdminRole[] = ["admin", "super_admin", "moderator", "promoter"];

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

// PATCH - change an admin user's role, name, and/or reset their password.
// Super admin only. Any subset of { role, name, password } may be sent.
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const currentAdmin = await getCurrentAdmin();

  if (!currentAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (currentAdmin.role !== "super_admin") {
    return NextResponse.json({ error: "Only super admins can edit admin users." }, { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as
    | { role?: string; name?: string; password?: string }
    | null;

  const hasRole = payload?.role !== undefined;
  const hasName = payload?.name !== undefined;
  const hasPassword = payload?.password !== undefined;

  if (!hasRole && !hasName && !hasPassword) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const role = payload?.role as AdminRole | undefined;

  if (hasRole && (!role || !VALID_ROLES.includes(role))) {
    return NextResponse.json(
      { error: "Role must be one of: admin, super_admin, moderator, promoter." },
      { status: 400 }
    );
  }

  const name = hasName ? (payload?.name?.trim() || null) : undefined;

  const password = payload?.password;

  if (hasPassword && (!password || password.length < 8)) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const targetRef = getAdminDb().collection(ADMINS_COLLECTION).doc(params.uid);
  const targetDoc = await targetRef.get();

  if (!targetDoc.exists) {
    return NextResponse.json({ error: "Admin user not found." }, { status: 404 });
  }

  if (hasRole) {
    const isDemotingLastSuperAdmin =
      targetDoc.data()?.role === "super_admin" &&
      role !== "super_admin" &&
      (await countSuperAdmins(params.uid)) === 0;

    if (isDemotingLastSuperAdmin) {
      return NextResponse.json(
        { error: "Cannot remove the last super admin. Promote another admin first." },
        { status: 400 }
      );
    }
  }

  if (hasName || hasPassword) {
    try {
      await getAdminAuth().updateUser(params.uid, {
        ...(hasName ? { displayName: name ?? undefined } : {}),
        ...(hasPassword ? { password } : {}),
      });
    } catch (error) {
      const code = (error as { code?: string })?.code;

      if (code === "auth/invalid-password") {
        return NextResponse.json({ error: "Password does not meet Firebase's requirements." }, { status: 400 });
      }

      return NextResponse.json({ error: "Could not update this admin user." }, { status: 500 });
    }

    if (hasPassword) {
      // Changing the password alone doesn't invalidate sessions already
      // issued — revoke their refresh tokens so any admin-panel session they
      // have open right now (and any session cookie verified afterward,
      // since getCurrentAdmin() checks revocation) is kicked out immediately.
      // They must sign in again with the new password to get back in.
      await getAdminAuth().revokeRefreshTokens(params.uid);
    }
  }

  await targetRef.update({
    ...(hasRole ? { role } : {}),
    ...(hasName ? { name } : {}),
  });

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
