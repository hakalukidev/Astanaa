import type {
  DocumentData,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Timestamp,
} from "firebase/firestore";

export const LISTINGS_COLLECTION = "listings";

/**
 * Purposes ("For Rent", "For Sale", and whatever an admin adds beyond those)
 * are no longer a fixed pair — they're admin-managed in Firestore, keyed by
 * a stable slug (`ListingPurposeRecord.key`). See lib/listing-purposes.ts,
 * which holds the original rent/sale pair as DEFAULT_LISTING_PURPOSES
 * (seeded in the first time an admin opens the Listing Purposes admin page).
 * The type stays a plain string here since the valid set is now dynamic.
 */
export type ListingPurpose = string;

// Property types (categories) themselves are similarly no longer hardcoded
// here — they're admin-managed in Firestore. See lib/property-type-categories.ts,
// which also holds the original list as DEFAULT_PROPERTY_TYPE_CATEGORIES
// (seeded in the first time an admin opens the Categories admin page).

export type ListingStatus = "active" | "sold" | "pending" | "rejected";

export type BoostStatus = "none" | "pending" | "active" | "expired";
export type BoostPaymentMethod = "bkash" | "nagad" | "rocket" | "card";

/**
 * Fixed boost price shown throughout the app (post-ad/listing detail): ৳100
 * per boosted post. There's no separate "payments" collection — a boost
 * request on a listing *is* the payment record.
 */
export const BOOST_PRICE_BDT = 100;

export type ListingBoost = {
  status: BoostStatus;
  method: BoostPaymentMethod | null;
  transactionId: string | null;
  requestedAtMs: number | null;
  expiresAtMs: number | null;
};

export type Listing = {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerWhatsapp: string;
  sellerEmail: string;
  sellerRole: "client" | "promoter";
  title: string;
  description: string;
  price: number;
  negotiable: boolean;
  purpose: ListingPurpose;
  propertyType: string;
  location: string;
  locationDivision: string;
  locationDistrict: string;
  locationUpazila: string;
  locationArea: string;
  /** Anything an admin nested deeper than Area in the location tree (e.g. Road, Goli). */
  locationExtra: string[];
  /** Google Maps link the seller pasted pointing at the exact house/building
   * (Share -> Copy link from the Maps app, or the address bar URL). Optional —
   * empty string when not provided. See lib/map-link.ts for how it's turned
   * into an embeddable map on the listing detail page. */
  locationMapUrl: string;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqft: number | null;
  photoUrls: string[];
  photoPublicIds: string[];
  status: ListingStatus;
  boost: ListingBoost;
  createdAtMs: number | null;
  updatedAtMs: number | null;
  /** Who last approved/rejected this listing, and when — set by markListingStatus(). */
  moderatedBy: string;
  moderatedByName: string;
  moderatedAtMs: number | null;
};

export type ListingInput = Omit<
  Listing,
  | "id"
  | "boost"
  | "status"
  | "createdAtMs"
  | "updatedAtMs"
  | "moderatedBy"
  | "moderatedByName"
  | "moderatedAtMs"
>;

type ListingSnapshot =
  | QueryDocumentSnapshot<DocumentData>
  | DocumentSnapshot<DocumentData>;

function getTimestampMs(value: unknown) {
  if (!value) {
    return null;
  }

  if (typeof value === "object" && value !== null && "toMillis" in value) {
    return (value as Timestamp).toMillis();
  }

  if (typeof value === "number") {
    return value;
  }

  return null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return null;
}

