"use client";

import { Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
import { subscribeToAllListingsForAdmin } from "@/lib/listing-service";
import { BOOST_PRICE_BDT, type BoostStatus, type Listing } from "@/lib/listings";
import { cn } from "@/lib/utils";

type PeriodTotals = {
  today: number;
  week: number;
  month: number;
  year: number;
  all: number;
};

function getPeriodStarts() {
  const now = new Date();
  return {
    today: new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(),
    week: new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).getTime(),
    month: new Date(now.getFullYear(), now.getMonth(), 1).getTime(),
    year: new Date(now.getFullYear(), 0, 1).getTime(),
  };
}

function computePeriodTotals(payments: Listing[]): PeriodTotals {
  const periods = getPeriodStarts();
  const totals: PeriodTotals = { today: 0, week: 0, month: 0, year: 0, all: 0 };

  for (const listing of payments) {
    const ms = listing.boost.requestedAtMs;
    if (ms === null) continue;

    totals.all += 1;
    if (ms >= periods.year) totals.year += 1;
    if (ms >= periods.month) totals.month += 1;
    if (ms >= periods.week) totals.week += 1;
    if (ms >= periods.today) totals.today += 1;
  }

  return totals;
}

const STATUS_STYLES: Record<BoostStatus, string> = {
  none: "bg-slate-100 text-slate-500",
  pending: "bg-amber-100 text-amber-700",
  active: "bg-green-100 text-green-700",
  expired: "bg-slate-100 text-slate-500",
};

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-center",
        highlight ? "border-green-200 bg-green-50" : "border-blue-100 bg-blue-50/50"
      )}
    >
      <p className={cn("text-2xl font-bold", highlight ? "text-green-700" : "text-blue-950")}>
        {value}
      </p>
      <p
        className={cn(
          "mt-1 text-xs font-medium uppercase tracking-wide",
          highlight ? "text-green-600" : "text-blue-600"
        )}
      >
        {label}
      </p>
    </div>
  );
}

function formatDate(ms: number | null) {
  if (ms === null) return "—";
  return new Date(ms).toLocaleDateString("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const METHOD_LABELS: Record<string, string> = {
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  card: "Card",
};

export default function AdminPaymentsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToAllListingsForAdmin((nextListings) => {
      setListings(nextListings);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const payments = useMemo(
    () =>
      listings
        .filter((listing) => listing.boost.requestedAtMs !== null)
        .sort((left, right) => (right.boost.requestedAtMs ?? 0) - (left.boost.requestedAtMs ?? 0)),
    [listings]
  );

  const totals = useMemo(() => computePeriodTotals(payments), [payments]);

  const statusCounts = useMemo(() => {
    const counts: Record<BoostStatus, number> = { none: 0, pending: 0, active: 0, expired: 0 };
    for (const listing of payments) {
      counts[listing.boost.status] += 1;
    }
    return counts;
  }, [payments]);

  const visiblePayments = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return payments;

    return payments.filter(
      (listing) =>
        listing.title.toLowerCase().includes(normalized) ||
        listing.sellerName.toLowerCase().includes(normalized) ||
        listing.sellerPhone.toLowerCase().includes(normalized) ||
        (listing.boost.transactionId ?? "").toLowerCase().includes(normalized)
    );
  }, [payments, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-6 py-14 text-blue-700">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading payments...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-blue-950">Total revenue</CardTitle>
          <CardDescription>
            Every boost request counts as one payment (fixed ৳{BOOST_PRICE_BDT} each) — regardless
            of whether it&apos;s still pending verification, already active, or expired.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <StatCard label="Today" value={`৳ ${(totals.today * BOOST_PRICE_BDT).toLocaleString("en-BD")}`} />
            <StatCard label="This Week" value={`৳ ${(totals.week * BOOST_PRICE_BDT).toLocaleString("en-BD")}`} />
            <StatCard label="This Month" value={`৳ ${(totals.month * BOOST_PRICE_BDT).toLocaleString("en-BD")}`} />
            <StatCard label="This Year" value={`৳ ${(totals.year * BOOST_PRICE_BDT).toLocaleString("en-BD")}`} />
            <StatCard
              label="All Time"
              value={`৳ ${(totals.all * BOOST_PRICE_BDT).toLocaleString("en-BD")}`}
              highlight
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Pending verification" value={statusCounts.pending.toLocaleString("en-BD")} />
            <StatCard label="Active" value={statusCounts.active.toLocaleString("en-BD")} />
            <StatCard label="Expired" value={statusCounts.expired.toLocaleString("en-BD")} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-blue-950">All payments</CardTitle>
          <CardDescription>
            Every boost payment, newest first — {payments.length.toLocaleString("en-BD")} total.
            Search by listing, seller, or transaction ID.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search payments..."
              className="pl-9"
            />
          </div>

          {visiblePayments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center text-sm text-slate-500">
              No payments found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Listing</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Requested</TableHead>
                    <TableHead className="text-right">Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiblePayments.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell className="max-w-[220px] truncate font-medium text-blue-950">
                        <Link
                          href={`/listings/${listing.id}`}
                          target="_blank"
                          className="hover:underline"
                        >
                          {listing.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-blue-950">{listing.sellerName || "Unknown"}</div>
                        <div className="text-xs text-slate-500">{listing.sellerPhone}</div>
                      </TableCell>
                      <TableCell>
                        {listing.boost.method ? METHOD_LABELS[listing.boost.method] ?? listing.boost.method : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {listing.boost.transactionId || "—"}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-700">
                        ৳ {BOOST_PRICE_BDT.toLocaleString("en-BD")}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase",
                            STATUS_STYLES[listing.boost.status]
                          )}
                        >
                          {listing.boost.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-blue-600">
                        {formatDate(listing.boost.requestedAtMs)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-blue-600">
                        {formatDate(listing.boost.expiresAtMs)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
