import { NextRequest, NextResponse } from "next/server";

import { getCurrentAdmin, isStaffAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { isPropertyTypeIconColor } from "@/lib/property-type-icons";

type RouteContext = { params: { id: string } };

// PATCH - staff-admin only. Renaming `en` cascades to every listing whose
// propertyType still holds the old label — atomic since both tables are
// Postgres now (no more cross-service HTTP hop for the cascade).
export async function PATCH(request: NextRequest, { params }: RouteContext) {
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

  const existing = await db.propertyTypeCategory.findUnique({ where: { id: params.id } });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.$transaction(async (tx) => {
    await tx.propertyTypeCategory.update({
      where: { id: params.id },
      data: {
        purpose: input.purpose,
        en: input.en,
        bn: input.bn,
        icon: input.icon || "Building2",
        iconColor: isPropertyTypeIconColor(input.iconColor) ? input.iconColor : "",
      },
    });

    if (existing.en !== input.en) {
      await tx.listing.updateMany({
        where: { propertyType: existing.en },
        data: { propertyType: input.en },
      });
    }
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const admin = await getCurrentAdmin();

  if (!admin || !isStaffAdmin(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.propertyTypeCategory.delete({ where: { id: params.id } }).catch(() => {});

  return NextResponse.json({ success: true });
}
