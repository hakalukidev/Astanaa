"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import LocationCascadeSelect, {
  type LocationCascadeValue,
} from "@/components/listings/LocationCascadeSelect";
import PurposeCategoryPicker from "@/components/listings/PurposeCategoryPicker";
import TenantTypeSelect from "@/components/listings/TenantTypeSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { getListingPurposesCached, type ListingPurposeRecord } from "@/lib/listing-purposes";
import { createListing, updateListing } from "@/lib/listing-service";
import { formatListingLocation, type Listing, type ListingPurpose } from "@/lib/listings";
import {
  getPropertyTypeCategoriesCached,
  groupCategoriesByPurpose,
  type PropertyTypeCategory,
} from "@/lib/property-type-categories";
import { translations } from "@/lib/site-translations";
import type { TenantType } from "@/lib/tenant-types";
import { uploadListingImage } from "@/lib/upload-listing-image";

const MAX_PHOTOS = 6;

type PostAdFormProps = {
  /** Editing an existing listing pre-fills every field from it and calls
   * updateListing on submit instead of createListing. */
  listing?: Listing;
};

export default function PostAdForm({ listing }: PostAdFormProps) {
  const isEditing = Boolean(listing);
  const router = useRouter();
  const { user, profile, adminRole, loading } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language].postAd;

  const [propertyTypeCategories, setPropertyTypeCategories] = useState<PropertyTypeCategory[]>([]);
  const categoriesByPurpose = groupCategoriesByPurpose(propertyTypeCategories);
  const [purposes, setPurposes] = useState<ListingPurposeRecord[]>([]);

  const [title, setTitle] = useState(listing?.title ?? "");
  const [purpose, setPurpose] = useState<ListingPurpose>(listing?.purpose ?? "sale");
  const [propertyType, setPropertyType] = useState<string>(listing?.propertyType ?? "");
  const [price, setPrice] = useState(listing ? String(listing.price) : "");
  const [negotiable, setNegotiable] = useState(listing?.negotiable ?? false);
  const [location, setLocation] = useState<LocationCascadeValue>({
    locationDivision: listing?.locationDivision ?? "",
    locationDistrict: listing?.locationDistrict ?? "",
    locationUpazila: listing?.locationUpazila ?? "",
    locationArea: listing?.locationArea ?? "",
    locationExtra: listing?.locationExtra ?? [],
  });
  const [bedrooms, setBedrooms] = useState(listing?.bedrooms != null ? String(listing.bedrooms) : "");
  const [bathrooms, setBathrooms] = useState(listing?.bathrooms != null ? String(listing.bathrooms) : "");
  const [areaSqft, setAreaSqft] = useState(listing?.areaSqft != null ? String(listing.areaSqft) : "");
  const [description, setDescription] = useState(listing?.description ?? "");
  const [mapLink, setMapLink] = useState(listing?.locationMapUrl ?? "");
  const [sellerPhone, setSellerPhone] = useState(listing?.sellerPhone ?? "");
  const [sellerWhatsapp, setSellerWhatsapp] = useState(listing?.sellerWhatsapp ?? "");
  const [tenantTypes, setTenantTypes] = useState<TenantType[]>(listing?.tenantTypes ?? []);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

  const [photos, setPhotos] = useState<{ url: string; publicId: string }[]>(
    () =>
      listing?.photoUrls.map((url, index) => ({
        url,
        publicId: listing.photoPublicIds[index] ?? "",
      })) ?? []
  );
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isEditing && profile?.phone) {
      setSellerPhone(profile.phone);
    }
    // Only auto-fill from the profile when creating — editing shouldn't
    // clobber whatever phone number the ad was already posted with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, isEditing]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${isEditing && listing ? `/post-ad/${listing.id}` : "/post-ad"}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, router]);

  // firestore.rules would reject the update anyway (owner-only), but bounce
  // them before they fill out a form they can't actually submit.
  useEffect(() => {
    if (!loading && user && listing && listing.sellerId !== user.uid) {
      toast({ title: t.notYourListing, variant: "destructive" });
      router.replace("/my-listings");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, listing]);

  useEffect(() => {
    let cancelled = false;
    getPropertyTypeCategoriesCached().then((categories) => {
      if (!cancelled) {
        setPropertyTypeCategories(categories);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    getListingPurposesCached().then((loadedPurposes) => {
      if (!cancelled) {
        setPurposes(loadedPurposes);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the chosen purpose valid whenever the purposes list loads (e.g. an
  // admin renamed/removed the one currently selected).
  useEffect(() => {
    if (purposes.length > 0 && !purposes.some((item) => item.key === purpose)) {
      setPurpose(purposes[0].key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purposes]);

  // Don't auto-pick a category — the picker starts on "All Listings"
  // (unselected), exactly like the navbar's browse dropdown, until the
  // person deliberately chooses one. Only clear it out if it becomes
  // invalid (e.g. an admin renamed/removed that category while they had it
  // selected, or they switched purpose to one it doesn't belong to).
  useEffect(() => {
    const validTypes = (categoriesByPurpose[purpose] ?? []).map((category) => category.en);
    if (propertyType && !validTypes.includes(propertyType)) {
      setPropertyType("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purpose, propertyTypeCategories]);

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!user || files.length === 0) {
      return;
    }

    const remainingSlots = MAX_PHOTOS - photos.length;
    const filesToUpload = files.slice(0, remainingSlots);

    setIsUploadingPhoto(true);
    setErrorMessage("");

    try {
      for (const file of filesToUpload) {
        const uploaded = await uploadListingImage(file);
        setPhotos((current) => [...current, uploaded]);
      }
    } catch {
      setErrorMessage(t.photoUploadError);
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  function removePhoto(publicId: string) {
    setPhotos((current) => current.filter((photo) => photo.publicId !== publicId));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !hasAcceptedTerms) {
      return;
    }

    if (photos.length === 0) {
      setErrorMessage(t.noPhotoError);
      return;
    }

    if (!location.locationDivision || !location.locationDistrict || !location.locationUpazila) {
      setErrorMessage(t.locationRequiredError);
      return;
    }

    if (!propertyType) {
      setErrorMessage(t.propertyTypeRequiredError);
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    const listingFields = {
      sellerPhone,
      sellerWhatsapp,
      title: title.trim(),
      description: description.trim(),
      price: Number(price) || 0,
      negotiable,
      purpose,
      propertyType,
      location: formatListingLocation(location),
      locationDivision: location.locationDivision,
      locationDistrict: location.locationDistrict,
      locationUpazila: location.locationUpazila,
      locationArea: location.locationArea.trim(),
      locationExtra: location.locationExtra,
      locationMapUrl: mapLink.trim(),
      bedrooms: bedrooms ? Number(bedrooms) : null,
      bathrooms: bathrooms ? Number(bathrooms) : null,
      areaSqft: areaSqft ? Number(areaSqft) : null,
      tenantTypes,
      photoUrls: photos.map((photo) => photo.url),
      photoPublicIds: photos.map((photo) => photo.publicId),
    };

    try {
      if (isEditing && listing) {
        // A listing that was already live (or rejected) goes back to
        // "pending" on edit — Firestore rules require it (the owner can only
        // write a resulting status of 'pending' or 'sold'), and it's the
        // right call anyway: what's live changed, so it should be
        // re-reviewed before it's shown again. A still-pending or sold
        // listing keeps its status untouched.
        const needsReReview = listing.status === "active" || listing.status === "rejected";

        await updateListing(listing.id, {
          ...listingFields,
          ...(needsReReview ? { status: "pending" as const } : {}),
        });

        toast({
          title: t.adUpdatedTitle,
          description: needsReReview ? t.adUpdatedDescResubmit : t.adUpdatedDesc,
        });
      } else {
        await createListing({
          sellerId: user.uid,
          sellerName: profile?.name || "Astanaa user",
          sellerEmail: "",
          sellerRole: adminRole === "promoter" ? "promoter" : "client",
          ...listingFields,
        });

        toast({
          title: t.adSubmittedTitle,
          description: t.adSubmittedDesc,
        });
      }

      router.replace("/my-listings");
    } catch {
      setErrorMessage(isEditing ? t.updateErrorFallback : t.submitErrorFallback);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading || !user || (listing && listing.sellerId !== user.uid)) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </main>
    );
  }

  return (
    <main className="bg-gray-50 py-10">
      <div className="mx-auto max-w-3xl px-4">
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? t.editPageTitle : t.pageTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photos */}
              <div className="space-y-2">
                <Label>{t.photos} ({photos.length}/{MAX_PHOTOS})</Label>
                <div className="flex flex-wrap gap-3">
                  {photos.map((photo) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <div key={photo.publicId || photo.url} className="relative h-24 w-24 overflow-hidden rounded-lg border">
                      <img src={photo.url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.publicId)}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                        aria-label="Remove photo"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {photos.length < MAX_PHOTOS ? (
                    <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-green-500 hover:text-green-600">
                      {isUploadingPhoto ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <>
                          <ImagePlus size={20} />
                          <span className="text-[11px] font-medium">{t.addPhoto}</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handlePhotoChange}
                        disabled={isUploadingPhoto}
                      />
                    </label>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="title">{t.adTitle}</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={t.adTitlePlaceholder}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">{t.purpose}</Label>
                  <PurposeCategoryPicker
                    purposes={purposes}
                    categoriesByPurpose={categoriesByPurpose}
                    purpose={purpose}
                    propertyType={propertyType}
                    language={language}
                    placeholder={t.allListings}
                    onChange={(nextPurpose, nextPropertyType) => {
                      setPurpose(nextPurpose as ListingPurpose);
                      setPropertyType(nextPropertyType);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">{t.price}</Label>
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    placeholder="4000000"
                    required
                  />
                  <label htmlFor="negotiable" className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      id="negotiable"
                      type="checkbox"
                      checked={negotiable}
                      onChange={(event) => setNegotiable(event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    {t.negotiable}
                  </label>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <LocationCascadeSelect value={location} onChange={setLocation} enableFlatSearch />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bedrooms">{t.bedrooms}</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min={0}
                    value={bedrooms}
                    onChange={(event) => setBedrooms(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bathrooms">{t.bathrooms}</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min={0}
                    value={bathrooms}
                    onChange={(event) => setBathrooms(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="areaSqft">{t.area}</Label>
                  <Input
                    id="areaSqft"
                    type="number"
                    min={0}
                    value={areaSqft}
                    onChange={(event) => setAreaSqft(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenantTypes">{t.tenantTypes}</Label>
                  <TenantTypeSelect
                    id="tenantTypes"
                    value={tenantTypes}
                    onChange={setTenantTypes}
                    labels={{ male: t.tenantMale, female: t.tenantFemale, family: t.tenantFamily }}
                    placeholder={t.tenantTypesPlaceholder}
                    limitHint={t.tenantTypesLimit}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sellerPhone">{t.contactPhone}</Label>
                  <Input
                    id="sellerPhone"
                    type="tel"
                    value={sellerPhone}
                    onChange={(event) => setSellerPhone(event.target.value)}
                    placeholder="01XXXXXXXXX"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sellerWhatsapp">{t.whatsapp}</Label>
                  <Input
                    id="sellerWhatsapp"
                    type="tel"
                    value={sellerWhatsapp}
                    onChange={(event) => setSellerWhatsapp(event.target.value)}
                    placeholder="01XXXXXXXXX"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="description">{t.description}</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder={t.descriptionPlaceholder}
                    rows={5}
                    required
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="mapLink">{t.mapLink}</Label>
                  <Input
                    id="mapLink"
                    type="url"
                    value={mapLink}
                    onChange={(event) => setMapLink(event.target.value)}
                    placeholder={t.mapLinkPlaceholder}
                  />
                  <p className="text-xs text-gray-500">{t.mapLinkHelp}</p>
                </div>
              </div>

              {errorMessage ? (
                <p className="text-sm font-medium text-red-600">{errorMessage}</p>
              ) : null}

              {!isEditing ? (
                <p className="text-xs text-gray-500">
                  {t.reviewNote}
                </p>
              ) : null}

              <label
                htmlFor="termsAgreement"
                className="flex cursor-pointer items-start gap-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700"
              >
                <input
                  id="termsAgreement"
                  type="checkbox"
                  checked={hasAcceptedTerms}
                  onChange={(event) => setHasAcceptedTerms(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                {t.termsAgreement}
              </label>

              {hasAcceptedTerms ? (
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isSubmitting || isUploadingPhoto}
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isEditing ? t.saveChanges : t.submit}
                </Button>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
