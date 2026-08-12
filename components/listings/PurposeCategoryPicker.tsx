"use client";

import { ChevronDown, ChevronRight, LayoutGrid } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { ListingPurposeRecord } from "@/lib/listing-purposes";
import { getPropertyTypeIcon } from "@/lib/property-type-icons";
import type { PropertyTypeCategory } from "@/lib/property-type-categories";

/**
 * Combined "Purpose + Property Type" picker for the post-ad form — a single
 * button that opens the same icon'd, expand-to-reveal-categories menu as the
 * TopBar's "All Listings" browse dropdown, instead of two separate plain
 * <select>s. Selecting a category sets both `purpose` and `propertyType` in
 * one click so the two can never end up mismatched.
 */
export default function PurposeCategoryPicker({
  purposes,
  categoriesByPurpose,
  purpose,
  propertyType,
  language,
  onChange,
  placeholder,
}: {
  purposes: ListingPurposeRecord[];
  categoriesByPurpose: Record<string, PropertyTypeCategory[]>;
  purpose: string;
  propertyType: string;
  language: "en" | "bn";
  onChange: (purpose: string, propertyType: string) => void;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(purpose || null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedPurpose = purposes.find((item) => item.key === purpose);
  const selectedCategory = (categoriesByPurpose[purpose] ?? []).find(
    (category) => category.en === propertyType
  );

  const TriggerIcon = selectedCategory
    ? getPropertyTypeIcon(selectedCategory.icon)
    : selectedPurpose
      ? getPropertyTypeIcon(selectedPurpose.icon)
      : LayoutGrid;

  const triggerLabel = selectedPurpose && selectedCategory
    ? `${language === "bn" ? selectedPurpose.bn : selectedPurpose.en} · ${
        language === "bn" ? selectedCategory.bn : selectedCategory.en
      }`
    : placeholder;

  function openMenu() {
    setExpandedGroup(purpose || null);
    setIsOpen(true);
  }

  function toggleGroup(purposeKey: string) {
    setExpandedGroup((current) => (current === purposeKey ? null : purposeKey));
  }

  function handleSelect(category: PropertyTypeCategory, purposeKey: string) {
    onChange(purposeKey, category.en);
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm"
      >
        <span className="flex min-w-0 items-center gap-2">
          <TriggerIcon size={15} className="shrink-0 text-gray-500" />
          <span className={`truncate ${selectedCategory ? "text-gray-900" : "text-gray-400"}`}>
            {triggerLabel}
          </span>
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[280px] rounded-md border border-gray-200 bg-white py-2 shadow-lg">
          {purposes.map((purposeRecord) => {
            const GroupIcon = getPropertyTypeIcon(purposeRecord.icon);
            const isExpanded = expandedGroup === purposeRecord.key;
            const categories = categoriesByPurpose[purposeRecord.key] ?? [];

            return (
              <div key={purposeRecord.id}>
                <button
                  type="button"
                  onClick={() => toggleGroup(purposeRecord.key)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-brand-mint/15"
                >
                  <span className="flex items-center gap-2">
                    <GroupIcon size={15} className="shrink-0" />
                    {language === "bn" ? purposeRecord.bn : purposeRecord.en}
                  </span>
                  <ChevronRight
                    size={14}
                    className={`shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  />
                </button>

                {isExpanded ? (
                  <ul className="bg-gray-50 py-1">
                    {categories.map((category) => {
                      const TypeIcon = getPropertyTypeIcon(category.icon);
                      const isSelected = purpose === purposeRecord.key && propertyType === category.en;

                      return (
                        <li key={category.id}>
                          <button
                            type="button"
                            onClick={() => handleSelect(category, purposeRecord.key)}
                            className={`flex w-full items-center gap-2 px-7 py-1.5 text-left text-sm transition hover:bg-brand-mint/15 hover:text-brand-navy ${
                              isSelected ? "bg-brand-mint/20 font-medium text-brand-navy" : "text-gray-600"
                            }`}
                          >
                            <TypeIcon size={14} className="shrink-0" />
                            {language === "bn" ? category.bn : category.en}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
