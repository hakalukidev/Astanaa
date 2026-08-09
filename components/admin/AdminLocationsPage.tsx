"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { buildLocationTree } from "@/lib/bd-locations";
import {
  addCustomLocationEntry,
  deleteCustomLocationEntry,
  subscribeToCustomLocations,
  type CustomLocationEntry,
  type LocationLevel,
} from "@/lib/custom-locations";

const LEVEL_OPTIONS: { value: LocationLevel; label: string }[] = [
  { value: "division", label: "Division (বিভাগ)" },
  { value: "district", label: "District (জেলা)" },
  { value: "upazila", label: "Upazila / Thana (উপজেলা)" },
  { value: "area", label: "Area / Para-Mohalla (এলাকা)" },
];

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50";

export default function AdminLocationsPage() {
  const [customEntries, setCustomEntries] = useState<CustomLocationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [level, setLevel] = useState<LocationLevel>("area");
  const [divisionEn, setDivisionEn] = useState("");
  const [districtEn, setDistrictEn] = useState("");
  const [upazilaEn, setUpazilaEn] = useState("");
  const [en, setEn] = useState("");
  const [bn, setBn] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToCustomLocations((entries) => {
      setCustomEntries(entries);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const tree = useMemo(() => buildLocationTree(customEntries), [customEntries]);

  const selectedDivision = useMemo(
    () => tree.find((division) => division.en === divisionEn),
    [tree, divisionEn]
  );
  const selectedDistrict = useMemo(
    () => selectedDivision?.districts.find((district) => district.en === districtEn),
    [selectedDivision, districtEn]
  );

  const needsDivision = level !== "division";
  const needsDistrict = level === "upazila" || level === "area";
  const needsUpazila = level === "area";

  const parentPath = useMemo(() => {
    if (level === "division") return "";
    if (level === "district") return divisionEn;
    if (level === "upazila") return `${divisionEn}/${districtEn}`;
    return `${divisionEn}/${districtEn}/${upazilaEn}`;
  }, [level, divisionEn, districtEn, upazilaEn]);

  const canSubmit =
    en.trim() &&
    bn.trim() &&
    (!needsDivision || divisionEn) &&
    (!needsDistrict || districtEn) &&
    (!needsUpazila || upazilaEn);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    try {
      await addCustomLocationEntry({ level, parentPath, en: en.trim(), bn: bn.trim() });
      toast({ title: "Location added" });
      setEn("");
      setBn("");
    } catch {
      toast({ title: "Could not add location", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(entry: CustomLocationEntry) {
    if (!window.confirm(`Remove "${entry.en}"? Listings already using it keep their saved value.`)) {
      return;
    }

    setDeletingId(entry.id);
    try {
      await deleteCustomLocationEntry(entry.id);
    } catch {
      toast({ title: "Could not remove location", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-blue-950">Locations</CardTitle>
          <CardDescription>
            Divisions, districts, and upazilas already ship with the site (all of Bangladesh).
            Use this to add missing entries, or — most usefully — the Para/Mohalla (area) names
            sellers can pick from under each upazila in the post-ad location picker.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <select
                id="level"
                value={level}
                onChange={(event) => {
                  setLevel(event.target.value as LocationLevel);
                  setDivisionEn("");
                  setDistrictEn("");
                  setUpazilaEn("");
                }}
                className={selectClassName}
              >
                {LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {needsDivision && (
              <div className="space-y-2">
                <Label htmlFor="parentDivision">Division</Label>
                <select
                  id="parentDivision"
                  value={divisionEn}
                  onChange={(event) => {
                    setDivisionEn(event.target.value);
                    setDistrictEn("");
                    setUpazilaEn("");
                  }}
                  className={selectClassName}
                >
                  <option value="">Choose...</option>
                  {tree.map((division) => (
                    <option key={division.id} value={division.en}>
                      {division.en} ({division.bn})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {needsDistrict && (
              <div className="space-y-2">
                <Label htmlFor="parentDistrict">District</Label>
                <select
                  id="parentDistrict"
                  value={districtEn}
                  onChange={(event) => {
                    setDistrictEn(event.target.value);
                    setUpazilaEn("");
                  }}
                  disabled={!selectedDivision}
                  className={selectClassName}
                >
                  <option value="">Choose...</option>
                  {selectedDivision?.districts.map((district) => (
                    <option key={district.id} value={district.en}>
                      {district.en} ({district.bn})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {needsUpazila && (
              <div className="space-y-2">
                <Label htmlFor="parentUpazila">Upazila / Thana</Label>
                <select
                  id="parentUpazila"
                  value={upazilaEn}
                  onChange={(event) => setUpazilaEn(event.target.value)}
                  disabled={!selectedDistrict}
                  className={selectClassName}
                >
                  <option value="">Choose...</option>
                  {selectedDistrict?.upazilas.map((upazila) => (
                    <option key={upazila.id} value={upazila.en}>
                      {upazila.en} ({upazila.bn})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="en">Name (English)</Label>
              <Input id="en" value={en} onChange={(event) => setEn(event.target.value)} placeholder="e.g. Sat Masjid Road" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bn">Name (বাংলা)</Label>
              <Input id="bn" value={bn} onChange={(event) => setBn(event.target.value)} placeholder="যেমন: সাত মসজিদ রোড" />
            </div>

            <div className="flex items-end">
              <Button type="submit" disabled={!canSubmit || isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Add
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-blue-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-blue-950">Admin-added entries</CardTitle>
          <CardDescription>
            Only entries added here are listed — the built-in division/district/upazila data
            isn&apos;t shown (or editable) on this page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-6 py-14 text-blue-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading locations...
            </div>
          ) : customEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center text-sm text-slate-500">
              No admin-added locations yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Level</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>English</TableHead>
                    <TableHead>বাংলা</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="capitalize">{entry.level}</TableCell>
                      <TableCell className="text-sm text-gray-500">{entry.parentPath || "—"}</TableCell>
                      <TableCell className="font-medium text-blue-950">{entry.en}</TableCell>
                      <TableCell>{entry.bn}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(entry)}
                          disabled={deletingId === entry.id}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          {deletingId === entry.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
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
