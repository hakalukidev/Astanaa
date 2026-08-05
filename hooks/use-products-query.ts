"use client";

import { useQuery } from "@tanstack/react-query";

import type { Product } from "@/lib/products";
import {
  productsQueryGcTimeMs,
  productsQueryKey,
  productsQueryStaleTimeMs,
} from "@/lib/product-query";
import { getAllProducts } from "@/lib/product-service";

export function useProductsQuery(initialProducts?: Product[]) {
  return useQuery({
    gcTime: productsQueryGcTimeMs,
    initialData: initialProducts,
    queryFn: getAllProducts,
    queryKey: productsQueryKey,
    refetchOnWindowFocus: false,
    staleTime: productsQueryStaleTimeMs,
  });
}
