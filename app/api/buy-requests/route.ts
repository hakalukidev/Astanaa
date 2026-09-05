import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

function mapRequest(row: {
  id: string;
  listingId: string;
  listingTitle: string | null;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  sellerId: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: Date;
}) {
  return {
    id: row.id,
    listingId: row.listingId,
    listingTitle: row.listingTitle ?? "",
    buyerId: row.buyerId,
    buyerName: row.buyerName,
    buyerPhone: row.buyerPhone,
    sellerId: row.sellerId,
    status: row.status.toLowerCase() as "pending" | "accepted" | "declined",
    createdAtMs: row.createdAt.getTime(),
  };
}

// POST - buyer expresses interest in a listing. Deduped per (listing, buyer)
// pair. buyerId always comes from the session, never the request body.
export async function POST(request: NextRequest) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const input = (await request.json().catch(() => null)) as
    | { listingId?: string; listingTitle?: string; buyerPhone?: string; sellerId?: string }
    | null;

  if (!input?.listingId || !input?.sellerId) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const existing = await db.buyRequest.findUnique({
    where: { listingId_buyerId: { listingId: input.listingId, buyerId: user.id } },
  });

  if (existing) {
    return NextResponse.json({ request: mapRequest(existing) });
  }

  const row = await db.buyRequest.create({
    data: {
      listingId: input.listingId,
      listingTitle: input.listingTitle || null,
      buyerId: user.id,
      buyerName: user.name || user.email,
      buyerPhone: input.buyerPhone || user.phone || "",
      sellerId: input.sellerId,
    },
  });

  return NextResponse.json({ request: mapRequest(row) }, { status: 201 });
}
