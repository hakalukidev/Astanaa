// One-time (re-runnable) script: replaces whatever is in the Firestore
// `slides` collection (old garage-equipment hero slides) with apartment
// marketplace slides, so the homepage hero shows the right images.
//
// Usage:
//   node --env-file=.env.local scripts/seed-marketplace-slides.mjs

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error(
    "Missing Firebase Admin credentials. Set NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local."
  );
  process.exit(1);
}

const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore(app);

const slides = [
  {
    tag: "Buy & Sell Apartments",
    title: "Find Your Next Home in Bangladesh",
    cta: "BROWSE LISTINGS",
    ctaHref: "/listings",
    bg: "bg-gray-200",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=80",
    imagePublicId: "",
    order: 1,
    isActive: true,
  },
  {
    tag: "Sell Fast",
    title: "Post Your Apartment for Sale or Rent in Minutes",
    cta: "POST YOUR AD",
    ctaHref: "/post-ad",
    bg: "bg-gray-100",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80",
    imagePublicId: "",
    order: 2,
    isActive: true,
  },
  {
    tag: "Verified Listings",
    title: "Modern Apartments Across Every Major City",
    cta: "VIEW LISTINGS",
    ctaHref: "/listings",
    bg: "bg-slate-100",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80",
    imagePublicId: "",
    order: 3,
    isActive: true,
  },
  {
    tag: "Talk to Sellers",
    title: "Chat Directly with Owners, No Middleman",
    cta: "CONTACT US",
    ctaHref: "/contact",
    bg: "bg-gray-200",
    image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1600&q=80",
    imagePublicId: "",
    order: 4,
    isActive: true,
  },
];

async function main() {
  const slidesRef = db.collection("slides");

  const existing = await slidesRef.get();
  console.log(`Found ${existing.size} existing slide(s), deleting...`);

  const deleteBatch = db.batch();
  existing.docs.forEach((docSnapshot) => deleteBatch.delete(docSnapshot.ref));
  if (existing.size > 0) {
    await deleteBatch.commit();
  }

  console.log(`Inserting ${slides.length} apartment marketplace slide(s)...`);
  const now = new Date();

  for (const slide of slides) {
    await slidesRef.add({
      ...slide,
      createdAt: now,
      updatedAt: now,
    });
  }

  console.log("Done. Refresh the homepage to see the new slides.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed slides:", error);
    process.exit(1);
  });
