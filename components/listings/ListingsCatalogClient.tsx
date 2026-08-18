"use client";

import { useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import ListingCard from "@/components/listings/ListingCard";
import PriceFilterDropdown, { type PriceRange } from "@/components/listings/PriceFilterDropdown";
import { useLanguage } from "@/contexts/LanguageContext";
import { matchesPriceBand, type Listing, type ListingPurpose } from "@/lib/listings";
import { translations } from "@/lib/site-translations";

type SortOption = "newest" | "oldest" | "price-asc" | "price-desc";

function compareBySortOption(left: Listing, right: Listing, sortOption: SortOption) {
  switch (sortOption) {
    case "oldest":
      return (left.createdAtMs ?? 0) - (right.createdAtMs ?? 0);
    case "price-asc":
      return left.price - right.price;
    case "price-desc":
      return right.price - left.price;
    case "newest":
    default:
      return (right.createdAtMs ?? 0) - (left.createdAtMs ?? 0);
  }
}

type ListingsCatalogClientProps = {
  initialListings: Listing[];
};

export default function ListingsCatalogClient({
  initialListings,
}: ListingsCatalogClientProps) {
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const t = translations[language].listings;

  const [searchTerm, setSearchTerm] = useState(searchParams?.get("search")?.trim() ?? "");
  const [selectedType, setSelectedType] = useState(searchParams?.get("type")?.trim() ?? "all");
  const [selectedPurpose, setSelectedPurpose] = useState<ListingPurpose | "all">(
    (searchParams?.get("purpose") as ListingPurpose | null) ?? "all"
  );
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: null, max: null });
  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    setSearchTerm(searchParams?.get("search")?.trim() ?? "");
    setSelectedType(searchParams?.get("type")?.trim() ?? "all");
    setSelectedPurpose((searchParams?.get("purpose") as ListingPurpose | null) ?? "all");
  }, [searchParams]);

  // Everything except the price filter — reused both to filter the grid and to
  // compute a live "ads" count per price band, so those counts reflect the
  // other active filters the same way the reference design does.
  const baseFilteredListings = useMemo(() => {
    const normalizedSearch = deferredSearchTerm.trim().toLowerCase();

    return initialListings.filter((listing) => {
      const matchesType = selectedType === "all" || listing.propertyType === selectedType;
      const matchesPurpose = selectedPurpose === "all" || listing.purpose === selectedPurpose;
      const matchesSearch =
        !normalizedSearch ||
        listing.title.toLowerCase().includes(normalizedSearch) ||
        listing.location.toLowerCase().includes(normalizedSearch);

      return matchesType && matchesPurpose && matchesSearch;
    });
  }, [initialListings, deferredSearchTerm, selectedType, selectedPurpose]);

  const filteredListings = useMemo(() => {
    const filtered = baseFilteredListings.filter((listing) =>
      matchesPriceBand(listing.price, priceRange)
    );

    // Boosted (paid) listings always surface first; the chosen sort applies
    // within each of those two tiers.
    return [...filtered].sort((left, right) => {
      const leftBoosted = left.boost.status === "active" ? 1 : 0;
      const rightBoosted = right.boost.status === "active" ? 1 : 0;

      if (leftBoosted !== rightBoosted) {
        return rightBoosted - leftBoosted;
      }

      return compareBySortOption(left, right, sortOption);
    });
  }, [baseFilteredListings, priceRange, sortOption]);

  return (
    <main className="bg-gray-50">
      <section className="bg-white py-10">
        <div className="container mx-auto px-4">
          <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row">
            <PriceFilterDropdown
              value={priceRange}
              onChange={setPriceRange}
              listings={baseFilteredListings}
              labels={t}
            />

            <div className="flex items-center gap-2">
              <label htmlFor="sortOption" className="shrink-0 text-sm font-medium text-gray-600">
                {t.sortBy}
              </label>
              <select
                id="sortOption"
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value as SortOption)}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500"
              >
                <option value="newest">{t.sortNewest}</option>
                <option value="oldest">{t.sortOldest}</option>
                <option value="price-asc">{t.sortPriceAsc}</option>
                <option value="price-desc">{t.sortPriceDesc}</option>
              </select>
            </div>
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
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 xl:gap-6">
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
