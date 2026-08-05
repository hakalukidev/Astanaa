"use client";

import { useQuery } from "@tanstack/react-query";

import type { Category } from "@/lib/categories";
import {
  categoriesQueryGcTimeMs,
  categoriesQueryKey,
  categoriesQueryStaleTimeMs,
} from "@/lib/category-query";
import { getAllCategories } from "@/lib/category-service";

export function useCategoriesQuery(initialCategories?: Category[]) {
  return useQuery({
    gcTime: categoriesQueryGcTimeMs,
    initialData: initialCategories,
    queryFn: getAllCategories,
    queryKey: categoriesQueryKey,
    refetchOnWindowFocus: false,
    staleTime: categoriesQueryStaleTimeMs,
  });
}
