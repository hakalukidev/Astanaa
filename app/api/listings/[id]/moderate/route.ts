import { NextRequest, NextResponse } from "next/server";

import { canModerateListings, getCurrentAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { mapListingRow } from "@/lib/listing-mappers";

type RouteContext = { params: { id: string } };

// POST - approve/reject a pending listing. Moderator+ only. Stamps
// moderatedBy/moderatedByName/moderatedAt — the piece that made this a
// separate action from the generic PATCH field-edit route — and notifies
// the seller.
export async function POST(request: NextRequest, { params }: RouteContext) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canModerateListings(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { status?: "active" | "rejected" } | null;

  if (body?.status !== "active" && body?.status !== "rejected") {
    return NextResponse.json({ error: "status must be 'active' or 'rejected'." }, { status: 400 });
  }

  const existing = await db.listing.findUnique({ where: { id: params.id } });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const row = await db.listing.update({
    where: { id: params.id },
    data: {
      status: body.status === "active" ? "ACTIVE" : "REJECTED",
      moderatedBy: admin.uid,
      moderatedByName: admin.name,
      moderatedAt: new Date(),
    },
  });

  await db.notification.create({
    data: {
      userId: existing.sellerId,
      type: body.status === "active" ? "LISTING_APPROVED" : "LISTING_REJECTED",
      listingId: existing.id,
      listingTitle: existing.title,
    },
  });

  return NextResponse.json({ listing: mapListingRow(row) });
}
