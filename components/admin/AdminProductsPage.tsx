"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  ExternalLink,
  Loader2,
  PencilLine,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import ProductForm, {
  toProductFormValues,
  toProductInput,
  type ProductFormValues,
} from "@/components/admin/ProductForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCategoriesQuery } from "@/hooks/use-categories-query";
import { useProductsQuery } from "@/hooks/use-products-query";
import { toast } from "@/hooks/use-toast";
import {
  findManagedMainCategory,
  getManagedCategoryOptions,
  matchesManagedCategoryValue,
  type Category,
} from "@/lib/categories";
import { deleteManagedProductImages } from "@/lib/product-image-service";
import { productsQueryKey } from "@/lib/product-query";
import {
  deleteProduct,
  updateProduct,
} from "@/lib/product-service";
import {
  getProductPhotoPublicIds,
  getProductPhotoUrls,
  getPrimaryProductPhotoUrl,
  type Product,
  type ProductInput,
} from "@/lib/products";
import { revalidateProductsCache } from "@/lib/revalidate-products-cache";

function formatProductDate(value: number | null) {
  if (!value) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function hasProductImageChanged(previousProduct: Product, nextProduct: ProductInput) {
  return (
    JSON.stringify(previousProduct.photoUrls) !== JSON.stringify(nextProduct.photoUrls) ||
    JSON.stringify(previousProduct.photoPublicIds) !== JSON.stringify(nextProduct.photoPublicIds)
  );
}

function getRemovedProductImages(previousProduct: Product, nextProduct: ProductInput) {
  const nextPhotoUrls = new Set(getProductPhotoUrls(nextProduct));
  const nextPhotoPublicIds = new Set(getProductPhotoPublicIds(nextProduct));

  return {
    photoUrls: getProductPhotoUrls(previousProduct).filter((photoUrl) => !nextPhotoUrls.has(photoUrl)),
    photoPublicIds: getProductPhotoPublicIds(previousProduct).filter(
      (photoPublicId) => !nextPhotoPublicIds.has(photoPublicId)
    ),
  };
}

function getAddedProductImages(previousProduct: Product, nextProduct: ProductInput) {
  const previousPhotoUrls = new Set(getProductPhotoUrls(previousProduct));
  const previousPhotoPublicIds = new Set(getProductPhotoPublicIds(previousProduct));

  return {
    photoUrls: getProductPhotoUrls(nextProduct).filter((photoUrl) => !previousPhotoUrls.has(photoUrl)),
    photoPublicIds: getProductPhotoPublicIds(nextProduct).filter(
      (photoPublicId) => !previousPhotoPublicIds.has(photoPublicId)
    ),
  };
}

function buildUpdatedProduct(previousProduct: Product, nextProduct: ProductInput): Product {
  return {
    ...previousProduct,
    ...nextProduct,
    updatedAtMs: Date.now(),
  };
}

function getCleanupDescription(
  context: "deleted product" | "previous image",
  cleanupStatus: "skipped" | "not_found"
) {
  if (cleanupStatus === "skipped") {
    return context === "deleted product"
      ? "The product was deleted, but no Cloudinary public ID was available for the image cleanup."
      : "The product was saved, but the previous image did not include a Cloudinary public ID for cleanup.";
  }

  return context === "deleted product"
    ? "The product was deleted, but Cloudinary could not confirm the image removal. Check the stored photo URL/public ID."
    : "The product was saved, but Cloudinary could not confirm the previous image removal. Check the stored photo URL/public ID.";
}

type AdminProductsPageProps = {
  initialCategories?: Category[];
  initialProducts?: Product[];
};

export default function AdminProductsPage({
  initialCategories,
  initialProducts,
}: AdminProductsPageProps) {
  const queryClient = useQueryClient();
  const {
    data: managedCategories = [],
    isPending: isLoadingCategories,
  } = useCategoriesQuery(initialCategories);
  const {
    data: products = [],
    error,
    isPending: isLoadingProducts,
  } = useProductsQuery(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const categoryOptions = useMemo(
    () => getManagedCategoryOptions(managedCategories),
    [managedCategories]
  );

  useEffect(() => {
    if (!error) {
      return;
    }

    toast({
      title: "Could not load products",
      description: "Please refresh the page and try again.",
      variant: "destructive",
    });
  }, [error]);

  const categoryFilters = useMemo(() => {
    const seen = new Set<string>();
    const options = ["all"];

    for (const value of [
      ...categoryOptions.map((option) => option.value),
      ...products.map((product) => product.category),
    ]) {
      const normalizedValue = value.trim();
      const normalizedKey = normalizedValue.toLowerCase();

      if (!normalizedValue || seen.has(normalizedKey)) {
        continue;
      }

      seen.add(normalizedKey);
      options.push(normalizedValue);
    }

    return options;
  }, [categoryOptions, products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = deferredSearchTerm.trim().toLowerCase();
    const selectedManagedMainCategory =
      selectedCategory === "all"
        ? null
        : findManagedMainCategory(selectedCategory, managedCategories);

    return products.filter((product) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.category.toLowerCase().includes(normalizedSearch) ||
        product.price.toLowerCase().includes(normalizedSearch);
      const matchesCategory =
        selectedCategory === "all" ||
        (selectedManagedMainCategory
          ? matchesManagedCategoryValue(product.category, selectedManagedMainCategory)
          : product.category === selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [deferredSearchTerm, managedCategories, products, selectedCategory]);

  async function handleDelete(product: Product) {
    const confirmed = window.confirm(
      `Delete "${product.name}" from the product list?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingProductId(product.id);

    try {
      await deleteProduct(product.id);
      queryClient.setQueryData<Product[]>(productsQueryKey, (currentProducts) =>
        (currentProducts ?? []).filter((candidate) => candidate.id !== product.id)
      );
      setEditingProduct((currentProduct) =>
        currentProduct?.id === product.id ? null : currentProduct
      );

      let cleanupDescription: string | null = null;

      try {
        const cleanupResult = await deleteManagedProductImages(product);

        if (cleanupResult.status !== "deleted") {
          cleanupDescription = getCleanupDescription("deleted product", cleanupResult.status);
        }
      } catch (cleanupError) {
        cleanupDescription =
          cleanupError instanceof Error
            ? cleanupError.message
            : "The product was deleted, but the image could not be removed.";
      }

      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: productsQueryKey }),
        revalidateProductsCache(),
      ]);
      toast({
        title: "Product deleted",
        description:
          cleanupDescription ?? "The product was removed from the catalog.",
      });
    } catch {
      toast({
        title: "Delete failed",
        description: "The product could not be removed right now.",
        variant: "destructive",
      });
    } finally {
      setDeletingProductId(null);
    }
  }

  async function handleUpdate(
    productId: string,
    values: ProductFormValues
  ) {
    const previousProduct =
      editingProduct && editingProduct.id === productId ? editingProduct : null;
    const nextProduct = toProductInput(values);
    const imageChanged = previousProduct
      ? hasProductImageChanged(previousProduct, nextProduct)
      : false;
    const removedImages = previousProduct
      ? getRemovedProductImages(previousProduct, nextProduct)
      : { photoPublicIds: [], photoUrls: [] };
    const addedImages = previousProduct
      ? getAddedProductImages(previousProduct, nextProduct)
      : { photoPublicIds: [], photoUrls: [] };

    try {
      await updateProduct(productId, nextProduct);

      if (previousProduct) {
        const updatedProduct = buildUpdatedProduct(previousProduct, nextProduct);

        queryClient.setQueryData<Product[]>(productsQueryKey, (currentProducts) =>
          (currentProducts ?? []).map((product) =>
            product.id === productId ? updatedProduct : product
          )
        );
      }

      let cleanupDescription: string | null = null;

      if (
        previousProduct &&
        imageChanged &&
        (removedImages.photoUrls.length > 0 || removedImages.photoPublicIds.length > 0)
      ) {
        try {
          const cleanupResult = await deleteManagedProductImages(removedImages);

          if (cleanupResult.status !== "deleted") {
            cleanupDescription = getCleanupDescription("previous image", cleanupResult.status);
          }
        } catch (cleanupError) {
          cleanupDescription =
            cleanupError instanceof Error
              ? cleanupError.message
              : "The product was saved, but the previous image could not be removed.";
        }
      }

      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: productsQueryKey }),
        revalidateProductsCache(),
      ]);
      toast({
        title: "Product updated",
        description:
          cleanupDescription ?? "The product details were saved successfully.",
      });
      setEditingProduct(null);
    } catch {
      if (
        previousProduct &&
        imageChanged &&
        (addedImages.photoUrls.length > 0 || addedImages.photoPublicIds.length > 0)
      ) {
        try {
          await deleteManagedProductImages(addedImages);
        } catch {
          // Keep the original update error as the primary failure surfaced to the UI.
        }
      }

      toast({
        title: "Update failed",
        description: "The product changes could not be saved.",
        variant: "destructive",
      });
      throw new Error("Update failed");
    }
  }

  const totalCategories = useMemo(
    () => new Set(products.map((product) => product.category).filter(Boolean)).size,
    [products]
  );
  const featuredCount = products.filter((product) => product.isHot).length;
  const imageReadyCount = products.filter((product) => product.photoUrl).length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-blue-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Total products</CardDescription>
            <CardTitle className="text-3xl text-blue-950">
              {products.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-blue-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Featured products</CardDescription>
            <CardTitle className="text-3xl text-blue-950">
              {featuredCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-blue-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Categories</CardDescription>
            <CardTitle className="text-3xl text-blue-950">
              {totalCategories}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-blue-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Images ready</CardDescription>
            <CardTitle className="text-3xl text-blue-950">
              {imageReadyCount}
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card className="border-blue-200 shadow-sm">
        <CardHeader className="gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-blue-950">All products</CardTitle>
            <CardDescription>
              Search, filter, edit, and remove products from one place.
            </CardDescription>
          </div>
          <Button asChild variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">
            <Link href="/admin/products/new">
              <Plus />
              Add Product
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, category, or price"
                className="pl-9 focus-visible:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="flex h-10 min-w-[220px] rounded-md border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {categoryFilters.map((category) => (
                  <option key={category} value={category}>
                    {category === "all" ? "All categories" : category}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="ghost"
                className="justify-start text-blue-600 hover:text-blue-800"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
              >
                Clear filters
              </Button>
            </div>
          </div>

          {isLoadingProducts ? (
            <div className="flex items-center gap-2 py-8 text-sm text-blue-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-6 py-12 text-center">
              <p className="text-base font-medium text-blue-900">
                No products match the current filters.
              </p>
              <p className="mt-2 text-sm text-blue-500">
                Try another search, choose a different category, or add a new
                product.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-blue-200">
                  <TableHead className="text-blue-700">Image</TableHead>
                  <TableHead className="text-blue-700">Name</TableHead>
                  <TableHead className="text-blue-700">Category</TableHead>
                  <TableHead className="text-blue-700">Price</TableHead>
                  <TableHead className="text-blue-700">Status</TableHead>
                  <TableHead className="text-blue-700">Updated</TableHead>
                  <TableHead className="text-right text-blue-700">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const isDeleting = deletingProductId === product.id;
                  const primaryPhotoUrl = getPrimaryProductPhotoUrl(product);

                  return (
                    <TableRow key={product.id} className="border-blue-100">
                      <TableCell>
                        {primaryPhotoUrl ? (
                          <img
                            src={primaryPhotoUrl}
                            alt={product.name}
                            className="h-14 w-14 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-blue-400">
                            No image
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="min-w-[260px]">
                        <div>
                          <p className="font-medium text-blue-900">{product.name}</p>
                          <p className="mt-1 line-clamp-2 text-sm text-blue-500">
                            {product.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-blue-700">{product.category}</TableCell>
                      <TableCell className="text-blue-700">{product.price}</TableCell>
                      <TableCell>
                        {product.isHot ? (
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                            Featured
                          </span>
                        ) : (
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                            Standard
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-blue-600">{formatProductDate(product.updatedAtMs)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-blue-300 text-blue-600 hover:bg-blue-50"
                            onClick={() => setEditingProduct(product)}
                          >
                            <PencilLine />
                            Edit
                          </Button>
                          <Button asChild variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                            <Link href={`/product/${product.id}`}>
                              <ExternalLink />
                              View
                            </Link>
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={isDeleting}
                            onClick={() => void handleDelete(product)}
                          >
                            {isDeleting ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              <Trash2 />
                            )}
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(editingProduct)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingProduct(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto border-blue-200 bg-white text-blue-900">
          <DialogHeader>
            <DialogTitle className="text-blue-950">Edit product</DialogTitle>
            <DialogDescription className="text-blue-600">
              Update product details, category, price, and image from one form.
            </DialogDescription>
          </DialogHeader>
          {editingProduct ? (
            <ProductForm
              categoriesLoading={isLoadingCategories}
              categoryOptions={categoryOptions}
              key={editingProduct.id}
              defaultValues={toProductFormValues(editingProduct)}
              layout="dialog"
              submitLabel="Save Changes"
              pendingLabel="Saving Changes..."
              onSubmit={(values) => handleUpdate(editingProduct.id, values)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
