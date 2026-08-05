"use client";

import {
  ChevronDown,
  ChevronRight,
  Grid2X2,
  Grid3X3,
  LayoutGrid,
  Loader2,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import ProductPhoto from "@/components/products/ProductPhoto";
import { getPrimaryProductPhotoUrl } from "@/lib/products";
import { useProductsQuery } from "@/hooks/use-products-query";
import { type Product } from "@/lib/products";

// [NEW] Define category hierarchy with main categories and subcategories
// Based on the image: Lifting Equipments, Diagnostic and Checking, Denting & Painting, Repairing Equipments, Supporting Equipments
const CATEGORY_HIERARCHY = [
  {
    name: "Lifting Equipments",
    subcategories: ["2 Post Lift", "4 Post Lift", "Scissor Lift", "Bottle Jack", "Floor Jack"],
  },
  {
    name: "Diagnostic and Checking",
    subcategories: ["Engine Diagnostic Tool", "Battery Tester", "Multimeter", "Scan Tool"],
  },
  {
    name: "Denting & Painting",
    subcategories: ["Paint Spray Gun", "Denting Kit", "Paint Booth", "Sander"],
  },
  {
    name: "Repairing Equipments",
    subcategories: ["Impact Wrench", "Air Compressor", "Tool Set", "Work Light"],
  },
  {
    name: "Supporting Equipments",
    subcategories: ["Tool Cabinet", "Creeper", "Oil Drain", "Shop Press"],
  },
];

// [NEW] Flatten all subcategories for mapping to products
const ALL_SUBCATEGORIES = CATEGORY_HIERARCHY.flatMap(cat => cat.subcategories);

type HomeCatalogClientProps = {
  initialProducts?: Product[];
};

export default function HomeCatalogClient({
  initialProducts,
}: HomeCatalogClientProps) {
  const searchParams = useSearchParams();
  const urlCategory = searchParams?.get("category") ?? null;
  
  const { data: products = [], isPending: isLoading } =
    useProductsQuery(initialProducts);
  
  // [NEW] Track selected main category and subcategory
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  
  const [gridCols, setGridCols] = useState(4);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // [NEW] Initialize selected category from URL on mount
  useEffect(() => {
    if (urlCategory) {
      // Check if URL category is a main category
      const foundMain = CATEGORY_HIERARCHY.find(cat => cat.name === urlCategory);
      if (foundMain) {
        setSelectedMainCategory(urlCategory);
        setSelectedSubCategory(null);
      } else if (ALL_SUBCATEGORIES.includes(urlCategory)) {
        // Find which main category this subcategory belongs to
        const parentCat = CATEGORY_HIERARCHY.find(cat => 
          cat.subcategories.includes(urlCategory)
        );
        if (parentCat) {
          setSelectedMainCategory(parentCat.name);
          setSelectedSubCategory(urlCategory);
        }
      }
    }
  }, [urlCategory]);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }

      if (window.innerWidth < 640) {
        setGridCols(1);
      } else if (window.innerWidth < 768) {
        setGridCols(2);
      } else if (window.innerWidth < 1024) {
        setGridCols(3);
      } else {
        setGridCols(4);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // [NEW] Get categories for sidebar (main + subcategory toggle)
  const sidebarCategories = useMemo(() => {
    return CATEGORY_HIERARCHY;
  }, []);

  // [NEW] Filter products based on selected main category and subcategory
  const filteredProducts = useMemo(() => {
    if (!selectedMainCategory) {
      // If no category selected, show all products
      return products;
    }
    
    // If subcategory is selected, filter by that subcategory
    if (selectedSubCategory) {
      return products.filter(
        (product) => product.category === selectedSubCategory
      );
    }
    
    // If only main category is selected, show products from all its subcategories
    const mainCat = CATEGORY_HIERARCHY.find(cat => cat.name === selectedMainCategory);
    if (mainCat) {
      return products.filter(
        (product) => mainCat.subcategories.includes(product.category)
      );
    }
    
    return products;
  }, [products, selectedMainCategory, selectedSubCategory]);

  // Featured products (unchanged)
  const featuredProducts = useMemo(
    () => products.filter((product) => product.isHot).slice(0, 5),
    [products]
  );

  const getGridColsClass = () => {
    if (gridCols === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    if (gridCols === 4) {
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
    }
    if (gridCols === 5) {
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5";
    }
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  };

  // [NEW] Get display name for current selection
  const currentCategoryName = useMemo(() => {
    if (selectedSubCategory) return selectedSubCategory;
    if (selectedMainCategory) return selectedMainCategory;
    return "All Products";
  }, [selectedMainCategory, selectedSubCategory]);

  // [NEW] Handle main category click
  const handleMainCategoryClick = (categoryName: string) => {
    setSelectedMainCategory(categoryName);
    setSelectedSubCategory(null);
    if (isMobile) setSidebarOpen(false);
  };

  // [NEW] Handle subcategory click
  const handleSubCategoryClick = (subCategoryName: string) => {
    setSelectedSubCategory(subCategoryName);
    // Find parent main category to highlight
    const parentCat = CATEGORY_HIERARCHY.find(cat => 
      cat.subcategories.includes(subCategoryName)
    );
    if (parentCat) {
      setSelectedMainCategory(parentCat.name);
    }
    if (isMobile) setSidebarOpen(false);
  };

  // [NEW] Handle "All Products" click
  const handleAllProductsClick = () => {
    setSelectedMainCategory(null);
    setSelectedSubCategory(null);
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        
        {/* Mobile Category Toggle Button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm transition hover:bg-gray-50 lg:hidden"
          >
            <div className="flex items-center gap-2">
              <Menu size={18} className="text-gray-600" />
              <span className="font-medium text-gray-700">
                {currentCategoryName}
              </span>
            </div>
            <ChevronDown
              size={18}
              className={`transform transition-transform ${sidebarOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Sidebar - Category hierarchy with subcategories */}
          <aside
            className={`
              ${sidebarOpen ? "block" : "hidden"}
              w-full lg:block lg:w-80 lg:shrink-0
            `}
          >
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:p-5">
              {/* Category Header with close button for mobile */}
              <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3 lg:hidden">
                <h2 className="text-base font-bold text-gray-900">Categories</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-full p-1 hover:bg-gray-100"
                >
                  <X size={18} />
                </button>
              </div>

              {/* All Products Link */}
              <div className="mb-4">
                <button
                  onClick={handleAllProductsClick}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-all lg:px-4 lg:py-2.5 lg:text-base ${
                    !selectedMainCategory && !selectedSubCategory
                      ? "bg-blue-50 font-semibold text-blue-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                  }`}
                >
                  📦 All Products
                </button>
              </div>

              {/* Category Hierarchy with Subcategories */}
              <div className="mb-6">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500 lg:mb-4 lg:text-base">
                  BROWSE CATEGORIES
                </h2>
                <ul className="space-y-2">
                  {sidebarCategories.map((category) => (
                    <li key={category.name}>
                      {/* Main Category Button */}
                      <button
                        onClick={() => handleMainCategoryClick(category.name)}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-all lg:px-4 lg:py-2.5 lg:text-base ${
                          selectedMainCategory === category.name && !selectedSubCategory
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-800 hover:bg-gray-50 hover:text-blue-600"
                        }`}
                      >
                        {category.name}
                      </button>
                      
                      {/* [NEW] Subcategories - shown when main category is selected */}
                      {selectedMainCategory === category.name && (
                        <ul className="ml-4 mt-1 space-y-1 border-l-2 border-blue-200 pl-3">
                          {category.subcategories.map((sub) => (
                            <li key={sub}>
                              <button
                                onClick={() => handleSubCategoryClick(sub)}
                                className={`w-full rounded-lg px-3 py-1.5 text-left text-sm transition-all ${
                                  selectedSubCategory === sub
                                    ? "bg-blue-50 font-medium text-blue-700"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                                }`}
                              >
                                {sub}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Featured Products Section (unchanged) */}
              <div className="border-t border-gray-200 pt-5">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500 lg:mb-4 lg:text-base">
                  FEATURED
                </h2>
                {isLoading ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                ) : featuredProducts.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-6">
                    No featured products yet
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {featuredProducts.map((product) => (
                      <li key={product.id} className="group">
                        <Link
                          href={`/product/${product.id}`}
                          className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
                          onClick={() => isMobile && setSidebarOpen(false)}
                        >
                          <ProductPhoto
                            src={getPrimaryProductPhotoUrl(product)}
                            alt={product.name}
                            className="h-12 w-12 shrink-0 rounded-lg border border-gray-200"
                            imgClassName="object-cover w-full h-full rounded-lg"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-xs font-medium text-gray-800 group-hover:text-blue-600 lg:text-sm">
                              {product.name}
                            </p>
                            <p className="mt-1 text-xs text-blue-600">
                              {product.category?.split(" ").slice(0, 2).join(" ")}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content - Products Grid */}
          <main className="flex-1">
            {/* Breadcrumb and Grid Controls */}
            <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center lg:mb-6">
              <div className="flex items-center gap-2 text-xs text-gray-500 sm:text-sm">
                <Link href="/" className="hover:text-blue-600">
                  Home
                </Link>
                <ChevronRight size={14} />
                <span className="font-medium text-gray-800">
                  {currentCategoryName}
                </span>
              </div>

              <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end sm:gap-4">
                <div className="hidden items-center gap-1 sm:flex">
                  <button
                    type="button"
                    onClick={() => setGridCols(3)}
                    className={`rounded p-1 transition-colors ${
                      gridCols === 3
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                    aria-label="3 columns"
                  >
                    <Grid2X2 size={18} className="lg:h-5 lg:w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setGridCols(4)}
                    className={`rounded p-1 transition-colors ${
                      gridCols === 4
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                    aria-label="4 columns"
                  >
                    <Grid3X3 size={18} className="lg:h-5 lg:w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setGridCols(5)}
                    className={`rounded p-1 transition-colors ${
                      gridCols === 5
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                    aria-label="5 columns"
                  >
                    <LayoutGrid size={18} className="lg:h-5 lg:w-5" />
                  </button>
                </div>

                <Link
                  href="/products"
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 transition hover:border-blue-400 hover:text-blue-600 sm:text-sm"
                >
                  View All
                </Link>
              </div>
            </div>

            {/* Products Grid - Shows filtered products based on selected category */}
            {isLoading ? (
              <div className="flex items-center gap-2 py-12 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-500">
                  No products found in this category yet.
                </p>
              </div>
            ) : (
              <div className={`grid gap-3 sm:gap-4 lg:gap-6 ${getGridColsClass()}`}>
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-300 hover:shadow-lg"
                    onMouseEnter={() => setHoveredProduct(product.id)}
                    onMouseLeave={() => setHoveredProduct(null)}
                  >
                    <div className="relative aspect-square cursor-pointer overflow-hidden bg-gray-100">
                      <ProductPhoto
                        src={getPrimaryProductPhotoUrl(product)}
                        alt={product.name}
                        className="h-full w-full"
                        imgClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {hoveredProduct === product.id && (
                        <div className="absolute inset-x-0 bottom-0 animate-slide-up">
                          <Link
                            href={`/product/${product.id}`}
                            className="block bg-blue-600 py-2.5 text-center text-xs font-semibold text-white transition-colors hover:bg-blue-700 sm:py-3 sm:text-sm"
                          >
                            View Details
                          </Link>
                        </div>
                      )}
                    </div>

                    <div className="p-3 lg:p-4">
                      <Link
                        href={`/product/${product.id}`}
                        className="line-clamp-2 text-sm font-medium leading-snug text-gray-800 hover:text-blue-600 sm:text-base"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-1 text-xs text-blue-600 sm:mt-2 sm:text-sm">
                        {product.category}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
