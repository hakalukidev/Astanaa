"use client";

import { ChevronDown, ChevronRight, Loader2, Search } from "lucide-react";
import { Fragment, useDeferredValue, useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTime, getDayRangeMs, toDateInputValue } from "@/lib/admin-date-range";
import { subscribeToAllListingsForAdmin } from "@/lib/listing-service";
import type { Listing, ListingStatus } from "@/lib/listings";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<ListingStatus, string> = {
  active: "Approved",
  pending: "Pending",
  rejected: "Rejected",
  sold: "Sold",
};

const STATUS_BADGE_STYLES: Record<ListingStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
  sold: "bg-slate-100 text-slate-600",
};

type PromoterRow = {
  id: string;
  name: string;
  createdCount: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  postsThatDay: Listing[];
};

function buildPromoterRows(listings: Listing[], dayRange: { start: number; end: number }): PromoterRow[] {
  const byId = new Map<string, PromoterRow>();

  function getRow(listing: Listing) {
    const existing = byId.get(listing.sellerId);
    if (existing) {
      return existing;
    }

    const created: PromoterRow = {
      id: listing.sellerId,
      name: listing.sellerName,
      createdCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      pendingCount: 0,
      postsThatDay: [],
    };
    byId.set(listing.sellerId, created);
    return created;
  }

  for (const listing of listings) {
    if (listing.sellerRole !== "promoter") {
      continue;
    }

    const isCreatedThatDay =
      listing.createdAtMs !== null &&
      listing.createdAtMs >= dayRange.start &&
      listing.createdAtMs < dayRange.end;

    const isModeratedThatDay =
      listing.moderatedAtMs !== null &&
      listing.moderatedAtMs >= dayRange.start &&
      listing.moderatedAtMs < dayRange.end;

    if (!isCreatedThatDay && !isModeratedThatDay) {
      continue;
    }

    const row = getRow(listing);

    if (isCreatedThatDay) {
      row.createdCount += 1;
      row.postsThatDay.push(listing);
      if (listing.status === "pending") {
        row.pendingCount += 1;
      }
    }

    if (isModeratedThatDay && listing.status === "active") {
      row.approvedCount += 1;
    }

    if (isModeratedThatDay && listing.status === "rejected") {
      row.rejectedCount += 1;
    }
  }

  return Array.from(byId.values()).sort((left, right) => right.createdCount - left.createdCount);
}

export default function AdminPromotersPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => toDateInputValue(new Date()));
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    const unsubscribe = subscribeToAllListingsForAdmin((nextListings) => {
      setListings(nextListings);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const dayRange = useMemo(() => getDayRangeMs(selectedDate), [selectedDate]);

  const rows = useMemo(() => {
    if (!dayRange) {
      return [];
    }

    return buildPromoterRows(listings, dayRange);
  }, [listings, dayRange]);

  const filteredRows = useMemo(() => {
    const normalized = deferredSearchTerm.trim().toLowerCase();

    if (!normalized) {
      return rows;
    }

    return rows.filter((row) => row.name.toLowerCase().includes(normalized));
  }, [rows, deferredSearchTerm]);

  const totals = useMemo(
    () =>
      filteredRows.reduce(
        (sum, row) => ({
          created: sum.created + row.createdCount,
          approved: sum.approved + row.approvedCount,
          rejected: sum.rejected + row.rejectedCount,
        }),
        { created: 0, approved: 0, rejected: 0 }
      ),
    [filteredRows]
  );

  const isToday = selectedDate === toDateInputValue(new Date());

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-blue-950">Promoters</CardTitle>
          <CardDescription>
            Per-promoter posting activity — how many listings each promoter created,
            and how many were approved or rejected, on any given day.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search promoter by name..."
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                max={toDateInputValue(new Date())}
                className="w-auto"
              />
              {!isToday ? (
                <button
                  type="button"
                  onClick={() => setSelectedDate(toDateInputValue(new Date()))}
                  className="rounded-md border border-blue-200 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50"
                >
                  Today
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-blue-950">{totals.created}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-blue-600">Posted</p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-emerald-700">{totals.approved}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-emerald-600">
                Approved
              </p>
            </div>
            <div className="rounded-xl border border-red-100 bg-red-50/50 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-red-700">{totals.rejected}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-red-600">Rejected</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-6 py-14 text-blue-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading promoters...
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center text-sm text-slate-500">
              No promoter activity on this date.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Promoter</TableHead>
                  <TableHead className="text-right">Posted</TableHead>
                  <TableHead className="text-right">Approved</TableHead>
                  <TableHead className="text-right">Rejected</TableHead>
                  <TableHead className="text-right">Still pending</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => {
                  const isExpanded = expandedId === row.id;

                  return (
                    <Fragment key={row.id}>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : row.id)}
                      >
                        <TableCell className="font-medium text-blue-950">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                            )}
                            {row.name || "Unknown"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{row.createdCount}</TableCell>
                        <TableCell className="text-right text-emerald-700">{row.approvedCount}</TableCell>
                        <TableCell className="text-right text-red-700">{row.rejectedCount}</TableCell>
                        <TableCell className="text-right text-amber-700">{row.pendingCount}</TableCell>
                      </TableRow>
                      {isExpanded ? (
                        <TableRow key={`${row.id}-detail`}>
                          <TableCell colSpan={5} className="bg-slate-50 p-0">
                            <div className="space-y-2 px-4 py-3">
                              {row.postsThatDay.length === 0 ? (
                                <p className="text-sm text-slate-500">
                                  No posts created on this date (activity above is from
                                  posts approved/rejected today that were created earlier).
                                </p>
                              ) : (
                                row.postsThatDay.map((listing) => (
                                  <div
                                    key={listing.id}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                  >
                                    <span className="font-medium text-blue-950">{listing.title}</span>
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                      <span>Posted {formatTime(listing.createdAtMs)}</span>
                                      <span
                                        className={cn(
                                          "rounded-full px-2 py-0.5 font-medium",
                                          STATUS_BADGE_STYLES[listing.status]
                                        )}
                                      >
                                        {STATUS_LABELS[listing.status]}
                                      </span>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
