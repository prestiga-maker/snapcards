import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';

// GET: Fetch messages for a conversation (with polling support)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const { conversationId } = await params;
  const convId = BigInt(conversationId);
  const { searchParams } = new URL(request.url);
  const after = searchParams.get('after'); // ISO timestamp for polling
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  // Verify user is a participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      uq_participant: { conversationId: convId, userId: user.id },
    },
  });

  if (!participant) {
    return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    conversationId: convId,
    deletedAt: null,
  };

  // For polling: only fetch messages after a given timestamp
  if (after) {
    where.createdAt = { gt: new Date(after) };
  }

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: after ? 'asc' : 'desc' },
    take: after ? undefined : limit,
    include: {
      sender: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
    },
  });

  // Reverse for initial load (we queried desc for pagination)
  const ordered = after ? messages : messages.reverse();

  // Mark as read
  await prisma.conversationParticipant.update({
    where: { id: participant.id },
    data: { lastReadAt: new Date() },
  });

  return NextResponse.json({
    messages: ordered.map((m) => ({
      id: m.id.toString(),
      content: m.content,
      senderType: m.senderType,
      mediaUrls: m.mediaUrls,
      isOwn: m.senderId === user.id,
      createdAt: m.createdAt.toISOString(),
      sender: m.sender
        ? {
            id: m.sender.id.toString(),
            displayName: m.sender.displayName,
            avatarUrl: m.sender.avatarUrl,
          }
        : null,
    })),
  });
}

// POST: Send a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const { conversationId } = await params;
  const convId = BigInt(conversationId);
  const { content, mediaUrls } = await request.json();

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  // Verify user is a participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      uq_participant: { conversationId: convId, userId: user.id },
    },
  });

  if (!participant) {
    return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
  }

  const message = await prisma.message.create({
    data: {
      conversationId: convId,
      senderId: user.id,
      senderType: 'user',
      content: content.trim(),
      ...(mediaUrls && { mediaUrls: JSON.parse(JSON.stringify(mediaUrls)) }),
    },
    include: {
      sender: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
    },
  });

  // Update conversation's updatedAt
  await prisma.conversation.update({
    where: { id: convId },
    data: { updatedAt: new Date() },
  });

  // Update sender's lastReadAt
  await prisma.conversationParticipant.update({
    where: { id: participant.id },
    data: { lastReadAt: new Date() },
  });

  // Create notification for other participants
  const otherParticipants = await prisma.conversationParticipant.findMany({
    where: {
      conversationId: convId,
      userId: { not: user.id },
      isMuted: false,
    },
    select: { userId: true },
  });

  if (otherParticipants.length > 0) {
    await prisma.notification.createMany({
      data: otherParticipants.map((p) => ({
        userId: p.userId,
        type: 'new_message',
        title: `New message from ${user.displayName}`,
        body: content.slice(0, 100),
        data: JSON.parse(JSON.stringify({
          conversationId: convId.toString(),
          senderId: user.id.toString(),
        })),
      })),
    });
  }

  return NextResponse.json({
    message: {
      id: message.id.toString(),
      content: message.content,
      senderType: message.senderType,
      mediaUrls: message.mediaUrls,
      isOwn: true,
      createdAt: message.createdAt.toISOString(),
      sender: message.sender
        ? {
            id: message.sender.id.toString(),
            displayName: message.sender.displayName,
            avatarUrl: message.sender.avatarUrl,
          }
        : null,
    },
  }, { status: 201 });
}
