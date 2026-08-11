'use client';

import {
  Bell,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Search,
  User,
  X,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import LocationCascadeSelect, { type LocationCascadeValue } from '@/components/listings/LocationCascadeSelect';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { subscribeToListingPurposes, type ListingPurposeRecord } from '@/lib/listing-purposes';
import { childrenOf, searchLocationNodes, subscribeToLocationNodes, type LocationNode } from '@/lib/location-nodes';
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
import { getPropertyTypeIcon } from '@/lib/property-type-icons';
import { translations } from '@/lib/site-translations';

const LANGUAGE_SHORT_LABEL: Record<'bn' | 'en', string> = {
  bn: 'বাং',
  en: 'En',
};

/**
 * Renders both language versions of a label stacked in the same grid cell (one
 * hidden via `invisible`, not `hidden`, so it still takes up space). The box
 * ends up sized for whichever language is wider, in *both* languages, so
 * toggling language never resizes the button around the text — only the
 * visible text swaps.
 */
function BilingualLabel({ en, bn }: { en: string; bn: string }) {
  const { language } = useLanguage();
  return (
    <span className="grid">
      <span className={`col-start-1 row-start-1 whitespace-nowrap ${language === 'en' ? '' : 'invisible'}`}>
        {en}
      </span>
      <span className={`col-start-1 row-start-1 whitespace-nowrap ${language === 'bn' ? '' : 'invisible'}`}>
        {bn}
      </span>
    </span>
  );
}

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
      <BilingualLabel en={LANGUAGE_SHORT_LABEL.en} bn={LANGUAGE_SHORT_LABEL.bn} />
    </button>
  );
}

