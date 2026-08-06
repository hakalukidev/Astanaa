import { NextRequest, NextResponse } from "next/server";

import { ADMINS_COLLECTION, getCurrentAdmin, type AdminRole } from "@/lib/admin-auth";
import { getAdminAuth, getAdminDb, isFirebaseAdminReady } from "@/lib/firebase-admin";

const VALID_ROLES: AdminRole[] = ["admin", "super_admin", "moderator", "promoter"];

// GET - list every admin panel user. Super admin only.
export async function GET() {
  const currentAdmin = await getCurrentAdmin();

  if (!currentAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (currentAdmin.role !== "super_admin") {
    return NextResponse.json({ error: "Only super admins can manage admin users." }, { status: 403 });
  }

  const snapshot = await getAdminDb().collection(ADMINS_COLLECTION).orderBy("createdAt", "asc").get();

  const users = snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data();
    const createdAt = data.createdAt?.toDate?.() ?? null;

    return {
      uid: docSnapshot.id,
      email: data.email as string,
      role: data.role as AdminRole,
      createdAt: createdAt ? createdAt.toISOString() : null,
      createdBy: (data.createdBy as string | undefined) ?? null,
    };
  });

  return NextResponse.json({ users });
}

// POST - create a new admin panel user (Firebase Auth account + admins doc).
// Super admin only.
export async function POST(request: NextRequest) {
  const currentAdmin = await getCurrentAdmin();

  if (!currentAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (currentAdmin.role !== "super_admin") {
    return NextResponse.json({ error: "Only super admins can create admin users." }, { status: 403 });
  }

  if (!isFirebaseAdminReady()) {
    return NextResponse.json({ error: "Firebase Admin is not configured." }, { status: 500 });
  }

  const payload = (await request.json().catch(() => null)) as
    | { email?: string; password?: string; role?: string }
    | null;

  const email = payload?.email?.trim().toLowerCase();
  const password = payload?.password;
  const role = payload?.role;

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

  const adminAuth = getAdminAuth();

  let uid: string;
  try {
    const userRecord = await adminAuth.createUser({ email, password });
    uid = userRecord.uid;
  } catch (error) {
    const code = (error as { code?: string })?.code;

    if (code === "auth/email-already-exists") {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    if (code === "auth/invalid-password") {
      return NextResponse.json({ error: "Password does not meet Firebase's requirements." }, { status: 400 });
    }

    return NextResponse.json({ error: "Could not create the account." }, { status: 500 });
  }

  await getAdminDb()
    .collection(ADMINS_COLLECTION)
    .doc(uid)
    .set({
      email,
      role,
      createdAt: new Date(),
      createdBy: currentAdmin.uid,
    });

  return NextResponse.json({ uid, email, role }, { status: 201 });
}