export function mapListingSnapshot(snapshot: ListingSnapshot): Listing | null {
  const data = snapshot.data();

  if (!data) {
    return null;
  }

  const boostData = (data.boost ?? {}) as Record<string, unknown>;

  return {
    id: snapshot.id,
    sellerId: typeof data.sellerId === "string" ? data.sellerId : "",
    sellerName: typeof data.sellerName === "string" ? data.sellerName : "",
    sellerPhone: typeof data.sellerPhone === "string" ? data.sellerPhone : "",
    sellerWhatsapp: typeof data.sellerWhatsapp === "string" ? data.sellerWhatsapp : "",
    sellerEmail: typeof data.sellerEmail === "string" ? data.sellerEmail : "",
    sellerRole: data.sellerRole === "promoter" ? "promoter" : "client",
    title: typeof data.title === "string" ? data.title : "",
    description: typeof data.description === "string" ? data.description : "",
    price: toNullableNumber(data.price) ?? 0,
    negotiable: data.negotiable === true,
    purpose: typeof data.purpose === "string" && data.purpose ? data.purpose : "sale",
    propertyType:
      typeof data.propertyType === "string" ? data.propertyType : "Flat Rent",
    location: typeof data.location === "string" ? data.location : "",
    locationDivision:
      typeof data.locationDivision === "string" ? data.locationDivision : "",
    locationDistrict:
      typeof data.locationDistrict === "string" ? data.locationDistrict : "",
    locationUpazila:
      typeof data.locationUpazila === "string" ? data.locationUpazila : "",
    locationArea: typeof data.locationArea === "string" ? data.locationArea : "",
    locationExtra: toStringArray(data.locationExtra),
    locationMapUrl: typeof data.locationMapUrl === "string" ? data.locationMapUrl : "",
    bedrooms: toNullableNumber(data.bedrooms),
    bathrooms: toNullableNumber(data.bathrooms),
    areaSqft: toNullableNumber(data.areaSqft),
    photoUrls: toStringArray(data.photoUrls),
    photoPublicIds: toStringArray(data.photoPublicIds),
    status:
      data.status === "sold" || data.status === "pending" || data.status === "rejected"
        ? data.status
        : "active",
    boost: {
      status:
        boostData.status === "pending" ||
        boostData.status === "active" ||
        boostData.status === "expired"
          ? boostData.status
          : "none",
      method:
        boostData.method === "bkash" ||
        boostData.method === "nagad" ||
        boostData.method === "card"
          ? boostData.method
          : null,
      transactionId:
        typeof boostData.transactionId === "string" ? boostData.transactionId : null,
      requestedAtMs: getTimestampMs(boostData.requestedAtMs),
      expiresAtMs: getTimestampMs(boostData.expiresAtMs),
    },
    createdAtMs: getTimestampMs(data.createdAt),
    updatedAtMs: getTimestampMs(data.updatedAt),
    moderatedBy: typeof data.moderatedBy === "string" ? data.moderatedBy : "",
    moderatedByName:
      typeof data.moderatedByName === "string" ? data.moderatedByName : "",
    moderatedAtMs: getTimestampMs(data.moderatedAt),
  };
}

export const MODERATION_LOG_COLLECTION = "moderationLog";

/**
 * Records a moderator permanently removing a listing. Approvals/rejections
 * don't need a log entry — they're already stamped on the listing doc
 * (moderatedBy/moderatedByName/moderatedAt) and that doc keeps existing. A
 * removal deletes the doc outright, so this is the only trace left of who
 * removed what and when. Written by deleteListing() in lib/listing-service.ts.
 */
export type ModerationLogEntry = {
  id: string;
  listingId: string;
  listingTitle: string;
  sellerId: string;
  sellerName: string;
  moderatorUid: string;
  moderatorName: string;
  createdAtMs: number | null;
};

export function mapModerationLogSnapshot(snapshot: ListingSnapshot): ModerationLogEntry | null {
  const data = snapshot.data();

  if (!data) {
    return null;
  }

  return {
    id: snapshot.id,
    listingId: typeof data.listingId === "string" ? data.listingId : "",
    listingTitle: typeof data.listingTitle === "string" ? data.listingTitle : "",
    sellerId: typeof data.sellerId === "string" ? data.sellerId : "",
    sellerName: typeof data.sellerName === "string" ? data.sellerName : "",
    moderatorUid: typeof data.moderatorUid === "string" ? data.moderatorUid : "",
    moderatorName: typeof data.moderatorName === "string" ? data.moderatorName : "",
    createdAtMs: getTimestampMs(data.createdAt),
  };
}

