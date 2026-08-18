"use client";

import { BedDouble, Handshake, MapPin, Ruler, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useLanguage } from "@/contexts/LanguageContext";
import { getListingPurposeLabel, subscribeToListingPurposes, type ListingPurposeRecord } from "@/lib/listing-purposes";
import {
  formatListingPostedAt,
  formatListingPrice,
  getPrimaryListingPhotoUrl,
  type Listing,
} from "@/lib/listings";
import {
  getPropertyTypeLabel,
  subscribeToPropertyTypeCategories,
  type PropertyTypeCategory,
} from "@/lib/property-type-categories";
import { translations } from "@/lib/site-translations";

type ListingCardProps = {
  listing: Listing;
};

export default function ListingCard({ listing }: ListingCardProps) {
  const { language } = useLanguage();
  const t = translations[language].listings;
  const photoUrl = getPrimaryListingPhotoUrl(listing);
  const isBoosted = listing.boost.status === "active";
  const [purposes, setPurposes] = useState<ListingPurposeRecord[]>([]);
  const [propertyTypeCategories, setPropertyTypeCategories] = useState<PropertyTypeCategory[]>([]);

  useEffect(() => subscribeToListingPurposes(setPurposes), []);
  useEffect(() => subscribeToPropertyTypeCategories(setPropertyTypeCategories), []);

  const purposeLabel = getListingPurposeLabel(purposes, listing.purpose, language);
  const propertyTypeLabel = getPropertyTypeLabel(propertyTypeCategories, listing.propertyType, language);

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex w-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_18px_40px_-34px_rgba(15,23,42,0.75)] transition duration-300 hover:-translate-y-1 hover:border-green-300 hover:shadow-[0_28px_50px_-32px_rgba(15,23,42,0.75)]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={listing.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <BedDouble size={32} />
          </div>
        )}

        {isBoosted ? (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">
            <Zap size={10} /> {t.boosted}
          </span>
        ) : null}

        <div className="absolute right-2 top-2 flex max-w-[70%] flex-col items-end gap-1">
          <span className="max-w-full truncate rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700 shadow">
            {purposeLabel}
          </span>
          <span className="max-w-full truncate rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700 shadow">
            {propertyTypeLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3 text-left">
        <p className="flex items-center justify-between text-base font-bold text-green-700">
          <span>
            {formatListingPrice(listing.price)}
            {listing.purpose === "rent" ? (
              <span className="text-xs font-medium text-slate-500"> {t.perMonth}</span>
            ) : null}
          </span>
          {listing.negotiable ? (
            <Handshake size={16} className="shrink-0 text-amber-600" aria-label={t.negotiable} />
          ) : null}
        </p>

        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
          {listing.title}
        </h3>

        <p className="flex items-center gap-1 text-xs text-slate-500">
          <MapPin size={12} className="shrink-0" />
          <span className="line-clamp-1">{listing.location}</span>
        </p>

        <div className="mt-1 flex items-center justify-between gap-3 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            {listing.bedrooms ? (
              <span className="flex items-center gap-1">
                <BedDouble size={12} /> {listing.bedrooms} {t.bed}
              </span>
            ) : null}
            {listing.areaSqft ? (
              <span className="flex items-center gap-1">
                <Ruler size={12} /> {listing.areaSqft} {t.sqft}
              </span>
            ) : null}
          </div>
          <span className="shrink-0">
            {formatListingPostedAt(listing.createdAtMs, language, t.time)}
          </span>
        </div>
      </div>
    </Link>
  );
}
