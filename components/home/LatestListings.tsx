"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import ListingCard from "@/components/listings/ListingCard";
import PriceFilterDropdown, { type PriceRange } from "@/components/listings/PriceFilterDropdown";
import { useLanguage } from "@/contexts/LanguageContext";
import { matchesPriceBand, type Listing } from "@/lib/listings";
import { translations } from "@/lib/site-translations";

type LatestListingsProps = {
  listings: Listing[];
};

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

export default function LatestListings({ listings }: LatestListingsProps) {
  const { language } = useLanguage();
  const t = translations[language].listings;
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: null, max: null });

  const sortedListings = useMemo(() => {
    const filtered = listings.filter((listing) => matchesPriceBand(listing.price, priceRange));

    return filtered.sort((left, right) => {
      const leftBoosted = left.boost.status === "active" ? 1 : 0;
      const rightBoosted = right.boost.status === "active" ? 1 : 0;

      if (leftBoosted !== rightBoosted) {
        return rightBoosted - leftBoosted;
      }

      return compareBySortOption(left, right, sortOption);
    });
  }, [listings, priceRange, sortOption]);

  if (listings.length === 0) {
    return (
      <section className="bg-[#f5f4ef] py-16 text-center">
        <div className="mx-auto max-w-xl px-4">
          <h2 className="text-2xl font-bold text-slate-900">No listings yet</h2>
          <p className="mt-2 text-sm text-slate-600">
            Be the first to post an apartment for sale or rent.
          </p>
          <Link
            href="/post-ad"
            className="mt-5 inline-flex items-center justify-center rounded-md bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            Post your ad
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-slate-200 bg-[#f5f4ef] pb-14 pt-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Latest Listings
          </h2>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <PriceFilterDropdown
              value={priceRange}
              onChange={setPriceRange}
              listings={listings}
              labels={t}
            />

            <div className="flex items-center gap-2">
              <label htmlFor="latestListingsSort" className="shrink-0 text-sm font-semibold text-slate-700">
                {t.sortBy}
              </label>
              <select
                id="latestListingsSort"
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value as SortOption)}
                className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-green-500"
              >
                <option value="newest">{t.sortNewest}</option>
                <option value="oldest">{t.sortOldest}</option>
                <option value="price-asc">{t.sortPriceAsc}</option>
                <option value="price-desc">{t.sortPriceDesc}</option>
              </select>
            </div>
          </div>
        </div>

        {sortedListings.length === 0 ? (
          <p className="mt-8 py-8 text-center text-sm text-slate-500">{t.noResults}</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 xl:gap-6">
            {sortedListings.slice(0, 10).map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
