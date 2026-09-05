// One-time data migration: copies chats + their messages subcollection, and
// buyRequests, from Firestore into Postgres. Notifications are deliberately
// NOT migrated — they're low-value, ephemeral history (old approve/reject
// notices), not worth the FK bookkeeping; the app just starts writing fresh
// ones going forward.
//
// Usage (on the VPS):
//   node --env-file=.env --env-file=.env.local scripts/migrate-engagement-to-postgres.mjs

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { PrismaClient } from "@prisma/client";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim().replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing Firebase Admin credentials.");
  process.exit(1);
}

const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const firestore = getFirestore(app);
const db = new PrismaClient();

function tsToDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (typeof value === "number") return new Date(value);
  return null;
}

async function ensureShadowUser(uid, { name, phone } = {}) {
  if (!uid) return;
  const existing = await db.user.findUnique({ where: { id: uid } });
  if (existing) return;

  await db.user
    .create({
      data: { id: uid, name: name || null, email: `${uid}@migrated.astanaa.local`, phone: phone || null },
    })
    .catch(() => {});
}

async function migrateChats() {
  const snapshot = await firestore.collection("chats").get();
  let chatCount = 0;
  let messageCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    const existing = await db.chat.findUnique({ where: { id: doc.id } });
    if (!existing) {
      await ensureShadowUser(data.buyerId, { name: data.buyerName });
      await ensureShadowUser(data.sellerId, { name: data.sellerName });

      // The listing this chat is about must already exist (listings were
      // migrated in an earlier pass) — skip chats pointing at a listing
      // that was deleted before migration ran.
      const listingExists = data.listingId
        ? await db.listing.findUnique({ where: { id: data.listingId } })
        : null;
      if (!listingExists) {
        console.warn(`chats: skipping ${doc.id} — listing ${data.listingId} no longer exists.`);
        continue;
      }

      await db.chat.create({
        data: {
          id: doc.id,
          listingId: data.listingId,
          listingTitle: data.listingTitle || "",
          listingPhotoUrl: data.listingPhotoUrl || null,
          buyerId: data.buyerId,
          buyerName: data.buyerName || "",
          sellerId: data.sellerId,
          sellerName: data.sellerName || "",
          lastMessage: data.lastMessage || null,
          lastMessageAt: tsToDate(data.lastMessageAt),
          createdAt: tsToDate(data.createdAt) || new Date(),
          participants: {
            create: [{ userId: data.buyerId }, { userId: data.sellerId }],
          },
        },
      });
      chatCount++;
    }

    const messagesSnapshot = await firestore.collection("chats").doc(doc.id).collection("messages").get();
    for (const messageDoc of messagesSnapshot.docs) {
      const messageExists = await db.message.findUnique({ where: { id: messageDoc.id } });
      if (messageExists) continue;

      const messageData = messageDoc.data();
      await ensureShadowUser(messageData.senderId);

      await db.message.create({
        data: {
          id: messageDoc.id,
          chatId: doc.id,
          senderId: messageData.senderId,
          text: messageData.text || "",
          createdAt: tsToDate(messageData.createdAt) || new Date(),
        },
      });
      messageCount++;
    }
  }

  console.log(`chats: migrated ${chatCount} of ${snapshot.size} (plus ${messageCount} messages)`);
}

async function migrateBuyRequests() {
  const snapshot = await firestore.collection("buyRequests").get();
  const STATUS_TO_DB = { pending: "PENDING", accepted: "ACCEPTED", declined: "DECLINED" };
  let count = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const existing = await db.buyRequest.findUnique({ where: { id: doc.id } });
    if (existing) continue;

    const listingExists = data.listingId
      ? await db.listing.findUnique({ where: { id: data.listingId } })
      : null;
    if (!listingExists) {
      console.warn(`buyRequests: skipping ${doc.id} — listing ${data.listingId} no longer exists.`);
      continue;
    }

    await ensureShadowUser(data.buyerId, { name: data.buyerName, phone: data.buyerPhone });
    await ensureShadowUser(data.sellerId);

    await db.buyRequest.create({
      data: {
        id: doc.id,
        listingId: data.listingId,
        listingTitle: data.listingTitle || null,
        buyerId: data.buyerId,
        buyerName: data.buyerName || "",
        buyerPhone: data.buyerPhone || "",
        sellerId: data.sellerId,
        status: STATUS_TO_DB[data.status] || "PENDING",
        createdAt: tsToDate(data.createdAt) || new Date(),
      },
    });
    count++;
  }

  console.log(`buyRequests: migrated ${count} of ${snapshot.size}`);
}

async function main() {
  await migrateChats();
  await migrateBuyRequests();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
