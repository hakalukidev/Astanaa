"use client";

import { Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import SimpleBarChart from "@/components/admin/SimpleBarChart";
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
import {
  bucketUsersByGranularity,
  computeUserPeriodStats,
  fetchSiteUsers,
  type ChartGranularity,
  type SiteUser,
} from "@/lib/site-users";

const GRANULARITY_OPTIONS: { value: ChartGranularity; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-center">
      <p className="text-2xl font-bold text-blue-950">{value.toLocaleString("en-BD")}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-blue-600">{label}</p>
    </div>
  );
}

function formatJoinedDate(ms: number | null) {
  if (ms === null) {
    return "—";
  }
  return new Date(ms).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminSiteUsersPage() {
  const [users, setUsers] = useState<SiteUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [granularity, setGranularity] = useState<ChartGranularity>("month");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchSiteUsers()
      .then(setUsers)
      .catch(() => setErrorMessage("Could not load users."))
      .finally(() => setIsLoading(false));
  }, []);

  const periodStats = useMemo(() => computeUserPeriodStats(users), [users]);
  const chartData = useMemo(() => bucketUsersByGranularity(users, granularity), [users, granularity]);

  const visibleUsers = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    const sorted = [...users].sort((left, right) => (right.createdAtMs ?? 0) - (left.createdAtMs ?? 0));

    if (!normalized) {
      return sorted;
    }

    return sorted.filter(
      (user) =>
        user.displayId.toLowerCase().includes(normalized) ||
        user.name.toLowerCase().includes(normalized) ||
        user.phone.toLowerCase().includes(normalized) ||
        user.email.toLowerCase().includes(normalized)
    );
  }, [users, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-6 py-14 text-blue-700">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading users...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-dashed border-red-300 bg-red-50 px-6 py-14 text-center text-red-600">
        {errorMessage}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-blue-950">Users</CardTitle>
          <CardDescription>
            Everyone who has signed up on Astanaa.com — {periodStats.all.toLocaleString("en-BD")} total.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <StatCard label="Today" value={periodStats.today} />
            <StatCard label="This Week" value={periodStats.week} />
            <StatCard label="This Month" value={periodStats.month} />
            <StatCard label="This Year" value={periodStats.year} />
            <StatCard label="All Time" value={periodStats.all} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 shadow-sm">
        <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-blue-950">User signups</CardTitle>
            <CardDescription>New sign-ups over time.</CardDescription>
          </div>
          <div className="flex gap-1 rounded-lg border border-blue-200 bg-blue-50 p-1">
            {GRANULARITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setGranularity(option.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  granularity === option.value
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-blue-700 hover:bg-blue-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <SimpleBarChart data={chartData} />
        </CardContent>
      </Card>

      <Card className="border-blue-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-blue-950">All users</CardTitle>
          <CardDescription>Newest first. Search by ID, name, phone, or email.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search users..."
              className="pl-9"
            />
          </div>

          {visibleUsers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center text-sm text-slate-500">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleUsers.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell className="font-mono text-xs font-semibold text-blue-700">
                        {user.displayId}
                      </TableCell>
                      <TableCell className="font-medium text-blue-950">{user.name || "Unknown"}</TableCell>
                      <TableCell>{user.phone || "—"}</TableCell>
                      <TableCell>{user.email || "—"}</TableCell>
                      <TableCell className="text-right text-sm text-blue-600">
                        {formatJoinedDate(user.createdAtMs)}
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
