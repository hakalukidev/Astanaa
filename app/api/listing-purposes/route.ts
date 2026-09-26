import { NextRequest, NextResponse } from "next/server";

import { getCurrentAdmin, isStaffAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { isPropertyTypeIconColor } from "@/lib/property-type-icons";

function mapPurpose(row: {
  id: string;
  key: string;
  en: string;
  bn: string;
  icon: string;
  iconColor: string;
  order: number;
  createdAt: Date;
}) {
  return {
    id: row.id,
    key: row.key,
    en: row.en,
    bn: row.bn,
    icon: row.icon,
    iconColor: row.iconColor,
    order: row.order,
    createdAtMs: row.createdAt.getTime(),
  };
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "purpose";
}

export async function GET() {
  const rows = await db.listingPurpose.findMany({ orderBy: [{ order: "asc" }, { en: "asc" }] });
  return NextResponse.json({ purposes: rows.map(mapPurpose) });
}

// POST - staff-admin only. Generates a stable `key` from the English name,
// disambiguated against existing keys.
export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();

  if (!admin || !isStaffAdmin(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const input = (await request.json().catch(() => null)) as
    | { en?: string; bn?: string; icon?: string; iconColor?: string }
    | null;

  if (!input?.en || !input?.bn) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const existing = await db.listingPurpose.findMany({ select: { key: true, order: true } });
  const existingKeys = new Set(existing.map((item) => item.key));
  const maxOrder = existing.reduce((max, item) => Math.max(max, item.order), -1);

  const baseKey = slugify(input.en);
  let key = baseKey;
  let suffix = 2;
  while (existingKeys.has(key)) {
    key = `${baseKey}-${suffix}`;
    suffix += 1;
  }

  const row = await db.listingPurpose.create({
    data: {
      key,
      en: input.en,
      bn: input.bn,
      icon: input.icon || "Tag",
      iconColor: isPropertyTypeIconColor(input.iconColor) ? input.iconColor : "",
      order: maxOrder + 1,
    },
  });

  return NextResponse.json({ purpose: mapPurpose(row) }, { status: 201 });
}
