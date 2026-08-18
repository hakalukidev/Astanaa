"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  formatPriceBandLabel,
  matchesPriceBand,
  PRICE_BANDS,
  type Listing,
} from "@/lib/listings";

export type PriceRange = { min: number | null; max: number | null };

type PriceFilterLabels = {
  priceFilterLabel: string;
  priceHeading: string;
  priceMinPlaceholder: string;
  priceMaxPlaceholder: string;
  priceUnderPrefix: string;
  priceAbovePrefix: string;
  priceClear: string;
  priceApply: string;
  adsCountSuffix: string;
};

type PriceFilterDropdownProps = {
  value: PriceRange;
  onChange: (value: PriceRange) => void;
  /** Listings to count against each band (already filtered by anything other
   * than price, so the counts shown reflect the other active filters). */
  listings: Listing[];
  labels: PriceFilterLabels;
};

/** Price-range filter button + dropdown (preset bands, newest-shows-count, and a free min/max
 * input pair) — shared between the /listings catalog and the home page's Latest Listings so both
 * behave identically. */
export default function PriceFilterDropdown({
  value,
  onChange,
  listings,
  labels,
}: PriceFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const bandCounts = useMemo(
    () =>
      PRICE_BANDS.map(
        (band) => listings.filter((listing) => matchesPriceBand(listing.price, band)).length
      ),
    [listings]
  );

  const isActive = value.min !== null || value.max !== null;
  const buttonLabel = isActive
    ? formatPriceBandLabel({ min: value.min, max: value.max }, labels)
    : labels.priceFilterLabel;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`w-full whitespace-nowrap rounded-md border px-3 py-2.5 text-left text-sm outline-none transition sm:w-auto ${
          isActive
            ? "border-green-500 bg-green-50 text-green-700 font-medium"
            : "border-gray-300 text-gray-700 hover:border-green-500"
        }`}
      >
        {buttonLabel}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">{labels.priceHeading}</span>
            <div className="flex items-center gap-3">
              {isActive && (
                <button
                  type="button"
                  onClick={() => onChange({ min: null, max: null })}
                  className="text-xs font-medium text-green-600 hover:underline"
                >
                  {labels.priceClear}
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md bg-green-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-green-700"
              >
                {labels.priceApply}
              </button>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={value.min ?? ""}
              onChange={(event) =>
                onChange({
                  min: event.target.value === "" ? null : Number(event.target.value),
                  max: value.max,
                })
              }
              placeholder={labels.priceMinPlaceholder}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500"
            />
            <span className="shrink-0 text-gray-400">–</span>
            <input
              type="number"
              min={0}
              value={value.max ?? ""}
              onChange={(event) =>
                onChange({
                  min: value.min,
                  max: event.target.value === "" ? null : Number(event.target.value),
                })
              }
              placeholder={labels.priceMaxPlaceholder}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500"
            />
          </div>

          <ul className="space-y-2.5">
            {PRICE_BANDS.map((band, index) => (
              <li key={index}>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="priceBand"
                    checked={band.min === value.min && band.max === value.max}
                    onChange={() => onChange({ min: band.min, max: band.max })}
                    className="h-4 w-4 accent-green-600"
                  />
                  <span>
                    {formatPriceBandLabel(band, labels)}
                    <span className="text-gray-400"> · {bandCounts[index]} {labels.adsCountSuffix}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
