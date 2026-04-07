import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';

// PATCH: Accept, reject, or block a connection
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ connectionId: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const { connectionId } = await params;
  const { action } = await request.json(); // 'accept' | 'reject' | 'block'

  if (!['accept', 'reject', 'block'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const connection = await prisma.connection.findUnique({
    where: { id: BigInt(connectionId) },
  });

  if (!connection) {
    return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
  }

  // Only the receiver can accept/reject, either party can block
  if (action === 'accept' || action === 'reject') {
    if (connection.receiverId !== user.id) {
      return NextResponse.json({ error: 'Only the receiver can accept or reject' }, { status: 403 });
    }
  } else if (action === 'block') {
    if (connection.requesterId !== user.id && connection.receiverId !== user.id) {
      return NextResponse.json({ error: 'Not your connection' }, { status: 403 });
    }
  }

  const newStatus = action === 'accept' ? 'accepted' : action === 'block' ? 'blocked' : 'rejected';

  await prisma.connection.update({
    where: { id: connection.id },
    data: { status: newStatus },
  });

  // Notify requester of acceptance
  if (action === 'accept') {
    await prisma.notification.create({
      data: {
        userId: connection.requesterId,
        type: 'connection_accepted',
        title: `${user.displayName} accepted your connection`,
        body: 'You are now connected!',
        data: JSON.parse(JSON.stringify({
          connectionId: connection.id.toString(),
          accepterId: user.id.toString(),
        })),
      },
    });
  }

  return NextResponse.json({ status: newStatus });
}

// DELETE: Remove a connection
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ connectionId: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const { connectionId } = await params;

  const connection = await prisma.connection.findUnique({
    where: { id: BigInt(connectionId) },
  });

  if (!connection) {
    return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
  }

  // Either party can delete
  if (connection.requesterId !== user.id && connection.receiverId !== user.id) {
    return NextResponse.json({ error: 'Not your connection' }, { status: 403 });
  }

  await prisma.connection.delete({
    where: { id: connection.id },
  });

  return NextResponse.json({ success: true });
}
