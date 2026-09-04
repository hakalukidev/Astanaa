import { NextRequest, NextResponse } from "next/server";

import { countSuperAdmins, getCurrentAdmin, type AdminRole } from "@/lib/admin-auth";
import { hashPassword } from "@/lib/auth/password";
import { revokeAllUserSessions } from "@/lib/auth/session";
import { db } from "@/lib/db";

const VALID_ROLES: AdminRole[] = ["admin", "super_admin", "moderator", "promoter"];
const ROLE_TO_ENUM: Record<AdminRole, "ADMIN" | "SUPER_ADMIN" | "MODERATOR" | "PROMOTER"> = {
  admin: "ADMIN",
  super_admin: "SUPER_ADMIN",
  moderator: "MODERATOR",
  promoter: "PROMOTER",
};

type RouteContext = {
  params: { uid: string };
};

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

  const name = hasName ? payload?.name?.trim() || null : undefined;
  const password = payload?.password;

  if (hasPassword && (!password || password.length < 8)) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const target = await db.user.findUnique({ where: { id: params.uid } });

  if (!target || !target.role) {
    return NextResponse.json({ error: "Admin user not found." }, { status: 404 });
  }

  if (hasRole) {
    const isDemotingLastSuperAdmin =
      target.role === "SUPER_ADMIN" && role !== "super_admin" && (await countSuperAdmins()) <= 1;

    if (isDemotingLastSuperAdmin) {
      return NextResponse.json(
        { error: "Cannot remove the last super admin. Promote another admin first." },
        { status: 400 }
      );
    }
  }

  await db.user.update({
    where: { id: params.uid },
    data: {
      ...(hasRole ? { role: ROLE_TO_ENUM[role as AdminRole] } : {}),
      ...(hasName ? { name } : {}),
      ...(hasPassword ? { passwordHash: await hashPassword(password!) } : {}),
    },
  });

  if (hasPassword) {
    // Changing the password alone doesn't invalidate sessions already
    // issued — kick out any admin-panel session they have open right now.
    // They must sign in again with the new password to get back in.
    await revokeAllUserSessions(params.uid);
  }

  return NextResponse.json({ success: true });
}

// DELETE - remove an admin user's account entirely. Super admin only.
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
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

  const target = await db.user.findUnique({ where: { id: params.uid } });

  if (!target || !target.role) {
    return NextResponse.json({ error: "Admin user not found." }, { status: 404 });
  }

  const isRemovingLastSuperAdmin = target.role === "SUPER_ADMIN" && (await countSuperAdmins()) <= 1;

  if (isRemovingLastSuperAdmin) {
    return NextResponse.json(
      { error: "Cannot remove the last super admin. Promote another admin first." },
      { status: 400 }
    );
  }

  try {
    await db.user.delete({ where: { id: params.uid } });
  } catch (error) {
    // P2003 = foreign key constraint failed — this account also owns
    // listings/messages/etc., which Postgres (unlike Firestore) won't let
    // us silently orphan. Clearing their role instead of deleting the
    // account keeps their existing content intact.
    if ((error as { code?: string })?.code === "P2003") {
      await db.user.update({ where: { id: params.uid }, data: { role: null } });
      await revokeAllUserSessions(params.uid);
      return NextResponse.json({ success: true });
    }
    throw error;
  }

  return NextResponse.json({ success: true });
}
