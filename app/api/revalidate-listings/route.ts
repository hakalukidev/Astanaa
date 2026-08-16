import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { listingsCacheTag } from "@/lib/listing-cache";

export async function POST() {
  revalidateTag(listingsCacheTag);

  return NextResponse.json({ revalidated: true });
}
