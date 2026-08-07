'use client';

import {
  Briefcase,
  Building,
  Building2,
  ChevronDown,
  Globe,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Search,
  ShoppingBag,
  Store,
  Trees,
  User,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { homeTranslations } from '@/lib/home-translations';
import { PROPERTY_TYPES } from '@/lib/listings';
import { translations } from '@/lib/site-translations';

const PROPERTY_TYPE_ICONS: Record<string, typeof Building2> = {
  Apartment: Building2,
  Duplex: Building,
  Land: Trees,
  'Commercial Space': Store,
  'Office Space': Briefcase,
  Shop: ShoppingBag,
};

function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { language, toggleLanguage } = useLanguage();
  const label = homeTranslations[language].languageToggleLabel;

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`flex items-center gap-1 rounded border border-brand-mint text-brand-mint hover:bg-brand-mint hover:text-brand-navy transition font-semibold whitespace-nowrap ${
        compact ? 'px-2 py-1 text-xs' : 'px-2.5 py-1 text-xs lg:text-sm'
      }`}
    >
      <Globe size={compact ? 12 : 14} /> {label}
    </button>
  );
}

export default function TopBar() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = translations[language];
  const { user, profile, logOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBrowseOpen, setIsBrowseOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const browseDropdownRef = useRef<HTMLDivElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (browseDropdownRef.current && !browseDropdownRef.current.contains(event.target as Node)) {
        setIsBrowseOpen(false);
      }
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = searchTerm.trim();
    router.push(trimmed ? `/listings?search=${encodeURIComponent(trimmed)}` : '/listings');
    setIsSearchOpen(false);
  }

  async function handleLogOut() {
    await logOut();
    setIsAccountOpen(false);
    router.push('/');
    router.refresh();
  }

  return (
    <div className="sticky top-0 z-50 shadow-md">
      {/* Main bar: logo + browse + search + account (moved in from the old Navbar) */}
      <div className="bg-brand-navy px-4 py-3 md:px-6">
        <div className="hidden lg:flex items-center justify-center gap-6">
          <Link href="/" className="flex items-center shrink-0">
            <Image src="/logo.svg" alt="Astanaa.com" width={60} height={35} className="object-contain" unoptimized priority />
            <span className="ml-2 text-base font-bold text-white leading-tight">ASTANAA.COM</span>
          </Link>

          <div className="relative" ref={browseDropdownRef}>
            <button
              onClick={() => setIsBrowseOpen(!isBrowseOpen)}
              className="flex items-center gap-2 border border-white/25 hover:bg-white/10 px-4 py-2 rounded text-sm font-semibold text-white transition whitespace-nowrap"
            >
              <Menu size={15} />
              {t.topbar.browseTypes}
              <ChevronDown size={13} className={`transition-transform ${isBrowseOpen ? 'rotate-180' : ''}`} />
            </button>

            {isBrowseOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <ul className="py-1">
                  <li>
                    <Link
                      href="/listings"
                      className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-brand-mint/15 hover:text-brand-navy"
                      onClick={() => setIsBrowseOpen(false)}
                    >
                      {t.topbar.allListings}
                    </Link>
                  </li>
                  {PROPERTY_TYPES.map((type) => {
                    const Icon = PROPERTY_TYPE_ICONS[type] ?? Building2;
                    return (
                      <li key={type}>
                        <Link
                          href={`/listings?type=${encodeURIComponent(type)}`}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-brand-mint/15 hover:text-brand-navy"
                          onClick={() => setIsBrowseOpen(false)}
                        >
                          <Icon size={14} /> {t.propertyTypes[type]}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <form onSubmit={handleSearchSubmit} className="w-72">
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t.topbar.searchPlaceholder}
                className="w-full rounded-md border border-transparent bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-brand-mint"
              />
            </div>
          </form>

          <Link
            href="/post-ad"
            className="flex shrink-0 items-center gap-1.5 rounded-md bg-brand-mint px-4 py-2 text-sm font-semibold text-brand-navy transition hover:brightness-95 whitespace-nowrap"
          >
            <Plus size={15} /> {t.topbar.postAd}
          </Link>

          <div className="relative shrink-0" ref={accountDropdownRef}>
            <button
              onClick={() => setIsAccountOpen(!isAccountOpen)}
              className="flex items-center gap-2 border border-white/25 hover:bg-white/10 px-3 py-2 rounded text-sm font-semibold text-white transition whitespace-nowrap"
            >
              <User size={15} />
              {user ? profile?.name?.split(' ')[0] || t.topbar.account : t.topbar.login}
              <ChevronDown size={13} className={`transition-transform ${isAccountOpen ? 'rotate-180' : ''}`} />
            </button>

            {isAccountOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {user ? (
                  <>
                    <Link href="/my-listings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-mint/15 hover:text-brand-navy" onClick={() => setIsAccountOpen(false)}>
                      {t.topbar.myListings}
                    </Link>
                    <Link href="/chat" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-brand-mint/15 hover:text-brand-navy" onClick={() => setIsAccountOpen(false)}>
                      <MessageCircle size={14} /> {t.topbar.messages}
                    </Link>
                    <button onClick={handleLogOut} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                      <LogOut size={14} /> {t.topbar.logOut}
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-mint/15 hover:text-brand-navy" onClick={() => setIsAccountOpen(false)}>
                      {t.topbar.logIn}
                    </Link>
                    <Link href="/signup" className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-mint/15 hover:text-brand-navy" onClick={() => setIsAccountOpen(false)}>
                      {t.topbar.signUp}
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          <LanguageToggle />
        </div>

        {/* Mobile bar */}
        <div className="flex lg:hidden items-center justify-between">
          <Link href="/" className="flex items-center shrink-0">
            <Image src="/logo.svg" alt="Astanaa.com" width={50} height={30} className="object-contain" unoptimized priority />
            <span className="ml-1 text-sm font-bold text-white leading-tight">ASTANAA.COM</span>
          </Link>

          <div className="flex items-center gap-1">
            <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="p-2 hover:bg-white/10 rounded-full">
              <Search size={18} className="text-white" />
            </button>
            <Link href="/post-ad" className="p-2 hover:bg-white/10 rounded-full" aria-label="Post ad">
              <Plus size={18} className="text-brand-mint" />
            </Link>
            <LanguageToggle compact />
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-white/10 rounded-full text-white">
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {isSearchOpen && (
          <form onSubmit={handleSearchSubmit} className="lg:hidden mt-3">
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t.topbar.searchPlaceholder}
                className="w-full rounded-md border border-transparent bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-brand-mint"
                autoFocus
              />
            </div>
          </form>
        )}

        {isMenuOpen && (
          <div className="lg:hidden mt-3 space-y-2">
            <div>
              <button
                onClick={() => setIsBrowseOpen(!isBrowseOpen)}
                className="w-full flex items-center justify-between gap-2 border border-white/25 hover:bg-white/10 px-4 py-2 rounded text-sm font-semibold text-white transition"
              >
                <span className="flex items-center gap-2">
                  <Menu size={16} /> {t.topbar.browseTypes}
                </span>
                <ChevronDown size={14} className={`transition-transform ${isBrowseOpen ? 'rotate-180' : ''}`} />
              </button>

              {isBrowseOpen && (
                <div className="mt-2 ml-4 space-y-1 border-l-2 border-white/20 pl-3">
                  <Link href="/listings" className="block py-2 text-sm text-white/80 hover:text-brand-mint" onClick={() => { setIsBrowseOpen(false); setIsMenuOpen(false); }}>
                    {t.topbar.allListings}
                  </Link>
                  {PROPERTY_TYPES.map((type) => (
                    <Link
                      key={type}
                      href={`/listings?type=${encodeURIComponent(type)}`}
                      className="block py-2 text-sm text-white/80 hover:text-brand-mint"
                      onClick={() => { setIsBrowseOpen(false); setIsMenuOpen(false); }}
                    >
                      {t.propertyTypes[type]}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <>
                <Link href="/my-listings" className="block py-2 text-sm text-white/80 hover:text-brand-mint" onClick={() => setIsMenuOpen(false)}>
                  {t.topbar.myListings}
                </Link>
                <Link href="/chat" className="block py-2 text-sm text-white/80 hover:text-brand-mint" onClick={() => setIsMenuOpen(false)}>
                  {t.topbar.messages}
                </Link>
                <button onClick={handleLogOut} className="block py-2 text-sm text-red-400">
                  {t.topbar.logOut}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block py-2 text-sm text-white/80 hover:text-brand-mint" onClick={() => setIsMenuOpen(false)}>
                  {t.topbar.logIn}
                </Link>
                <Link href="/signup" className="block py-2 text-sm text-white/80 hover:text-brand-mint" onClick={() => setIsMenuOpen(false)}>
                  {t.topbar.signUp}
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
