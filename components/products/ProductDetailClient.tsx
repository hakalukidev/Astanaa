"use client";

import { ArrowLeft, CheckCircle, Loader2, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import ProductPhoto from "@/components/products/ProductPhoto";
import { getAllProducts, getProductById } from "@/lib/product-service";
import { getPrimaryProductPhotoUrl, getProductPhotoUrls, type Product } from "@/lib/products";

type ProductDetailClientProps = {
  productId: string;
};

export default function ProductDetailClient({
  productId,
}: ProductDetailClientProps) {
  const mapUrl = "https://www.google.com/maps/place/Muaz+Technology/@23.719186,90.4094433,17z/data=!4m7!3m6!1s0x3755b93eeb19d727:0xb774586735f37c8b!4b1!8m2!3d23.7184837!4d90.4115032!16s%2Fg%2F11xlnxv_ts?hl=en&entry=ttu&g_ep=EgoyMDI2MDYxMC4wIKXMDSoASAFQAw%3D%3D";
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState("");

  useEffect(() => {
    async function loadProduct() {
      try {
        const currentProduct = await getProductById(productId);
        setProduct(currentProduct);

        if (currentProduct) {
          const allProducts = await getAllProducts();
          setRelatedProducts(
            allProducts
              .filter(
                (candidate) =>
                  candidate.category === currentProduct.category &&
                  candidate.id !== currentProduct.id
              )
              .slice(0, 4)
          );
        }
      } finally {
        setIsLoading(false);
      }
    }

    void loadProduct();
  }, [productId]);

  useEffect(() => {
    if (!product) {
      setSelectedPhotoUrl("");
      return;
    }

    const productPhotoUrls = getProductPhotoUrls(product);
    setSelectedPhotoUrl(productPhotoUrls[0] ?? "");
  }, [product]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto flex items-center gap-2 px-4 py-20 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading product...
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">
            Product Not Found
          </h1>
          <p className="mb-8 text-gray-600">
            The product you are looking for does not exist.
          </p>
          <Link
            href="/products"
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            Back to Products
          </Link>
        </div>
      </main>
    );
  }

  const productPhotoUrls = getProductPhotoUrls(product);
  const activePhotoUrl = selectedPhotoUrl || productPhotoUrls[0] || "";

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 md:py-10">
        <Link
          href="/products"
          className="mb-4 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 md:mb-6 md:text-base"
        >
          <ArrowLeft size={18} /> Back to Products
        </Link>

        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
          <div className="grid gap-6 p-4 md:grid-cols-2 md:gap-8 md:p-8">
            <div className="space-y-4">
              <ProductPhoto
                src={activePhotoUrl}
                alt={product.name}
                className="flex min-h-[320px] items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 md:min-h-[420px]"
                imgClassName="h-full w-full object-contain p-4 md:p-6"
              />
              {productPhotoUrls.length > 1 ? (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {productPhotoUrls.map((photoUrl, index) => {
                    const isActive = photoUrl === activePhotoUrl;

                    return (
                      <button
                        key={`${photoUrl}-${index}`}
                        type="button"
                        onClick={() => setSelectedPhotoUrl(photoUrl)}
                        className={`flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white p-2 ${
                          isActive ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"
                        }`}
                      >
                        <img
                          src={photoUrl}
                          alt={`${product.name} image ${index + 1}`}
                          className="h-full w-full object-contain"
                        />
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="space-y-4 md:space-y-6">
              {product.isHot ? (
                <span className="inline-block w-fit rounded-full bg-red-500 px-2 py-1 text-xs text-white">
                  Hot Product
                </span>
              ) : null}

              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                  {product.category}
                </p>
                <h1 className="text-2xl font-bold text-gray-800 md:text-3xl lg:text-4xl">
                  {product.name}
                </h1>
                <p className="text-lg font-semibold text-blue-600 md:text-xl">
                  {product.price}
                </p>
              </div>

              <div className="border-y border-gray-200 py-3 md:py-4">
                <div className="whitespace-normal break-words leading-relaxed text-gray-700">
                  <p className="mb-2 font-medium text-gray-800">Description:</p>
                  <div className="text-sm md:text-base">
                    {(product.details || product.description || "").split("\n").map((paragraph, idx) => (
                      <p key={idx} className="mb-2 last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {product.keyHighlights.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-800">Key Highlights</h3>
                  <div className="flex flex-col gap-2">
                      {product.keyHighlights.map((highlight) => (
                        <span
                          key={highlight}
                          className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-sm text-blue-700"
                        >
                          <CheckCircle size={16} className="text-blue-600" />
                          {highlight}
                        </span>
                      ))}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row md:gap-4">
                <a
                  href="tel:+8801897914480"
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-blue-700 md:px-6"
                >
                  Call Us
                </a>
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 transition hover:border-blue-600 hover:text-blue-600 md:px-6"
                >
                  <MapPin size={18} />
                  Visit Shop
                </a>
              </div>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 ? (
          <div className="mt-8 md:mt-12">
            <h2 className="mb-4 text-xl font-bold text-gray-800 md:mb-6 md:text-2xl">
              Related Products
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link href={`/product/${relatedProduct.id}`} key={relatedProduct.id}>
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-lg">
                    <ProductPhoto
                      src={getPrimaryProductPhotoUrl(relatedProduct)}
                      alt={relatedProduct.name}
                      className="flex h-52 items-center justify-center bg-white p-4"
                      imgClassName="object-contain"
                    />
                    <div className="p-4">
                      <h3 className="line-clamp-2 text-sm font-medium text-gray-800">
                        {relatedProduct.name}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
