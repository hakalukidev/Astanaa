"use client";

import { Loader2, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { subscribeToUserChats, type ChatThread } from "@/lib/chat";
import { translations } from "@/lib/site-translations";

export default function ChatInboxPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const t = translations[language].chat;
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/chat");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = subscribeToUserChats(user.uid, (nextChats) => {
      setChats(nextChats);
      setChatsLoading(false);
    });

    return unsubscribe;
  }, [user]);

  if (loading || !user) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </main>
    );
  }

  return (
    <main className="min-h-[70vh] bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-4">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">{t.messages}</h1>

        {chatsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-green-600" />
          </div>
        ) : chats.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center text-sm text-gray-500">
            {t.noConversations}
          </p>
        ) : (
          <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
            {chats.map((chat) => {
              const otherName = chat.buyerId === user.uid ? chat.sellerName : chat.buyerName;

              return (
                <Link
                  key={chat.id}
                  href={`/chat/${chat.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-gray-50"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-400">
                    {chat.listingPhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={chat.listingPhotoUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <MessageCircle size={18} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {otherName || t.astanaaUser}
                    </p>
                    <p className="truncate text-xs text-gray-500">{chat.listingTitle}</p>
                    {chat.lastMessage ? (
                      <p className="mt-0.5 truncate text-xs text-gray-400">{chat.lastMessage}</p>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
