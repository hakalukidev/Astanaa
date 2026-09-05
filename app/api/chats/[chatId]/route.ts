import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

type RouteContext = { params: { chatId: string } };

function mapChat(row: {
  id: string;
  listingId: string;
  listingTitle: string;
  listingPhotoUrl: string | null;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  createdAt: Date;
  participants: { userId: string }[];
}) {
  return {
    id: row.id,
    listingId: row.listingId,
    listingTitle: row.listingTitle,
    listingPhotoUrl: row.listingPhotoUrl ?? "",
    buyerId: row.buyerId,
    buyerName: row.buyerName,
    sellerId: row.sellerId,
    sellerName: row.sellerName,
    participantIds: row.participants.map((p) => p.userId),
    lastMessage: row.lastMessage ?? "",
    lastMessageAtMs: row.lastMessageAt ? row.lastMessageAt.getTime() : null,
    createdAtMs: row.createdAt.getTime(),
  };
}

// GET - a single chat thread. Only a participant can read it.
export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ chat: null }, { status: 401 });
  }

  const chat = await db.chat.findUnique({
    where: { id: params.chatId },
    include: { participants: { select: { userId: true } } },
  });

  if (!chat || !chat.participants.some((p) => p.userId === user.id)) {
    return NextResponse.json({ chat: null }, { status: 404 });
  }

  return NextResponse.json({ chat: mapChat(chat) });
}
