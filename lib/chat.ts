"use client";

const MESSAGES_POLL_INTERVAL_MS = 4000;
const CHATS_POLL_INTERVAL_MS = 6000;

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

export async function getChatById(chatId: string): Promise<ChatThread | null> {
  const response = await fetch(`/api/chats/${chatId}`);
  if (!response.ok) return null;
  const data = (await response.json()) as { chat: ChatThread | null };
  return data.chat;
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
  const response = await fetch("/api/chats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Could not start chat.");
  }

  const data = (await response.json()) as { chatId: string };
  return data.chatId;
}

/** Polls the signed-in user's own chat threads. `userId` is kept for
 * call-site compatibility — the server always scopes to the session. */
export function subscribeToUserChats(_userId: string, onChange: (chats: ChatThread[]) => void) {
  let cancelled = false;

  async function tick() {
    try {
      const response = await fetch("/api/chats");
      const data = (await response.json()) as { chats: ChatThread[] };
      if (!cancelled) onChange(data.chats);
    } catch {
      // Transient poll failure — keep showing whatever we had.
    }
  }

  tick();
  const interval = setInterval(tick, CHATS_POLL_INTERVAL_MS);

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}

/** Polls one chat's messages — a shorter interval than the thread list for
 * a more "live" feel while actually looking at a conversation. */
export function subscribeToChatMessages(chatId: string, onChange: (messages: ChatMessage[]) => void) {
  let cancelled = false;

  async function tick() {
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`);
      const data = (await response.json()) as { messages: ChatMessage[] };
      if (!cancelled) onChange(data.messages);
    } catch {
      // Transient poll failure — keep showing whatever we had.
    }
  }

  tick();
  const interval = setInterval(tick, MESSAGES_POLL_INTERVAL_MS);

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}

/** `senderId` is kept for call-site compatibility — the server always uses
 * the session's own user id, never a client-supplied one. */
export async function sendChatMessage(chatId: string, _senderId: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;

  await fetch(`/api/chats/${chatId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: trimmed }),
  });
}
