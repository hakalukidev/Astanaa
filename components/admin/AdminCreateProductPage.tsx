// components/admin/AdminCreateProductPage.tsx
"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import ProductForm, {
  emptyProductFormValues,
  toProductInput,
} from "@/components/admin/ProductForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCategoriesQuery } from "@/hooks/use-categories-query";
import { toast } from "@/hooks/use-toast";
import {
  getManagedCategoryOptions,
  type Category,
} from "@/lib/categories";
import { productsQueryKey } from "@/lib/product-query";
import { createProduct } from "@/lib/product-service";
import { revalidateProductsCache } from "@/lib/revalidate-products-cache";

type AdminCreateProductPageProps = {
  initialCategories?: Category[];
};

export default function AdminCreateProductPage({
  initialCategories,
}: AdminCreateProductPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    data: categories = [],
    isPending: isLoadingCategories,
  } = useCategoriesQuery(initialCategories);
  const categoryOptions = useMemo(
    () => getManagedCategoryOptions(categories),
    [categories]
  );

  async function handleCreate(values: typeof emptyProductFormValues) {
    try {
      await createProduct(toProductInput(values));
      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: productsQueryKey }),
        revalidateProductsCache(),
      ]);
      toast({
        title: "Product saved",
        description: "The new product is now available in the catalog.",
      });
      router.push("/admin/products");
    } catch {
      toast({
        title: "Save failed",
        description: "The product could not be saved right now.",
        variant: "destructive",
      });
      throw new Error("Create failed");
    }
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="w-fit px-0 text-blue-600">
        <Link href="/admin/products">
          <ArrowLeft />
          Back to all products
        </Link>
      </Button>

      <Card className="border-blue-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-blue-950">Add product</CardTitle>
          <CardDescription>
            Create a new catalog item with pricing, details, and an image.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm
            categoriesLoading={isLoadingCategories}
            categoryOptions={categoryOptions}
            defaultValues={emptyProductFormValues}
            layout="page"
            submitLabel="Save Product"
            pendingLabel="Saving Product..."
            onSubmit={handleCreate}
          />
        </CardContent>
      </Card>
    </div>
  );
}
