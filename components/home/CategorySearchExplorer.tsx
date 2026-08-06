"use client";

import {
  Boxes,
  Cog,
  Gauge,
  Hammer,
  Layers,
  PackageSearch,
  Search,
  Settings2,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useLanguage } from "@/contexts/LanguageContext";
import { type Category } from "@/lib/categories";
import { homeTranslations } from "@/lib/home-translations";

type CategorySearchExplorerProps = {
  categories: Category[];
};

const CATEGORY_ICONS = [
  Wrench,
  Cog,
  Gauge,
  Hammer,
  Settings2,
  Boxes,
  Layers,
  PackageSearch,
];

export default function CategorySearchExplorer({
  categories,
}: CategorySearchExplorerProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const t = homeTranslations[language].search;
  const [searchTerm, setSearchTerm] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = searchTerm.trim();
    router.push(
      trimmed ? `/products?search=${encodeURIComponent(trimmed)}` : "/products"
    );
  }

  return (
    <section className="bg-white py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {t.title}
          </h2>
          <p className="mt-2 text-sm text-gray-500 sm:text-base">
            {t.subtitle}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-6 flex max-w-2xl items-center overflow-hidden rounded-full border-2 border-blue-600 bg-white shadow-sm"
        >
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t.placeholder}
            className="w-full flex-1 bg-transparent px-5 py-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 sm:text-base"
          />
          <button
            type="submit"
            className="flex shrink-0 items-center gap-2 bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 sm:px-6"
          >
            <Search size={16} />
            <span className="hidden sm:inline">{t.button}</span>
          </button>
        </form>

        {categories.length > 0 ? (
          <div className="mt-10">
            <h3 className="mb-5 text-center text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
              {t.categoriesHeading}
            </h3>
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              <Link
                href="/products"
                className="group flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white p-4 text-center transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                  <PackageSearch size={22} />
                </span>
                <span className="text-xs font-medium text-gray-700 sm:text-sm">
                  {t.allProducts}
                </span>
              </Link>

              {categories.map((category, index) => {
                const Icon = CATEGORY_ICONS[index % CATEGORY_ICONS.length];

                return (
                  <Link
                    key={category.id}
                    href={`/products?category=${encodeURIComponent(category.name)}`}
                    className="group flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white p-4 text-center transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                      <Icon size={22} />
                    </span>
                    <span className="line-clamp-2 text-xs font-medium text-gray-700 sm:text-sm">
                      {category.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
