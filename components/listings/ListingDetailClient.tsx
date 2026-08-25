"use client";

import {
  BedDouble,
  ExternalLink,
  Handshake,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Ruler,
  ShowerHead,
  Trash2,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import BoostListingDialog from "@/components/listings/BoostListingDialog";
import ListingCard from "@/components/listings/ListingCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { getOrCreateChat } from "@/lib/chat";
import { getLastSearchedLocation } from "@/lib/last-searched-location";
import { getListingPurposeLabel, subscribeToListingPurposes, type ListingPurposeRecord } from "@/lib/listing-purposes";
import { deleteListing } from "@/lib/listing-service";
import {
  getPropertyTypeLabel,
  subscribeToPropertyTypeCategories,
  type PropertyTypeCategory,
} from "@/lib/property-type-categories";
import { revalidateListingsCache } from "@/lib/revalidate-listings-cache";
import {
  formatListingPostedAt,
  formatListingPrice,
  getPrimaryListingPhotoUrl,
  type Listing,
} from "@/lib/listings";
import { buildGoogleMapsEmbedSrc } from "@/lib/map-link";
import { translations } from "@/lib/site-translations";

const MAX_RECOMMENDED_LISTINGS = 10;

type ListingDetailClientProps = {
  listing: Listing;
  otherListings?: Listing[];
};

export default function ListingDetailClient({ listing, otherListings = [] }: ListingDetailClientProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language].listingDetail;
  const tListings = translations[language].listings;

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isChatSubmitting, setIsChatSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [boostDialogOpen, setBoostDialogOpen] = useState(false);
  const [boostStatus, setBoostStatus] = useState(listing.boost.status);
  const [purposes, setPurposes] = useState<ListingPurposeRecord[]>([]);
  const [propertyTypeCategories, setPropertyTypeCategories] = useState<PropertyTypeCategory[]>([]);
  const [lastSearchedLocation, setLastSearchedLocationState] = useState<string | null>(null);

  useEffect(() => subscribeToListingPurposes(setPurposes), []);
  useEffect(() => subscribeToPropertyTypeCategories(setPropertyTypeCategories), []);

  // Read once on mount — localStorage isn't available during SSR, so this
  // can't be computed alongside the other derived values below.
  useEffect(() => {
    setLastSearchedLocationState(getLastSearchedLocation());
  }, []);

  const purposeLabel = getListingPurposeLabel(purposes, listing.purpose, language);
  const propertyTypeLabel = getPropertyTypeLabel(propertyTypeCategories, listing.propertyType, language);

  const otherActiveListings = useMemo(
    () => otherListings.filter((candidate) => candidate.id !== listing.id),
    [otherListings, listing.id]
  );

  // Same sub-category (propertyType) as this listing — e.g. other
  // "Apartment" posts, regardless of location.
  const similarListings = useMemo(
    () =>
      otherActiveListings
        .filter((candidate) => candidate.propertyType === listing.propertyType)
        .slice(0, MAX_RECOMMENDED_LISTINGS),
    [otherActiveListings, listing.propertyType]
  );

  // Other posts from the location the visitor last searched/filtered by
  // (e.g. picked in the TopBar) before landing here — not necessarily this
  // listing's own location.
  const locationRecommendedListings = useMemo(() => {
    if (!lastSearchedLocation) {
      return [];
    }

    const normalizedLocation = lastSearchedLocation.toLowerCase();

    return otherActiveListings
      .filter((candidate) => candidate.location.toLowerCase().includes(normalizedLocation))
      .slice(0, MAX_RECOMMENDED_LISTINGS);
  }, [otherActiveListings, lastSearchedLocation]);

  // Prefer the seller's pinned Google Maps link (exact building) over a
  // guessed embed built from the free-text location — falls back to that
  // guess when no link was pasted, and to nothing if neither is set.
  const mapEmbedSrc = listing.locationMapUrl
    ? buildGoogleMapsEmbedSrc(listing.locationMapUrl)
    : listing.location
      ? `https://www.google.com/maps?q=${encodeURIComponent(listing.location)}&output=embed`
      : null;

  const photos = listing.photoUrls.length > 0 ? listing.photoUrls : [getPrimaryListingPhotoUrl(listing)];
  const isOwner = user?.uid === listing.sellerId;

  function requireLogin() {
    toast({ title: t.loginRequiredTitle, description: t.loginRequiredDesc });
    router.push(`/login?next=/listings/${listing.id}`);
  }

  async function handleChat() {
    if (!user) {
      requireLogin();
      return;
    }

    setIsChatSubmitting(true);

    try {
      const chatId = await getOrCreateChat({
        listingId: listing.id,
        listingTitle: listing.title,
        listingPhotoUrl: getPrimaryListingPhotoUrl(listing),
        buyerId: user.uid,
        buyerName: profile?.name || user.displayName || "Astanaa user",
        sellerId: listing.sellerId,
        sellerName: listing.sellerName,
      });
      router.push(`/chat/${chatId}`);
    } catch {
      toast({
        title: t.genericErrorTitle,
        description: t.chatErrorDesc,
        variant: "destructive",
      });
    } finally {
      setIsChatSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(t.deleteConfirm)) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteListing(listing);
      await revalidateListingsCache().catch(() => {});
      toast({ title: t.listingDeletedTitle });
      router.replace("/my-listings");
    } catch {
      toast({
        title: t.deleteErrorTitle,
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  }

  return (
    <main className="bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        {/*
          A plain 2-column grid from tablet width up (gallery+description+map
          on the left, the info/seller cards on the right) reads top-to-bottom
          in source order once it collapses to 1 column on phones — which used
          to put the price/title/tags card *after* the description. Each
          section below is its own grid item with an explicit phone-width
          `order-*` (gallery, then info card, then description, map, seller)
          and a `md:order-*` + `md:col-start-*` pair (md: = 768px+) that
          reproduces the original two-column arrangement from tablet up.
        */}
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr]">
          {/* Gallery */}
          <div className="order-1 md:order-1 md:col-start-1">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100">
              {photos[activePhotoIndex] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photos[activePhotoIndex]}
                  alt={listing.title}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>

            {photos.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {photos.map((photoUrl, index) => (
                  <button
                    key={photoUrl + index}
                    type="button"
                    onClick={() => setActivePhotoIndex(index)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 ${
                      index === activePhotoIndex ? "border-green-600" : "border-transparent"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Info card — price / title / tags / location / posted-at */}
          <div className="order-2 md:order-4 md:col-start-2 rounded-xl border border-gray-200 bg-white p-5">
            {isOwner && listing.status !== "active" && listing.status !== "sold" ? (
              <div
                className={`mb-3 rounded-md px-3 py-2 text-xs font-semibold ${
                  listing.status === "rejected"
                    ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {listing.status === "rejected"
                  ? t.rejectedNotice
                  : t.pendingNotice}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                {purposeLabel}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                {propertyTypeLabel}
              </span>
              {boostStatus === "active" ? (
                <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                  <Zap size={10} /> {tListings.boosted}
                </span>
              ) : null}
            </div>

            <p className="mt-3 flex items-center justify-between text-2xl font-bold text-green-700">
              <span>
                {formatListingPrice(listing.price)}
                {listing.purpose === "rent" ? (
                  <span className="text-sm font-medium text-slate-500"> {tListings.perMonth}</span>
                ) : null}
              </span>
              {listing.negotiable ? (
                <Handshake size={20} className="shrink-0 text-amber-600" aria-label={t.negotiable} />
              ) : null}
            </p>

            <h1 className="mt-1 text-xl font-bold text-gray-900">{listing.title}</h1>

            <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
              <MapPin size={14} className="shrink-0" /> {listing.location}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              {t.postedAt} {formatListingPostedAt(listing.createdAtMs, language, tListings.time)}
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-4 text-center text-xs text-gray-600">
              <div className="flex flex-col items-center gap-1">
                <BedDouble size={16} className="text-green-600" />
                {listing.bedrooms ?? "-"} {t.beds}
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShowerHead size={16} className="text-green-600" />
                {listing.bathrooms ?? "-"} {t.baths}
              </div>
              <div className="flex flex-col items-center gap-1">
                <Ruler size={16} className="text-green-600" />
                {listing.areaSqft ?? "-"} {tListings.sqft}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="order-3 md:order-2 md:col-start-1 rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-gray-900">{t.description}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600">
              {listing.description}
            </p>
          </div>

          {mapEmbedSrc || listing.locationMapUrl || listing.location ? (
            <div className="order-4 md:order-3 md:col-start-1 rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-gray-900">{t.mapTitle}</h2>
              {mapEmbedSrc ? (
                <div className="mt-3 aspect-video w-full overflow-hidden rounded-lg border border-gray-100">
                  <iframe
                    key={mapEmbedSrc}
                    src={mapEmbedSrc}
                    className="h-full w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={listing.location || listing.title}
                  />
                </div>
              ) : null}
              {listing.locationMapUrl ? (
                <a
                  href={listing.locationMapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:underline"
                >
                  <ExternalLink size={14} className="shrink-0" /> {t.viewOnGoogleMaps}
                </a>
              ) : null}
            </div>
          ) : null}

          {/* Seller card */}
          <div className="order-5 md:order-5 md:col-start-2 rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              {t.seller}
            </h2>
            <p className="mt-1 text-base font-semibold text-gray-900">{listing.sellerName}</p>
            {listing.sellerPhone ? (
              <a
                href={`tel:${listing.sellerPhone}`}
                className="mt-1 flex items-center gap-1.5 text-sm text-green-700 hover:underline"
              >
                <Phone size={14} /> {listing.sellerPhone}
              </a>
            ) : null}
            {listing.sellerWhatsapp ? (
              <a
                href={`https://wa.me/${listing.sellerWhatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1.5 text-sm text-green-700 hover:underline"
              >
                <WhatsAppIcon size={14} /> {listing.sellerWhatsapp}
              </a>
            ) : null}
            {listing.sellerEmail ? (
              <a
                href={`mailto:${listing.sellerEmail}`}
                className="mt-1 flex items-center gap-1.5 text-sm text-green-700 hover:underline"
              >
                <Mail size={14} /> {listing.sellerEmail}
              </a>
            ) : null}

            {!isOwner ? (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={handleChat}
                  disabled={isChatSubmitting}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isChatSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <MessageCircle className="mr-2 h-4 w-4" />
                  )}
                  {t.chat}
                </Button>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-500">{t.yourListingNotice}</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {boostStatus === "none" || boostStatus === "expired" ? (
                    <Button
                      onClick={() => setBoostDialogOpen(true)}
                      className="flex-1 bg-amber-500 hover:bg-amber-600"
                    >
                      <Zap className="mr-2 h-4 w-4" /> {t.boostButton}
                    </Button>
                  ) : (
                    <p className="flex-1 rounded-md bg-amber-50 px-3 py-2 text-center text-xs font-medium text-amber-700">
                      {boostStatus === "pending" ? t.boostPending : t.boostActive}
                    </p>
                  )}
                  <Button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {locationRecommendedListings.length > 0 ? (
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-gray-900">
              {t.recommendedIn} {lastSearchedLocation}
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {locationRecommendedListings.map((recommended) => (
                <ListingCard key={recommended.id} listing={recommended} />
              ))}
            </div>
          </section>
        ) : null}

        {similarListings.length > 0 ? (
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-gray-900">{t.similarListings}</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {similarListings.map((similar) => (
                <ListingCard key={similar.id} listing={similar} />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <BoostListingDialog
        listingId={listing.id}
        open={boostDialogOpen}
        onOpenChange={setBoostDialogOpen}
        onBoosted={() => setBoostStatus("pending")}
      />
    </main>
  );
}
