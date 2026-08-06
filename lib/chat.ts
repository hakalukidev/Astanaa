import type {
  DocumentData,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Timestamp,
} from "firebase/firestore";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export const CHATS_COLLECTION = "chats";

export type ChatThread = {
  id: string;
  listingId: string;
  listingTitle: string;
  listingPhotoUrl: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  participantIds: string[];
  lastMessage: string;
  lastMessageAtMs: number | null;
  createdAtMs: number | null;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  text: string;
  createdAtMs: number | null;
};

function getTimestampMs(value: unknown) {
  if (!value) return null;
  if (typeof value === "object" && value !== null && "toMillis" in value) {
    return (value as Timestamp).toMillis();
  }
  return typeof value === "number" ? value : null;
}

function mapChatThread(
  snapshot: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>
): ChatThread {
  const data = snapshot.data() ?? {};

  return {
    id: snapshot.id,
    listingId: typeof data.listingId === "string" ? data.listingId : "",
    listingTitle: typeof data.listingTitle === "string" ? data.listingTitle : "",
    listingPhotoUrl:
      typeof data.listingPhotoUrl === "string" ? data.listingPhotoUrl : "",
    buyerId: typeof data.buyerId === "string" ? data.buyerId : "",
    buyerName: typeof data.buyerName === "string" ? data.buyerName : "",
    sellerId: typeof data.sellerId === "string" ? data.sellerId : "",
    sellerName: typeof data.sellerName === "string" ? data.sellerName : "",
    participantIds: Array.isArray(data.participantIds) ? data.participantIds : [],
    lastMessage: typeof data.lastMessage === "string" ? data.lastMessage : "",
    lastMessageAtMs: getTimestampMs(data.lastMessageAt),
    createdAtMs: getTimestampMs(data.createdAt),
  };
}

/** Deterministic id so re-opening chat for the same listing/buyer reuses the same thread. */
export function buildChatId(listingId: string, buyerId: string) {
  return `${listingId}__${buyerId}`;
}

export async function getChatById(chatId: string): Promise<ChatThread | null> {
  if (!db) {
    return null;
  }

  const snapshot = await getDoc(doc(db, CHATS_COLLECTION, chatId));

  if (!snapshot.exists()) {
    return null;
  }

  return mapChatThread(snapshot);
}

export async function getOrCreateChat(input: {
  listingId: string;
  listingTitle: string;
  listingPhotoUrl: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
}) {
  if (!db) {
    throw new Error("Chat is not available.");
  }

  const chatId = buildChatId(input.listingId, input.buyerId);
  const chatRef = doc(db, CHATS_COLLECTION, chatId);
  const existing = await getDoc(chatRef);

  if (!existing.exists()) {
    await setDoc(chatRef, {
      ...input,
      participantIds: [input.buyerId, input.sellerId],
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  }

  return chatId;
}

export function subscribeToUserChats(
  userId: string,
  onChange: (chats: ChatThread[]) => void
) {
  if (!db) {
    onChange([]);
    return () => {};
  }

  const chatsQuery = query(
    collection(db, CHATS_COLLECTION),
    where("participantIds", "array-contains", userId),
    orderBy("lastMessageAt", "desc")
  );

  return onSnapshot(chatsQuery, (snapshot) => {
    onChange(snapshot.docs.map(mapChatThread));
  });
}

export function subscribeToChatMessages(
  chatId: string,
  onChange: (messages: ChatMessage[]) => void
) {
  if (!db) {
    onChange([]);
    return () => {};
  }

  const messagesQuery = query(
    collection(db, CHATS_COLLECTION, chatId, "messages"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(messagesQuery, (snapshot) => {
    onChange(
      snapshot.docs.map((messageSnapshot) => {
        const data = messageSnapshot.data();

        return {
          id: messageSnapshot.id,
          senderId: typeof data.senderId === "string" ? data.senderId : "",
          text: typeof data.text === "string" ? data.text : "",
          createdAtMs: getTimestampMs(data.createdAt),
        };
      })
    );
  });
}

export async function sendChatMessage(
  chatId: string,
  senderId: string,
  text: string
) {
  if (!db) {
    throw new Error("Chat is not available.");
  }

  const trimmed = text.trim();

  if (!trimmed) {
    return;
  }

  await addDoc(collection(db, CHATS_COLLECTION, chatId, "messages"), {
    senderId,
    text: trimmed,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, CHATS_COLLECTION, chatId), {
    lastMessage: trimmed,
    lastMessageAt: serverTimestamp(),
  });
}
