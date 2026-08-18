'use client';

import { ListChecks, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useLanguage } from '@/contexts/LanguageContext';
import { getRulesAndRestrictions } from '@/lib/rules';
import { translations } from '@/lib/site-translations';

export default function RulesPage() {
  const { language } = useLanguage();
  const t = translations[language].rulesPage;
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getRulesAndRestrictions(language)
      .then(setContent)
      .finally(() => setIsLoading(false));
  }, [language]);

  return (
    <main className="bg-white">
      <section className="bg-gradient-to-r from-green-900 to-green-700 py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-3 flex justify-center">
            <ListChecks size={40} />
          </div>
          <h1 className="text-3xl font-bold md:text-4xl">{t.title}</h1>
          <p className="mt-2 text-green-100">{t.subtitle}</p>
        </div>
      </section>

      <section className="container mx-auto max-w-3xl px-4 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-14 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t.loading}
          </div>
        ) : (
          <p className="whitespace-pre-wrap leading-relaxed text-gray-700">{content}</p>
        )}
      </section>
    </main>
  );
}
