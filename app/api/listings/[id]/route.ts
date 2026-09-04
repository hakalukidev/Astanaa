import { NextRequest, NextResponse } from "next/server";

import { canModerateListings, getCurrentAdmin, isStaffAdmin, type AdminRole } from "@/lib/admin-auth";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { mapListingRow } from "@/lib/listing-mappers";
import type { ListingInput, ListingStatus } from "@/lib/listings";

type RouteContext = { params: { id: string } };

const EDITABLE_FIELDS = [
  "sellerPhone",
  "sellerWhatsapp",
  "title",
  "description",
  "price",
  "negotiable",
  "purpose",
  "propertyType",
  "location",
  "locationDivision",
  "locationDistrict",
  "locationUpazila",
  "locationArea",
  "locationExtra",
  "locationMapUrl",
  "bedrooms",
  "bathrooms",
  "areaSqft",
  "photoUrls",
  "photoPublicIds",
] as const satisfies readonly (keyof ListingInput)[];

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const row = await db.listing.findUnique({ where: { id: params.id } });

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ listing: mapListingRow(row) });
}

// PATCH - generic field edit (post-ad "edit my listing", or a moderator
// tweaking a location typo). Does NOT change moderation stamps — approving/
// rejecting goes through POST /api/listings/[id]/moderate instead, matching
// the old updateListing() vs markListingStatus() split.
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db.listing.findUnique({ where: { id: params.id } });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = existing.sellerId === user.id;
  const isModerator = user.role ? canModerateListings(user.role.toLowerCase() as AdminRole) : false;

  if (!isOwner && !isModerator) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | (Partial<ListingInput> & { status?: ListingStatus })
    | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!isModerator) {
    // Owner path — mirrors the old firestore.rules constraint: the
    // resulting status must stay "pending" or become "sold", and boost
    // can't be self-activated.
    const nextStatus = body.status ?? (existing.status.toLowerCase() as ListingStatus);
    if (nextStatus !== "pending" && nextStatus !== "sold") {
      return NextResponse.json({ error: "You can't set that status." }, { status: 403 });
    }
  }

  const data: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) {
      data[field] = (body as Record<string, unknown>)[field];
    }
  }
  if (body.status) {
    data.status = body.status.toUpperCase();
  }

  const row = await db.listing.update({ where: { id: params.id }, data });

  return NextResponse.json({ listing: mapListingRow(row) });
}

// DELETE - staff-admin or the listing's own owner. Logs a moderationLog
// entry when a staff member (not the owner) removes someone else's listing.
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db.listing.findUnique({ where: { id: params.id } });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = existing.sellerId === user.id;
  const admin = await getCurrentAdmin();
  const isStaff = admin ? isStaffAdmin(admin.role) : false;

  if (!isOwner && !isStaff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (isStaff && !isOwner && admin) {
    await db.moderationLog.create({
      data: {
        listingId: existing.id,
        listingTitle: existing.title,
        sellerId: existing.sellerId,
        sellerName: existing.sellerName,
        moderatorUid: admin.uid,
        moderatorName: admin.name,
      },
    });
  }

  await db.listing.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
