'use client';

import { Globe, Home, Newspaper, Phone, Settings } from 'lucide-react';
import Link from 'next/link';
import { FaFacebook, FaYoutube } from 'react-icons/fa';

import { useLanguage } from '@/contexts/LanguageContext';
import { homeTranslations } from '@/lib/home-translations';

function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { language, toggleLanguage } = useLanguage();
  const label = homeTranslations[language].languageToggleLabel;

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`flex items-center gap-1 rounded border border-blue-400 hover:bg-blue-500 transition font-semibold whitespace-nowrap ${
        compact ? 'px-2 py-1 text-xs' : 'px-2.5 py-1 text-xs lg:text-sm'
      }`}
    >
      <Globe size={compact ? 12 : 14} /> {label}
    </button>
  );
}

export default function TopBar() {
  return (
    <>
      {/* Desktop TopBar - Hidden on mobile */}
      <div className="bg-blue-600 text-white text-sm py-2 px-4 hidden md:block">
        <div className="container mx-auto flex justify-between items-center">
          <p className="font-bold text-xs lg:text-sm">
          Everything your workshop needs in one place.
          </p>
          <div className="flex items-center gap-4 lg:gap-6">
            <Link href="/" className="flex items-center gap-1 hover:text-blue-200 transition text-xs lg:text-sm font-semibold">
              <Home size={14} /> START HERE
            </Link>
            <Link href="/about" className="flex items-center gap-1 hover:text-blue-200 transition text-xs lg:text-sm font-semibold">
              <Settings size={14} /> ABOUT SERVICE
            </Link>
            {/* [NEW] Blog link added */}
            <Link href="/blog" className="flex items-center gap-1 hover:text-blue-200 transition text-xs lg:text-sm font-semibold">
              <Newspaper size={14} /> BLOG
            </Link>
            <Link href="/contact" className="flex items-center gap-1 hover:text-blue-200 transition text-xs lg:text-sm font-semibold">
              <Phone size={14} /> CONTACT US
            </Link>
            <div className="flex items-center gap-2 lg:gap-3 border-l border-blue-400 pl-3 lg:pl-4">
              <a href="https://www.facebook.com/muaztechnology" target="_blank" rel="noopener noreferrer"
              className="hover:text-blue-200 transition"><FaFacebook size={14} /></a>
              <a href="https://youtube.com/@muaztechnology3326" target="_blank" rel="noopener noreferrer"
              className="hover:text-blue-200 transition"><FaYoutube size={14} /></a>
            </div>
            <LanguageToggle />
          </div>
        </div>
      </div>

      {/* Mobile TopBar - Horizontal scroll */}
      <div className="bg-blue-600 text-white md:hidden overflow-x-auto">
        <div className="flex items-center gap-4 px-4 py-2 min-w-max">
          <Link href="/" className="flex items-center gap-1 hover:text-blue-200 transition text-xs font-semibold whitespace-nowrap">
            <Home size={14} /> START HERE
          </Link>
          <Link href="/about" className="flex items-center gap-1 hover:text-blue-200 transition text-xs font-semibold whitespace-nowrap">
            <Settings size={14} /> ABOUT SERVICE
          </Link>
          {/* [NEW] Blog link added for mobile */}
          <Link href="/blog" className="flex items-center gap-1 hover:text-blue-200 transition text-xs font-semibold whitespace-nowrap">
            <Newspaper size={14} /> BLOG
          </Link>
          <Link href="/contact" className="flex items-center gap-1 hover:text-blue-200 transition text-xs font-semibold whitespace-nowrap">
            <Phone size={14} /> CONTACT US
          </Link>
          <div className="flex items-center gap-2 border-l border-blue-400 pl-3">
            <a href="https://www.facebook.com/muaztechnology" target="_blank" rel="noopener noreferrer"
            className="hover:text-blue-200 transition"><FaFacebook size={12} /></a>
            <a href="https://youtube.com/@muaztechnology3326" target="_blank" rel="noopener noreferrer"
            className="hover:text-blue-200 transition"><FaYoutube size={12} /></a>
          </div>
          <LanguageToggle compact />
        </div>
      </div>
    </>
  );
}
