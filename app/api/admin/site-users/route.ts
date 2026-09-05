import { NextResponse } from "next/server";

import { getCurrentAdmin, isStaffAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

// GET - list every signed-up site user (buyers/sellers), oldest first.
// Staff admin only (admin / super_admin).
export async function GET() {
  const currentAdmin = await getCurrentAdmin();

  if (!currentAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStaffAdmin(currentAdmin.role)) {
    return NextResponse.json({ error: "Only admins can view the user list." }, { status: 403 });
  }

  const rows = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, phone: true, email: true, createdAt: true },
  });

  return NextResponse.json({
    users: rows.map((row) => ({
      uid: row.id,
      name: row.name ?? "",
      phone: row.phone ?? "",
      email: row.email,
      createdAtMs: row.createdAt.getTime(),
    })),
  });
}
