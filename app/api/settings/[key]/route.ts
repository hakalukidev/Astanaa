import { NextRequest, NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

const VALID_KEYS = new Set(["about", "footer", "rules", "terms"]);

type RouteContext = { params: { key: string } };

// GET - publicly readable (About/footer/rules/terms are shown to every
// visitor). Returns null if nothing's been saved yet — callers merge with
// their own built-in defaults.
export async function GET(_request: NextRequest, { params }: RouteContext) {
  if (!VALID_KEYS.has(params.key)) {
    return NextResponse.json({ error: "Unknown settings key." }, { status: 404 });
  }

  const row = await db.siteSetting.findUnique({ where: { key: params.key } });

  return NextResponse.json({ value: row?.value ?? null });
}

// PATCH - super-admin only, matching firestore.rules' isSuperAdmin() gate on
// the `settings` collection.
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  if (!VALID_KEYS.has(params.key)) {
    return NextResponse.json({ error: "Unknown settings key." }, { status: 404 });
  }

  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const value = await request.json().catch(() => null);

  if (!value || typeof value !== "object") {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  await db.siteSetting.upsert({
    where: { key: params.key },
    create: { key: params.key, value },
    update: { value },
  });

  return NextResponse.json({ success: true });
}
