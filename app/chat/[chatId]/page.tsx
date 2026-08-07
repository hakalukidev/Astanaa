"use client";

import { ArrowLeft, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getChatById,
  sendChatMessage,
  subscribeToChatMessages,
  type ChatMessage,
  type ChatThread,
} from "@/lib/chat";
import { translations } from "@/lib/site-translations";

export default function ChatThreadPage() {
  const params = useParams<{ chatId: string }>();
  const chatId = params?.chatId ?? "";
  const router = useRouter();
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const t = translations[language].chat;

  const [chat, setChat] = useState<ChatThread | null>(null);
  const [chatLoading, setChatLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=/chat/${chatId}`);
    }
  }, [loading, user, router, chatId]);

  useEffect(() => {
    let isActive = true;

    getChatById(chatId).then((thread) => {
      if (isActive) {
        setChat(thread);
        setChatLoading(false);
      }
    });

    return () => {
      isActive = false;
    };
  }, [chatId]);

  useEffect(() => {
    const unsubscribe = subscribeToChatMessages(chatId, setMessages);
    return unsubscribe;
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !messageText.trim()) {
      return;
    }

    setIsSending(true);

    try {
      await sendChatMessage(chatId, user.uid, messageText);
      setMessageText("");
    } finally {
      setIsSending(false);
    }
  }

  if (loading || !user || chatLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </main>
    );
  }

  if (!chat || !chat.participantIds.includes(user.uid)) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center text-sm text-gray-500">
        {t.conversationNotFound}
      </main>
    );
  }

  const otherName = chat.buyerId === user.uid ? chat.sellerName : chat.buyerName;

  return (
    <main className="flex min-h-[70vh] flex-col bg-gray-50">
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
        <Link href="/chat" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">
            {otherName || t.astanaaUser}
          </p>
          <Link
            href={`/listings/${chat.listingId}`}
            className="truncate text-xs text-green-700 hover:underline"
          >
            {chat.listingTitle}
          </Link>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((message) => {
          const isMine = message.senderId === user.uid;

          return (
            <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  isMine
                    ? "bg-green-600 text-white"
                    : "border border-gray-200 bg-white text-gray-800"
                }`}
              >
                {message.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-gray-200 bg-white px-4 py-3"
      >
        <input
          type="text"
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
          placeholder={t.messagePlaceholder}
          className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-green-500"
        />
        <button
          type="submit"
          disabled={isSending || !messageText.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-600 text-white transition hover:bg-green-700 disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </main>
  );
}
