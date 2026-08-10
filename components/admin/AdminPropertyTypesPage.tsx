"use client";

import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import type { ListingPurpose } from "@/lib/listings";
import {
  addPropertyTypeCategory,
  deletePropertyTypeCategory,
  groupCategoriesByPurpose,
  seedDefaultPropertyTypeCategories,
  subscribeToPropertyTypeCategories,
  updatePropertyTypeCategory,
  type PropertyTypeCategory,
} from "@/lib/property-type-categories";
import {
  DEFAULT_PROPERTY_TYPE_ICON,
  getPropertyTypeIcon,
  PROPERTY_TYPE_ICON_OPTIONS,
} from "@/lib/property-type-icons";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

function isFallbackList(categories: PropertyTypeCategory[]) {
  return categories.length > 0 && categories.every((category) => category.id.startsWith("default-"));
}

/** Surfaces *why* a write failed instead of a bare "Could not save category" —
 * a permission-denied error almost always means firestore.rules hasn't been
 * deployed yet (`firebase deploy --only firestore:rules`), which is easy to
 * miss since reads still work fine off the built-in fallback list. */
function describeSaveError(error: unknown): string {
  const code = (error as { code?: string } | null)?.code ?? "";
  if (code === "permission-denied") {
    return "Permission denied by Firestore rules — the propertyTypeCategories write rule may not be deployed yet (firebase deploy --only firestore:rules).";
  }
  if (code === "unavailable") {
    return "Could not reach Firestore. Check your connection and try again.";
  }
  return "Please try again.";
}

export default function AdminPropertyTypesPage() {
  const [categories, setCategories] = useState<PropertyTypeCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const hasTriggeredSeed = useRef(false);

  const [purpose, setPurpose] = useState<ListingPurpose>("rent");
  const [en, setEn] = useState("");
  const [bn, setBn] = useState("");
  const [icon, setIcon] = useState(DEFAULT_PROPERTY_TYPE_ICON);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToPropertyTypeCategories((next) => {
      setCategories(next);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isLoading || hasTriggeredSeed.current || !isFallbackList(categories)) {
      return;
    }
    hasTriggeredSeed.current = true;
    setIsSeeding(true);
    seedDefaultPropertyTypeCategories()
      .catch((error) => {
        toast({
          title: "Could not load default categories",
          description: describeSaveError(error),
          variant: "destructive",
        });
        hasTriggeredSeed.current = false;
      })
      .finally(() => setIsSeeding(false));
  }, [categories, isLoading]);

  const grouped = groupCategoriesByPurpose(isFallbackList(categories) ? [] : categories);

  function resetForm() {
    setEditingId(null);
    setEn("");
    setBn("");
    setIcon(DEFAULT_PROPERTY_TYPE_ICON);
    setPurpose("rent");
  }

  function startEdit(category: PropertyTypeCategory) {
    setEditingId(category.id);
    setPurpose(category.purpose);
    setEn(category.en);
    setBn(category.bn);
    setIcon(category.icon);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!en.trim() || !bn.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updatePropertyTypeCategory(editingId, { purpose, en: en.trim(), bn: bn.trim(), icon });
        toast({ title: "Category updated" });
      } else {
        await addPropertyTypeCategory({ purpose, en: en.trim(), bn: bn.trim(), icon });
        toast({ title: "Category added" });
      }
      resetForm();
    } catch (error) {
      toast({
        title: "Could not save category",
        description: describeSaveError(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(category: PropertyTypeCategory) {
    if (!window.confirm(`Remove "${category.en}"? Listings already using it keep their saved value.`)) {
      return;
    }

    setDeletingId(category.id);
    try {
      await deletePropertyTypeCategory(category.id);
      if (editingId === category.id) {
        resetForm();
      }
    } catch {
      toast({ title: "Could not remove category", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  }

  const showLoadingState = isLoading || isSeeding;

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-blue-950">Property Type Categories</CardTitle>
          <CardDescription>
            The categories shown under For Rent / For Sale in the &quot;Browse Property Types&quot;
            menu, the post-ad form, and the listings filter. &quot;All Listings&quot; itself always
            stays fixed at the top of that menu and isn&apos;t a category — everything below is
            editable here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <select
                id="purpose"
                value={purpose}
                onChange={(event) => setPurpose(event.target.value as ListingPurpose)}
                className={selectClassName}
              >
                <option value="rent">For Rent</option>
                <option value="sale">For Sale</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryEn">Name (English)</Label>
              <Input id="categoryEn" value={en} onChange={(event) => setEn(event.target.value)} placeholder="e.g. Duplex Rent" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryBn">Name (বাংলা)</Label>
              <Input id="categoryBn" value={bn} onChange={(event) => setBn(event.target.value)} placeholder="যেমন: ডুপ্লেক্স ভাড়া" />
            </div>

            <div className="space-y-2 sm:col-span-2 lg:col-span-4">
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
          </form>
        </CardContent>
      </Card>

      {showLoadingState ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-6 py-14 text-blue-700">
          <Loader2 className="h-5 w-5 animate-spin" />
          {isSeeding ? "Setting up the default categories..." : "Loading categories..."}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <CategoryListCard title="For Rent" categories={grouped.rent} onEdit={startEdit} onDelete={handleDelete} deletingId={deletingId} />
          <CategoryListCard title="For Sale" categories={grouped.sale} onEdit={startEdit} onDelete={handleDelete} deletingId={deletingId} />
        </div>
      )}
    </div>
  );
}

function CategoryListCard({
  title,
  categories,
  onEdit,
  onDelete,
  deletingId,
}: {
  title: string;
  categories: PropertyTypeCategory[];
  onEdit: (category: PropertyTypeCategory) => void;
  onDelete: (category: PropertyTypeCategory) => void;
  deletingId: string | null;
}) {
  return (
    <Card className="border-blue-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base text-blue-950">{title}</CardTitle>
        <CardDescription>{categories.length} categor{categories.length === 1 ? "y" : "ies"}</CardDescription>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            No categories yet.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {categories.map((category) => {
              const CategoryIcon = getPropertyTypeIcon(category.icon);
              return (
              <li key={category.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600">
                    <CategoryIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-blue-950">{category.en}</p>
                    <p className="truncate text-sm text-gray-500">{category.bn}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(category)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(category)}
                    disabled={deletingId === category.id}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    {deletingId === category.id ? (
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
  );
}
