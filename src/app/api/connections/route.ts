import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';

// GET: List connections for the authenticated user
export async function GET(request: NextRequest) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'accepted'; // accepted | pending | all

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    OR: [
      { requesterId: user.id },
      { receiverId: user.id },
    ],
  };

  if (status !== 'all') {
    where.status = status;
  }

  const connections = await prisma.connection.findMany({
    where,
    include: {
      requester: {
        select: { id: true, displayName: true, avatarUrl: true, email: true },
      },
      receiver: {
        select: { id: true, displayName: true, avatarUrl: true, email: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const mapped = connections.map((c) => {
    // Show the "other" user
    const otherUser = c.requesterId === user.id ? c.receiver : c.requester;
    const isRequester = c.requesterId === user.id;

    return {
      id: c.id.toString(),
      status: c.status,
      source: c.source,
      isRequester,
      otherUser: {
        id: otherUser.id.toString(),
        displayName: otherUser.displayName,
        avatarUrl: otherUser.avatarUrl,
        email: otherUser.email,
      },
      createdAt: c.createdAt.toISOString(),
    };
  });

  return NextResponse.json({ connections: mapped });
}

// POST: Send a connection request
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
    return NextResponse.json({ error: 'Cannot connect with yourself' }, { status: 400 });
  }

  // Check target exists
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Check if connection already exists (either direction)
  const existing = await prisma.connection.findFirst({
    where: {
      OR: [
        { requesterId: user.id, receiverId: targetId },
        { requesterId: targetId, receiverId: user.id },
      ],
    },
  });

  if (existing) {
    return NextResponse.json({
      id: existing.id.toString(),
      status: existing.status,
      alreadyExists: true,
    });
  }

  const connection = await prisma.connection.create({
    data: {
      requesterId: user.id,
      receiverId: targetId,
      status: 'pending',
      source: 'manual',
    },
  });

  // Create notification for receiver
  await prisma.notification.create({
    data: {
      userId: targetId,
      type: 'connection_request',
      title: `${user.displayName} wants to connect`,
      body: 'You have a new connection request',
      data: JSON.parse(JSON.stringify({
        connectionId: connection.id.toString(),
        requesterId: user.id.toString(),
        requesterName: user.displayName,
      })),
    },
  });

  return NextResponse.json({
    id: connection.id.toString(),
    status: 'pending',
  }, { status: 201 });
}
