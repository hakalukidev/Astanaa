"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { createListing } from "@/lib/listing-service";
import { PROPERTY_TYPES, type ListingPurpose } from "@/lib/listings";
import { uploadListingImage } from "@/lib/upload-listing-image";

const MAX_PHOTOS = 6;

export default function PostAdPage() {
  const router = useRouter();
  const { user, profile, adminRole, loading } = useAuth();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState<ListingPurpose>("sale");
  const [propertyType, setPropertyType] = useState<string>(PROPERTY_TYPES[0]);
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [areaSqft, setAreaSqft] = useState("");
  const [description, setDescription] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [sellerWhatsapp, setSellerWhatsapp] = useState("");

  const [photos, setPhotos] = useState<{ url: string; publicId: string }[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.phone) {
      setSellerPhone(profile.phone);
    }
  }, [profile]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/post-ad");
    }
  }, [loading, user, router]);

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
        const uploaded = await uploadListingImage(file, user);
        setPhotos((current) => [...current, uploaded]);
      }
    } catch {
      setErrorMessage("Could not upload one of the photos. Please try again.");
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  function removePhoto(publicId: string) {
    setPhotos((current) => current.filter((photo) => photo.publicId !== publicId));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      return;
    }

    if (photos.length === 0) {
      setErrorMessage("Add at least one photo of the apartment.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await createListing({
        sellerId: user.uid,
        sellerName: profile?.name || user.displayName || "Astanaa user",
        sellerPhone,
        sellerWhatsapp,
        sellerRole: adminRole === "promoter" ? "promoter" : "client",
        title: title.trim(),
        description: description.trim(),
        price: Number(price) || 0,
        purpose,
        propertyType,
        location: location.trim(),
        bedrooms: bedrooms ? Number(bedrooms) : null,
        bathrooms: bathrooms ? Number(bathrooms) : null,
        areaSqft: areaSqft ? Number(areaSqft) : null,
        photoUrls: photos.map((photo) => photo.url),
        photoPublicIds: photos.map((photo) => photo.publicId),
      });

      toast({
        title: "Ad submitted!",
        description: "Your listing will go live once it's approved.",
      });
      router.replace("/my-listings");
    } catch {
      setErrorMessage("Could not post your ad. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading || !user) {
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
            <CardTitle>Post your apartment ad</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photos */}
              <div className="space-y-2">
                <Label>Photos ({photos.length}/{MAX_PHOTOS})</Label>
                <div className="flex flex-wrap gap-3">
                  {photos.map((photo) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <div key={photo.publicId} className="relative h-24 w-24 overflow-hidden rounded-lg border">
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
                          <span className="text-[11px] font-medium">Add photo</span>
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
                  <Label htmlFor="title">Ad title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g. 3 Bedroom Apartment in Dhanmondi"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose</Label>
                  <select
                    id="purpose"
                    value={purpose}
                    onChange={(event) => setPurpose(event.target.value as ListingPurpose)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="sale">For Sale</option>
                    <option value="rent">For Rent</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyType">Property type</Label>
                  <select
                    id="propertyType"
                    value={propertyType}
                    onChange={(event) => setPropertyType(event.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {PROPERTY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price (BDT)</Label>
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    placeholder="4000000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="e.g. Dhanmondi, Dhaka"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min={0}
                    value={bedrooms}
                    onChange={(event) => setBedrooms(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min={0}
                    value={bathrooms}
                    onChange={(event) => setBathrooms(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="areaSqft">Area (sqft)</Label>
                  <Input
                    id="areaSqft"
                    type="number"
                    min={0}
                    value={areaSqft}
                    onChange={(event) => setAreaSqft(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sellerPhone">Contact phone</Label>
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
                  <Label htmlFor="sellerWhatsapp">WhatsApp number (optional)</Label>
                  <Input
                    id="sellerWhatsapp"
                    type="tel"
                    value={sellerWhatsapp}
                    onChange={(event) => setSellerWhatsapp(event.target.value)}
                    placeholder="01XXXXXXXXX"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Describe the apartment, condition, nearby facilities..."
                    rows={5}
                    required
                  />
                </div>
              </div>

              {errorMessage ? (
                <p className="text-sm font-medium text-red-600">{errorMessage}</p>
              ) : null}

              <p className="text-xs text-gray-500">
                Your ad will be reviewed by our team and go live once approved.
              </p>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isSubmitting || isUploadingPhoto}
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit for approval
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
