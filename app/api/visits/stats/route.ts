import { NextResponse } from "next/server";

import { isStaffAdmin, getCurrentAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

function localDateId(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// GET - staff-admin only (matches firestore.rules' isStaffAdmin() gate on
// reading siteVisits). Sums the daily visit rows into period buckets.
export async function GET() {
  const admin = await getCurrentAdmin();

  if (!admin || !isStaffAdmin(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db.siteVisit.findMany();

  const stats = { today: 0, week: 0, month: 0, year: 0, all: 0 };
  const now = new Date();
  const todayId = localDateId(now);
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  for (const row of rows) {
    const docDate = new Date(`${row.date}T00:00:00`);
    if (Number.isNaN(docDate.getTime())) continue;

    stats.all += row.count;
    if (row.date === todayId) stats.today += row.count;
    if (docDate >= startOfWeek) stats.week += row.count;
    if (docDate >= startOfMonth) stats.month += row.count;
    if (docDate >= startOfYear) stats.year += row.count;
  }

  return NextResponse.json(stats);
}
