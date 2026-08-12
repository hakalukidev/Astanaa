"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  childrenOf,
  searchLocationNodes,
  subscribeToLocationNodes,
  type LocationNode,
} from "@/lib/location-nodes";

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
  /** Adds a whole-tree text search above the drill-down columns — typing
   * e.g. "aftabnagar" jumps straight to it (with its ancestor breadcrumb)
   * exactly like the top bar's own location search, instead of clicking
   * through Division -> District -> ... Off by default since the top bar
   * mounts this component for its own drill-down and already has that
   * search box above the dropdown. */
  enableFlatSearch?: boolean;
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
  flatSearchPlaceholder: {
    en: "Search a location, e.g. Aftabnagar",
    bn: "লোকেশন খুঁজুন, যেমন আফতাবনগর",
  },
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
    <div className="flex w-72 max-w-full flex-col border border-gray-200">
      <div className="border-b border-gray-200 bg-green-50 px-3 py-2 text-sm font-semibold text-gray-800">
        {title}
      </div>

      {items.length > 6 && (
        <div className="relative border-b border-gray-200 bg-white px-2 py-1.5">
          <Search size={15} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={LABELS.searchPlaceholder[language]}
            className="w-full rounded-md border border-gray-200 bg-white py-1.5 pl-9 pr-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-brand-mint"
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

/** Flat, whole-tree text-search hits (see lib/location-nodes.ts
 * searchLocationNodes) — each row shows the matched name plus its ancestor
 * chain, so a match found deep in the tree (e.g. a Thana) is still
 * identifiable without having drilled down to it. Mirrors the top bar's own
 * LocationSearchResults. */
function FlatSearchResults({
  results,
  onSelect,
  language,
}: {
  results: { node: LocationNode; path: LocationNode[] }[];
  onSelect: (path: LocationNode[]) => void;
  language: "en" | "bn";
}) {
  if (results.length === 0) {
    return (
      <div className="w-72 max-w-full border border-gray-200 px-3 py-4 text-center text-xs text-gray-400">
        {LABELS.noMatches[language]}
      </div>
    );
  }

  return (
    <ul className="max-h-72 w-72 max-w-full overflow-y-auto border border-gray-200">
      {results.map(({ node, path }) => {
        const ancestry = path.slice(0, -1);
        return (
          <li key={node.id}>
            <button
              type="button"
              onClick={() => onSelect(path)}
              className="block w-full px-3 py-2 text-left text-sm transition hover:bg-green-50"
            >
              <div className="truncate font-medium text-gray-800">
                {language === "bn" ? node.bn : node.en}
              </div>
              {ancestry.length > 0 && (
                <div className="truncate text-xs text-gray-400">
                  {ancestry.map((ancestor) => (language === "bn" ? ancestor.bn : ancestor.en)).join(" / ")}
                </div>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Narrowing location picker that drills down one level at a time (Division ->
 * District -> Upazila/Thana -> Para/Mohalla -> ...), mirroring the drill-down UX
 * of dlrms.land.gov.bd's khatian lookup. Only the level currently being picked
 * is shown, sized to its own content, instead of stacking every level's column
 * side by side. Backed entirely by the admin-managed location tree
 * (lib/location-nodes.ts) — an admin can nest as many extra levels as they want
 * under Area (Road, Goli, ...), and a matching extra step shows up here
 * automatically.
 */
export default function LocationCascadeSelect({
  value,
  onChange,
  enableFlatSearch = false,
}: LocationCascadeSelectProps) {
  const { language } = useLanguage();
  const [nodes, setNodes] = useState<LocationNode[]>([]);
  // Depth the user is actively revisiting (via a breadcrumb click). Null means
  // "show the next level right after the deepest current selection".
  const [reselectDepth, setReselectDepth] = useState<number | null>(null);
  const [flatQuery, setFlatQuery] = useState("");

  useEffect(() => subscribeToLocationNodes(setNodes), []);

  const selectedPath = useMemo(() => resolvePath(nodes, valueToNames(value)), [nodes, value]);
  const names = valueToNames(value);

  const depth = Math.min(reselectDepth ?? selectedPath.length, selectedPath.length);
  const parentId = depth === 0 ? null : selectedPath[depth - 1]?.id ?? null;
  const items = childrenOf(nodes, parentId);

  const trimmedFlatQuery = flatQuery.trim();
  const flatResults = trimmedFlatQuery ? searchLocationNodes(nodes, trimmedFlatQuery) : [];

  function handleSelectAt(atDepth: number, en: string) {
    const newNames = selectedPath.slice(0, atDepth).map((node) => node.en);
    newNames.push(en);
    onChange(namesToValue(newNames));
    setReselectDepth(null); // reveal the next level once this one is picked
  }

  function handleFlatResultSelect(path: LocationNode[]) {
    onChange(namesToValue(path.map((node) => node.en)));
    setReselectDepth(null);
    setFlatQuery("");
  }

  return (
    <div className="space-y-2">
      <Label>{`${LABELS.division[language]} / ${LABELS.district[language]} / ${LABELS.upazila[language]} / ${LABELS.area[language]}`}</Label>

      {enableFlatSearch && (
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={flatQuery}
            onChange={(event) => setFlatQuery(event.target.value)}
            placeholder={LABELS.flatSearchPlaceholder[language]}
            className="w-full rounded-md border border-gray-200 bg-white py-1.5 pl-9 pr-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-brand-mint"
          />
        </div>
      )}

      {trimmedFlatQuery ? (
        <FlatSearchResults results={flatResults} onSelect={handleFlatResultSelect} language={language} />
      ) : (
        <>
          {selectedPath.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 text-sm">
              {selectedPath.map((node, i) => (
                <span key={node.id} className="flex items-center gap-1">
                  {i > 0 && <span className="text-gray-300">/</span>}
                  <button
                    type="button"
                    onClick={() => setReselectDepth(i)}
                    className={`rounded px-2 py-0.5 transition ${
                      depth === i ? "bg-green-600 text-white" : "bg-green-50 text-green-800 hover:bg-green-100"
                    }`}
                  >
                    {language === "bn" ? node.bn : node.en}
                  </button>
                </span>
              ))}
            </div>
          )}

          <LocationColumn
            key={depth}
            title={columnLabel(depth)[language]}
            items={items}
            selectedEn={names[depth] ?? ""}
            onSelect={(en) => handleSelectAt(depth, en)}
            language={language}
          />
        </>
      )}
    </div>
  );
}
