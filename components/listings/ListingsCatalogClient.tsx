"use client";

import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import ListingCard from "@/components/listings/ListingCard";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  formatCompactBDT,
  PRICE_BANDS,
  type Listing,
  type ListingPurpose,
  type PriceBand,
} from "@/lib/listings";
import {
  subscribeToPropertyTypeCategories,
  type PropertyTypeCategory,
} from "@/lib/property-type-categories";
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

  const [propertyTypeCategories, setPropertyTypeCategories] = useState<PropertyTypeCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState(searchParams?.get("search")?.trim() ?? "");
  const [selectedType, setSelectedType] = useState(searchParams?.get("type")?.trim() ?? "all");
  const [selectedPurpose, setSelectedPurpose] = useState<ListingPurpose | "all">(
    (searchParams?.get("purpose") as ListingPurpose | null) ?? "all"
  );
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  const priceDropdownRef = useRef<HTMLDivElement>(null);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    setSearchTerm(searchParams?.get("search")?.trim() ?? "");
    setSelectedType(searchParams?.get("type")?.trim() ?? "all");
    setSelectedPurpose((searchParams?.get("purpose") as ListingPurpose | null) ?? "all");
  }, [searchParams]);

  useEffect(() => subscribeToPropertyTypeCategories(setPropertyTypeCategories), []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (priceDropdownRef.current && !priceDropdownRef.current.contains(event.target as Node)) {
        setIsPriceOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Property types offered in the type dropdown narrow down to the chosen purpose
  // (a rent-only type like "Sublet" has no sale equivalent, and vice versa).
  const visibleCategories =
    selectedPurpose === "all"
      ? propertyTypeCategories
      : propertyTypeCategories.filter((category) => category.purpose === selectedPurpose);
  const visibleTypes = visibleCategories.map((category) => category.en);
  const categoryLabels: Record<string, string> = {};
  for (const category of propertyTypeCategories) {
    categoryLabels[category.en] = language === "bn" ? category.bn : category.en;
  }

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

  const priceBandCounts = useMemo(
    () =>
      PRICE_BANDS.map(
        (band) =>
          baseFilteredListings.filter((listing) => matchesPriceBand(listing.price, band)).length
      ),
    [baseFilteredListings]
  );

  const filteredListings = useMemo(() => {
    const filtered = baseFilteredListings.filter((listing) =>
      matchesPriceBand(listing.price, { min: minPrice, max: maxPrice })
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
  }, [baseFilteredListings, minPrice, maxPrice, sortOption]);

  const isPriceFilterActive = minPrice !== null || maxPrice !== null;
  const priceButtonLabel = isPriceFilterActive
    ? formatPriceRangeLabel(minPrice, maxPrice, t)
    : t.priceFilterLabel;

  function selectPriceBand(band: PriceBand) {
    setMinPrice(band.min);
    setMaxPrice(band.max);
  }

  function clearPriceFilter() {
    setMinPrice(null);
    setMaxPrice(null);
  }

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
              {visibleTypes.map((type) => (
                <option key={type} value={type}>
                  {categoryLabels[type] ?? type}
                </option>
              ))}
            </select>

            <select
              value={selectedPurpose}
              onChange={(event) => {
                const nextPurpose = event.target.value as ListingPurpose | "all";
                setSelectedPurpose(nextPurpose);
                const nextVisibleTypes =
                  nextPurpose === "all"
                    ? propertyTypeCategories.map((category) => category.en)
                    : propertyTypeCategories
                        .filter((category) => category.purpose === nextPurpose)
                        .map((category) => category.en);
                if (!nextVisibleTypes.includes(selectedType)) {
                  setSelectedType("all");
                }
              }}
              className="rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500"
            >
              <option value="all">{t.saleAndRent}</option>
              <option value="sale">{t.forSale}</option>
              <option value="rent">{t.forRent}</option>
            </select>

            <div className="relative" ref={priceDropdownRef}>
              <button
                type="button"
                onClick={() => setIsPriceOpen((open) => !open)}
                className={`w-full whitespace-nowrap rounded-md border px-3 py-2.5 text-left text-sm outline-none transition sm:w-auto ${
                  isPriceFilterActive
                    ? "border-green-500 bg-green-50 text-green-700 font-medium"
                    : "border-gray-300 text-gray-700 hover:border-green-500"
                }`}
              >
                {priceButtonLabel}
              </button>

              {isPriceOpen && (
                <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">{t.priceHeading}</span>
                    {isPriceFilterActive && (
                      <button
                        type="button"
                        onClick={clearPriceFilter}
                        className="text-xs font-medium text-green-600 hover:underline"
                      >
                        {t.priceClear}
                      </button>
                    )}
                  </div>

                  <div className="mb-4 flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={minPrice ?? ""}
                      onChange={(event) =>
                        setMinPrice(event.target.value === "" ? null : Number(event.target.value))
                      }
                      placeholder={t.priceMinPlaceholder}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500"
                    />
                    <span className="shrink-0 text-gray-400">–</span>
                    <input
                      type="number"
                      min={0}
                      value={maxPrice ?? ""}
                      onChange={(event) =>
                        setMaxPrice(event.target.value === "" ? null : Number(event.target.value))
                      }
                      placeholder={t.priceMaxPlaceholder}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500"
                    />
                  </div>

                  <ul className="space-y-2.5">
                    {PRICE_BANDS.map((band, index) => (
                      <li key={index}>
                        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-700">
                          <input
                            type="radio"
                            name="priceBand"
                            checked={band.min === minPrice && band.max === maxPrice}
                            onChange={() => selectPriceBand(band)}
                            className="h-4 w-4 accent-green-600"
                          />
                          <span>
                            {formatPriceBandLabel(band, t)}
                            <span className="text-gray-400"> · {priceBandCounts[index]} {t.adsCountSuffix}</span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

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

function matchesPriceBand(price: number, band: PriceBand) {
  const matchesMin = band.min === null || price >= band.min;
  const matchesMax = band.max === null || price <= band.max;
  return matchesMin && matchesMax;
}

type PriceLabels = {
  priceUnderPrefix: string;
  priceAbovePrefix: string;
};

function formatPriceBandLabel(band: PriceBand, labels: PriceLabels) {
  if (band.min === null && band.max !== null) {
    return `${labels.priceUnderPrefix} ${formatCompactBDT(band.max)}`;
  }
  if (band.max === null && band.min !== null) {
    return `${labels.priceAbovePrefix} ${formatCompactBDT(band.min)}`;
  }
  if (band.min !== null && band.max !== null) {
    return `${formatCompactBDT(band.min)} - ${formatCompactBDT(band.max)}`;
  }
  return "";
}

function formatPriceRangeLabel(minPrice: number | null, maxPrice: number | null, labels: PriceLabels) {
  return formatPriceBandLabel({ min: minPrice, max: maxPrice }, labels);
}
