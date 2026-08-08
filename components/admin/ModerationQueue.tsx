"use client";

import { Check, Loader2, MapPin, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { deleteListing, markListingStatus, subscribeToListingsByStatus } from "@/lib/listing-service";
import {
  formatDurationMs,
  formatListingPrice,
  getPrimaryListingPhotoUrl,
  type Listing,
  type ListingStatus,
} from "@/lib/listings";
import { cn } from "@/lib/utils";

const TABS: { value: ListingStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "active", label: "Live" },
  { value: "rejected", label: "Rejected" },
];

type ModerationQueueProps = {
  adminUid: string;
  adminName: string;
};

export default function ModerationQueue({ adminUid, adminName }: ModerationQueueProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ListingStatus>("pending");
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToListingsByStatus(activeTab, (nextListings) => {
      setListings(nextListings);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [activeTab]);

  async function handleApprove(listing: Listing) {
    setPendingId(listing.id);
    try {
      await markListingStatus(listing.id, "active", { uid: adminUid, name: adminName });
      toast({ title: "Listing approved", description: listing.title });
    } catch {
      toast({ title: "Could not approve listing", variant: "destructive" });
    } finally {
      setPendingId(null);
    }
  }

  async function handleReject(listing: Listing) {
    setPendingId(listing.id);
    try {
      await markListingStatus(listing.id, "rejected", { uid: adminUid, name: adminName });
      toast({ title: "Listing rejected", description: listing.title });
    } catch {
      toast({ title: "Could not reject listing", variant: "destructive" });
    } finally {
      setPendingId(null);
    }
  }

  async function handleRemove(listing: Listing) {
    if (!window.confirm(`Permanently remove "${listing.title}"? This cannot be undone.`)) {
      return;
    }

    setPendingId(listing.id);
    try {
      await deleteListing(listing.id);
      toast({ title: "Listing removed" });
    } catch {
      toast({ title: "Could not remove listing", variant: "destructive" });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-blue-950">Moderation queue</CardTitle>
          <CardDescription>
            Approve new listings before they go public, or remove ones that
            violate the rules.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex gap-2 border-b border-slate-200">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "border-b-2 px-4 py-2 text-sm font-semibold transition",
                  activeTab === tab.value
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-6 py-14 text-blue-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading listings...
            </div>
          ) : listings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center text-sm text-slate-500">
              No {activeTab} listings right now.
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => {
                const isRowPending = pendingId === listing.id;

                return (
                  <div
                    key={listing.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
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
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/listings/${listing.id}`}
                          target="_blank"
                          className="font-semibold text-blue-950 hover:underline"
                        >
                          {listing.title}
                        </Link>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                            listing.sellerRole === "promoter"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          )}
                        >
                          {listing.sellerRole}
                        </span>
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3 shrink-0" /> {listing.location}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-green-700">
                        {formatListingPrice(listing.price)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        by {listing.sellerName || "Unknown"} · {listing.sellerPhone}
                      </p>
                      {listing.moderatedByName && listing.moderatedAtMs ? (
                        <p className="mt-0.5 text-xs text-slate-400">
                          {listing.status === "rejected" ? "Rejected" : "Approved"} by{" "}
                          {listing.moderatedByName}
                          {listing.createdAtMs
                            ? ` in ${formatDurationMs(listing.moderatedAtMs - listing.createdAtMs)}`
                            : ""}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {isRowPending ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      ) : activeTab === "pending" ? (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprove(listing)}
                          >
                            <Check className="h-4 w-4" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => handleReject(listing)}
                          >
                            <X className="h-4 w-4" /> Reject
                          </Button>
                        </>
                      ) : activeTab === "rejected" ? (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprove(listing)}
                          >
                            <Check className="h-4 w-4" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => handleRemove(listing)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleRemove(listing)}
                        >
                          <Trash2 className="h-4 w-4" /> Remove
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
