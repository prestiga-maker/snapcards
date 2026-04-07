import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';

// GET: List user's conversations
export async function GET() {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const participantRecords = await prisma.conversationParticipant.findMany({
    where: { userId: user.id },
    select: { conversationId: true, lastReadAt: true, isMuted: true },
  });

  if (participantRecords.length === 0) {
    return NextResponse.json({ conversations: [] });
  }

  const conversationIds = participantRecords.map((p) => p.conversationId);

  const conversations = await prisma.conversation.findMany({
    where: { id: { in: conversationIds } },
    include: {
      participants: {
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      },
      messages: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const mapped = conversations.map((conv) => {
    const myParticipant = participantRecords.find((p) => p.conversationId === conv.id);
    const otherParticipants = conv.participants
      .filter((p) => p.userId !== user.id)
      .map((p) => ({
        id: p.user.id.toString(),
        displayName: p.user.displayName,
        avatarUrl: p.user.avatarUrl,
      }));

    const lastMessage = conv.messages[0];
    const unreadCount = myParticipant?.lastReadAt
      ? 0 // We'll compute this properly below
      : lastMessage ? 1 : 0;

    return {
      id: conv.id.toString(),
      type: conv.type,
      participants: otherParticipants,
      lastMessage: lastMessage
        ? {
            content: lastMessage.content,
            senderId: lastMessage.senderId?.toString() || null,
            senderType: lastMessage.senderType,
            createdAt: lastMessage.createdAt.toISOString(),
          }
        : null,
      unreadCount,
      isMuted: myParticipant?.isMuted || false,
      updatedAt: conv.updatedAt.toISOString(),
    };
  });

  // Count unread per conversation properly
  for (const conv of mapped) {
    const myParticipant = participantRecords.find((p) => p.conversationId === BigInt(conv.id));
    if (myParticipant?.lastReadAt) {
      const count = await prisma.message.count({
        where: {
          conversationId: BigInt(conv.id),
          createdAt: { gt: myParticipant.lastReadAt },
          senderId: { not: user.id },
          deletedAt: null,
        },
      });
      conv.unreadCount = count;
    }
  }

  return NextResponse.json({ conversations: mapped });
}

// POST: Create or find a direct conversation
export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const { targetUserId } = await request.json();

  if (!targetUserId) {
    return NextResponse.json({ error: 'targetUserId required' }, { status: 400 });
  }

  const targetId = BigInt(targetUserId);

  if (targetId === user.id) {
    return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
  }

  // Check if direct conversation already exists between these two users
  const existingConv = await prisma.conversation.findFirst({
    where: {
      type: 'direct',
      AND: [
        { participants: { some: { userId: user.id } } },
        { participants: { some: { userId: targetId } } },
      ],
    },
  });

  if (existingConv) {
    return NextResponse.json({ conversationId: existingConv.id.toString() });
  }

  // Create new direct conversation
  const conversation = await prisma.conversation.create({
    data: {
      type: 'direct',
      participants: {
        create: [
          { userId: user.id },
          { userId: targetId },
        ],
      },
    },
  });

  return NextResponse.json(
    { conversationId: conversation.id.toString() },
    { status: 201 }
  );
}
