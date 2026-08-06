'use client';

import {
  Briefcase,
  Building,
  Building2,
  ChevronDown,
  Globe,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Newspaper,
  Phone,
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
import { FaFacebook, FaYoutube } from 'react-icons/fa';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { homeTranslations } from '@/lib/home-translations';
import { PROPERTY_TYPES } from '@/lib/listings';

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
      className={`flex items-center gap-1 rounded border border-green-400 hover:bg-green-500 transition font-semibold whitespace-nowrap ${
        compact ? 'px-2 py-1 text-xs' : 'px-2.5 py-1 text-xs lg:text-sm'
      }`}
    >
      <Globe size={compact ? 12 : 14} /> {label}
    </button>
  );
}

export default function TopBar() {
  const router = useRouter();
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
      {/* Slim info strip */}
      <div className="bg-green-600 text-white text-sm py-1.5 px-4 hidden md:block">
        <div className="container mx-auto flex justify-between items-center">
          <p className="font-bold text-xs lg:text-sm">Buy, sell, and rent apartments across Bangladesh.</p>
          <div className="flex items-center gap-4 lg:gap-6">
            <Link href="/" className="flex items-center gap-1 hover:text-green-200 transition text-xs lg:text-sm font-semibold">
              <Home size={14} /> START HERE
            </Link>
            <Link href="/about" className="flex items-center gap-1 hover:text-green-200 transition text-xs lg:text-sm font-semibold">
              ABOUT
            </Link>
            <Link href="/blog" className="flex items-center gap-1 hover:text-green-200 transition text-xs lg:text-sm font-semibold">
              <Newspaper size={14} /> BLOG
            </Link>
            <Link href="/contact" className="flex items-center gap-1 hover:text-green-200 transition text-xs lg:text-sm font-semibold">
              <Phone size={14} /> CONTACT US
            </Link>
            <div className="flex items-center gap-2 lg:gap-3 border-l border-green-400 pl-3 lg:pl-4">
              <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-green-200 transition"><FaFacebook size={14} /></a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-green-200 transition"><FaYoutube size={14} /></a>
            </div>
            <LanguageToggle />
          </div>
        </div>
      </div>

      {/* Main bar: logo + browse + search + account (moved in from the old Navbar) */}
      <div className="bg-white px-4 py-3 md:px-6">
        <div className="hidden lg:flex items-center justify-center gap-6">
          <Link href="/" className="flex items-center shrink-0">
            <Image src="/logo.svg" alt="Astanaa.com" width={60} height={35} className="object-contain" unoptimized priority />
            <span className="ml-2 text-base font-bold text-green-700 leading-tight">ASTANAA.COM</span>
          </Link>

          <div className="relative" ref={browseDropdownRef}>
            <button
              onClick={() => setIsBrowseOpen(!isBrowseOpen)}
              className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded text-sm font-semibold text-gray-700 transition whitespace-nowrap"
            >
              <Menu size={15} />
              BROWSE PROPERTY TYPES
              <ChevronDown size={13} className={`transition-transform ${isBrowseOpen ? 'rotate-180' : ''}`} />
            </button>

            {isBrowseOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <ul className="py-1">
                  <li>
                    <Link
                      href="/listings"
                      className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700"
                      onClick={() => setIsBrowseOpen(false)}
                    >
                      All Listings
                    </Link>
                  </li>
                  {PROPERTY_TYPES.map((type) => {
                    const Icon = PROPERTY_TYPE_ICONS[type] ?? Building2;
                    return (
                      <li key={type}>
                        <Link
                          href={`/listings?type=${encodeURIComponent(type)}`}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700"
                          onClick={() => setIsBrowseOpen(false)}
                        >
                          <Icon size={14} /> {type}
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
                placeholder="Search by location, title..."
                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-green-500"
              />
            </div>
          </form>

          <Link
            href="/post-ad"
            className="flex shrink-0 items-center gap-1.5 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 whitespace-nowrap"
          >
            <Plus size={15} /> Post Ad
          </Link>

          <div className="relative shrink-0" ref={accountDropdownRef}>
            <button
              onClick={() => setIsAccountOpen(!isAccountOpen)}
              className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 px-3 py-2 rounded text-sm font-semibold text-gray-700 transition whitespace-nowrap"
            >
              <User size={15} />
              {user ? profile?.name?.split(' ')[0] || 'Account' : 'Login'}
              <ChevronDown size={13} className={`transition-transform ${isAccountOpen ? 'rotate-180' : ''}`} />
            </button>

            {isAccountOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {user ? (
                  <>
                    <Link href="/my-listings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700" onClick={() => setIsAccountOpen(false)}>
                      My Listings
                    </Link>
                    <Link href="/chat" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700" onClick={() => setIsAccountOpen(false)}>
                      <MessageCircle size={14} /> Messages
                    </Link>
                    <button onClick={handleLogOut} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                      <LogOut size={14} /> Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700" onClick={() => setIsAccountOpen(false)}>
                      Log in
                    </Link>
                    <Link href="/signup" className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700" onClick={() => setIsAccountOpen(false)}>
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile bar */}
        <div className="flex lg:hidden items-center justify-between">
          <Link href="/" className="flex items-center shrink-0">
            <Image src="/logo.svg" alt="Astanaa.com" width={50} height={30} className="object-contain" unoptimized priority />
            <span className="ml-1 text-sm font-bold text-green-700 leading-tight">ASTANAA.COM</span>
          </Link>

          <div className="flex items-center gap-1">
            <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="p-2 hover:bg-gray-100 rounded-full">
              <Search size={18} className="text-gray-600" />
            </button>
            <Link href="/post-ad" className="p-2 hover:bg-gray-100 rounded-full" aria-label="Post ad">
              <Plus size={18} className="text-green-600" />
            </Link>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-gray-100 rounded-full">
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
                placeholder="Search by location, title..."
                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-green-500"
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
                className="w-full flex items-center justify-between gap-2 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded text-sm font-semibold text-gray-700 transition"
              >
                <span className="flex items-center gap-2">
                  <Menu size={16} /> BROWSE PROPERTY TYPES
                </span>
                <ChevronDown size={14} className={`transition-transform ${isBrowseOpen ? 'rotate-180' : ''}`} />
              </button>

              {isBrowseOpen && (
                <div className="mt-2 ml-4 space-y-1 border-l-2 border-green-200 pl-3">
                  <Link href="/listings" className="block py-2 text-sm text-gray-600 hover:text-green-600" onClick={() => { setIsBrowseOpen(false); setIsMenuOpen(false); }}>
                    All Listings
                  </Link>
                  {PROPERTY_TYPES.map((type) => (
                    <Link
                      key={type}
                      href={`/listings?type=${encodeURIComponent(type)}`}
                      className="block py-2 text-sm text-gray-600 hover:text-green-600"
                      onClick={() => { setIsBrowseOpen(false); setIsMenuOpen(false); }}
                    >
                      {type}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <>
                <Link href="/my-listings" className="block py-2 text-sm text-gray-600 hover:text-green-600" onClick={() => setIsMenuOpen(false)}>
                  My Listings
                </Link>
                <Link href="/chat" className="block py-2 text-sm text-gray-600 hover:text-green-600" onClick={() => setIsMenuOpen(false)}>
                  Messages
                </Link>
                <button onClick={handleLogOut} className="block py-2 text-sm text-red-600">
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block py-2 text-sm text-gray-600 hover:text-green-600" onClick={() => setIsMenuOpen(false)}>
                  Log in
                </Link>
                <Link href="/signup" className="block py-2 text-sm text-gray-600 hover:text-green-600" onClick={() => setIsMenuOpen(false)}>
                  Sign up
                </Link>
              </>
            )}

            <div className="pt-2 border-t border-gray-200">
              <Link href="/" className="block py-2 text-sm text-gray-600 hover:text-green-600" onClick={() => setIsMenuOpen(false)}>Home</Link>
              <Link href="/about" className="block py-2 text-sm text-gray-600 hover:text-green-600" onClick={() => setIsMenuOpen(false)}>About</Link>
              <Link href="/contact" className="block py-2 text-sm text-gray-600 hover:text-green-600" onClick={() => setIsMenuOpen(false)}>Contact</Link>
              <Link href="/blog" className="block py-2 text-sm text-gray-600 hover:text-green-600" onClick={() => setIsMenuOpen(false)}>Blog</Link>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <a href="#" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-green-600"><FaFacebook size={16} /></a>
                <a href="#" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-green-600"><FaYoutube size={16} /></a>
              </div>
              <LanguageToggle compact />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
