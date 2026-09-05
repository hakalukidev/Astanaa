import { NextRequest, NextResponse } from "next/server";

import { getCurrentAdmin, isStaffAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

function mapNode(row: {
  id: string;
  parentId: string | null;
  en: string;
  bn: string;
  order: number;
  manualOrder: boolean;
  createdAt: Date;
}) {
  return {
    id: row.id,
    parentId: row.parentId,
    en: row.en,
    bn: row.bn,
    order: row.order,
    manualOrder: row.manualOrder,
    createdAtMs: row.createdAt.getTime(),
  };
}

// GET - the post-ad location picker needs the full tree at once (it's built
// client-side via childrenOf()), so this returns everything, unfiltered.
export async function GET() {
  const rows = await db.locationNode.findMany();
  return NextResponse.json({ nodes: rows.map(mapNode) });
}

// POST - staff-admin only. Appends as the last child of parentId.
export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();

  if (!admin || !isStaffAdmin(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const input = (await request.json().catch(() => null)) as
    | { parentId?: string | null; en?: string; bn?: string }
    | null;

  if (!input?.en || !input?.bn) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const maxOrder = await db.locationNode.aggregate({
    where: { parentId: input.parentId ?? null },
    _max: { order: true },
  });

  const row = await db.locationNode.create({
    data: {
      parentId: input.parentId ?? null,
      en: input.en,
      bn: input.bn,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json({ node: mapNode(row) }, { status: 201 });
}
