// One-time data migration: copies every listing (and moderationLog entry)
// from Firestore into Postgres. Also creates a minimal "shadow" User row
// for every seller/moderator uid referenced by a listing that doesn't
// already exist in Postgres — full Firebase Auth account migration
// (passwords, login) is a separate later pass; this just makes existing
// listings visible again and keeps their seller_id/moderated_by foreign
// keys valid.
//
// Usage (on the VPS, needs both FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY
// from .env.local and DATABASE_URL from .env):
//   node --env-file=.env --env-file=.env.local scripts/migrate-listings-to-postgres.mjs

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { PrismaClient } from "@prisma/client";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim().replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error(
    "Missing Firebase Admin credentials (NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)."
  );
  process.exit(1);
}

const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const firestore = getFirestore(app);
const db = new PrismaClient();

const STATUS_TO_DB = { active: "ACTIVE", pending: "PENDING", sold: "SOLD", rejected: "REJECTED" };
const BOOST_STATUS_TO_DB = { none: "NONE", pending: "PENDING", active: "ACTIVE", expired: "NONE" };

function tsToDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (typeof value === "number") return new Date(value);
  return null;
}

function toStringArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

async function ensureShadowUser(uid, { name, email, phone } = {}) {
  if (!uid) return;

  const existing = await db.user.findUnique({ where: { id: uid } });
  if (existing) return;

  const placeholderEmail = email && email.trim() ? email.trim().toLowerCase() : `${uid}@migrated.astanaa.local`;

  await db.user.create({
    data: {
      id: uid,
      name: name || null,
      email: placeholderEmail,
      phone: phone && phone.trim() ? phone.trim() : null,
    },
  }).catch(async (error) => {
    // Placeholder email or phone collided with an already-migrated user —
    // fall back to a guaranteed-unique synthetic email so the listing
    // import below still has a valid foreign key to point at.
    if (error?.code === "P2002") {
      await db.user.create({
        data: { id: uid, name: name || null, email: `${uid}@migrated.astanaa.local`, phone: null },
      });
    } else {
      throw error;
    }
  });
}

async function main() {
  const snapshot = await firestore.collection("listings").get();
  console.log(`Found ${snapshot.size} listings in Firestore.`);

  let created = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    const alreadyMigrated = await db.listing.findUnique({ where: { id: doc.id } });
    if (alreadyMigrated) {
      skipped++;
      continue;
    }

    await ensureShadowUser(data.sellerId, {
      name: data.sellerName,
      email: data.sellerEmail,
      phone: data.sellerPhone,
    });

    if (data.moderatedBy) {
      await ensureShadowUser(data.moderatedBy, { name: data.moderatedByName });
    }

    const boost = data.boost || {};

    await db.listing.create({
      data: {
        id: doc.id,
        sellerId: data.sellerId || "",
        sellerName: data.sellerName || "",
        sellerPhone: data.sellerPhone || null,
        sellerWhatsapp: data.sellerWhatsapp || null,
        sellerEmail: data.sellerEmail || null,
        sellerRole: data.sellerRole === "promoter" ? "promoter" : "client",
        title: data.title || "",
        description: data.description || "",
        price: typeof data.price === "number" ? Math.round(data.price) : 0,
        negotiable: data.negotiable === true,
        purpose: data.purpose || "sale",
        propertyType: data.propertyType || "Flat Rent",
        location: data.location || "",
        locationDivision: data.locationDivision || null,
        locationDistrict: data.locationDistrict || null,
        locationUpazila: data.locationUpazila || null,
        locationArea: data.locationArea || null,
        locationExtra: toStringArray(data.locationExtra),
        locationMapUrl: data.locationMapUrl || null,
        bedrooms: typeof data.bedrooms === "number" ? data.bedrooms : null,
        bathrooms: typeof data.bathrooms === "number" ? data.bathrooms : null,
        areaSqft: typeof data.areaSqft === "number" ? data.areaSqft : null,
        photoUrls: toStringArray(data.photoUrls),
        photoPublicIds: toStringArray(data.photoPublicIds),
        status: STATUS_TO_DB[data.status] || "ACTIVE",
        boostStatus: BOOST_STATUS_TO_DB[boost.status] || "NONE",
        boostMethod: boost.method || null,
        boostTransactionId: boost.transactionId || null,
        boostRequestedAt: tsToDate(boost.requestedAtMs) ?? (typeof boost.requestedAtMs === "number" ? new Date(boost.requestedAtMs) : null),
        boostExpiresAt: typeof boost.expiresAtMs === "number" ? new Date(boost.expiresAtMs) : null,
        moderatedBy: data.moderatedBy || null,
        moderatedByName: data.moderatedByName || null,
        moderatedAt: tsToDate(data.moderatedAt),
        createdAt: tsToDate(data.createdAt) || new Date(),
        updatedAt: tsToDate(data.updatedAt) || new Date(),
      },
    });

    created++;
  }

  console.log(`Migrated ${created} listings, skipped ${skipped} already-migrated.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
