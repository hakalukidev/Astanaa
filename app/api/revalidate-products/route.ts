import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { productsCacheTag } from "@/lib/product-cache";

export async function POST() {
  revalidateTag(productsCacheTag);

  return NextResponse.json({ revalidated: true });
}
