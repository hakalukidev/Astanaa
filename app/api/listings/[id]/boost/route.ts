import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { mapListingRow } from "@/lib/listing-mappers";

type RouteContext = { params: { id: string } };

// PATCH - owner submits a boost payment request. No live payment gateway —
// this just records intent; an admin verifies and activates it manually.
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db.listing.findUnique({ where: { id: params.id } });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.sellerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | { method?: "bkash" | "nagad" | "rocket" | "card"; transactionId?: string | null }
    | null;

  if (!body?.method) {
    return NextResponse.json({ error: "Missing payment method." }, { status: 400 });
  }

  const row = await db.listing.update({
    where: { id: params.id },
    data: {
      boostStatus: "PENDING",
      boostMethod: body.method,
      boostTransactionId: body.transactionId ?? null,
      boostRequestedAt: new Date(),
      boostExpiresAt: null,
    },
  });

  return NextResponse.json({ listing: mapListingRow(row) });
}
