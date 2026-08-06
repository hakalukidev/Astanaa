"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { homeTranslations } from "@/lib/home-translations";

export default function BrandHeadline() {
  const { language } = useLanguage();
  const t = homeTranslations[language].brand;

  return (
    <div className="py-12 text-center border-b border-gray-200">
      <div className="inline-block bg-blue-600 text-white text-xs font-bold tracking-widest px-4 py-1.5 mb-4">
        {t.badge}
      </div>
      <h2 className="text-3xl font-black text-gray-900 mb-3">
        {t.title}
      </h2>
      <div className="w-16 h-0.5 bg-blue-600 mx-auto mb-4" />
      <p className="text-gray-500 text-sm max-w-xl mx-auto">
       {t.subtitle}
      </p>
    </div>
  );
}
