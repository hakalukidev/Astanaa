import type {
  DocumentData,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Timestamp,
} from "firebase/firestore";

export const LISTINGS_COLLECTION = "listings";

export const PROPERTY_TYPES = [
  "Apartment",
  "Duplex",
  "Land",
  "Commercial Space",
  "Office Space",
  "Shop",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const LISTING_PURPOSES = ["sale", "rent"] as const;
export type ListingPurpose = (typeof LISTING_PURPOSES)[number];

export type ListingStatus = "active" | "sold" | "pending" | "rejected";

export type BoostStatus = "none" | "pending" | "active" | "expired";
export type BoostPaymentMethod = "bkash" | "nagad" | "card";

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
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqft: number | null;
  photoUrls: string[];
  photoPublicIds: string[];
  status: ListingStatus;
  boost: ListingBoost;
  createdAtMs: number | null;
  updatedAtMs: number | null;
};

export type ListingInput = Omit<
  Listing,
  "id" | "boost" | "status" | "createdAtMs" | "updatedAtMs"
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
    purpose: data.purpose === "rent" ? "rent" : "sale",
    propertyType:
      typeof data.propertyType === "string" ? data.propertyType : "Apartment",
    location: typeof data.location === "string" ? data.location : "",
    locationDivision:
      typeof data.locationDivision === "string" ? data.locationDivision : "",
    locationDistrict:
      typeof data.locationDistrict === "string" ? data.locationDistrict : "",
    locationUpazila:
      typeof data.locationUpazila === "string" ? data.locationUpazila : "",
    locationArea: typeof data.locationArea === "string" ? data.locationArea : "",
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
  };
}

/** Joins the cascading location parts (division, district, upazila/thana, para/mohalla) into one display string, narrowest first. */
export function formatListingLocation(parts: {
  locationDivision: string;
  locationDistrict: string;
  locationUpazila: string;
  locationArea: string;
}) {
  return [
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

export function formatListingPrice(price: number) {
  if (!Number.isFinite(price) || price <= 0) {
    return "Price on call";
  }

  return `৳ ${price.toLocaleString("en-BD")}`;
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
