import Link from "next/link";

import ListingCard from "@/components/listings/ListingCard";
import { type Listing } from "@/lib/listings";

type LatestListingsProps = {
  listings: Listing[];
};

export default function LatestListings({ listings }: LatestListingsProps) {
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
    <section className="border-t border-slate-200 bg-[#f5f4ef] py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl text-left">
            <span className="inline-flex border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600">
              Fresh on the market
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Latest Listings
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
              Recently posted apartments for sale and rent across Bangladesh.
            </p>
          </div>

          <Link
            href="/listings"
            className="inline-flex items-center justify-center border border-slate-900 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-900 transition hover:bg-slate-900 hover:text-white"
          >
            Browse all
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-5 xl:gap-6">
          {listings.slice(0, 8).map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
    </section>
  );
}