/** Joins the cascading location parts (division, district, upazila/thana, para/mohalla, ...) into one display string, narrowest first. */
export function formatListingLocation(parts: {
  locationDivision: string;
  locationDistrict: string;
  locationUpazila: string;
  locationArea: string;
  locationExtra?: string[];
}) {
  return [
    ...(parts.locationExtra ?? []).slice().reverse(),
    parts.locationArea,
    parts.locationUpazila,
    parts.locationDistrict,
    parts.locationDivision,
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

export function getPrimaryListingPhotoUrl(listing: Listing) {
  return listing.photoUrls[0] ?? "";
}

/**
 * Cloudinary serves the exact upload resolution by default, which is
 * massive overkill for a small admin-list thumbnail (photos are often
 * multi-MB phone camera shots). Cloudinary supports resizing on the fly via
 * URL segment, so this inserts one right after "/upload/" — no re-upload or
 * stored-URL change needed. Falls back to the original URL untouched for
 * anything that isn't a Cloudinary "/upload/" URL (e.g. empty string).
 */
export function getListingThumbnailUrl(url: string, size = 100) {
  if (!url) {
    return url;
  }

  const uploadMarker = "/upload/";
  const markerIndex = url.indexOf(uploadMarker);

  if (markerIndex === -1) {
    return url;
  }

  const insertAt = markerIndex + uploadMarker.length;
  const transform = `w_${size},h_${size},c_fill,q_auto,f_auto/`;

  return url.slice(0, insertAt) + transform + url.slice(insertAt);
}

export function formatListingPrice(price: number) {
  if (!Number.isFinite(price) || price <= 0) {
    return "Price on call";
  }

  return `৳ ${price.toLocaleString("en-BD")}`;
}

/** Preset price bands (BDT) shown in the listings price filter, min/max being inclusive. */
export type PriceBand = { min: number | null; max: number | null };

export const PRICE_BANDS: PriceBand[] = [
  { min: null, max: 50000 },
  { min: 50000, max: 500000 },
  { min: 500000, max: 5000000 },
  { min: 5000000, max: 10000000 },
  { min: 10000000, max: 50000000 },
  { min: 50000000, max: null },
];

/** Whether a listing's price falls within a price band (or a free-typed min/max range) — inclusive at both ends. */
export function matchesPriceBand(price: number, band: PriceBand) {
  const matchesMin = band.min === null || price >= band.min;
  const matchesMax = band.max === null || price <= band.max;
  return matchesMin && matchesMax;
}

type PriceBandLabels = {
  priceUnderPrefix: string;
  priceAbovePrefix: string;
};

/** Human-readable label for one price band/range, e.g. "Under ৳50 K" or "৳50 K - ৳5 L". */
export function formatPriceBandLabel(band: PriceBand, labels: PriceBandLabels) {
  if (band.min === null && band.max !== null) {
    return `${labels.priceUnderPrefix} ${formatCompactBDT(band.max)}`;
  }
  if (band.max === null && band.min !== null) {
    return `${labels.priceAbovePrefix} ${formatCompactBDT(band.min)}`;
  }
  if (band.min !== null && band.max !== null) {
    return `${formatCompactBDT(band.min)} - ${formatCompactBDT(band.max)}`;
  }
  return "";
}

/** Compact "৳39 K / ৳1.5 L / ৳3.1 Cr" style formatting, following the Bangladeshi lakh/crore scale. */
export function formatCompactBDT(amount: number) {
  const trim = (value: number) => {
    const rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  };

  if (amount >= 10000000) {
    return `৳${trim(amount / 10000000)} Cr`;
  }
  if (amount >= 100000) {
    return `৳${trim(amount / 100000)} L`;
  }
  if (amount >= 1000) {
    return `৳${trim(amount / 1000)} K`;
  }
  return `৳${amount.toLocaleString("en-BD")}`;
}

type PostedAtLabels = {
  justNow: string;
  minute: string;
  minutes: string;
  hour: string;
  hours: string;
  day: string;
  days: string;
  ago: string;
};

/**
 * "Posted X ago" for a listing: minutes, then hours, then days, then (past a
 * week) the exact date it was posted — same convention as most marketplaces.
 */
export function formatListingPostedAt(
  createdAtMs: number | null,
  language: "en" | "bn",
  labels: PostedAtLabels
) {
  if (!createdAtMs) {
    return "";
  }

  const diffMs = Date.now() - createdAtMs;
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMinutes < 1) {
    return labels.justNow;
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? labels.minute : labels.minutes} ${labels.ago}`;
  }

  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? labels.hour : labels.hours} ${labels.ago}`;
  }

  if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? labels.day : labels.days} ${labels.ago}`;
  }

  return new Intl.DateTimeFormat(language === "bn" ? "bn-BD" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(createdAtMs);
}

/**
 * Compact "how long it took" duration, e.g. "45m", "3h 20m", "2d 5h" — used
 * to show how long a moderator took between a listing being submitted and
 * approved/rejected.
 */
export function formatDurationMs(durationMs: number) {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return "";
  }

  const totalMinutes = Math.floor(durationMs / (60 * 1000));

  if (totalMinutes < 1) {
    return "<1m";
  }

  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  return `${minutes}m`;
}
