import { NextRequest, NextResponse } from "next/server";

import { getCurrentAdmin, isStaffAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

type RouteContext = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const admin = await getCurrentAdmin();

  if (!admin || !isStaffAdmin(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const input = (await request.json().catch(() => null)) as
    | {
        title?: string;
        image?: string;
        imagePublicId?: string;
        order?: number;
        isActive?: boolean;
        tag?: string;
        cta?: string;
        ctaHref?: string;
        bg?: string;
      }
    | null;

  if (!input?.title || !input?.image) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  await db.slide.update({
    where: { id: params.id },
    data: {
      title: input.title,
      image: input.image,
      imagePublicId: input.imagePublicId || "",
      order: input.order ?? 0,
      isActive: input.isActive ?? true,
      tag: input.tag || "Featured",
      cta: input.cta || "VIEW PRODUCTS",
      ctaHref: input.ctaHref || "/products",
      bg: input.bg || "bg-slate-100",
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const admin = await getCurrentAdmin();

  if (!admin || !isStaffAdmin(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.slide.delete({ where: { id: params.id } }).catch(() => {});

  return NextResponse.json({ success: true });
}
