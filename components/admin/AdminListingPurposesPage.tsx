"use client";

import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  addListingPurpose,
  deleteListingPurpose,
  isFallbackPurpose,
  seedDefaultListingPurposes,
  subscribeToListingPurposes,
  updateListingPurpose,
  type ListingPurposeRecord,
} from "@/lib/listing-purposes";
import {
  subscribeToPropertyTypeCategories,
  type PropertyTypeCategory,
} from "@/lib/property-type-categories";
import {
  DEFAULT_PROPERTY_TYPE_ICON,
  getPropertyTypeIcon,
  PROPERTY_TYPE_ICON_OPTIONS,
} from "@/lib/property-type-icons";

function isFallbackList(purposes: ListingPurposeRecord[]) {
  return purposes.length > 0 && purposes.every(isFallbackPurpose);
}

function describeSaveError(error: unknown): string {
  const code = (error as { code?: string } | null)?.code ?? "";
  if (code === "permission-denied") {
    return "Permission denied by Firestore rules — the listingPurposes write rule may not be deployed yet (firebase deploy --only firestore:rules).";
  }
  if (code === "unavailable") {
    return "Could not reach Firestore. Check your connection and try again.";
  }
  return "Please try again.";
}

export default function AdminListingPurposesPage() {
  const [purposes, setPurposes] = useState<ListingPurposeRecord[]>([]);
  const [categories, setCategories] = useState<PropertyTypeCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const hasTriggeredSeed = useRef(false);

  const [en, setEn] = useState("");
  const [bn, setBn] = useState("");
  const [icon, setIcon] = useState(DEFAULT_PROPERTY_TYPE_ICON);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToListingPurposes((next) => {
      setPurposes(next);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => subscribeToPropertyTypeCategories(setCategories), []);

  useEffect(() => {
    if (isLoading || hasTriggeredSeed.current || !isFallbackList(purposes)) {
      return;
    }
    hasTriggeredSeed.current = true;
    setIsSeeding(true);
    seedDefaultListingPurposes()
      .catch((error) => {
        toast({
          title: "Could not load default purposes",
          description: describeSaveError(error),
          variant: "destructive",
        });
        hasTriggeredSeed.current = false;
      })
      .finally(() => setIsSeeding(false));
  }, [purposes, isLoading]);

  const visiblePurposes = isFallbackList(purposes) ? [] : purposes;

  function resetForm() {
    setEditingId(null);
    setEn("");
    setBn("");
    setIcon(DEFAULT_PROPERTY_TYPE_ICON);
  }

  function startEdit(purpose: ListingPurposeRecord) {
    setEditingId(purpose.id);
    setEn(purpose.en);
    setBn(purpose.bn);
    setIcon(purpose.icon);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!en.trim() || !bn.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateListingPurpose(editingId, { en: en.trim(), bn: bn.trim(), icon });
        toast({ title: "Purpose updated" });
      } else {
        await addListingPurpose({ en: en.trim(), bn: bn.trim(), icon });
        toast({ title: "Purpose added" });
      }
      resetForm();
    } catch (error) {
      toast({
        title: "Could not save purpose",
        description: describeSaveError(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(purpose: ListingPurposeRecord) {
    const inUseCount = categories.filter((category) => category.purpose === purpose.key).length;
    if (inUseCount > 0) {
      toast({
        title: "Still in use",
        description: `${inUseCount} propert${inUseCount === 1 ? "y type category" : "y type categories"} under "${purpose.en}" — move or remove those first.`,
        variant: "destructive",
      });
      return;
    }
    if (!window.confirm(`Remove "${purpose.en}"? Listings already using it keep their saved value.`)) {
      return;
    }
    setDeletingId(purpose.id);
    try {
      await deleteListingPurpose(purpose.id);
      if (editingId === purpose.id) {
        resetForm();
      }
    } catch (error) {
      toast({
        title: "Could not remove purpose",
        description: describeSaveError(error),
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  }

  const showLoadingState = isLoading || isSeeding;

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-blue-950">Listing Purposes</CardTitle>
          <CardDescription>
            The top-level groups shown in the &quot;Browse Property Types&quot; menu and the
            post-ad form&apos;s Purpose field — &quot;For Rent&quot; and &quot;For Sale&quot; are
            just the two that ship by default, both fully editable here, and you can add more.
            Each Property Type Category (managed on the previous page) belongs to one of these.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="purposeEn">Name (English)</Label>
              <Input id="purposeEn" value={en} onChange={(event) => setEn(event.target.value)} placeholder="e.g. For Exchange" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purposeBn">Name (বাংলা)</Label>
              <Input id="purposeBn" value={bn} onChange={(event) => setBn(event.target.value)} placeholder="যেমন: বিনিময়ের জন্য" />
            </div>

            <div className="flex items-end gap-2">
              <Button
                type="submit"
                disabled={!en.trim() || !bn.trim() || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : editingId ? (
                  <Pencil className="mr-2 h-4 w-4" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {editingId ? "Save" : "Add"}
              </Button>
              {editingId && (
                <Button type="button" variant="ghost" onClick={resetForm} aria-label="Cancel edit">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPE_ICON_OPTIONS.map(({ key, Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setIcon(key)}
                    aria-label={key}
                    aria-pressed={icon === key}
                    className={`flex h-10 w-10 items-center justify-center rounded-md border transition ${
                      icon === key
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-input text-slate-500 hover:border-blue-300 hover:text-blue-600"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-blue-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-blue-950">
            {visiblePurposes.length} purpose{visiblePurposes.length === 1 ? "" : "s"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showLoadingState ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-6 py-14 text-blue-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              {isSeeding ? "Setting up the default purposes..." : "Loading purposes..."}
            </div>
          ) : visiblePurposes.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No purposes yet.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {visiblePurposes.map((purpose) => {
                const PurposeIcon = getPropertyTypeIcon(purpose.icon);
                const inUseCount = categories.filter((category) => category.purpose === purpose.key).length;
                return (
                  <li key={purpose.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600">
                        <PurposeIcon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-blue-950">{purpose.en}</p>
                        <p className="truncate text-sm text-gray-500">
                          {purpose.bn} · <span className="text-gray-400">key: {purpose.key}</span> ·{" "}
                          {inUseCount} categor{inUseCount === 1 ? "y" : "ies"}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(purpose)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(purpose)}
                        disabled={deletingId === purpose.id}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        {deletingId === purpose.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
