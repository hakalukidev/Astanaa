"use client";

import BlogPostList from "@/components/home/BlogPostList";
import { useLanguage } from "@/contexts/LanguageContext";
import { homeTranslations } from "@/lib/home-translations";

export default function HomeBlogSection() {
  const { language } = useLanguage();
  const t = homeTranslations[language].blog;

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t.heading}
          </h2>
          <div className="w-20 h-1 bg-blue-600 mx-auto mb-4 rounded-full"></div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t.subheading}
          </p>
        </div>

        <BlogPostList limit={3} showViewAll={true} variant="grid" />
      </div>
    </section>
  );
}
