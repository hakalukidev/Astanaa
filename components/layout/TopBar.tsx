'use client';

import {
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Search,
  User,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { PROPERTY_TYPES_BY_PURPOSE, type ListingPurpose } from '@/lib/listings';
import { translations } from '@/lib/site-translations';

const LANGUAGE_FLAG: Record<'bn' | 'en', string> = {
  bn: '🇧🇩',
  en: '🇺🇸',
};

const LANGUAGE_SHORT_LABEL: Record<'bn' | 'en', string> = {
  bn: 'বাং',
  en: 'En',
};

function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`flex items-center gap-1 rounded border border-brand-mint text-brand-mint hover:bg-brand-mint hover:text-brand-navy transition font-semibold whitespace-nowrap ${
        compact ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-xs lg:text-sm'
      }`}
    >
      <span aria-hidden="true">{LANGUAGE_FLAG[language]}</span>
      {LANGUAGE_SHORT_LABEL[language]}
    </button>
  );
}

/** One collapsible "For Rent" / "For Sale" group inside the Browse Property Types menu. */
function PropertyTypeGroup({
  purpose,
  label,
  types,
  propertyTypeLabels,
  isExpanded,
  onToggle,
  onSelect,
  variant,
}: {
  purpose: ListingPurpose;
  label: string;
  types: readonly string[];
  propertyTypeLabels: Record<string, string>;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: (type: string, purpose: ListingPurpose) => void;
  variant: 'light' | 'dark';
}) {
  const light = variant === 'light';

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between gap-2 px-4 py-2 text-sm font-semibold transition ${
          light ? 'text-brand-navy hover:bg-brand-mint/15' : 'text-white hover:text-brand-mint'
        }`}
      >
        {label}
        <ChevronRight size={14} className={`shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>

      {isExpanded && (
        <ul className={light ? 'bg-gray-50 py-1' : 'ml-4 space-y-1 border-l-2 border-white/20 pl-3 py-1'}>
          {types.map((type) => (
            <li key={type}>
              <button
                type="button"
                onClick={() => onSelect(type, purpose)}
                className={`block w-full text-left text-sm transition ${
                  light
                    ? 'px-7 py-1.5 text-gray-600 hover:bg-brand-mint/15 hover:text-brand-navy'
                    : 'py-1.5 text-white/75 hover:text-brand-mint'
                }`}
              >
                {propertyTypeLabels[type] ?? type}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
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
  const [expandedGroup, setExpandedGroup] = useState<ListingPurpose | null>(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const browseDropdownRef = useRef<HTMLDivElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (browseDropdownRef.current && !browseDropdownRef.current.contains(event.target as Node)) {
        setIsBrowseOpen(false);
        setExpandedGroup(null);
      }
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function closeBrowseMenu() {
    setIsBrowseOpen(false);
    setIsMenuOpen(false);
    setExpandedGroup(null);
  }

  function goToPropertyType(type: string, purpose: ListingPurpose) {
    router.push(`/listings?type=${encodeURIComponent(type)}&purpose=${purpose}`);
    closeBrowseMenu();
  }

  function toggleGroup(purpose: ListingPurpose) {
    setExpandedGroup((current) => (current === purpose ? null : purpose));
  }

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
      <div className="bg-brand-navy px-4 py-1.5 md:px-6">
        <div className="hidden lg:flex items-center justify-center gap-6">
          <Link href="/" className="flex items-center shrink-0">
            <Image src="/logo.svg" alt="Astanaa.com" width={52} height={28} className="object-contain" unoptimized priority />
            <span className="ml-2 text-base font-bold text-white leading-tight">ASTANAA.COM</span>
          </Link>

          <div className="relative" ref={browseDropdownRef}>
            <button
              onClick={() => setIsBrowseOpen(!isBrowseOpen)}
              className="flex items-center gap-2 border border-white/25 hover:bg-white/10 px-4 py-1.5 rounded text-sm font-semibold text-white transition whitespace-nowrap"
            >
              <Menu size={15} />
              {t.topbar.browseTypes}
              <ChevronDown size={13} className={`transition-transform ${isBrowseOpen ? 'rotate-180' : ''}`} />
            </button>

            {isBrowseOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <Link
                  href="/listings"
                  className="block px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-brand-mint/15 hover:text-brand-navy"
                  onClick={closeBrowseMenu}
                >
                  {t.topbar.allListings}
                </Link>
                <div className="my-1 border-t border-gray-100" />
                <PropertyTypeGroup
                  purpose="rent"
                  label={t.listings.forRent}
                  types={PROPERTY_TYPES_BY_PURPOSE.rent}
                  propertyTypeLabels={t.propertyTypes}
                  isExpanded={expandedGroup === 'rent'}
                  onToggle={() => toggleGroup('rent')}
                  onSelect={goToPropertyType}
                  variant="light"
                />
                <PropertyTypeGroup
                  purpose="sale"
                  label={t.listings.forSale}
                  types={PROPERTY_TYPES_BY_PURPOSE.sale}
                  propertyTypeLabels={t.propertyTypes}
                  isExpanded={expandedGroup === 'sale'}
                  onToggle={() => toggleGroup('sale')}
                  onSelect={goToPropertyType}
                  variant="light"
                />
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
                className="w-full rounded-md border border-transparent bg-white py-1.5 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-brand-mint"
              />
            </div>
          </form>

          <Link
            href="/post-ad"
            className="flex shrink-0 items-center gap-1.5 rounded-md bg-brand-mint px-4 py-1.5 text-sm font-semibold text-brand-navy transition hover:brightness-95 whitespace-nowrap"
          >
            <Plus size={15} /> {t.topbar.postAd}
          </Link>

          <div className="relative shrink-0" ref={accountDropdownRef}>
            <button
              onClick={() => setIsAccountOpen(!isAccountOpen)}
              aria-label={user ? profile?.name?.split(' ')[0] || t.topbar.account : t.topbar.login}
              className="flex items-center gap-1 border border-white/25 hover:bg-white/10 p-1.5 rounded text-sm font-semibold text-white transition whitespace-nowrap"
            >
              <User size={17} />
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
            <Image src="/logo.svg" alt="Astanaa.com" width={42} height={24} className="object-contain" unoptimized priority />
            <span className="ml-1 text-sm font-bold text-white leading-tight">ASTANAA.COM</span>
          </Link>

          <div className="flex items-center gap-1">
            <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="p-1.5 hover:bg-white/10 rounded-full">
              <Search size={18} className="text-white" />
            </button>
            <Link href="/post-ad" className="p-1.5 hover:bg-white/10 rounded-full" aria-label="Post ad">
              <Plus size={18} className="text-brand-mint" />
            </Link>
            <LanguageToggle compact />
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1.5 hover:bg-white/10 rounded-full text-white">
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
                  <Link href="/listings" className="block py-2 text-sm text-white/80 hover:text-brand-mint" onClick={closeBrowseMenu}>
                    {t.topbar.allListings}
                  </Link>
                  <PropertyTypeGroup
                    purpose="rent"
                    label={t.listings.forRent}
                    types={PROPERTY_TYPES_BY_PURPOSE.rent}
                    propertyTypeLabels={t.propertyTypes}
                    isExpanded={expandedGroup === 'rent'}
                    onToggle={() => toggleGroup('rent')}
                    onSelect={goToPropertyType}
                    variant="dark"
                  />
                  <PropertyTypeGroup
                    purpose="sale"
                    label={t.listings.forSale}
                    types={PROPERTY_TYPES_BY_PURPOSE.sale}
                    propertyTypeLabels={t.propertyTypes}
                    isExpanded={expandedGroup === 'sale'}
                    onToggle={() => toggleGroup('sale')}
                    onSelect={goToPropertyType}
                    variant="dark"
                  />
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