/** One collapsible "For Rent" / "For Sale" group inside the Browse Property Types menu. */
function PropertyTypeGroup({
  purpose,
  label,
  groupIcon: GroupIcon,
  categories,
  language,
  isExpanded,
  onToggle,
  onSelect,
  variant,
}: {
  purpose: ListingPurpose;
  label: string;
  groupIcon: LucideIcon;
  categories: PropertyTypeCategory[];
  language: 'en' | 'bn';
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: (category: PropertyTypeCategory, purpose: ListingPurpose) => void;
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
          {categories.map((category) => {
            const TypeIcon = getPropertyTypeIcon(category.icon);
            return (
              <li key={category.id}>
                <button
                  type="button"
                  onClick={() => onSelect(category, purpose)}
                  className={`flex w-full items-center gap-2 text-left text-sm transition ${
                    light
                      ? 'px-7 py-1.5 text-gray-600 hover:bg-brand-mint/15 hover:text-brand-navy'
                      : 'py-1.5 text-white/75 hover:text-brand-mint'
                  }`}
                >
                  <TypeIcon size={14} className="shrink-0" />
                  {language === 'bn' ? category.bn : category.en}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const EMPTY_LOCATION_VALUE: LocationCascadeValue = {
  locationDivision: '',
  locationDistrict: '',
  locationUpazila: '',
  locationArea: '',
  locationExtra: [],
};

/** Walks the same name chain LocationCascadeSelect just resolved and returns
 * the deepest matched node — so the caller gets that node's `id`/`bn`/`en`,
 * not just the raw name strings the cascade value carries. */
function findDeepestLocationNode(nodes: LocationNode[], value: LocationCascadeValue): LocationNode | null {
  const names = [value.locationDivision, value.locationDistrict, value.locationUpazila, value.locationArea, ...value.locationExtra];
  let parentId: string | null = null;
  let deepest: LocationNode | null = null;

  for (const name of names) {
    if (!name) break;
    const match: LocationNode | undefined = childrenOf(nodes, parentId).find((node) => node.en === name);
    if (!match) break;
    deepest = match;
    parentId = match.id;
  }

  return deepest;
}

/** Flat list of whole-tree text-search hits (see lib/location-nodes.ts
 * searchLocationNodes) — each row shows the matched name plus its ancestor
 * chain, so a match found deep in the tree (e.g. a Thana) is still
 * identifiable without having drilled down to it. */
function LocationSearchResults({
  results,
  onSelect,
  language,
}: {
  results: { node: LocationNode; path: LocationNode[] }[];
  onSelect: (node: LocationNode) => void;
  language: 'en' | 'bn';
}) {
  if (results.length === 0) {
    return (
      <div className="w-72 max-w-full border border-gray-200 px-3 py-4 text-center text-xs text-gray-400">
        {language === 'bn' ? 'কিছু পাওয়া যায়নি' : 'No matches'}
      </div>
    );
  }

  return (
    <ul className="max-h-72 w-72 max-w-full overflow-y-auto border border-gray-200">
      {results.map(({ node, path }) => {
        const ancestry = path.slice(0, -1);
        return (
          <li key={node.id}>
            <button
              type="button"
              onClick={() => onSelect(node)}
              className="block w-full px-3 py-2 text-left text-sm transition hover:bg-green-50"
            >
              <div className="truncate font-medium text-gray-800">
                {language === 'bn' ? node.bn : node.en}
              </div>
              {ancestry.length > 0 && (
                <div className="truncate text-xs text-gray-400">
                  {ancestry.map((ancestor) => (language === 'bn' ? ancestor.bn : ancestor.en)).join(' / ')}
                </div>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Drills Division -> District -> Upazila -> Area exactly like the post-ad
 * form and admin Locations page do — picking a node at any depth counts as
 * a selection (no need to go all the way to Area). If `query` is non-empty,
 * that drill-down is swapped for a flat whole-tree text search instead, so
 * typing directly into the search box finds a location without clicking
 * through every level.
 *
 * The two ways to pick get different callbacks on purpose: a cascade click
 * is one step of a possibly-unfinished drill-down (Division picked doesn't
 * mean "done", District might come next), so `onSelect` must leave the query
 * empty and the panel open. A search-result click is already the final,
 * specific place the user typed for, so `onSelectResult` is the one that
 * should stick — fill the box with that exact pick and close up, not fall
 * back to the Division list. */
function LocationSearchPicker({
  query,
  onSelect,
  onSelectResult,
}: {
  query: string;
  onSelect: (node: LocationNode) => void;
  onSelectResult: (node: LocationNode) => void;
}) {
  const { language } = useLanguage();
  const [nodes, setNodes] = useState<LocationNode[]>([]);
  const [value, setValue] = useState<LocationCascadeValue>(EMPTY_LOCATION_VALUE);

  useEffect(() => subscribeToLocationNodes(setNodes), []);

  function handleChange(next: LocationCascadeValue) {
    setValue(next);
    const deepest = findDeepestLocationNode(nodes, next);
    if (deepest) {
      onSelect(deepest);
    }
  }

  const trimmedQuery = query.trim();
  if (trimmedQuery) {
    const results = searchLocationNodes(nodes, trimmedQuery);
    return <LocationSearchResults results={results} onSelect={onSelectResult} language={language} />;
  }

  return <LocationCascadeSelect value={value} onChange={handleChange} />;
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
  const [isLocationSearchOpen, setIsLocationSearchOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ en: string; bn: string } | null>(null);
  const [locationQuery, setLocationQuery] = useState('');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [propertyTypeCategories, setPropertyTypeCategories] = useState<PropertyTypeCategory[]>([]);
  const [purposes, setPurposes] = useState<ListingPurposeRecord[]>([]);
  // What the Browse trigger button shows — null means "All Listings". Keeping
  // both language variants (not just the current one) lets BilingualLabel
  // size the button for the wider of the two, so toggling language never
  // resizes it around whatever's currently selected.
  const [selectedBrowseLabel, setSelectedBrowseLabel] = useState<{ en: string; bn: string } | null>(
    null
  );
  const browseDropdownRef = useRef<HTMLDivElement>(null);
  // Desktop Browse dropdown stays mounted (just CSS-hidden) below the `lg`
  // breakpoint, so it can't double as the mobile menu's outside-click
  // boundary — the mobile Browse block needs its own ref, same reasoning as
  // the two notification refs below.
  const mobileBrowseDropdownRef = useRef<HTMLDivElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const locationSearchDropdownRef = useRef<HTMLDivElement>(null);
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
  useEffect(() => subscribeToListingPurposes(setPurposes), []);

  const categoriesByPurpose = useMemo(
    () => groupCategoriesByPurpose(propertyTypeCategories),
    [propertyTypeCategories]
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      const isInsideBrowse =
        browseDropdownRef.current?.contains(target) || mobileBrowseDropdownRef.current?.contains(target);
      if (!isInsideBrowse) {
        setIsBrowseOpen(false);
        setExpandedGroup(null);
      }
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(target)) {
        setIsAccountOpen(false);
      }
      if (locationSearchDropdownRef.current && !locationSearchDropdownRef.current.contains(target)) {
        setIsLocationSearchOpen(false);
      }
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

  function goToAllListings() {
    setSelectedBrowseLabel(null);
    closeBrowseMenu();
  }

  function goToPropertyType(category: PropertyTypeCategory, purpose: ListingPurpose) {
    router.push(`/listings?type=${encodeURIComponent(category.en)}&purpose=${purpose}`);
    setSelectedBrowseLabel({ en: category.en, bn: category.bn });
    closeBrowseMenu();
  }

  function toggleGroup(purpose: ListingPurpose) {
    setExpandedGroup((current) => (current === purpose ? null : purpose));
  }

  // Deliberately doesn't close the dropdown/panel — Division -> District ->
  // Upazila -> ... should keep revealing the next column as you drill in
  // (LocationCascadeSelect already does this as long as nothing unmounts it).
  // Every pick still searches immediately, so whichever level you stop at is
  // already live; closing happens on its own via the outside-click handler
  // (desktop) or tapping the search icon again (mobile).
  function handleLocationSelect(node: LocationNode) {
    setSelectedLocation({ en: node.en, bn: node.bn });
    // Reset the typed query, not fill it with the picked name — filling it
    // would make the box non-empty right after a level-by-level pick too,
    // which flips LocationSearchPicker into flat-search mode and kills the
    // Division -> District -> ... drill-down after the very first click.
    setLocationQuery('');
    router.push(`/listings?search=${encodeURIComponent(node.en)}`);
  }

  // A flat search-result pick (as opposed to a cascade level pick) is
  // already the exact, final place the user was looking for — so unlike
  // handleLocationSelect, this fills the box with that pick and closes the
  // panel instead of leaving it open on an empty Division list.
  function handleLocationResultSelect(node: LocationNode, closePanel: () => void) {
    setSelectedLocation({ en: node.en, bn: node.bn });
    setLocationQuery(language === 'bn' ? node.bn : node.en);
    router.push(`/listings?search=${encodeURIComponent(node.en)}`);
    closePanel();
  }

  function clearLocationSearch() {
    setSelectedLocation(null);
    setLocationQuery('');
    router.push('/listings');
    setIsLocationSearchOpen(false);
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
              <BilingualLabel
                en={selectedBrowseLabel?.en ?? translations.en.topbar.allListings}
                bn={selectedBrowseLabel?.bn ?? translations.bn.topbar.allListings}
              />
              <ChevronDown size={13} className={`transition-transform ${isBrowseOpen ? 'rotate-180' : ''}`} />
            </button>

            {isBrowseOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <Link
                  href="/listings"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-brand-mint/15 hover:text-brand-navy"
                  onClick={goToAllListings}
                >
                  <LayoutGrid size={15} className="shrink-0" />
                  {t.topbar.allListings}
                </Link>
                <div className="my-1 border-t border-gray-100" />
                {purposes.map((purposeRecord) => (
                  <PropertyTypeGroup
                    key={purposeRecord.id}
                    purpose={purposeRecord.key}
                    label={language === 'bn' ? purposeRecord.bn : purposeRecord.en}
                    groupIcon={getPropertyTypeIcon(purposeRecord.icon)}
                    categories={categoriesByPurpose[purposeRecord.key] ?? []}
                    language={language}
                    isExpanded={expandedGroup === purposeRecord.key}
                    onToggle={() => toggleGroup(purposeRecord.key)}
                    onSelect={goToPropertyType}
                    variant="light"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="relative w-72" ref={locationSearchDropdownRef}>
            <div className="relative flex w-full items-center">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={locationQuery}
                onChange={(event) => {
                  setLocationQuery(event.target.value);
                  setIsLocationSearchOpen(true);
                }}
                onFocus={() => setIsLocationSearchOpen(true)}
                placeholder={
                  selectedLocation
                    ? (language === 'bn' ? selectedLocation.bn : selectedLocation.en)
                    : t.topbar.searchPlaceholder
                }
                className="w-full rounded-md border border-transparent bg-white py-1.5 pl-9 pr-8 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-brand-mint"
              />
            </div>
            {(selectedLocation || locationQuery) && (
              <button
                type="button"
                onClick={clearLocationSearch}
                aria-label="Clear location"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}

            {isLocationSearchOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-fit max-w-[90vw] rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                <LocationSearchPicker
                  query={locationQuery}
                  onSelect={handleLocationSelect}
                  onSelectResult={(node) => handleLocationResultSelect(node, () => setIsLocationSearchOpen(false))}
                />
              </div>
            )}
          </div>

          <Link
            href="/post-ad"
            className="flex shrink-0 items-center gap-1.5 rounded-md bg-brand-mint px-4 py-1.5 text-sm font-semibold text-brand-navy transition hover:brightness-95 whitespace-nowrap"
          >
            <Plus size={15} /> <BilingualLabel en={translations.en.topbar.postAd} bn={translations.bn.topbar.postAd} />
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
          <div className="lg:hidden mt-3 space-y-2 rounded-lg border border-gray-200 bg-white p-3">
            <div className="relative flex w-full items-center">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={locationQuery}
                onChange={(event) => setLocationQuery(event.target.value)}
                placeholder={
                  selectedLocation
                    ? (language === 'bn' ? selectedLocation.bn : selectedLocation.en)
                    : t.topbar.searchPlaceholder
                }
                className="w-full rounded-md border border-gray-200 py-1.5 pl-9 pr-8 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-brand-mint"
              />
              {(selectedLocation || locationQuery) && (
                <button
                  type="button"
                  onClick={clearLocationSearch}
                  aria-label="Clear location"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <LocationSearchPicker
              query={locationQuery}
              onSelect={handleLocationSelect}
              onSelectResult={(node) => handleLocationResultSelect(node, () => setIsSearchOpen(false))}
            />
          </div>
        )}

        {isMenuOpen && (
          <div className="lg:hidden mt-3 space-y-2">
            <div ref={mobileBrowseDropdownRef}>
              <button
                onClick={() => setIsBrowseOpen(!isBrowseOpen)}
                className="w-full flex items-center justify-between gap-2 border border-white/25 hover:bg-white/10 px-4 py-2 rounded text-sm font-semibold text-white transition"
              >
                <span className="flex items-center gap-2">
                  <Menu size={16} />
                  <BilingualLabel
                    en={selectedBrowseLabel?.en ?? translations.en.topbar.allListings}
                    bn={selectedBrowseLabel?.bn ?? translations.bn.topbar.allListings}
                  />
                </span>
                <ChevronDown size={14} className={`transition-transform ${isBrowseOpen ? 'rotate-180' : ''}`} />
              </button>

              {isBrowseOpen && (
                <div className="mt-2 ml-4 space-y-1 border-l-2 border-white/20 pl-3">
                  <Link href="/listings" className="flex items-center gap-2 py-2 text-sm text-white/80 hover:text-brand-mint" onClick={goToAllListings}>
                    <LayoutGrid size={15} className="shrink-0" />
                    {t.topbar.allListings}
                  </Link>
                  {purposes.map((purposeRecord) => (
                    <PropertyTypeGroup
                      key={purposeRecord.id}
                      purpose={purposeRecord.key}
                      label={language === 'bn' ? purposeRecord.bn : purposeRecord.en}
                      groupIcon={getPropertyTypeIcon(purposeRecord.icon)}
                      categories={categoriesByPurpose[purposeRecord.key] ?? []}
                      language={language}
                      isExpanded={expandedGroup === purposeRecord.key}
                      onToggle={() => toggleGroup(purposeRecord.key)}
                      onSelect={goToPropertyType}
                      variant="dark"
                    />
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
