import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

// GET - buy requests addressed to the signed-in seller.
export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ requests: [] });
  }

  const rows = await db.buyRequest.findMany({
    where: { sellerId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    requests: rows.map((row) => ({
      id: row.id,
      listingId: row.listingId,
      listingTitle: row.listingTitle ?? "",
      buyerId: row.buyerId,
      buyerName: row.buyerName,
      buyerPhone: row.buyerPhone,
      sellerId: row.sellerId,
      status: row.status.toLowerCase(),
      createdAtMs: row.createdAt.getTime(),
    })),
  });
}
