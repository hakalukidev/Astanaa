"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { buildLocationTree, type BdArea, type BdDistrictWithAreas, type BdUpazilaWithAreas } from "@/lib/bd-locations";
import { subscribeToCustomLocations, type CustomLocationEntry } from "@/lib/custom-locations";

export type LocationCascadeValue = {
  locationDivision: string;
  locationDistrict: string;
  locationUpazila: string;
  locationArea: string;
};

type LocationCascadeSelectProps = {
  value: LocationCascadeValue;
  onChange: (value: LocationCascadeValue) => void;
  required?: boolean;
};

const LABELS = {
  division: { en: "Division", bn: "বিভাগ" },
  district: { en: "District", bn: "জেলা" },
  upazila: { en: "Upazila / Thana", bn: "উপজেলা/থানা" },
  area: { en: "Para / Mohalla", bn: "পাড়া/মহল্লা" },
  searchPlaceholder: { en: "Search...", bn: "অনুসন্ধান..." },
  chooseDistrict: { en: "Choose a division first", bn: "প্রথমে বিভাগ নির্বাচন করুন" },
  chooseUpazila: { en: "Choose a district first", bn: "প্রথমে জেলা নির্বাচন করুন" },
  chooseArea: { en: "Choose an upazila first", bn: "প্রথমে উপজেলা নির্বাচন করুন" },
  noMatches: { en: "No matches", bn: "কিছু পাওয়া যায়নি" },
  areaHint: {
    en: 'Don\'t see your area? Type it and press "Add" below.',
    bn: 'আপনার এলাকা নেই? নিচে টাইপ করে "যোগ করুন" চাপুন।',
  },
} as const;

type ColumnItem = { id: string; en: string; bn: string };

function LocationColumn({
  title,
  items,
  selectedEn,
  onSelect,
  disabled,
  disabledHint,
  language,
}: {
  title: string;
  items: ColumnItem[];
  selectedEn: string;
  onSelect: (en: string) => void;
  disabled: boolean;
  disabledHint: string;
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
    <div className="flex min-w-0 flex-col border border-gray-200 first:rounded-l-md last:rounded-r-md">
      <div className="border-b border-gray-200 bg-green-50 px-3 py-2 text-sm font-semibold text-gray-800">
        {title}
      </div>

      {!disabled && (
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
        {disabled ? (
          <p className="px-3 py-4 text-xs text-gray-400">{disabledHint}</p>
        ) : filteredItems.length === 0 ? (
          <p className="px-3 py-4 text-xs text-gray-400">{LABELS.noMatches[language]}</p>
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
                      isSelected
                        ? "bg-green-600 font-medium text-white"
                        : "text-gray-700 hover:bg-green-50"
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
 * Narrowing location picker rendered as a 4-column table (Division | District |
 * Upazila/Thana | Para/Mohalla), mirroring the drill-down UX of dlrms.land.gov.bd's
 * khatian lookup. Division/district/upazila come from the built-in BD_LOCATIONS
 * dataset; any level can also be extended by an admin (lib/custom-locations.ts),
 * merged in live via buildLocationTree().
 */
export default function LocationCascadeSelect({
  value,
  onChange,
  required = false,
}: LocationCascadeSelectProps) {
  const { language } = useLanguage();
  const [customEntries, setCustomEntries] = useState<CustomLocationEntry[]>([]);

  useEffect(() => subscribeToCustomLocations(setCustomEntries), []);

  const tree = useMemo(() => buildLocationTree(customEntries), [customEntries]);

  const selectedDivision = useMemo(
    () => tree.find((division) => division.en === value.locationDivision),
    [tree, value.locationDivision]
  );

  const selectedDistrict: BdDistrictWithAreas | undefined = useMemo(
    () => selectedDivision?.districts.find((district) => district.en === value.locationDistrict),
    [selectedDivision, value.locationDistrict]
  );

  const selectedUpazila: BdUpazilaWithAreas | undefined = useMemo(
    () => selectedDistrict?.upazilas.find((upazila) => upazila.en === value.locationUpazila),
    [selectedDistrict, value.locationUpazila]
  );

  const areaItems: BdArea[] = selectedUpazila?.areas ?? [];

  function handleDivisionSelect(divisionEn: string) {
    onChange({
      locationDivision: divisionEn,
      locationDistrict: "",
      locationUpazila: "",
      locationArea: "",
    });
  }

  function handleDistrictSelect(districtEn: string) {
    onChange({ ...value, locationDistrict: districtEn, locationUpazila: "", locationArea: "" });
  }

  function handleUpazilaSelect(upazilaEn: string) {
    onChange({ ...value, locationUpazila: upazilaEn, locationArea: "" });
  }

  function handleAreaSelect(areaEn: string) {
    onChange({ ...value, locationArea: areaEn });
  }

  return (
    <div className="space-y-2">
      <Label>{`${LABELS.division[language]} / ${LABELS.district[language]} / ${LABELS.upazila[language]} / ${LABELS.area[language]}`}</Label>

      <div className="grid grid-cols-1 overflow-hidden rounded-md sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-gray-200">
        <LocationColumn
          title={LABELS.division[language]}
          items={tree}
          selectedEn={value.locationDivision}
          onSelect={handleDivisionSelect}
          disabled={false}
          disabledHint=""
          language={language}
        />
        <LocationColumn
          title={LABELS.district[language]}
          items={selectedDivision?.districts ?? []}
          selectedEn={value.locationDistrict}
          onSelect={handleDistrictSelect}
          disabled={!selectedDivision}
          disabledHint={LABELS.chooseDistrict[language]}
          language={language}
        />
        <LocationColumn
          title={LABELS.upazila[language]}
          items={selectedDistrict?.upazilas ?? []}
          selectedEn={value.locationUpazila}
          onSelect={handleUpazilaSelect}
          disabled={!selectedDistrict}
          disabledHint={LABELS.chooseUpazila[language]}
          language={language}
        />
        <LocationColumn
          title={LABELS.area[language]}
          items={areaItems}
          selectedEn={value.locationArea}
          onSelect={handleAreaSelect}
          disabled={!selectedUpazila}
          disabledHint={LABELS.chooseArea[language]}
          language={language}
        />
      </div>

      {selectedUpazila && (
        <AreaFreeTextFallback
          language={language}
          value={value.locationArea}
          onChange={handleAreaSelect}
          required={required && areaItems.length === 0}
        />
      )}
    </div>
  );
}

/**
 * The Area column only lists what's already been added (by an admin, or by a
 * previous seller for this same upazila). Since that list starts out empty
 * for most upazilas, this free-text fallback lets the current user type
 * their own — it's saved as the listing's area either way.
 */
function AreaFreeTextFallback({
  language,
  value,
  onChange,
  required,
}: {
  language: "en" | "bn";
  value: string;
  onChange: (value: string) => void;
  required: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-500">{LABELS.areaHint[language]}</p>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={LABELS.area[language]}
        required={required}
        className="flex h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm"
      />
    </div>
  );
}
