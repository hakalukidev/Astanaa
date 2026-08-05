import { Suspense } from "react";

import ProductCatalogClient from "@/components/products/ProductCatalogClient";
import { getAllCategories } from "@/lib/category-service";
import { getCachedProducts } from "@/lib/product-cache";

export default async function ProductsPage() {
  const [initialCategories, initialProducts] = await Promise.all([
    getAllCategories(),
    getCachedProducts(),
  ]);

  return (
    <Suspense fallback={<ProductsPageFallback />}>
      <ProductCatalogClient
        initialCategories={initialCategories}
        initialProducts={initialProducts}
      />
    </Suspense>
  );
}

function ProductsPageFallback() {
  return (
    <main className="bg-gray-50">
      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          <h2 className="mb-10 text-center text-3xl font-bold">Products</h2>
          <p className="text-center text-gray-500">Loading catalog...</p>
        </div>
      </section>
    </main>
  );
}
