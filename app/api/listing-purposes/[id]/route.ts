import { NextRequest, NextResponse } from "next/server";

import { getCurrentAdmin, isStaffAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { isPropertyTypeIconColor } from "@/lib/property-type-icons";

type RouteContext = { params: { id: string } };

// PATCH - staff-admin only. `key` is set once at creation and never
// editable, so existing listings/categories that reference it keep matching.
export async function PATCH(request: NextRequest, { params }: RouteContext) {
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

  await db.listingPurpose.update({
    where: { id: params.id },
    data: {
      en: input.en,
      bn: input.bn,
      icon: input.icon || "Tag",
      iconColor: isPropertyTypeIconColor(input.iconColor) ? input.iconColor : "",
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const admin = await getCurrentAdmin();

  if (!admin || !isStaffAdmin(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.listingPurpose.delete({ where: { id: params.id } }).catch(() => {});

  return NextResponse.json({ success: true });
}
