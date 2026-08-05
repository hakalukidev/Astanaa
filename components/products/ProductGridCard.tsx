import Link from "next/link";

import ProductPhoto from "@/components/products/ProductPhoto";
import { getPrimaryProductPhotoUrl, type Product } from "@/lib/products";

type ProductGridCardProps = {
  product: Product;
  showHotBadge?: boolean;
};

export default function ProductGridCard({
  product,
  showHotBadge = false,
}: ProductGridCardProps) {
  const primaryPhotoUrl = getPrimaryProductPhotoUrl(product);

  return (
    <article className="group flex w-full max-w-[15.5rem] flex-col border border-slate-200 bg-white shadow-[0_18px_40px_-34px_rgba(15,23,42,0.75)] transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_28px_50px_-32px_rgba(15,23,42,0.75)]">
      <Link
        href={`/product/${product.id}`}
        className="relative block border-b border-slate-200 bg-slate-50"
      >
        <ProductPhoto
          src={primaryPhotoUrl}
          alt={product.name}
          className="h-40 bg-transparent px-3 py-3"
          imgClassName="object-contain transition duration-300 group-hover:scale-105"
        />

        {showHotBadge && product.isHot ? (
          <span className="absolute right-3 top-3 border border-red-200 bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-600">
            Hot
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3 text-left">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          {product.category}
        </p>
        <Link
          href={`/product/${product.id}`}
          className="line-clamp-2 min-h-[2.6rem] text-[0.95rem] font-semibold leading-5 text-slate-900 transition hover:text-blue-700"
        >
          {product.name}
        </Link>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-200 pt-2">
          <p className="text-xs font-semibold text-slate-900">
            {product.price}
          </p>
          <Link
            href={`/product/${product.id}`}
            className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-700 transition hover:text-blue-900"
          >
            View item
          </Link>
        </div>
      </div>
    </article>
  );
}
