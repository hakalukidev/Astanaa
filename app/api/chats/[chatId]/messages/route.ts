import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

type RouteContext = { params: { chatId: string } };

async function assertParticipant(chatId: string, userId: string) {
  const participant = await db.chatParticipant.findUnique({
    where: { chatId_userId: { chatId, userId } },
  });
  return Boolean(participant);
}

// GET - a chat's messages, oldest first.
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const user = await getSessionUser();

  if (!user || !(await assertParticipant(params.chatId, user.id))) {
    return NextResponse.json({ messages: [] }, { status: 401 });
  }

  const rows = await db.message.findMany({
    where: { chatId: params.chatId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    messages: rows.map((row) => ({
      id: row.id,
      senderId: row.senderId,
      text: row.text,
      createdAtMs: row.createdAt.getTime(),
    })),
  });
}

// POST - send a message. senderId always comes from the session, never the
// request body — you can't send as someone else.
export async function POST(request: NextRequest, { params }: RouteContext) {
  const user = await getSessionUser();

  if (!user || !(await assertParticipant(params.chatId, user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { text?: string } | null;
  const text = body?.text?.trim();

  if (!text) {
    return NextResponse.json({ error: "Message text is required." }, { status: 400 });
  }

  await db.$transaction([
    db.message.create({ data: { chatId: params.chatId, senderId: user.id, text } }),
    db.chat.update({
      where: { id: params.chatId },
      data: { lastMessage: text, lastMessageAt: new Date() },
    }),
  ]);

  return NextResponse.json({ success: true }, { status: 201 });
}
