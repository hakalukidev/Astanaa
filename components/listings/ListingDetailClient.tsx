"use client";

import {
  BedDouble,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Ruler,
  ShowerHead,
  Trash2,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import BoostListingDialog from "@/components/listings/BoostListingDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { createBuyRequest } from "@/lib/buy-requests";
import { getOrCreateChat } from "@/lib/chat";
import { deleteListing } from "@/lib/listing-service";
import {
  formatListingPrice,
  getPrimaryListingPhotoUrl,
  type Listing,
} from "@/lib/listings";

type ListingDetailClientProps = {
  listing: Listing;
};

export default function ListingDetailClient({ listing }: ListingDetailClientProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isBuySubmitting, setIsBuySubmitting] = useState(false);
  const [isChatSubmitting, setIsChatSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [buyRequestSent, setBuyRequestSent] = useState(false);
  const [boostDialogOpen, setBoostDialogOpen] = useState(false);
  const [boostStatus, setBoostStatus] = useState(listing.boost.status);

  const photos = listing.photoUrls.length > 0 ? listing.photoUrls : [getPrimaryListingPhotoUrl(listing)];
  const isOwner = user?.uid === listing.sellerId;

  function requireLogin() {
    toast({ title: "Please log in first", description: "You need an account to continue." });
    router.push(`/login?next=/listings/${listing.id}`);
  }

  async function handleBuy() {
    if (!user) {
      requireLogin();
      return;
    }

    setIsBuySubmitting(true);

    try {
      await createBuyRequest({
        listingId: listing.id,
        listingTitle: listing.title,
        buyerId: user.uid,
        buyerName: profile?.name || user.displayName || "Astanaa user",
        buyerPhone: profile?.phone || "",
        sellerId: listing.sellerId,
      });
      setBuyRequestSent(true);
      toast({
        title: "Request sent!",
        description: "The seller has been notified that you're interested.",
      });
    } catch {
      toast({
        title: "Something went wrong",
        description: "Could not send your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBuySubmitting(false);
    }
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
        title: "Something went wrong",
        description: "Could not start the chat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChatSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this listing? This cannot be undone.")) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteListing(listing.id);
      toast({ title: "Listing deleted" });
      router.replace("/my-listings");
    } catch {
      toast({
        title: "Could not delete listing",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  }

  return (
    <main className="bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          {/* Gallery */}
          <div>
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

            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-gray-900">Description</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {listing.description}
              </p>
            </div>
          </div>

          {/* Details / actions */}
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              {isOwner && listing.status !== "active" && listing.status !== "sold" ? (
                <div
                  className={`mb-3 rounded-md px-3 py-2 text-xs font-semibold ${
                    listing.status === "rejected"
                      ? "bg-red-50 text-red-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {listing.status === "rejected"
                    ? "This listing was rejected and isn't public."
                    : "Waiting for admin/moderator approval — not public yet."}
                </div>
              ) : null}

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  {listing.purpose === "rent" ? "For Rent" : "For Sale"}
                </span>
                {boostStatus === "active" ? (
                  <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                    <Zap size={10} /> Boosted
                  </span>
                ) : null}
              </div>

              <p className="mt-3 text-2xl font-bold text-green-700">
                {formatListingPrice(listing.price)}
                {listing.purpose === "rent" ? (
                  <span className="text-sm font-medium text-slate-500"> /month</span>
                ) : null}
              </p>

              <h1 className="mt-1 text-xl font-bold text-gray-900">{listing.title}</h1>

              <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
                <MapPin size={14} className="shrink-0" /> {listing.location}
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-4 text-center text-xs text-gray-600">
                <div className="flex flex-col items-center gap-1">
                  <BedDouble size={16} className="text-green-600" />
                  {listing.bedrooms ?? "-"} Beds
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ShowerHead size={16} className="text-green-600" />
                  {listing.bathrooms ?? "-"} Baths
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Ruler size={16} className="text-green-600" />
                  {listing.areaSqft ?? "-"} sqft
                </div>
              </div>
            </div>

            {/* Seller card */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Seller
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
                  <MessageCircle size={14} /> WhatsApp: {listing.sellerWhatsapp}
                </a>
              ) : null}

              {!isOwner ? (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button
                    onClick={handleBuy}
                    disabled={isBuySubmitting || buyRequestSent}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isBuySubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {buyRequestSent ? "Request sent" : "Buy"}
                  </Button>
                  <Button
                    onClick={handleChat}
                    disabled={isChatSubmitting}
                    variant="outline"
                    className="flex-1 border-green-600 text-green-700 hover:bg-green-50"
                  >
                    {isChatSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <MessageCircle className="mr-2 h-4 w-4" />
                    )}
                    Chat
                  </Button>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-gray-500">This is your listing.</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {boostStatus === "none" || boostStatus === "expired" ? (
                      <Button
                        onClick={() => setBoostDialogOpen(true)}
                        className="flex-1 bg-amber-500 hover:bg-amber-600"
                      >
                        <Zap className="mr-2 h-4 w-4" /> Boost this post (৳100)
                      </Button>
                    ) : (
                      <p className="flex-1 rounded-md bg-amber-50 px-3 py-2 text-center text-xs font-medium text-amber-700">
                        Boost {boostStatus === "pending" ? "pending verification" : "active"}
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
        </div>
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
