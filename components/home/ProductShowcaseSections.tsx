import Link from "next/link";

import ProductGridCard from "@/components/products/ProductGridCard";
import {
  filterItemsByManagedCategory,
  type Category,
} from "@/lib/categories";
import { type Product } from "@/lib/products";

type ProductShowcaseSectionsProps = {
  categories: Category[];
  products: Product[];
};

type ProductSectionProps = {
  actionHref: string;
  actionLabel: string;
  description: string;
  eyebrow: string;
  products: Product[];
  title: string;
};

function ProductSection({
  actionHref,
  actionLabel,
  description,
  eyebrow,
  products,
  title,
}: ProductSectionProps) {
  return (
    <section className="border-t border-slate-200 py-14 first:border-t-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl text-left">
            <span className="inline-flex border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600">
              {eyebrow}
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              {title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
              {description}
            </p>
          </div>

          <Link
            href={actionHref}
            className="inline-flex items-center justify-center border border-slate-900 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-900 transition hover:bg-slate-900 hover:text-white"
          >
            {actionLabel}
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-5 xl:gap-6">
          {products.map((product) => (
            <ProductGridCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ProductShowcaseSections({
  categories,
  products,
}: ProductShowcaseSectionsProps) {
  const latestProducts = products.slice(0, 4);
  const categorySections = categories
    .map((category) => ({
      category,
      products: filterItemsByManagedCategory(products, category).slice(0, 4),
    }))
    .filter((section) => section.products.length > 0);

  if (latestProducts.length === 0 && categorySections.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#f5f4ef]">
      {latestProducts.length > 0 ? (
        <ProductSection
          actionHref="/products"
          actionLabel="Browse catalog"
          description="A compact lineup of our latest workshop equipment, presented in a cleaner horizontal layout for faster scanning."
          eyebrow="New arrivals"
          products={latestProducts}
          title="Latest Products"
        />
      ) : null}

      {categorySections.map((section) => (
        <ProductSection
          key={section.category.id}
          actionHref={`/products?category=${encodeURIComponent(section.category.name)}`}
          actionLabel="Explore category"
          description={
            section.category.subcategories.length > 0
              ? `Browse products from ${section.category.name} and its related subcategories.`
              : `Browse a focused selection from our ${section.category.name} range.`
          }
          eyebrow="Shop by category"
          products={section.products}
          title={section.category.name}
        />
      ))}
    </div>
  );
}
