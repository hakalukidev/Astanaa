'use client';

import {
  Building2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useLanguage } from '@/contexts/LanguageContext';
import { DEFAULT_ABOUT_SETTINGS, getAboutSettings } from '@/lib/about-settings';

export default function AboutPage() {
  const { language } = useLanguage();
  const [settings, setSettings] = useState(DEFAULT_ABOUT_SETTINGS);

  useEffect(() => {
    let cancelled = false;

    getAboutSettings()
      .then((next) => {
        if (!cancelled) {
          setSettings(next);
        }
      })
      .catch(() => {
        // Keep the default content already in state.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const t = settings[language];

  return (
    <main className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-green-900 to-green-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            {t.heroTitle}
          </h1>
          <p className="text-xl md:text-2xl mb-6">
            {t.heroSubtitle}
          </p>
          <p className="text-lg max-w-3xl mx-auto">
            {t.heroBody}
          </p>
        </div>
      </section>

      {/* Company Overview Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-gray-800">
                {t.overviewTitle}
              </h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                {t.overviewP1}
              </p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                {t.overviewP2}
              </p>
              <p className="text-gray-600 leading-relaxed">
                {t.overviewP3}
              </p>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="flex items-center gap-3">
                  <Sparkles className="text-green-600" size={24} />
                  <span className="text-gray-700 font-medium">{t.badgeFreeToPost}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="text-green-600" size={24} />
                  <span className="text-gray-700 font-medium">{t.badgeDirectChat}</span>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="text-green-600" size={24} />
                  <span className="text-gray-700 font-medium">{t.badgeNoMiddleman}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Zap className="text-green-600" size={24} />
                  <span className="text-gray-700 font-medium">{t.badgeBoost}</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-100 to-gray-100 rounded-lg p-8">
              <div className="text-center">
                <div className="text-6xl mb-4">🏢</div>
                <h3 className="text-2xl font-bold text-green-800 mb-4">{t.missionTitle}</h3>
                <p className="text-gray-600">
                  {t.missionBody}
                </p>
                <div className="mt-6 pt-6 border-t border-gray-300">
                  <h3 className="text-2xl font-bold text-green-800 mb-4">{t.visionTitle}</h3>
                  <p className="text-gray-600">
                    {t.visionBody}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              {t.howItWorksTitle}
            </h2>
            <p className="text-xl text-gray-600">
              {t.howItWorksSubtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-600 p-3 rounded-full">
                  <Building2 className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">{t.step1Title}</h3>
              </div>
              <p className="ml-1 text-sm text-gray-600">
                {t.step1Body}
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-600 p-3 rounded-full">
                  <Zap className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">{t.step2Title}</h3>
              </div>
              <p className="ml-1 text-sm text-gray-600">
                {t.step2Body}
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-600 p-3 rounded-full">
                  <MessageCircle className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">{t.step3Title}</h3>
              </div>
              <p className="ml-1 text-sm text-gray-600">
                {t.step3Body}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {t.ctaTitle}
          </h2>
          <Link
            href="/post-ad"
            className="inline-flex items-center justify-center rounded-md bg-green-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            {t.ctaButton}
          </Link>
        </div>
      </section>
    </main>
  );
}
