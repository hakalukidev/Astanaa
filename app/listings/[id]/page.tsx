import { notFound } from "next/navigation";

import ListingDetailClient from "@/components/listings/ListingDetailClient";
import { getListingById } from "@/lib/listing-service";

type ListingDetailPageProps = {
  params: { id: string };
};

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const listing = await getListingById(params.id);

  if (!listing) {
    notFound();
  }

  return <ListingDetailClient listing={listing} />;
}
