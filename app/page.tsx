import BrandHeadline from "@/components/home/BrandHeadline";
import CategorySearchExplorer from "@/components/home/CategorySearchExplorer";
import HeroSlider from "@/components/home/HeroSlider";
import HomeBlogSection from "@/components/home/HomeBlogSection";
import ProductShowcaseSections from "@/components/home/ProductShowcaseSections";
import VideoSection from "@/components/home/VideoSection";
import { getAllCategories } from "@/lib/category-service";
import { getCachedProducts } from "@/lib/product-cache";

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    getAllCategories(),
    getCachedProducts(),
  ]);

  return (
    <main className="bg-white">
      <HeroSlider />
      <CategorySearchExplorer categories={categories} />
      <BrandHeadline />
      <ProductShowcaseSections categories={categories} products={products} />
      <VideoSection />
      <HomeBlogSection />
    </main>
  );
}
