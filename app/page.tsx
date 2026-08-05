import BlogPostList from "@/components/home/BlogPostList";
import BrandHeadline from "@/components/home/BrandHeadline";
import HeroSlider from "@/components/home/HeroSlider";
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
      <BrandHeadline />
      <ProductShowcaseSections categories={categories} products={products} />
      <VideoSection />
            {/* ✅ ব্লগ সেকশন */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Latest from Our Blog
            </h2>
            <div className="w-20 h-1 bg-blue-600 mx-auto mb-4 rounded-full"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Stay updated with our latest news, tips, and insights
            </p>
          </div>
          
          <BlogPostList limit={3} showViewAll={true} variant="grid" />
        </div>
      </section>
    </main>
  );
}
