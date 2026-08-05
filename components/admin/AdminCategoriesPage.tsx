"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  FolderTree,
  Layers3,
  Loader2,
  PencilLine,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import CategoryForm, {
  emptyCategoryFormValues,
  toCategoryFormValues,
  toCategoryInput as toManagedCategoryInput,
  type CategoryFormValues,
} from "@/components/admin/CategoryForm";
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
  getCategoryKey,
  getTotalSubcategoryCount,
  matchesManagedCategoryValue,
  sortCategories,
  type Category,
} from "@/lib/categories";
import { categoriesQueryKey } from "@/lib/category-query";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/lib/category-service";
import { type Product } from "@/lib/products";

type AdminCategoriesPageProps = {
  initialCategories?: Category[];
  initialProducts?: Product[];
};

function formatCategoryDate(value: number | null) {
  if (!value) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

export default function AdminCategoriesPage({
  initialCategories,
  initialProducts,
}: AdminCategoriesPageProps) {
  const queryClient = useQueryClient();
  const {
    data: categories = [],
    error: categoriesError,
    isPending: isLoadingCategories,
  } = useCategoriesQuery(initialCategories);
  const { data: products = [] } = useProductsQuery(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    if (!categoriesError) {
      return;
    }

    toast({
      title: "Could not load categories",
      description: "Please refresh the page and try again.",
      variant: "destructive",
    });
  }, [categoriesError]);

  const categoryRows = useMemo(
    () =>
      categories.map((category) => {
        const linkedProducts = products.filter((product) =>
          matchesManagedCategoryValue(product.category, category)
        );

        return {
          ...category,
          linkedProducts,
        };
      }),
    [categories, products]
  );

  const filteredRows = useMemo(() => {
    const normalizedSearch = getCategoryKey(deferredSearchTerm);

    if (!normalizedSearch) {
      return categoryRows;
    }

    return categoryRows.filter((category) =>
      [category.name, ...category.subcategories].some((value) =>
        getCategoryKey(value).includes(normalizedSearch)
      )
    );
  }, [categoryRows, deferredSearchTerm]);

  const totalLinkedProducts = useMemo(
    () =>
      products.filter((product) =>
        categories.some((category) =>
          matchesManagedCategoryValue(product.category, category)
        )
      ).length,
    [categories, products]
  );

  function hasDuplicateCategoryName(name: string, ignoreCategoryId?: string) {
    const normalizedName = getCategoryKey(name);

    return categories.some(
      (category) =>
        category.id !== ignoreCategoryId &&
        getCategoryKey(category.name) === normalizedName
    );
  }

  async function handleCreateCategory(values: CategoryFormValues) {
    const input = toManagedCategoryInput(values);

    if (hasDuplicateCategoryName(input.name)) {
      toast({
        title: "Category already exists",
        description: "Choose a different category name before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      const createdCategory = await createCategory(input);
      const optimisticCategory: Category = {
        id: createdCategory.id,
        ...input,
        createdAtMs: Date.now(),
        updatedAtMs: Date.now(),
      };

      queryClient.setQueryData<Category[]>(categoriesQueryKey, (currentCategories) =>
        sortCategories([...(currentCategories ?? []), optimisticCategory])
      );
      await queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
      setIsCreateDialogOpen(false);
      toast({
        title: "Category created",
        description: "The new category is now available in the admin list.",
      });
    } catch {
      toast({
        title: "Save failed",
        description: "The category could not be created right now.",
        variant: "destructive",
      });
    }
  }

  async function handleUpdateCategory(values: CategoryFormValues) {
    if (!editingCategory) {
      return;
    }

    const input = toManagedCategoryInput(values);

    if (hasDuplicateCategoryName(input.name, editingCategory.id)) {
      toast({
        title: "Category already exists",
        description: "Choose a different category name before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateCategory(editingCategory.id, input);
      queryClient.setQueryData<Category[]>(categoriesQueryKey, (currentCategories) =>
        sortCategories(
          (currentCategories ?? []).map((category) =>
            category.id === editingCategory.id
              ? {
                  ...category,
                  ...input,
                  updatedAtMs: Date.now(),
                }
              : category
          )
        )
      );
      await queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
      setEditingCategory(null);
      toast({
        title: "Category updated",
        description: "Your category changes have been saved.",
      });
    } catch {
      toast({
        title: "Update failed",
        description: "The category could not be updated right now.",
        variant: "destructive",
      });
    }
  }

  async function handleDeleteCategory(category: Category) {
    const confirmationMessage = category.subcategories.length
      ? `Delete "${category.name}" and its ${category.subcategories.length} subcategories? Linked products will not be changed.`
      : `Delete "${category.name}"? Linked products will not be changed.`;
    const confirmed = window.confirm(confirmationMessage);

    if (!confirmed) {
      return;
    }

    setDeletingCategoryId(category.id);

    try {
      await deleteCategory(category.id);
      queryClient.setQueryData<Category[]>(categoriesQueryKey, (currentCategories) =>
        (currentCategories ?? []).filter(
          (currentCategory) => currentCategory.id !== category.id
        )
      );
      setEditingCategory((currentCategory) =>
        currentCategory?.id === category.id ? null : currentCategory
      );
      await queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
      toast({
        title: "Category deleted",
        description:
          "The category group was removed. Product category values were not changed.",
      });
    } catch {
      toast({
        title: "Delete failed",
        description: "The category could not be removed right now.",
        variant: "destructive",
      });
    } finally {
      setDeletingCategoryId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="border-blue-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Total categories</CardDescription>
            <CardTitle className="text-3xl text-blue-950">
              {categories.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-blue-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Total subcategories</CardDescription>
            <CardTitle className="text-3xl text-blue-950">
              {getTotalSubcategoryCount(categories)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-blue-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Linked products</CardDescription>
            <CardTitle className="text-3xl text-blue-950">
              {totalLinkedProducts}
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card className="border-blue-200 shadow-sm">
        <CardHeader className="gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-blue-950">
              Categories and subcategories
            </CardTitle>
            <CardDescription>
              Add, edit, and delete category groups for the admin catalog. Deleting
              a category here will not change any saved product category values.
            </CardDescription>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row xl:max-w-2xl xl:justify-end">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search categories or subcategories"
                className="border-blue-200 pl-10 focus-visible:ring-blue-500"
              />
            </div>
            <Button
              type="button"
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add category
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-700">
            Products are matched when their saved category value equals the category
            name or one of its subcategories.
          </div>

          {isLoadingCategories && categories.length === 0 ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-6 py-14 text-blue-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-6 py-12 text-center">
              <p className="text-base font-medium text-blue-900">
                No categories found yet.
              </p>
              <p className="mt-2 text-sm text-blue-500">
                Create your first category group to start organizing subcategories.
              </p>
              <Button
                type="button"
                onClick={() => setIsCreateDialogOpen(true)}
                className="mt-4 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add first category
              </Button>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <p className="text-base font-medium text-slate-900">
                No matches for "{searchTerm.trim()}".
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Try a category name or one of its subcategories.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Subcategories</TableHead>
                  <TableHead>Linked products</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="min-w-[220px]">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-blue-100 p-2 text-blue-700">
                          <FolderTree className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-blue-950">
                            {category.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Updated {formatCategoryDate(category.updatedAtMs)}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="min-w-[320px]">
                      {category.subcategories.length === 0 ? (
                        <span className="text-sm text-slate-400">
                          No subcategories yet
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {category.subcategories.map((subcategory) => (
                            <span
                              key={subcategory}
                              className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                            >
                              <Layers3 className="h-3.5 w-3.5" />
                              {subcategory}
                            </span>
                          ))}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="min-w-[260px]">
                      <p className="font-semibold text-slate-900">
                        {category.linkedProducts.length} product
                        {category.linkedProducts.length === 1 ? "" : "s"}
                      </p>
                      {category.linkedProducts.length === 0 ? (
                        <p className="mt-1 text-sm text-slate-400">
                          No products currently match this group.
                        </p>
                      ) : (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {category.linkedProducts.slice(0, 3).map((product) => (
                            <span
                              key={product.id}
                              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                            >
                              {product.name}
                            </span>
                          ))}
                          {category.linkedProducts.length > 3 ? (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">
                              +{category.linkedProducts.length - 3} more
                            </span>
                          ) : null}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-900"
                          onClick={() => setEditingCategory(category)}
                        >
                          <PencilLine className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => void handleDeleteCategory(category)}
                          disabled={deletingCategoryId === category.id}
                        >
                          {deletingCategoryId === category.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-blue-950">Add category</DialogTitle>
            <DialogDescription>
              Create a main category and list any subcategories underneath it.
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            key="create-category"
            defaultValues={emptyCategoryFormValues}
            onSubmit={handleCreateCategory}
            pendingLabel="Saving category..."
            submitLabel="Save category"
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingCategory)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setEditingCategory(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-blue-950">Edit category</DialogTitle>
            <DialogDescription>
              Update the category name or edit the list of subcategories.
            </DialogDescription>
          </DialogHeader>
          {editingCategory ? (
            <CategoryForm
              key={editingCategory.id}
              defaultValues={toCategoryFormValues(editingCategory)}
              onSubmit={handleUpdateCategory}
              pendingLabel="Saving changes..."
              submitLabel="Update category"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
