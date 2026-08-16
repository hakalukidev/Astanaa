import { Suspense } from "react";

import ListingsCatalogClient from "@/components/listings/ListingsCatalogClient";
import { getCachedListings } from "@/lib/listing-cache";

export default async function ListingsPage() {
  const initialListings = await getCachedListings();

  return (
    <Suspense fallback={<ListingsPageFallback />}>
      <ListingsCatalogClient initialListings={initialListings} />
    </Suspense>
  );
}

function ListingsPageFallback() {
  return (
    <main className="bg-gray-50">
      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          <h2 className="mb-10 text-center text-3xl font-bold">Listings</h2>
          <p className="text-center text-gray-500">Loading listings...</p>
        </div>
      </section>
    </main>
  );
}
