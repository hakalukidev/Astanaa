import { NextRequest, NextResponse } from "next/server";

import { getCurrentAdmin, isStaffAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { isPropertyTypeIconColor } from "@/lib/property-type-icons";

function mapCategory(row: {
  id: string;
  purpose: string;
  en: string;
  bn: string;
  icon: string;
  iconColor: string;
  order: number;
  createdAt: Date;
}) {
  return {
    id: row.id,
    purpose: row.purpose,
    en: row.en,
    bn: row.bn,
    icon: row.icon,
    iconColor: row.iconColor,
    order: row.order,
    createdAtMs: row.createdAt.getTime(),
  };
}

export async function GET() {
  const rows = await db.propertyTypeCategory.findMany({
    orderBy: [{ purpose: "asc" }, { order: "asc" }, { en: "asc" }],
  });

  return NextResponse.json({ categories: rows.map(mapCategory) });
}

// POST - staff-admin only.
export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();

  if (!admin || !isStaffAdmin(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const input = (await request.json().catch(() => null)) as
    | { purpose?: string; en?: string; bn?: string; icon?: string; iconColor?: string }
    | null;

  if (!input?.purpose || !input?.en || !input?.bn) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const maxOrder = await db.propertyTypeCategory.aggregate({
    where: { purpose: input.purpose },
    _max: { order: true },
  });

  const row = await db.propertyTypeCategory.create({
    data: {
      purpose: input.purpose,
      en: input.en,
      bn: input.bn,
      icon: input.icon || "Building2",
      iconColor: isPropertyTypeIconColor(input.iconColor) ? input.iconColor : "",
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json({ category: mapCategory(row) }, { status: 201 });
}
