"use client";

import { Loader2, Plus, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getListingsBySeller } from "@/lib/listing-service";
import {
  formatListingPrice,
  getListingThumbnailUrl,
  getPrimaryListingPhotoUrl,
  type Listing,
} from "@/lib/listings";
import { cn } from "@/lib/utils";

type AdminMyPostsProps = {
  uid: string;
  name: string;
};

const STATUS_STYLES: Record<Listing["status"], string> = {
  active: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
  sold: "bg-slate-200 text-slate-700",
};

export default function AdminMyPosts({ uid, name }: AdminMyPostsProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getListingsBySeller(uid).then((data) => {
      setListings(data);
      setIsLoading(false);
    });
  }, [uid]);

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 shadow-sm">
        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-blue-950">My posts</CardTitle>
            <CardDescription>Signed in as {name}</CardDescription>
          </div>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/post-ad" target="_blank">
              <Plus className="h-4 w-4" /> Post new ad
            </Link>
          </Button>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-6 py-14 text-blue-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading your posts...
            </div>
          ) : listings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center text-sm text-slate-500">
              You haven&apos;t posted any listings yet.
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  target="_blank"
                  className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-blue-300"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {getPrimaryListingPhotoUrl(listing) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getListingThumbnailUrl(getPrimaryListingPhotoUrl(listing), 100)}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-blue-950">
                      {listing.title}
                    </p>
                    <p className="text-xs text-slate-500">{listing.location}</p>
                    <p className="text-sm font-bold text-green-700">
                      {formatListingPrice(listing.price)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-[10px] font-semibold uppercase",
                        STATUS_STYLES[listing.status]
                      )}
                    >
                      {listing.status}
                    </span>
                    {listing.boost.status === "active" ? (
                      <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2 py-1 text-[10px] font-bold uppercase text-white">
                        <Zap size={10} /> Boosted
                      </span>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
