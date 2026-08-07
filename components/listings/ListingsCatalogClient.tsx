"use client";

import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import ListingCard from "@/components/listings/ListingCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { PROPERTY_TYPES, type Listing, type ListingPurpose } from "@/lib/listings";
import { translations } from "@/lib/site-translations";

type ListingsCatalogClientProps = {
  initialListings: Listing[];
};

export default function ListingsCatalogClient({
  initialListings,
}: ListingsCatalogClientProps) {
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const t = translations[language].listings;
  const propertyTypeLabels = translations[language].propertyTypes;

  const [searchTerm, setSearchTerm] = useState(searchParams?.get("search")?.trim() ?? "");
  const [selectedType, setSelectedType] = useState(searchParams?.get("type")?.trim() ?? "all");
  const [selectedPurpose, setSelectedPurpose] = useState<ListingPurpose | "all">(
    (searchParams?.get("purpose") as ListingPurpose | null) ?? "all"
  );
  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    setSearchTerm(searchParams?.get("search")?.trim() ?? "");
    setSelectedType(searchParams?.get("type")?.trim() ?? "all");
  }, [searchParams]);

  const filteredListings = useMemo(() => {
    const normalizedSearch = deferredSearchTerm.trim().toLowerCase();

    const filtered = initialListings.filter((listing) => {
      const matchesType = selectedType === "all" || listing.propertyType === selectedType;
      const matchesPurpose = selectedPurpose === "all" || listing.purpose === selectedPurpose;
      const matchesSearch =
        !normalizedSearch ||
        listing.title.toLowerCase().includes(normalizedSearch) ||
        listing.location.toLowerCase().includes(normalizedSearch);

      return matchesType && matchesPurpose && matchesSearch;
    });

    // Boosted (paid) listings surface first.
    return [...filtered].sort((left, right) => {
      const leftBoosted = left.boost.status === "active" ? 1 : 0;
      const rightBoosted = right.boost.status === "active" ? 1 : 0;
      return rightBoosted - leftBoosted;
    });
  }, [initialListings, deferredSearchTerm, selectedType, selectedPurpose]);

  return (
    <main className="bg-gray-50">
      <section className="bg-white py-10">
        <div className="container mx-auto px-4">
          <h1 className="mb-6 text-center text-3xl font-bold text-gray-900">
            {t.browseTitle}
          </h1>

          <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full rounded-md border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-green-500"
              />
            </div>

            <select
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500"
            >
              <option value="all">{t.allPropertyTypes}</option>
              {PROPERTY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {propertyTypeLabels[type]}
                </option>
              ))}
            </select>

            <select
              value={selectedPurpose}
              onChange={(event) => setSelectedPurpose(event.target.value as ListingPurpose | "all")}
              className="rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500"
            >
              <option value="all">{t.saleAndRent}</option>
              <option value="sale">{t.forSale}</option>
              <option value="rent">{t.forRent}</option>
            </select>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-4">
          {filteredListings.length === 0 ? (
            <p className="py-16 text-center text-gray-500">
              {t.noResults}
            </p>
          ) : (
            <div className="flex flex-wrap justify-center gap-5 xl:gap-6">
              {filteredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
