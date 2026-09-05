import { NextRequest, NextResponse } from "next/server";

import { getCurrentAdmin, isStaffAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

function mapSlide(row: {
  id: string;
  title: string;
  image: string;
  imagePublicId: string;
  order: number;
  isActive: boolean;
  tag: string;
  cta: string;
  ctaHref: string;
  bg: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    title: row.title,
    image: row.image,
    imagePublicId: row.imagePublicId,
    order: row.order,
    isActive: row.isActive,
    tag: row.tag,
    cta: row.cta,
    ctaHref: row.ctaHref,
    bg: row.bg,
    createdAtMs: row.createdAt.getTime(),
    updatedAtMs: row.updatedAt.getTime(),
  };
}

// GET - public. Returns every slide (including inactive ones — the
// homepage carousel filters isActive client-side, same as before; the
// admin page needs the inactive ones too, to edit/re-enable them).
export async function GET() {
  const rows = await db.slide.findMany({ orderBy: [{ order: "asc" }, { title: "asc" }] });
  return NextResponse.json({ slides: rows.map(mapSlide) });
}

// POST - staff-admin only.
export async function POST(request: NextRequest) {
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

  const row = await db.slide.create({
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

  return NextResponse.json({ slide: mapSlide(row) }, { status: 201 });
}
