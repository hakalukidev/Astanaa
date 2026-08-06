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
  sellerRole: "client" | "promoter";
  title: string;
  description: string;
  price: number;
  purpose: ListingPurpose;
  propertyType: string;
  location: string;
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
    sellerRole: data.sellerRole === "promoter" ? "promoter" : "client",
    title: typeof data.title === "string" ? data.title : "",
    description: typeof data.description === "string" ? data.description : "",
    price: toNullableNumber(data.price) ?? 0,
    purpose: data.purpose === "rent" ? "rent" : "sale",
    propertyType:
      typeof data.propertyType === "string" ? data.propertyType : "Apartment",
    location: typeof data.location === "string" ? data.location : "",
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

export function getPrimaryListingPhotoUrl(listing: Listing) {
  return listing.photoUrls[0] ?? "";
}

export function formatListingPrice(price: number) {
  if (!Number.isFinite(price) || price <= 0) {
    return "Price on call";
  }

  return `৳ ${price.toLocaleString("en-BD")}`;
}
