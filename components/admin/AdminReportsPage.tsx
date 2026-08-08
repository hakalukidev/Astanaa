"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { subscribeToAllListingsForAdmin } from "@/lib/listing-service";
import { formatDurationMs, type Listing } from "@/lib/listings";
import { getVisitStats, type VisitStats } from "@/lib/visits";

// Fixed boost price shown throughout the app (post-ad/listing detail): ৳100
// per boosted post. There's no separate "payments" collection — a boost
// request on a listing *is* the payment record.
const BOOST_PRICE_BDT = 100;

type PeriodStarts = {
  today: number;
  week: number;
  month: number;
  year: number;
};

function getPeriodStarts(): PeriodStarts {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - now.getDay()
  ).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

  return { today: startOfToday, week: startOfWeek, month: startOfMonth, year: startOfYear };
}

type GroupedRow = {
  id: string;
  name: string;
  today: number;
  week: number;
  month: number;
  year: number;
  all: number;
};

function buildGroupedRows(
  listings: Listing[],
  periods: PeriodStarts,
  getId: (listing: Listing) => string,
  getName: (listing: Listing) => string,
  getTimestamp: (listing: Listing) => number | null
): GroupedRow[] {
  const byId = new Map<string, GroupedRow>();

  for (const listing of listings) {
    const ms = getTimestamp(listing);

    if (ms === null) {
      continue;
    }

    const id = getId(listing);
    const existing = byId.get(id) ?? {
      id,
      name: getName(listing),
      today: 0,
      week: 0,
      month: 0,
      year: 0,
      all: 0,
    };

    existing.all += 1;
    if (ms >= periods.year) existing.year += 1;
    if (ms >= periods.month) existing.month += 1;
    if (ms >= periods.week) existing.week += 1;
    if (ms >= periods.today) existing.today += 1;

    byId.set(id, existing);
  }

  return Array.from(byId.values()).sort((left, right) => right.all - left.all);
}

type ExtraColumn = {
  header: string;
  render: (row: GroupedRow) => React.ReactNode;
};

