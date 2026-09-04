import { notFound } from "next/navigation";

import ListingDetailClient from "@/components/listings/ListingDetailClient";
import { getCachedListings } from "@/lib/listing-cache";
import { getListingById } from "@/lib/listing-service-server";

type ListingDetailPageProps = {
  params: { id: string };
};

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const listing = await getListingById(params.id);

  if (!listing) {
    notFound();
  }

  // Same cached, publicly-active list the /listings catalog uses — reused
  // here to power the "similar" and "same location" recommendation rails
  // without an extra live subscription.
  const otherListings = await getCachedListings();

  return <ListingDetailClient listing={listing} otherListings={otherListings} />;
}
