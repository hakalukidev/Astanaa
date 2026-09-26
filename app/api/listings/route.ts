import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { mapListingRow } from "@/lib/listing-mappers";
import type { ListingInput } from "@/lib/listings";
import { normalizeTenantTypes } from "@/lib/tenant-types";

// GET - public active-listings feed (parity with the old subscribeToActiveListings).
export async function GET() {
  const rows = await db.listing.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ listings: rows.map(mapListingRow) });
}

// POST - create a new listing. Always starts "pending" — matches
// firestore.rules: signed-in, sellerId must be the caller, status forced.
export async function POST(request: NextRequest) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const input = (await request.json().catch(() => null)) as Partial<ListingInput> | null;

  if (!input || !input.title || !input.propertyType || !input.purpose) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const row = await db.listing.create({
    data: {
      sellerId: user.id,
      sellerName: input.sellerName || user.name || user.email,
      sellerPhone: input.sellerPhone || null,
      sellerWhatsapp: input.sellerWhatsapp || null,
      sellerEmail: input.sellerEmail || null,
      sellerRole: input.sellerRole ?? "client",
      title: input.title,
      description: input.description ?? "",
      price: input.price ?? 0,
      negotiable: input.negotiable ?? false,
      purpose: input.purpose,
      propertyType: input.propertyType,
      location: input.location ?? "",
      locationDivision: input.locationDivision || null,
      locationDistrict: input.locationDistrict || null,
      locationUpazila: input.locationUpazila || null,
      locationArea: input.locationArea || null,
      locationExtra: input.locationExtra ?? [],
      locationMapUrl: input.locationMapUrl || null,
      bedrooms: input.bedrooms ?? null,
      bathrooms: input.bathrooms ?? null,
      areaSqft: input.areaSqft ?? null,
      tenantTypes: normalizeTenantTypes(input.tenantTypes),
      photoUrls: input.photoUrls ?? [],
      photoPublicIds: input.photoPublicIds ?? [],
      status: "PENDING",
      boostStatus: "NONE",
    },
  });

  return NextResponse.json({ listing: mapListingRow(row) }, { status: 201 });
}
