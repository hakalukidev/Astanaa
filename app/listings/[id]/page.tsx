import { notFound } from "next/navigation";

import ListingDetailClient from "@/components/listings/ListingDetailClient";
import { getListingById } from "@/lib/listing-service";
import { getListingByIdAdmin } from "@/lib/listing-service-admin";

type ListingDetailPageProps = {
  params: { id: string };
};

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  // This is a Server Component, so there's no Firebase Auth session to carry
  // into a client-SDK read here — it always runs as an anonymous request.
  // firestore.rules only lets that through for "active" listings, so a
  // moderator opening a pending listing from the moderation queue (or an
  // owner opening their own pending/rejected one) would hit a bare
  // "Missing or insufficient permissions" crash. The Admin SDK bypasses
  // rules (trusted server context) and can always fetch the doc; falls back
  // to the client SDK only if Admin credentials aren't configured.
  const adminResult = await getListingByIdAdmin(params.id);
  const listing = adminResult !== undefined ? adminResult : await getListingById(params.id);

  if (!listing) {
    notFound();
  }

  return <ListingDetailClient listing={listing} />;
}
