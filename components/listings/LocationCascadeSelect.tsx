"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { childrenOf, subscribeToLocationNodes, type LocationNode } from "@/lib/location-nodes";

export type LocationCascadeValue = {
  locationDivision: string;
  locationDistrict: string;
  locationUpazila: string;
  locationArea: string;
  /** Anything an admin nested deeper than Area (e.g. Road, Goli), in order. */
  locationExtra: string[];
};

type LocationCascadeSelectProps = {
  value: LocationCascadeValue;
  onChange: (value: LocationCascadeValue) => void;
};

const LABELS = {
  division: { en: "Division", bn: "বিভাগ" },
  district: { en: "District", bn: "জেলা" },
  upazila: { en: "Upazila / Thana", bn: "উপজেলা/থানা" },
  area: { en: "Para / Mohalla", bn: "পাড়া/মহল্লা" },
  more: { en: "More detail", bn: "আরও বিস্তারিত" },
  searchPlaceholder: { en: "Search...", bn: "অনুসন্ধান..." },
  noMatches: { en: "No matches", bn: "কিছু পাওয়া যায়নি" },
  noneYet: { en: "Nothing added here yet", bn: "এখনো কিছু যোগ করা হয়নি" },
} as const;

const COLUMN_LABELS = [LABELS.division, LABELS.district, LABELS.upazila, LABELS.area];

function columnLabel(depth: number) {
  return COLUMN_LABELS[depth] ?? LABELS.more;
}

function valueToNames(value: LocationCascadeValue): string[] {
  return [value.locationDivision, value.locationDistrict, value.locationUpazila, value.locationArea, ...value.locationExtra];
}

function namesToValue(names: string[]): LocationCascadeValue {
  return {
    locationDivision: names[0] ?? "",
    locationDistrict: names[1] ?? "",
    locationUpazila: names[2] ?? "",
    locationArea: names[3] ?? "",
    locationExtra: names.slice(4),
  };
}

/** Walks parent -> child by EN name, stopping at the first name that doesn't match a node. */
function resolvePath(nodes: LocationNode[], names: string[]): LocationNode[] {
  const path: LocationNode[] = [];
  let parentId: string | null = null;

  for (const name of names) {
    if (!name) break;
    const match: LocationNode | undefined = childrenOf(nodes, parentId).find(
      (node) => node.en === name
    );
    if (!match) break;
    path.push(match);
    parentId = match.id;
  }

  return path;
}

function LocationColumn({
  title,
  items,
  selectedEn,
  onSelect,
  language,
}: {
  title: string;
  items: LocationNode[];
  selectedEn: string;
  onSelect: (en: string) => void;
  language: "en" | "bn";
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) {
      return items;
    }
    return items.filter(
      (item) => item.en.toLowerCase().includes(normalized) || item.bn.includes(searchTerm.trim())
    );
  }, [items, searchTerm]);

  return (
    <div className="flex w-56 shrink-0 flex-col border border-gray-200">
      <div className="border-b border-gray-200 bg-green-50 px-3 py-2 text-sm font-semibold text-gray-800">
        {title}
      </div>

      {items.length > 6 && (
        <div className="relative border-b border-gray-200 px-2 py-1.5">
          <Search size={13} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={LABELS.searchPlaceholder[language]}
            className="w-full rounded border border-gray-200 py-1 pl-6 pr-2 text-xs outline-none focus:border-green-500"
          />
        </div>
      )}

      <div className="max-h-64 min-h-[8rem] overflow-y-auto">
        {filteredItems.length === 0 ? (
          <p className="px-3 py-4 text-xs text-gray-400">
            {items.length === 0 ? LABELS.noneYet[language] : LABELS.noMatches[language]}
          </p>
        ) : (
          <ul>
            {filteredItems.map((item) => {
              const isSelected = item.en === selectedEn;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.en)}
                    className={`block w-full truncate px-3 py-1.5 text-left text-sm transition ${
                      isSelected ? "bg-green-600 font-medium text-white" : "text-gray-700 hover:bg-green-50"
                    }`}
                  >
                    {language === "bn" ? item.bn : item.en}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * Narrowing location picker rendered as cascading columns (Division | District |
 * Upazila/Thana | Para/Mohalla | ...), mirroring the drill-down UX of
 * dlrms.land.gov.bd's khatian lookup. Backed entirely by the admin-managed
 * location tree (lib/location-nodes.ts) — an admin can nest as many extra
 * levels as they want under Area (Road, Goli, ...), and a matching extra
 * column shows up here automatically.
 */
export default function LocationCascadeSelect({ value, onChange }: LocationCascadeSelectProps) {
  const { language } = useLanguage();
  const [nodes, setNodes] = useState<LocationNode[]>([]);

  useEffect(() => subscribeToLocationNodes(setNodes), []);

  const selectedPath = useMemo(() => resolvePath(nodes, valueToNames(value)), [nodes, value]);

  function handleSelectAt(depth: number, en: string) {
    const names = selectedPath.slice(0, depth).map((node) => node.en);
    names.push(en);
    onChange(namesToValue(names));
  }

  // One column per selected depth, plus one more to reveal that selection's children.
  const columnCount = selectedPath.length + 1;

  return (
    <div className="space-y-2">
      <Label>{`${LABELS.division[language]} / ${LABELS.district[language]} / ${LABELS.upazila[language]} / ${LABELS.area[language]}`}</Label>

      <div className="flex gap-0 overflow-x-auto rounded-md border border-gray-200 divide-x divide-gray-200">
        {Array.from({ length: columnCount }).map((_, depth) => {
          const parentId = depth === 0 ? null : selectedPath[depth - 1]?.id ?? null;
          const items = childrenOf(nodes, parentId);
          const selectedEn = valueToNames(value)[depth] ?? "";

          return (
            <LocationColumn
              key={depth}
              title={columnLabel(depth)[language]}
              items={items}
              selectedEn={selectedEn}
              onSelect={(en) => handleSelectAt(depth, en)}
              language={language}
            />
          );
        })}
      </div>
    </div>
  );
}
