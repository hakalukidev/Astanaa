"use client";

import { Loader2, Save, Trash2, User as UserIcon, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { deleteListing, getListingsBySeller } from "@/lib/listing-service";
import { formatListingPrice, getPrimaryListingPhotoUrl, type Listing } from "@/lib/listings";
import { translations } from "@/lib/site-translations";

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading, updateUserProfile } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const t = translations[language].profile;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/profile");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone);
      setEmail(profile.email);
    }
  }, [profile]);

  useEffect(() => {
    if (!user) {
      return;
    }

    getListingsBySeller(user.uid).then((data) => {
      setListings(data);
      setListingsLoading(false);
    });
  }, [user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      await updateUserProfile({ name: name.trim(), phone: phone.trim(), email: email.trim() });
      toast({ title: t.savedTitle });
    } catch (error) {
      const code = (error as { code?: string })?.code ?? "";

      if (code === "auth/requires-recent-login") {
        toast({
          title: t.genericErrorTitle,
          description: t.requiresRecentLoginError,
          variant: "destructive",
        });
      } else {
        toast({ title: t.genericErrorTitle, variant: "destructive" });
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(listing: Listing) {
    if (!window.confirm(t.deleteConfirm)) {
      return;
    }

    setDeletingId(listing.id);

    try {
      await deleteListing(listing);
      setListings((current) => current.filter((item) => item.id !== listing.id));
      toast({ title: t.deletedTitle, description: listing.title });
    } catch {
      toast({ title: t.deleteErrorTitle, variant: "destructive" });
    } finally {
      setDeletingId(null);
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
    <main className="min-h-[70vh] bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
            <UserIcon size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
            <p className="text-sm text-gray-500">{t.subtitle}</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-gray-200 bg-white p-5"
        >
          <div className="space-y-1.5">
            <label htmlFor="profileName" className="text-sm font-medium text-gray-700">
              {t.nameLabel}
            </label>
            <input
              id="profileName"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profilePhone" className="text-sm font-medium text-gray-700">
              {t.phoneLabel}
            </label>
            <input
              id="profilePhone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profileEmail" className="text-sm font-medium text-gray-700">
              {t.emailLabel}
            </label>
            <input
              id="profileEmail"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? t.saving : t.saveButton}
          </button>
        </form>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              {t.postsCountTitle}
              {!listingsLoading ? ` · ${listings.length} ${t.postsCountSuffix}` : ""}
            </h2>
            <Link href="/my-listings" className="text-xs font-medium text-green-600 hover:underline">
              {t.manageListingsLink}
            </Link>
          </div>

          {listingsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-green-600" />
            </div>
          ) : listings.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-300 bg-white py-10 text-center text-sm text-gray-500">
              {t.noPosts}
            </p>
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-3"
                >
                  <Link href={`/listings/${listing.id}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {getPrimaryListingPhotoUrl(listing) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getPrimaryListingPhotoUrl(listing)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </Link>
                  <Link href={`/listings/${listing.id}`} className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{listing.title}</p>
                    <p className="text-xs text-gray-500">{listing.location}</p>
                    <p className="text-sm font-bold text-green-700">
                      {formatListingPrice(listing.price)}
                    </p>
                  </Link>
                  {listing.boost.status === "active" ? (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-500 px-2 py-1 text-[10px] font-bold uppercase text-white">
                      <Zap size={10} /> {t.boosted}
                    </span>
                  ) : listing.boost.status === "pending" ? (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase text-amber-700">
                      {t.boostPending}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleDelete(listing)}
                    disabled={deletingId === listing.id}
                    aria-label={t.deleteButton}
                    className="flex shrink-0 items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                  >
                    {deletingId === listing.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
