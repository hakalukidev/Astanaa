"use client";

import {
  Briefcase,
  Building,
  Building2,
  Search,
  ShoppingBag,
  Store,
  Trees,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useLanguage } from "@/contexts/LanguageContext";
import { homeTranslations } from "@/lib/home-translations";
import { PROPERTY_TYPES } from "@/lib/listings";

const PROPERTY_TYPE_ICONS: Record<string, typeof Building2> = {
  Apartment: Building2,
  Duplex: Building,
  Land: Trees,
  "Commercial Space": Store,
  "Office Space": Briefcase,
  Shop: ShoppingBag,
};

export default function ListingSearchExplorer() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = homeTranslations[language].search;
  const [searchTerm, setSearchTerm] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = searchTerm.trim();
    router.push(
      trimmed ? `/listings?search=${encodeURIComponent(trimmed)}` : "/listings"
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
          className="mx-auto mt-6 flex max-w-2xl items-center overflow-hidden rounded-full border-2 border-green-600 bg-white shadow-sm"
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
            className="flex shrink-0 items-center gap-2 bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 sm:px-6"
          >
            <Search size={16} />
            <span className="hidden sm:inline">{t.button}</span>
          </button>
        </form>

        <div className="mt-10">
          <h3 className="mb-5 text-center text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
            {t.categoriesHeading}
          </h3>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-7">
            <Link
              href="/listings"
              className="group flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white p-4 text-center transition hover:-translate-y-0.5 hover:border-green-300 hover:shadow-md"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600 transition group-hover:bg-green-600 group-hover:text-white">
                <Search size={22} />
              </span>
              <span className="text-xs font-medium text-gray-700 sm:text-sm">
                {t.allProducts}
              </span>
            </Link>

            {PROPERTY_TYPES.map((type) => {
              const Icon = PROPERTY_TYPE_ICONS[type] ?? Building2;

              return (
                <Link
                  key={type}
                  href={`/listings?type=${encodeURIComponent(type)}`}
                  className="group flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white p-4 text-center transition hover:-translate-y-0.5 hover:border-green-300 hover:shadow-md"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600 transition group-hover:bg-green-600 group-hover:text-white">
                    <Icon size={22} />
                  </span>
                  <span className="line-clamp-2 text-xs font-medium text-gray-700 sm:text-sm">
                    {type}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
