import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

// GET /api/listings/counts?types=Flat%20Rent,Sublet,... - active-listing
// count per propertyType, public (matches the old open aggregation query).
// One groupBy query instead of N separate counts.
export async function GET(request: NextRequest) {
  const typesParam = request.nextUrl.searchParams.get("types") ?? "";
  const types = typesParam.split(",").map((value) => value.trim()).filter(Boolean);

  if (types.length === 0) {
    return NextResponse.json({ counts: {} });
  }

  const grouped = await db.listing.groupBy({
    by: ["propertyType"],
    where: { status: "ACTIVE", propertyType: { in: types } },
    _count: { _all: true },
  });

  const counts: Record<string, number> = Object.fromEntries(types.map((type) => [type, 0]));
  for (const group of grouped) {
    counts[group.propertyType] = group._count._all;
  }

  return NextResponse.json({ counts });
}
