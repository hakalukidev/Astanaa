import "server-only";

import { unstable_cache } from "next/cache";

import { productsQueryStaleTimeMs } from "@/lib/product-query";
import { getAllProducts } from "@/lib/product-service";

export const productsCacheTag = "products";

const productsCacheRevalidateSeconds = Math.floor(
  productsQueryStaleTimeMs / 1000
);

export const getCachedProducts = unstable_cache(
  async () => getAllProducts(),
  ["products-list"],
  {
    revalidate: productsCacheRevalidateSeconds,
    tags: [productsCacheTag],
  }
);
