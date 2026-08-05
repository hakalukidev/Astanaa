"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import ProductGridCard from "@/components/products/ProductGridCard";
import { useCategoriesQuery } from "@/hooks/use-categories-query";
import { useProductsQuery } from "@/hooks/use-products-query";
import {
  findManagedMainCategory,
  getCategoryKey,
  matchesManagedCategoryValue,
  type Category,
} from "@/lib/categories";
import { type Product } from "@/lib/products";

type ProductCatalogClientProps = {
  initialCategories?: Category[];
  initialProducts?: Product[];
};

type ParentCategoryOption = {
  label: string;
  value: string;
};

type SubcategoryOption = {
  label: string;
  value: string;
};

function normalizeCategoryValue(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function tokenizeCategoryValue(value: string) {
  return normalizeCategoryValue(value)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map((token) =>
      token.endsWith("ing") && token.length > 4 ? token.slice(0, -3) : token
    );
}

function matchesSubcategorySelection(
  productCategory: string,
  selectedSubcategory: string
) {
  const normalizedSelectedSubcategory = normalizeCategoryValue(selectedSubcategory);

  if (!normalizedSelectedSubcategory || normalizedSelectedSubcategory === "all") {
    return true;
  }

  const normalizedProductCategory = normalizeCategoryValue(productCategory);

  if (
    normalizedProductCategory === normalizedSelectedSubcategory ||
    normalizedProductCategory.includes(normalizedSelectedSubcategory) ||
    normalizedSelectedSubcategory.includes(normalizedProductCategory)
  ) {
    return true;
  }

  const productTokens = tokenizeCategoryValue(productCategory);
  const selectedTokens = tokenizeCategoryValue(selectedSubcategory);

  return selectedTokens.every((selectedToken) =>
    productTokens.some(
      (productToken) =>
        productToken === selectedToken ||
        productToken.startsWith(selectedToken) ||
        selectedToken.startsWith(productToken)
    )
  );
}

function appendSubcategoryFilterOption(
  options: SubcategoryOption[],
  seen: Set<string>,
  option: SubcategoryOption
) {
  const normalizedValue = normalizeCategoryValue(option.value);

  if (!normalizedValue || seen.has(normalizedValue)) {
    return;
  }

  seen.add(normalizedValue);
  options.push(option);
}

export default function ProductCatalogClient({
  initialCategories,
  initialProducts,
}: ProductCatalogClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { data: managedCategories = [] } = useCategoriesQuery(initialCategories);
  const { data: products = [], isPending: isLoading } =
    useProductsQuery(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParentCategory, setSelectedParentCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const categoryParam = searchParams?.get("category")?.trim() ?? "";
  const subcategoryParam = searchParams?.get("subcategory")?.trim() ?? "";
  const searchParam = searchParams?.get("search")?.trim() ?? "";

  const parentCategoryOptions = useMemo(() => {
    const options: ParentCategoryOption[] = [
      { label: "All Products", value: "all" },
    ];
    const seen = new Set<string>(["all"]);

    for (const category of managedCategories) {
      const normalizedName = category.name.trim();
      const normalizedKey = normalizeCategoryValue(normalizedName);

      if (!normalizedName || seen.has(normalizedKey)) {
        continue;
      }

      seen.add(normalizedKey);
      options.push({ label: normalizedName, value: normalizedName });
    }

    return options;
  }, [managedCategories]);

  const selectedParentCategoryEntity = useMemo(
    () => findManagedMainCategory(selectedParentCategory, managedCategories),
    [managedCategories, selectedParentCategory]
  );

  const subcategoryOptions = useMemo(() => {
    const options: SubcategoryOption[] = [
      { label: "All Subcategories", value: "all" },
    ];
    const seen = new Set<string>(["all"]);

    if (!selectedParentCategoryEntity) {
      return options;
    }

    for (const subcategory of selectedParentCategoryEntity.subcategories) {
      appendSubcategoryFilterOption(options, seen, {
        label: subcategory,
        value: subcategory,
      });
    }

    return options;
  }, [selectedParentCategoryEntity]);

  useEffect(() => {
    setSearchTerm(searchParam);
  }, [searchParam]);

  useEffect(() => {
    if (!categoryParam) {
      setSelectedParentCategory("all");
      return;
    }

    const parentFromCategoryParam = findManagedMainCategory(
      categoryParam,
      managedCategories
    );

    if (parentFromCategoryParam) {
      setSelectedParentCategory(parentFromCategoryParam.name);
      return;
    }

    const parentFromSubcategoryParam = managedCategories.find((category) =>
      category.subcategories.some(
        (subcategory) => getCategoryKey(subcategory) === getCategoryKey(categoryParam)
      )
    );

    if (parentFromSubcategoryParam) {
      setSelectedParentCategory(parentFromSubcategoryParam.name);
      return;
    }

    setSelectedParentCategory("all");
  }, [categoryParam, managedCategories]);

  useEffect(() => {
    if (!subcategoryParam) {
      setSelectedSubcategory("all");
      return;
    }

    setSelectedSubcategory(subcategoryParam);
  }, [subcategoryParam]);

  useEffect(() => {
    if (!selectedParentCategoryEntity) {
      if (selectedSubcategory !== "all") {
        setSelectedSubcategory("all");
      }

      return;
    }

    if (
      selectedSubcategory !== "all" &&
      !selectedParentCategoryEntity.subcategories.some(
        (subcategory) =>
          getCategoryKey(subcategory) === getCategoryKey(selectedSubcategory)
      )
    ) {
      setSelectedSubcategory("all");
    }
  }, [selectedParentCategoryEntity, selectedSubcategory]);

  const normalizedSelectedParentCategory = useMemo(
    () => normalizeCategoryValue(selectedParentCategory),
    [selectedParentCategory]
  );

  const normalizedSelectedSubcategory = useMemo(
    () => normalizeCategoryValue(selectedSubcategory),
    [selectedSubcategory]
  );

  function updateUrl(
    nextSearchTerm: string,
    nextParentCategory: string,
    nextSubcategory: string
  ) {
    const params = new URLSearchParams(searchParams?.toString());
    const trimmedSearch = nextSearchTerm.trim();

    if (trimmedSearch) {
      params.set("search", trimmedSearch);
    } else {
      params.delete("search");
    }

    if (normalizeCategoryValue(nextParentCategory) === "all") {
      params.delete("category");
      params.delete("subcategory");
    } else {
      params.set("category", nextParentCategory);

      if (normalizeCategoryValue(nextSubcategory) === "all") {
        params.delete("subcategory");
      } else {
        params.set("subcategory", nextSubcategory);
      }
    }

    const nextQuery = params.toString();
    const currentPathname = pathname ?? "";

    startTransition(() => {
      router.replace(nextQuery ? `${currentPathname}?${nextQuery}` : currentPathname, {
        scroll: false,
      });
    });
  }

  function handleParentCategorySelect(category: string) {
    setSelectedParentCategory(category);
    setSelectedSubcategory("all");
    updateUrl(searchTerm, category, "all");
  }

  function handleSubcategorySelect(subcategory: string) {
    setSelectedSubcategory(subcategory);
    updateUrl(searchTerm, selectedParentCategory, subcategory);
  }

  function handleClearFilters() {
    setSearchTerm("");
    setSelectedParentCategory("all");
    setSelectedSubcategory("all");
    const currentPathname = pathname ?? "";

    startTransition(() => {
      router.replace(currentPathname, { scroll: false });
    });
  }

  const filteredProducts = useMemo(() => {
    const normalizedSearch = normalizeCategoryValue(deferredSearchTerm);

    return products.filter((product) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          product.name,
          product.category,
          product.description,
          product.price,
        ].some((value) => normalizeCategoryValue(value).includes(normalizedSearch));
      const matchesParentCategory =
        normalizedSelectedParentCategory === "all" ||
        (selectedParentCategoryEntity
          ? matchesManagedCategoryValue(product.category, selectedParentCategoryEntity)
          : true);
      const matchesSubcategory = matchesSubcategorySelection(
        product.category,
        selectedSubcategory
      );

      return matchesSearch && matchesParentCategory && matchesSubcategory;
    });
  }, [
    deferredSearchTerm,
    managedCategories,
    normalizedSelectedParentCategory,
    products,
    selectedParentCategoryEntity,
    selectedSubcategory,
  ]);

  const hasActiveFilters =
    normalizedSelectedParentCategory !== "all" ||
    normalizedSelectedSubcategory !== "all" ||
    searchTerm.trim().length > 0;

  const activeCategoryLabel = useMemo(() => {
    if (normalizedSelectedParentCategory === "all") {
      return "All Products";
    }

    if (normalizedSelectedSubcategory !== "all") {
      return `${selectedParentCategory} / ${selectedSubcategory}`;
    }

    return selectedParentCategory;
  }, [
    normalizedSelectedParentCategory,
    normalizedSelectedSubcategory,
    selectedParentCategory,
    selectedSubcategory,
  ]);

  return (
    <main className="bg-gray-50">
      <section className="sticky top-16 z-40 border-b border-slate-200 bg-white/95 py-4 shadow-sm backdrop-blur">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:w-96">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, category, or price..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full border border-gray-300 py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
                <select
                  value={selectedParentCategory}
                  onChange={(event) =>
                    handleParentCategorySelect(event.target.value)
                  }
                  className="w-full min-w-[13rem] border border-gray-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto"
                >
                  {parentCategoryOptions.map((categoryOption) => (
                    <option key={categoryOption.value} value={categoryOption.value}>
                      {categoryOption.label}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedSubcategory}
                  onChange={(event) => handleSubcategorySelect(event.target.value)}
                  disabled={!selectedParentCategoryEntity}
                  className="w-full min-w-[13rem] border border-gray-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:w-auto"
                >
                  {subcategoryOptions.map((subcategoryOption) => (
                    <option
                      key={subcategoryOption.value}
                      value={subcategoryOption.value}
                    >
                      {subcategoryOption.label}
                    </option>
                  ))}
                </select>

                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="inline-flex items-center gap-2 border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                  >
                    <X className="h-4 w-4" />
                    Clear filters
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <p className="font-medium text-slate-900">
                Showing {filteredProducts.length} of {products.length} products
              </p>
              <span className="border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                {activeCategoryLabel}
              </span>
              {searchTerm.trim() ? (
                <span className="border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                  Search: {searchTerm.trim()}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          <h2 className="mb-10 text-center text-3xl font-bold">Products</h2>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading catalog...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-lg text-gray-500">
                No products found for the current category and search filters.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-5 xl:gap-6">
              {filteredProducts.map((product) => (
                <ProductGridCard
                  key={product.id}
                  product={product}
                  showHotBadge
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}