function StatsTable({
  rows,
  nameHeader,
  extraColumn,
}: {
  rows: GroupedRow[];
  nameHeader: string;
  extraColumn?: ExtraColumn;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center text-sm text-slate-500">
        No data yet.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{nameHeader}</TableHead>
          <TableHead className="text-right">Today</TableHead>
          <TableHead className="text-right">This Week</TableHead>
          <TableHead className="text-right">This Month</TableHead>
          <TableHead className="text-right">This Year</TableHead>
          <TableHead className="text-right">All Time</TableHead>
          {extraColumn ? <TableHead className="text-right">{extraColumn.header}</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium text-blue-950">{row.name || "Unknown"}</TableCell>
            <TableCell className="text-right">{row.today}</TableCell>
            <TableCell className="text-right">{row.week}</TableCell>
            <TableCell className="text-right">{row.month}</TableCell>
            <TableCell className="text-right">{row.year}</TableCell>
            <TableCell className="text-right font-semibold">{row.all}</TableCell>
            {extraColumn ? (
              <TableCell className="text-right font-semibold text-green-700">
                {extraColumn.render(row)}
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function VisitStatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-center">
      <p className="text-2xl font-bold text-blue-950">{value.toLocaleString("en-BD")}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-blue-600">{label}</p>
    </div>
  );
}

export default function AdminReportsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visitStats, setVisitStats] = useState<VisitStats | null>(null);
  const [isVisitsLoading, setIsVisitsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAllListingsForAdmin((nextListings) => {
      setListings(nextListings);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    getVisitStats()
      .then(setVisitStats)
      .finally(() => setIsVisitsLoading(false));
  }, []);

  const periods = useMemo(() => getPeriodStarts(), []);

  const postRows = useMemo(
    () =>
      buildGroupedRows(
        listings,
        periods,
        (listing) => listing.sellerId,
        (listing) => listing.sellerName,
        (listing) => listing.createdAtMs
      ),
    [listings, periods]
  );

  const paymentRows = useMemo(
    () =>
      buildGroupedRows(
        listings.filter((listing) => listing.boost.requestedAtMs !== null),
        periods,
        (listing) => listing.sellerId,
        (listing) => listing.sellerName,
        (listing) => listing.boost.requestedAtMs
      ),
    [listings, periods]
  );

  const moderatedListings = useMemo(
    () =>
      listings.filter(
        (listing) =>
          listing.status === "active" && listing.moderatedBy && listing.moderatedAtMs !== null
      ),
    [listings]
  );

  const moderatorRows = useMemo(
    () =>
      buildGroupedRows(
        moderatedListings,
        periods,
        (listing) => listing.moderatedBy,
        (listing) => listing.moderatedByName,
        (listing) => listing.moderatedAtMs
      ),
    [moderatedListings, periods]
  );

  // All-time average approve delay per moderator (submitted -> approved).
  const avgApprovalTimeById = useMemo(() => {
    const totals = new Map<string, { sumMs: number; count: number }>();

    for (const listing of moderatedListings) {
      if (listing.createdAtMs === null || listing.moderatedAtMs === null) {
        continue;
      }

      const durationMs = listing.moderatedAtMs - listing.createdAtMs;

      if (durationMs < 0) {
        continue;
      }

      const existing = totals.get(listing.moderatedBy) ?? { sumMs: 0, count: 0 };
      existing.sumMs += durationMs;
      existing.count += 1;
      totals.set(listing.moderatedBy, existing);
    }

    const averages = new Map<string, number>();
    totals.forEach((value, id) => averages.set(id, value.sumMs / value.count));
    return averages;
  }, [moderatedListings]);

  const totalPayments = paymentRows.reduce((sum, row) => sum + row.all, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-6 py-14 text-blue-700">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading reports...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-blue-950">Website visits</CardTitle>
          <CardDescription>
            Roughly one count per visitor's browser per day — not a full analytics
            platform, but enough to see traffic trends.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isVisitsLoading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-6 py-10 text-blue-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading visits...
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <VisitStatCard label="Today" value={visitStats?.today ?? 0} />
              <VisitStatCard label="This Week" value={visitStats?.week ?? 0} />
              <VisitStatCard label="This Month" value={visitStats?.month ?? 0} />
              <VisitStatCard label="This Year" value={visitStats?.year ?? 0} />
              <VisitStatCard label="All Time" value={visitStats?.all ?? 0} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-blue-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-blue-950">Posts by user</CardTitle>
          <CardDescription>
            How many listings each seller has posted, broken down by how recently.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StatsTable rows={postRows} nameHeader="Seller" />
        </CardContent>
      </Card>

      <Card className="border-blue-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-blue-950">Payments (boosts) by user</CardTitle>
          <CardDescription>
            Every boost request counts as one payment (fixed ৳{BOOST_PRICE_BDT} each) —
            regardless of whether it's still pending verification or already active.
            {totalPayments > 0 ? ` ${totalPayments} boost request(s) total.` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StatsTable
            rows={paymentRows}
            nameHeader="Seller"
            extraColumn={{
              header: "Total Amount",
              render: (row) => `৳ ${(row.all * BOOST_PRICE_BDT).toLocaleString("en-BD")}`,
            }}
          />
        </CardContent>
      </Card>

      <Card className="border-blue-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-blue-950">Moderator activity</CardTitle>
          <CardDescription>
            Who approved how many posts, and how long they typically took from
            submission to approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StatsTable
            rows={moderatorRows}
            nameHeader="Moderator"
            extraColumn={{
              header: "Avg. Time to Approve",
              render: (row) => {
                const avgMs = avgApprovalTimeById.get(row.id);
                return avgMs === undefined ? "—" : formatDurationMs(avgMs);
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
