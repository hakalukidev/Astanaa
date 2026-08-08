"use client";

import { Check, Loader2, MapPin, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { type AdminRole } from "@/lib/admin-auth";
import { deleteListing, markListingStatus, subscribeToAllListingsForAdmin } from "@/lib/listing-service";
import {
  formatDurationMs,
  formatListingPrice,
  getPrimaryListingPhotoUrl,
  type Listing,
  type ListingStatus,
} from "@/lib/listings";
import { cn } from "@/lib/utils";

// Duplicated (rather than imported) from lib/admin-auth.ts on purpose: that
// module is marked "server-only", so a client component can't pull the real
// function in — only its type. Keep this in sync with canModerateListings().
function canModerate(role: AdminRole) {
  return role === "super_admin" || role === "admin" || role === "moderator";
}

const STATUS_FILTERS: { value: ListingStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Live" },
  { value: "rejected", label: "Rejected" },
  { value: "sold", label: "Sold" },
];

const STATUS_BADGE_STYLES: Record<ListingStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  active: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  sold: "bg-slate-200 text-slate-700",
};

type AdminPostsPageProps = {
  role: AdminRole;
  adminUid: string;
  adminName: string;
};

export default function AdminPostsPage({ role, adminUid, adminName }: AdminPostsPageProps) {
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ListingStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const canApprove = canModerate(role);

  useEffect(() => {
    const unsubscribe = subscribeToAllListingsForAdmin((nextListings) => {
      setListings(nextListings);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const counts = useMemo(() => {
    return {
      total: listings.length,
      pending: listings.filter((listing) => listing.status === "pending").length,
      active: listings.filter((listing) => listing.status === "active").length,
      rejected: listings.filter((listing) => listing.status === "rejected").length,
      sold: listings.filter((listing) => listing.status === "sold").length,
    };
  }, [listings]);

  const filteredListings = useMemo(() => {
    const normalizedSearch = deferredSearchTerm.trim().toLowerCase();

    return listings.filter((listing) => {
      const matchesStatus = statusFilter === "all" || listing.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        listing.title.toLowerCase().includes(normalizedSearch) ||
        listing.location.toLowerCase().includes(normalizedSearch) ||
        listing.sellerName.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [listings, statusFilter, deferredSearchTerm]);

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
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="border-blue-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Total posts</CardDescription>
            <CardTitle className="text-3xl text-blue-950">{counts.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-blue-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl text-amber-600">{counts.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-blue-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Live</CardDescription>
            <CardTitle className="text-3xl text-green-700">{counts.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-blue-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Rejected</CardDescription>
            <CardTitle className="text-3xl text-red-600">{counts.rejected}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-blue-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Sold</CardDescription>
            <CardTitle className="text-3xl text-slate-600">{counts.sold}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card className="border-blue-200 shadow-sm">
        <CardHeader className="gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-blue-950">All posts</CardTitle>
            <CardDescription>
              Every listing, any status — approve, reject, or remove from one place.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by title, location, or seller"
                className="pl-9 focus-visible:ring-blue-500"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    statusFilter === filter.value
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-6 py-14 text-blue-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading posts...
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center text-sm text-slate-500">
              No posts match the current filters.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredListings.map((listing) => {
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
                            STATUS_BADGE_STYLES[listing.status]
                          )}
                        >
                          {listing.status}
                        </span>
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

                    {canApprove ? (
                      <div className="flex shrink-0 items-center gap-2">
                        {isRowPending ? (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        ) : (
                          <>
                            {listing.status !== "active" ? (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApprove(listing)}
                              >
                                <Check className="h-4 w-4" /> Approve
                              </Button>
                            ) : null}
                            {listing.status !== "rejected" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() => handleReject(listing)}
                              >
                                <X className="h-4 w-4" /> Reject
                              </Button>
                            ) : null}
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => handleRemove(listing)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    ) : null}
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
