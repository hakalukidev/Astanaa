import { NextRequest, NextResponse } from "next/server";

import { getCurrentAdmin, type AdminRole } from "@/lib/admin-auth";
import { hashPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";

const VALID_ROLES: AdminRole[] = ["admin", "super_admin", "moderator", "promoter"];
const ROLE_TO_ENUM: Record<AdminRole, "ADMIN" | "SUPER_ADMIN" | "MODERATOR" | "PROMOTER"> = {
  admin: "ADMIN",
  super_admin: "SUPER_ADMIN",
  moderator: "MODERATOR",
  promoter: "PROMOTER",
};

// GET - list every admin panel user. Super admin only.
export async function GET() {
  const currentAdmin = await getCurrentAdmin();

  if (!currentAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (currentAdmin.role !== "super_admin") {
    return NextResponse.json({ error: "Only super admins can manage admin users." }, { status: 403 });
  }

  const users = await db.user.findMany({
    where: { role: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return NextResponse.json({
    users: users.map((user) => ({
      uid: user.id,
      email: user.email,
      name: user.name,
      role: (user.role as string).toLowerCase(),
      createdAt: user.createdAt.toISOString(),
      createdBy: null,
    })),
  });
}

// POST - create a new admin panel account. Super admin only.
export async function POST(request: NextRequest) {
  const currentAdmin = await getCurrentAdmin();

  if (!currentAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (currentAdmin.role !== "super_admin") {
    return NextResponse.json({ error: "Only super admins can create admin users." }, { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as
    | { email?: string; password?: string; role?: string; name?: string }
    | null;

  const email = payload?.email?.trim().toLowerCase();
  const password = payload?.password;
  const role = payload?.role;
  const name = payload?.name?.trim() || null;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  if (!role || !VALID_ROLES.includes(role as AdminRole)) {
    return NextResponse.json(
      { error: "Role must be one of: admin, super_admin, moderator, promoter." },
      { status: 400 }
    );
  }

  const existing = await db.user.findUnique({ where: { email } });

  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const user = await db.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: ROLE_TO_ENUM[role as AdminRole],
    },
  });

  return NextResponse.json({ uid: user.id, email, name, role }, { status: 201 });
}
