"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import ProductPhoto from "@/components/products/ProductPhoto";
import { getPrimaryProductPhotoUrl, type Product } from "@/lib/products";

type ProductSearchBoxProps = {
  onNavigate?: () => void;
  products: Product[];
};

export default function ProductSearchBox({
  onNavigate,
  products,
}: ProductSearchBoxProps) {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const suggestions = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    return products
      .filter((product) =>
        product.name.toLowerCase().includes(normalizedQuery)
      )
      .slice(0, 6);
  }, [deferredQuery, products]);

  function closeSearch() {
    setIsOpen(false);
    onNavigate?.();
  }

  function resetSearch() {
    setQuery("");
    closeSearch();
  }

  function navigateToProduct(productId: string) {
    resetSearch();
    router.push(`/product/${productId}`);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return;
    }

    if (suggestions.length > 0) {
      navigateToProduct(suggestions[0].id);
      return;
    }

    closeSearch();
    router.push(`/products?search=${encodeURIComponent(normalizedQuery)}`);
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form
        onSubmit={handleSubmit}
        className="flex items-center overflow-hidden rounded border border-gray-300 bg-white"
      >
        <input
          type="text"
          value={query}
          onChange={(event) => {
            const nextValue = event.target.value;

            setQuery(nextValue);
            setIsOpen(nextValue.trim().length > 0);
          }}
          onFocus={() => setIsOpen(query.trim().length > 0)}
          placeholder="Search products by name..."
          className="flex-1 px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          className="bg-blue-600 px-3 py-2 text-white transition hover:bg-blue-700"
          aria-label="Search products"
        >
          <Search size={16} />
        </button>
      </form>

      {isOpen && query.trim().length > 0 ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          {suggestions.length === 0 ? (
            <div className="px-4 py-4 text-sm text-gray-500">
              No products found for "{query.trim()}".
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {suggestions.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => navigateToProduct(product.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-blue-50"
                  >
                    <ProductPhoto
                      src={getPrimaryProductPhotoUrl(product)}
                      alt={product.name}
                      className="h-14 w-14 shrink-0 rounded-xl border border-gray-200"
                    />
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-sm font-medium text-gray-900">
                        {product.name}
                      </p>
                      <p className="mt-1 text-xs text-blue-600">
                        {product.category}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <Link
            href={`/products?search=${encodeURIComponent(query.trim())}`}
            onClick={closeSearch}
            className="block border-t border-gray-100 px-4 py-3 text-center text-sm font-medium text-blue-700 transition hover:bg-blue-50"
          >
            View all matching products
          </Link>
        </div>
      ) : null}
    </div>
  );
}
