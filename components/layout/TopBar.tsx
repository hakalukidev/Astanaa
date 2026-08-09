'use client';

import {
  Bell,
  Bike,
  Briefcase,
  Building,
  Building2,
  Car,
  ChevronDown,
  ChevronRight,
  DoorOpen,
  KeyRound,
  LayoutGrid,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Store,
  Tag,
  Trees,
  User,
  Users,
  Warehouse,
  X,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatListingPostedAt, type ListingPurpose } from '@/lib/listings';
import {
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToUserNotifications,
  type AppNotification,
} from '@/lib/notifications';
import {
  groupCategoriesByPurpose,
  subscribeToPropertyTypeCategories,
  type PropertyTypeCategory,
} from '@/lib/property-type-categories';
import { translations } from '@/lib/site-translations';

const LANGUAGE_SHORT_LABEL: Record<'bn' | 'en', string> = {
  bn: 'বাং',
  en: 'En',
};

/**
 * Inline SVG flags instead of flag emoji (🇧🇩/🇺🇸) — emoji flags depend on the
 * OS having a font that renders regional-indicator pairs as a flag glyph.
 * Windows doesn't ship one by default, so they show blank/as letters there;
 * an SVG renders identically on every device.
 */
function FlagIcon({ language, className }: { language: 'bn' | 'en'; className?: string }) {
  if (language === 'bn') {
    return (
      <svg viewBox="0 0 36 24" className={className} aria-hidden="true">
        <rect width="36" height="24" fill="#006A4E" />
        <circle cx="16" cy="12" r="7" fill="#F42A41" />
      </svg>
    );
  }

  const stripeHeight = 24 / 13;

  return (
    <svg viewBox="0 0 36 24" className={className} aria-hidden="true">
      <rect width="36" height="24" fill="#B22234" />
      {Array.from({ length: 6 }).map((_, i) => (
        <rect key={i} x={0} y={(i * 2 + 1) * stripeHeight} width="36" height={stripeHeight} fill="#fff" />
      ))}
      <rect x="0" y="0" width="16" height={7 * stripeHeight} fill="#3C3B6E" />
    </svg>
  );
}

/** Icon shown before each property-type row in the Browse menu — falls back to Building2. */
const PROPERTY_TYPE_ICONS: Record<string, LucideIcon> = {
  'Flat Rent': Building2,
  Sublet: DoorOpen,
  Roommate: Users,
  Shop: Store,
  'Office/Commercial Space': Briefcase,
  'Sublet Office': DoorOpen,
  Warehouse: Warehouse,
  'Motorcycle Garage': Bike,
  'Car Garage': Car,
  'Flat Sell': Building2,
  'Shop Sell': Store,
  'Office/Commercial Space Sell': Briefcase,
  'Building With Land Sell': Building,
  'Land Sell': Trees,
  'Motorcycle Garage Sell': Bike,
  'Car Garage Sell': Car,
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
      <FlagIcon language={language} className="h-3 w-4 shrink-0 rounded-sm" />
      {LANGUAGE_SHORT_LABEL[language]}
    </button>
  );
}

