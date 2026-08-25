import { notFound } from "next/navigation";

import PostAdForm from "@/components/listings/PostAdForm";
import { getListingById } from "@/lib/listing-service";
import { getListingByIdAdmin } from "@/lib/listing-service-admin";

type EditListingPageProps = {
  params: { id: string };
};

export default async function EditListingPage({ params }: EditListingPageProps) {
  // Server Component, so no Firebase Auth session to carry into a client-SDK
  // read here — same reasoning as the public listing detail page: the owner
  // editing their own pending/rejected listing needs the Admin SDK to bypass
  // firestore.rules' "active-only for anonymous reads" restriction. Falls
  // back to the client SDK only if Admin credentials aren't configured.
  const adminResult = await getListingByIdAdmin(params.id);
  const listing = adminResult !== undefined ? adminResult : await getListingById(params.id);

  if (!listing) {
    notFound();
  }

  // Ownership is enforced client-side in PostAdForm (it has the signed-in
  // user via useAuth) — this only fetches the doc to pre-fill the form.
  return <PostAdForm listing={listing} />;
}
