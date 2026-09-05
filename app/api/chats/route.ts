import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

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

// GET - the signed-in user's own chat threads, newest activity first.
export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ chats: [] });
  }

  const rows = await db.chat.findMany({
    where: { participants: { some: { userId: user.id } } },
    include: { participants: { select: { userId: true } } },
    orderBy: { lastMessageAt: "desc" },
  });

  return NextResponse.json({ chats: rows.map(mapChat) });
}

// POST - getOrCreateChat. The buyer must be the session's own user — you
// can't open a chat pretending to be someone else.
export async function POST(request: NextRequest) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const input = (await request.json().catch(() => null)) as
    | {
        listingId?: string;
        listingTitle?: string;
        listingPhotoUrl?: string;
        buyerId?: string;
        buyerName?: string;
        sellerId?: string;
        sellerName?: string;
      }
    | null;

  if (!input?.listingId || !input?.sellerId) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const buyerId = user.id;

  const existing = await db.chat.findUnique({
    where: { listingId_buyerId: { listingId: input.listingId, buyerId } },
  });

  if (existing) {
    return NextResponse.json({ chatId: existing.id });
  }

  const chat = await db.chat.create({
    data: {
      listingId: input.listingId,
      listingTitle: input.listingTitle || "",
      listingPhotoUrl: input.listingPhotoUrl || null,
      buyerId,
      buyerName: input.buyerName || user.name || user.email,
      sellerId: input.sellerId,
      sellerName: input.sellerName || "",
      participants: {
        create: [{ userId: buyerId }, { userId: input.sellerId }],
      },
    },
  });

  return NextResponse.json({ chatId: chat.id }, { status: 201 });
}
