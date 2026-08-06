"use client";

import { Loader2, MessageCircle, Plus, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { subscribeToSellerBuyRequests, type BuyRequest } from "@/lib/buy-requests";
import { getListingsBySeller } from "@/lib/listing-service";
import { formatListingPrice, getPrimaryListingPhotoUrl, type Listing } from "@/lib/listings";

export default function MyListingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [buyRequests, setBuyRequests] = useState<BuyRequest[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/my-listings");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) {
      return;
    }

    getListingsBySeller(user.uid).then((data) => {
      setListings(data);
      setListingsLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = subscribeToSellerBuyRequests(user.uid, setBuyRequests);
    return unsubscribe;
  }, [user]);

  if (loading || !user) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </main>
    );
  }

  return (
    <main className="min-h-[70vh] bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <Link
            href="/post-ad"
            className="flex items-center gap-1.5 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            <Plus size={16} /> Post new ad
          </Link>
        </div>

        {buyRequests.length > 0 ? (
          <div className="mb-8 rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Buy requests received
            </h2>
            <div className="space-y-2">
              {buyRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-gray-900">{request.buyerName}</p>
                    <p className="text-xs text-gray-500">
                      interested in {request.listingTitle}
                    </p>
                  </div>
                  {request.buyerPhone ? (
                    <a
                      href={`tel:${request.buyerPhone}`}
                      className="text-xs font-semibold text-green-700 hover:underline"
                    >
                      {request.buyerPhone}
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {listingsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-green-600" />
          </div>
        ) : listings.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center text-sm text-gray-500">
            You haven&apos;t posted any listings yet.
          </p>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-3 transition hover:border-green-300"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {getPrimaryListingPhotoUrl(listing) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getPrimaryListingPhotoUrl(listing)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{listing.title}</p>
                  <p className="text-xs text-gray-500">{listing.location}</p>
                  <p className="text-sm font-bold text-green-700">
                    {formatListingPrice(listing.price)}
                  </p>
                </div>
                {listing.boost.status === "active" ? (
                  <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2 py-1 text-[10px] font-bold uppercase text-white">
                    <Zap size={10} /> Boosted
                  </span>
                ) : listing.boost.status === "pending" ? (
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase text-amber-700">
                    Boost pending
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        )}

        <Link
          href="/chat"
          className="mt-6 flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-green-400"
        >
          <MessageCircle size={16} /> View all messages
        </Link>
      </div>
    </main>
  );
}
