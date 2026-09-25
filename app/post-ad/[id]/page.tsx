import { notFound, redirect } from "next/navigation";

import PostAdForm from "@/components/listings/PostAdForm";
import { getListingById } from "@/lib/listing-service-server";
import { isListingLockedForOwner } from "@/lib/listings";

type EditListingPageProps = {
  params: { id: string };
};

export default async function EditListingPage({ params }: EditListingPageProps) {
  const listing = await getListingById(params.id);

  if (!listing) {
    notFound();
  }

  // Approved/sold posts can't be edited by their owner (the API enforces it
  // too), so don't show a form that would only fail on save.
  if (isListingLockedForOwner(listing)) {
    redirect("/my-listings");
  }

  // Ownership is enforced client-side in PostAdForm (it has the signed-in
  // user via useAuth) — this only fetches the doc to pre-fill the form.
  return <PostAdForm listing={listing} />;
}
