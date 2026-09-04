import { notFound } from "next/navigation";

import PostAdForm from "@/components/listings/PostAdForm";
import { getListingById } from "@/lib/listing-service-server";

type EditListingPageProps = {
  params: { id: string };
};

export default async function EditListingPage({ params }: EditListingPageProps) {
  const listing = await getListingById(params.id);

  if (!listing) {
    notFound();
  }

  // Ownership is enforced client-side in PostAdForm (it has the signed-in
  // user via useAuth) — this only fetches the doc to pre-fill the form.
  return <PostAdForm listing={listing} />;
}
