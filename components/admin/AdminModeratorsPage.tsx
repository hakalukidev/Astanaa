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
import { subscribeToAllListingsForAdmin, subscribeToModerationLog } from "@/lib/listing-service";
import type { Listing, ModerationLogEntry } from "@/lib/listings";
import { cn } from "@/lib/utils";

type ModeratorActionType = "approved" | "rejected" | "removed";

const ACTION_LABELS: Record<ModeratorActionType, string> = {
  approved: "Approved",
  rejected: "Rejected",
  removed: "Removed",
};

const ACTION_BADGE_STYLES: Record<ModeratorActionType, string> = {
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  removed: "bg-slate-200 text-slate-700",
};

type ModeratorAction = {
  id: string;
  title: string;
  action: ModeratorActionType;
  atMs: number | null;
};

type ModeratorRow = {
  id: string;
  name: string;
  approvedCount: number;
  rejectedCount: number;
  removedCount: number;
  actionsThatDay: ModeratorAction[];
};

function buildModeratorRows(
  listings: Listing[],
  logEntries: ModerationLogEntry[],
  dayRange: { start: number; end: number }
): ModeratorRow[] {
  const byId = new Map<string, ModeratorRow>();

  function getRow(id: string, name: string) {
    const existing = byId.get(id);
    if (existing) {
      return existing;
    }

    const created: ModeratorRow = {
      id,
      name,
      approvedCount: 0,
      rejectedCount: 0,
      removedCount: 0,
      actionsThatDay: [],
    };
    byId.set(id, created);
    return created;
  }

  for (const listing of listings) {
    if (!listing.moderatedBy || listing.moderatedAtMs === null) {
      continue;
    }

    if (listing.moderatedAtMs < dayRange.start || listing.moderatedAtMs >= dayRange.end) {
      continue;
    }

    if (listing.status !== "active" && listing.status !== "rejected") {
      continue;
    }

    const row = getRow(listing.moderatedBy, listing.moderatedByName);
    const action: ModeratorActionType = listing.status === "active" ? "approved" : "rejected";

    if (action === "approved") {
      row.approvedCount += 1;
    } else {
      row.rejectedCount += 1;
    }

    row.actionsThatDay.push({
      id: listing.id,
      title: listing.title,
      action,
      atMs: listing.moderatedAtMs,
    });
  }

  for (const entry of logEntries) {
    if (entry.createdAtMs === null) {
      continue;
    }

    if (entry.createdAtMs < dayRange.start || entry.createdAtMs >= dayRange.end) {
      continue;
    }

    const row = getRow(entry.moderatorUid, entry.moderatorName);
    row.removedCount += 1;
    row.actionsThatDay.push({
      id: entry.id,
      title: entry.listingTitle,
      action: "removed",
      atMs: entry.createdAtMs,
    });
  }

  for (const row of byId.values()) {
    row.actionsThatDay.sort((left, right) => (right.atMs ?? 0) - (left.atMs ?? 0));
  }

  return Array.from(byId.values()).sort(
    (left, right) =>
      right.approvedCount + right.rejectedCount + right.removedCount -
      (left.approvedCount + left.rejectedCount + left.removedCount)
  );
}

export default function AdminModeratorsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [logEntries, setLogEntries] = useState<ModerationLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => toDateInputValue(new Date()));
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    let listingsLoaded = false;
    let logLoaded = false;

    function checkLoaded() {
      if (listingsLoaded && logLoaded) {
        setIsLoading(false);
      }
    }

    const unsubscribeListings = subscribeToAllListingsForAdmin((nextListings) => {
      setListings(nextListings);
      listingsLoaded = true;
      checkLoaded();
    });

    const unsubscribeLog = subscribeToModerationLog((nextEntries) => {
      setLogEntries(nextEntries);
      logLoaded = true;
      checkLoaded();
    });

    return () => {
      unsubscribeListings();
      unsubscribeLog();
    };
  }, []);

  const dayRange = useMemo(() => getDayRangeMs(selectedDate), [selectedDate]);

  const rows = useMemo(() => {
    if (!dayRange) {
      return [];
    }

    return buildModeratorRows(listings, logEntries, dayRange);
  }, [listings, logEntries, dayRange]);

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
          approved: sum.approved + row.approvedCount,
          rejected: sum.rejected + row.rejectedCount,
          removed: sum.removed + row.removedCount,
        }),
        { approved: 0, rejected: 0, removed: 0 }
      ),
    [filteredRows]
  );

  const isToday = selectedDate === toDateInputValue(new Date());

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-blue-950">Moderators</CardTitle>
          <CardDescription>
            Per-moderator activity — how many listings each moderator approved,
            rejected, or removed, on any given day.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search moderator by name..."
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
            <div className="rounded-xl border border-slate-200 bg-slate-100/50 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-slate-700">{totals.removed}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">Removed</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-6 py-14 text-blue-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading moderators...
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center text-sm text-slate-500">
              No moderator activity on this date.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Moderator</TableHead>
                  <TableHead className="text-right">Approved</TableHead>
                  <TableHead className="text-right">Rejected</TableHead>
                  <TableHead className="text-right">Removed</TableHead>
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
                        <TableCell className="text-right text-emerald-700">{row.approvedCount}</TableCell>
                        <TableCell className="text-right text-red-700">{row.rejectedCount}</TableCell>
                        <TableCell className="text-right text-slate-600">{row.removedCount}</TableCell>
                      </TableRow>
                      {isExpanded ? (
                        <TableRow key={`${row.id}-detail`}>
                          <TableCell colSpan={4} className="bg-slate-50 p-0">
                            <div className="space-y-2 px-4 py-3">
                              {row.actionsThatDay.map((entry) => (
                                <div
                                  key={`${entry.action}-${entry.id}`}
                                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                >
                                  <span className="font-medium text-blue-950">{entry.title}</span>
                                  <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span>{formatTime(entry.atMs)}</span>
                                    <span
                                      className={cn(
                                        "rounded-full px-2 py-0.5 font-medium",
                                        ACTION_BADGE_STYLES[entry.action]
                                      )}
                                    >
                                      {ACTION_LABELS[entry.action]}
                                    </span>
                                  </div>
                                </div>
                              ))}
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
