"use client";

import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  addLocationNode,
  childrenOf,
  deleteLocationNode,
  isFallbackNode,
  seedBuiltInLocations,
  subscribeToLocationNodes,
  updateLocationNode,
  type LocationNode,
} from "@/lib/location-nodes";

const COLUMN_TITLES = ["Division", "District", "Upazila / Thana", "Area / Para-Mohalla"];

function columnTitle(depth: number) {
  return COLUMN_TITLES[depth] ?? `Level ${depth + 1}`;
}

function AddRow({ onAdd }: { onAdd: (en: string, bn: string) => Promise<void> }) {
  const [en, setEn] = useState("");
  const [bn, setBn] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAdd() {
    if (!en.trim() || !bn.trim()) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onAdd(en.trim(), bn.trim());
      setEn("");
      setBn("");
    } catch {
      toast({ title: "Could not add", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-1 border-b border-gray-200 bg-gray-50 p-2">
      <Input
        value={en}
        onChange={(event) => setEn(event.target.value)}
        placeholder="English name"
        className="h-8 text-xs"
      />
      <Input
        value={bn}
        onChange={(event) => setBn(event.target.value)}
        placeholder="বাংলা নাম"
        className="h-8 text-xs"
      />
      <Button
        type="button"
        size="sm"
        onClick={handleAdd}
        disabled={!en.trim() || !bn.trim() || isSubmitting}
        className="h-7 w-full bg-blue-600 text-xs hover:bg-blue-700"
      >
        {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        Add
      </Button>
    </div>
  );
}

function LocationItemRow({
  node,
  serial,
  hasChildren,
  isSelected,
  onSelect,
  onDelete,
}: {
  node: LocationNode;
  serial: number;
  hasChildren: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [en, setEn] = useState(node.en);
  const [bn, setBn] = useState(node.bn);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isPlaceholder = isFallbackNode(node);

  async function handleSave() {
    if (!en.trim() || !bn.trim()) {
      return;
    }
    setIsSaving(true);
    try {
      await updateLocationNode(node.id, { en: en.trim(), bn: bn.trim() });
      setIsEditing(false);
    } catch {
      toast({ title: "Could not save", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteClick() {
    if (hasChildren) {
      toast({ title: "Remove everything nested under it first", variant: "destructive" });
      return;
    }
    if (!window.confirm(`Remove "${node.en}"? Listings already using it keep their saved value.`)) {
      return;
    }
    setIsDeleting(true);
    try {
      await onDelete();
    } catch {
      toast({ title: "Could not remove", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  }

  if (isEditing) {
    return (
      <li className="space-y-1 border-b border-gray-100 p-2">
        <Input value={en} onChange={(event) => setEn(event.target.value)} className="h-7 text-xs" />
        <Input value={bn} onChange={(event) => setBn(event.target.value)} className="h-7 text-xs" />
        <div className="flex gap-1">
          <Button type="button" size="sm" onClick={handleSave} disabled={isSaving} className="h-6 flex-1 bg-blue-600 text-xs hover:bg-blue-700">
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-6 px-2">
            <X className="h-3 w-3" />
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li
      className={`group flex items-center justify-between gap-1 border-b border-gray-50 px-2 py-1.5 text-sm ${
        isSelected ? "bg-green-600 text-white" : "text-gray-700 hover:bg-green-50"
      }`}
    >
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 truncate text-left">
        <span className={`mr-1 tabular-nums ${isSelected ? "text-white/70" : "text-gray-400"}`}>{serial}.</span>
        {node.en} <span className={isSelected ? "text-white/80" : "text-gray-400"}>({node.bn})</span>
      </button>
      {isPlaceholder ? (
        <span className="shrink-0 text-[10px] italic text-gray-400" title="Still being imported — try again in a moment">
          setting up...
        </span>
      ) : (
        <span className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className={`rounded p-1 ${isSelected ? "hover:bg-white/20" : "hover:bg-gray-200"}`}
            aria-label="Edit"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className={`rounded p-1 ${isSelected ? "hover:bg-white/20" : "hover:bg-red-100 hover:text-red-600"}`}
            aria-label="Delete"
          >
            {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
          </button>
        </span>
      )}
    </li>
  );
}

function LocationColumn({
  depth,
  items,
  nodes,
  selectedId,
  onSelect,
  onAdd,
}: {
  depth: number;
  items: LocationNode[];
  nodes: LocationNode[];
  selectedId: string | null;
  onSelect: (node: LocationNode) => void;
  onAdd: (en: string, bn: string) => Promise<void>;
}) {
  return (
    <div className="flex w-60 shrink-0 flex-col border border-gray-200">
      <div className="border-b border-gray-200 bg-green-50 px-3 py-2 text-sm font-semibold text-gray-800">
        {columnTitle(depth)}
      </div>
      <AddRow onAdd={onAdd} />
      <div className="max-h-80 overflow-y-auto">
        {items.length === 0 ? (
          <p className="px-3 py-4 text-xs text-gray-400">Nothing added here yet.</p>
        ) : (
          <ul>
            {items.map((node, index) => (
              <LocationItemRow
                key={node.id}
                node={node}
                serial={index + 1}
                hasChildren={childrenOf(nodes, node.id).length > 0}
                isSelected={node.id === selectedId}
                onSelect={() => onSelect(node)}
                onDelete={() => deleteLocationNode(node.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function AdminLocationsPage() {
  const [nodes, setNodes] = useState<LocationNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [selectedPath, setSelectedPath] = useState<LocationNode[]>([]);
  const hasTriggeredSeed = useRef(false);

  useEffect(() => {
    const unsubscribe = subscribeToLocationNodes((next) => {
      setNodes(next);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  // subscribeToLocationNodes always returns *something* — either real
  // Firestore docs or (if the collection is genuinely still empty) the
  // built-in Division/District/Upazila list as read-only placeholders — so
  // "not seeded yet" means every node currently loaded is a placeholder,
  // not that the list is empty.
  const notYetSeeded = nodes.length > 0 && nodes.every(isFallbackNode);

  useEffect(() => {
    if (isLoading || hasTriggeredSeed.current || !notYetSeeded) {
      return;
    }
    hasTriggeredSeed.current = true;
    setIsSeeding(true);
    seedBuiltInLocations()
      .catch(() => {
        toast({ title: "Could not load built-in locations", variant: "destructive" });
        hasTriggeredSeed.current = false;
      })
      .finally(() => setIsSeeding(false));
  }, [isLoading, notYetSeeded]);

  // Selections can go stale once nodes are deleted/renamed elsewhere — drop
  // anything in the path that no longer exists.
  useEffect(() => {
    setSelectedPath((current) => {
      const stillValid: LocationNode[] = [];
      let parentId: string | null = null;
      for (const step of current) {
        const match = nodes.find((node) => node.id === step.id && node.parentId === parentId);
        if (!match) break;
        stillValid.push(match);
        parentId = match.id;
      }
      return stillValid.length === current.length ? current : stillValid;
    });
  }, [nodes]);

  const columnCount = selectedPath.length + 1;

  async function handleAddAt(depth: number, en: string, bn: string) {
    const parent = depth === 0 ? null : selectedPath[depth - 1];
    if (parent && isFallbackNode(parent)) {
      toast({
        title: "Still setting up",
        description: "This division/district hasn't finished importing yet — try again shortly.",
        variant: "destructive",
      });
      return;
    }
    await addLocationNode({ parentId: parent?.id ?? null, en, bn });
  }

  function handleSelectAt(depth: number, node: LocationNode) {
    setSelectedPath((current) => [...current.slice(0, depth), node]);
  }

  const showLoadingState = isLoading || isSeeding;

  const columns = useMemo(
    () =>
      Array.from({ length: columnCount }).map((_, depth) => {
        const parentId = depth === 0 ? null : selectedPath[depth - 1]?.id ?? null;
        return { depth, parentId, items: childrenOf(nodes, parentId) };
      }),
    [columnCount, selectedPath, nodes]
  );

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-blue-950">Locations</CardTitle>
          <CardDescription>
            Every division, district, and upazila (all of Bangladesh) is loaded here and fully
            editable — click one to drill into it, use the pencil/trash icons to rename or remove,
            or add new entries at any level (including deeper ones of your own, like Road or Goli,
            under an Area).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showLoadingState ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-6 py-14 text-blue-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              {isSeeding
                ? "Setting up all divisions, districts, and upazilas — this can take a moment..."
                : "Loading locations..."}
            </div>
          ) : (
            <>
              {notYetSeeded && (
                <p className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Couldn&apos;t set up the built-in locations — showing them read-only below.
                  Double-check <code>firestore.rules</code> is deployed, then reload this page to try again.
                </p>
              )}
              <div className="flex gap-0 overflow-x-auto rounded-md border border-gray-200 divide-x divide-gray-200">
                {columns.map(({ depth, items }) => (
                  <LocationColumn
                    key={depth}
                    depth={depth}
                    items={items}
                    nodes={nodes}
                    selectedId={selectedPath[depth]?.id ?? null}
                    onSelect={(node) => handleSelectAt(depth, node)}
                    onAdd={(en, bn) => handleAddAt(depth, en, bn)}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
