import { NextResponse } from "next/server";

import { db } from "@/lib/db";

function localDateId(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// POST - public. Increments today's visit counter by 1.
export async function POST() {
  const today = localDateId(new Date());

  await db.siteVisit.upsert({
    where: { date: today },
    create: { date: today, count: 1 },
    update: { count: { increment: 1 } },
  });

  return NextResponse.json({ success: true });
}
