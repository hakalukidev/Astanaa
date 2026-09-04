import type { Listing as PrismaListing } from "@prisma/client";

import type { Listing, ListingStatus } from "@/lib/listings";

const STATUS_TO_APP: Record<PrismaListing["status"], ListingStatus> = {
  PENDING: "pending",
  ACTIVE: "active",
  SOLD: "sold",
  REJECTED: "rejected",
};

export const STATUS_TO_DB: Record<ListingStatus, PrismaListing["status"]> = {
  pending: "PENDING",
  active: "ACTIVE",
  sold: "SOLD",
  rejected: "REJECTED",
};

const BOOST_STATUS_TO_APP: Record<PrismaListing["boostStatus"], Listing["boost"]["status"]> = {
  NONE: "none",
  PENDING: "pending",
  ACTIVE: "active",
};

export const BOOST_STATUS_TO_DB: Record<"none" | "pending" | "active", PrismaListing["boostStatus"]> = {
  none: "NONE",
  pending: "PENDING",
  active: "ACTIVE",
};

export function mapListingRow(row: PrismaListing): Listing {
  return {
    id: row.id,
    sellerId: row.sellerId,
    sellerName: row.sellerName,
    sellerPhone: row.sellerPhone ?? "",
    sellerWhatsapp: row.sellerWhatsapp ?? "",
    sellerEmail: row.sellerEmail ?? "",
    sellerRole: row.sellerRole === "promoter" ? "promoter" : "client",
    title: row.title,
    description: row.description,
    price: row.price,
    negotiable: row.negotiable,
    purpose: row.purpose,
    propertyType: row.propertyType,
    location: row.location,
    locationDivision: row.locationDivision ?? "",
    locationDistrict: row.locationDistrict ?? "",
    locationUpazila: row.locationUpazila ?? "",
    locationArea: row.locationArea ?? "",
    locationExtra: row.locationExtra,
    locationMapUrl: row.locationMapUrl ?? "",
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    areaSqft: row.areaSqft,
    photoUrls: row.photoUrls,
    photoPublicIds: row.photoPublicIds,
    status: STATUS_TO_APP[row.status],
    boost: {
      status: BOOST_STATUS_TO_APP[row.boostStatus],
      method: (row.boostMethod as Listing["boost"]["method"]) ?? null,
      transactionId: row.boostTransactionId,
      requestedAtMs: row.boostRequestedAt ? row.boostRequestedAt.getTime() : null,
      expiresAtMs: row.boostExpiresAt ? row.boostExpiresAt.getTime() : null,
    },
    createdAtMs: row.createdAt.getTime(),
    updatedAtMs: row.updatedAt.getTime(),
    moderatedBy: row.moderatedBy ?? "",
    moderatedByName: row.moderatedByName ?? "",
    moderatedAtMs: row.moderatedAt ? row.moderatedAt.getTime() : null,
  };
}
