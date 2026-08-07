"use client";

import { useMemo } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { BD_LOCATIONS } from "@/lib/bd-locations";

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
  areaPlaceholder: { en: "e.g. Sat Masjid Road", bn: "যেমন: সাত মসজিদ রোড" },
  choose: { en: "Choose...", bn: "নির্বাচন করুন..." },
} as const;

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Narrowing location picker: Division -> District -> Upazila/Thana, then a free-text
 * Para/Mohalla field (there's no public dataset at that granularity, so it's typed in).
 * Mirrors the drill-down UX of dlrms.land.gov.bd's khatian lookup.
 */
export default function LocationCascadeSelect({
  value,
  onChange,
  required = false,
}: LocationCascadeSelectProps) {
  const { language } = useLanguage();

  const selectedDivision = useMemo(
    () => BD_LOCATIONS.find((division) => division.en === value.locationDivision),
    [value.locationDivision]
  );

  const selectedDistrict = useMemo(
    () =>
      selectedDivision?.districts.find(
        (district) => district.en === value.locationDistrict
      ),
    [selectedDivision, value.locationDistrict]
  );

  function handleDivisionChange(divisionEn: string) {
    onChange({
      locationDivision: divisionEn,
      locationDistrict: "",
      locationUpazila: "",
      locationArea: value.locationArea,
    });
  }

  function handleDistrictChange(districtEn: string) {
    onChange({
      ...value,
      locationDistrict: districtEn,
      locationUpazila: "",
    });
  }

  function handleUpazilaChange(upazilaEn: string) {
    onChange({ ...value, locationUpazila: upazilaEn });
  }

  function handleAreaChange(area: string) {
    onChange({ ...value, locationArea: area });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="locationDivision">{LABELS.division[language]}</Label>
        <select
          id="locationDivision"
          value={value.locationDivision}
          onChange={(event) => handleDivisionChange(event.target.value)}
          className={selectClassName}
          required={required}
        >
          <option value="">{LABELS.choose[language]}</option>
          {BD_LOCATIONS.map((division) => (
            <option key={division.id} value={division.en}>
              {language === "bn" ? division.bn : division.en}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="locationDistrict">{LABELS.district[language]}</Label>
        <select
          id="locationDistrict"
          value={value.locationDistrict}
          onChange={(event) => handleDistrictChange(event.target.value)}
          className={selectClassName}
          disabled={!selectedDivision}
          required={required}
        >
          <option value="">{LABELS.choose[language]}</option>
          {selectedDivision?.districts.map((district) => (
            <option key={district.id} value={district.en}>
              {language === "bn" ? district.bn : district.en}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="locationUpazila">{LABELS.upazila[language]}</Label>
        <select
          id="locationUpazila"
          value={value.locationUpazila}
          onChange={(event) => handleUpazilaChange(event.target.value)}
          className={selectClassName}
          disabled={!selectedDistrict}
          required={required}
        >
          <option value="">{LABELS.choose[language]}</option>
          {selectedDistrict?.upazilas.map((upazila) => (
            <option key={upazila.id} value={upazila.en}>
              {language === "bn" ? upazila.bn : upazila.en}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="locationArea">{LABELS.area[language]}</Label>
        <Input
          id="locationArea"
          value={value.locationArea}
          onChange={(event) => handleAreaChange(event.target.value)}
          placeholder={LABELS.areaPlaceholder[language]}
        />
      </div>
    </div>
  );
}