/** One collapsible "For Rent" / "For Sale" group inside the Browse Property Types menu. */
function PropertyTypeGroup({
  purpose,
  label,
  groupIcon: GroupIcon,
  types,
  propertyTypeLabels,
  isExpanded,
  onToggle,
  onSelect,
  variant,
}: {
  purpose: ListingPurpose;
  label: string;
  groupIcon: LucideIcon;
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
        <span className="flex items-center gap-2">
          <GroupIcon size={15} className="shrink-0" />
          {label}
        </span>
        <ChevronRight size={14} className={`shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>

      {isExpanded && (
        <ul className={light ? 'bg-gray-50 py-1' : 'ml-4 space-y-1 border-l-2 border-white/20 pl-3 py-1'}>
          {types.map((type) => {
            const TypeIcon = PROPERTY_TYPE_ICONS[type] ?? Building2;
            return (
              <li key={type}>
                <button
                  type="button"
                  onClick={() => onSelect(type, purpose)}
                  className={`flex w-full items-center gap-2 text-left text-sm transition ${
                    light
                      ? 'px-7 py-1.5 text-gray-600 hover:bg-brand-mint/15 hover:text-brand-navy'
                      : 'py-1.5 text-white/75 hover:text-brand-mint'
                  }`}
                >
                  <TypeIcon size={14} className="shrink-0" />
                  {propertyTypeLabels[type] ?? type}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

type NotificationLabels = {
  title: string;
  markAllRead: string;
  empty: string;
  approvedPrefix: string;
  approvedSuffix: string;
  rejectedSuffix: string;
};

function getNotificationMessage(notification: AppNotification, labels: NotificationLabels) {
  const suffix = notification.type === 'listing_rejected' ? labels.rejectedSuffix : labels.approvedSuffix;
  return `${labels.approvedPrefix} "${notification.listingTitle}" ${suffix}`;
}

/** Presentational bell + dropdown — notification data/handlers live in TopBar so the single
 * Firestore subscription is shared between the desktop and mobile trees (both mounted at once). */
function NotificationBell({
  notifications,
  unreadCount,
  isOpen,
  onToggle,
  onMarkAllRead,
  onSelectNotification,
  labels,
  language,
  timeLabels,
  dropdownRef,
}: {
  notifications: AppNotification[];
  unreadCount: number;
  isOpen: boolean;
  onToggle: () => void;
  onMarkAllRead: () => void;
  onSelectNotification: (notification: AppNotification) => void;
  labels: NotificationLabels;
  language: 'en' | 'bn';
  timeLabels: Parameters<typeof formatListingPostedAt>[2];
  dropdownRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        type="button"
        onClick={onToggle}
        aria-label={labels.title}
        className="relative flex items-center border border-white/25 hover:bg-white/10 p-1.5 rounded text-sm font-semibold text-white transition"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] rounded-lg border border-gray-200 bg-white shadow-lg z-50">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
            <span className="text-sm font-semibold text-brand-navy">{labels.title}</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="text-xs font-medium text-brand-mint hover:underline"
              >
                {labels.markAllRead}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">{labels.empty}</p>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => onSelectNotification(notification)}
                      className={`block w-full border-b border-gray-50 px-4 py-3 text-left text-sm transition hover:bg-brand-mint/10 ${
                        notification.read ? 'text-gray-500' : 'bg-blue-50/60 font-medium text-gray-800'
                      }`}
                    >
                      <span className="flex items-start gap-2">
                        {!notification.read && (
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-mint" />
                        )}
                        <span>
                          {getNotificationMessage(notification, labels)}
                          <span className="mt-0.5 block text-xs text-gray-400">
                            {formatListingPostedAt(notification.createdAtMs, language, timeLabels)}
                          </span>
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
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
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [propertyTypeCategories, setPropertyTypeCategories] = useState<PropertyTypeCategory[]>([]);
  const browseDropdownRef = useRef<HTMLDivElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  // Two refs because the desktop and mobile bell each render their own trigger
  // + panel, and both trees are mounted at once (only one is CSS-visible at a
  // given viewport) — either one being clicked should count as "inside".
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);
  const mobileNotificationsDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    return subscribeToUserNotifications(user.uid, setNotifications);
  }, [user]);

  useEffect(() => subscribeToPropertyTypeCategories(setPropertyTypeCategories), []);

  const categoriesByPurpose = useMemo(
    () => groupCategoriesByPurpose(propertyTypeCategories),
    [propertyTypeCategories]
  );
  const categoryLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    for (const category of propertyTypeCategories) {
      labels[category.en] = language === 'bn' ? category.bn : category.en;
    }
    return labels;
  }, [propertyTypeCategories, language]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (browseDropdownRef.current && !browseDropdownRef.current.contains(event.target as Node)) {
        setIsBrowseOpen(false);
        setExpandedGroup(null);
      }
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
      const target = event.target as Node;
      const isInsideNotifications =
        notificationsDropdownRef.current?.contains(target) ||
        mobileNotificationsDropdownRef.current?.contains(target);
      if (!isInsideNotifications) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadNotificationCount = notifications.filter((notification) => !notification.read).length;

  function handleSelectNotification(notification: AppNotification) {
    if (!notification.read) {
      markNotificationRead(notification.id).catch(() => {});
    }
    setIsNotificationsOpen(false);
    router.push(`/listings/${notification.listingId}`);
  }

  function handleMarkAllNotificationsRead() {
    const unreadIds = notifications.filter((notification) => !notification.read).map((n) => n.id);
    markAllNotificationsRead(unreadIds).catch(() => {});
  }

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
              {t.topbar.allListings}
              <ChevronDown size={13} className={`transition-transform ${isBrowseOpen ? 'rotate-180' : ''}`} />
            </button>

            {isBrowseOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <Link
                  href="/listings"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-brand-mint/15 hover:text-brand-navy"
                  onClick={closeBrowseMenu}
                >
                  <LayoutGrid size={15} className="shrink-0" />
                  {t.topbar.allListings}
                </Link>
                <div className="my-1 border-t border-gray-100" />
                <PropertyTypeGroup
                  purpose="rent"
                  label={t.listings.forRent}
                  groupIcon={KeyRound}
                  types={categoriesByPurpose.rent.map((category) => category.en)}
                  propertyTypeLabels={categoryLabels}
                  isExpanded={expandedGroup === 'rent'}
                  onToggle={() => toggleGroup('rent')}
                  onSelect={goToPropertyType}
                  variant="light"
                />
                <PropertyTypeGroup
                  purpose="sale"
                  label={t.listings.forSale}
                  groupIcon={Tag}
                  types={categoriesByPurpose.sale.map((category) => category.en)}
                  propertyTypeLabels={categoryLabels}
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

          {user && (
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadNotificationCount}
              isOpen={isNotificationsOpen}
              onToggle={() => setIsNotificationsOpen((open) => !open)}
              onMarkAllRead={handleMarkAllNotificationsRead}
              onSelectNotification={handleSelectNotification}
              labels={t.notifications}
              language={language}
              timeLabels={t.listings.time}
              dropdownRef={notificationsDropdownRef}
            />
          )}

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
            {user && (
              <NotificationBell
                notifications={notifications}
                unreadCount={unreadNotificationCount}
                isOpen={isNotificationsOpen}
                onToggle={() => setIsNotificationsOpen((open) => !open)}
                onMarkAllRead={handleMarkAllNotificationsRead}
                onSelectNotification={handleSelectNotification}
                labels={t.notifications}
                language={language}
                timeLabels={t.listings.time}
                dropdownRef={mobileNotificationsDropdownRef}
              />
            )}
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
                  <Menu size={16} /> {t.topbar.allListings}
                </span>
                <ChevronDown size={14} className={`transition-transform ${isBrowseOpen ? 'rotate-180' : ''}`} />
              </button>

              {isBrowseOpen && (
                <div className="mt-2 ml-4 space-y-1 border-l-2 border-white/20 pl-3">
                  <Link href="/listings" className="flex items-center gap-2 py-2 text-sm text-white/80 hover:text-brand-mint" onClick={closeBrowseMenu}>
                    <LayoutGrid size={15} className="shrink-0" />
                    {t.topbar.allListings}
                  </Link>
                  <PropertyTypeGroup
                    purpose="rent"
                    label={t.listings.forRent}
                    groupIcon={KeyRound}
                    types={categoriesByPurpose.rent.map((category) => category.en)}
                    propertyTypeLabels={categoryLabels}
                    isExpanded={expandedGroup === 'rent'}
                    onToggle={() => toggleGroup('rent')}
                    onSelect={goToPropertyType}
                    variant="dark"
                  />
                  <PropertyTypeGroup
                    purpose="sale"
                    label={t.listings.forSale}
                    groupIcon={Tag}
                    types={categoriesByPurpose.sale.map((category) => category.en)}
                    propertyTypeLabels={categoryLabels}
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
