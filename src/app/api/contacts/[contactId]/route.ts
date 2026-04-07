import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const { contactId } = await params;

  const card = await prisma.scannedCard.findFirst({
    where: {
      id: BigInt(contactId),
      scannerUserId: user.id,
      deletedAt: null,
    },
    include: {
      matchedUser: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
      connections: {
        where: {
          OR: [
            { requesterId: user.id },
            { receiverId: user.id },
          ],
        },
        select: { id: true, status: true },
        take: 1,
      },
    },
  });

  if (!card) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  }

  return NextResponse.json({
    contact: {
      id: card.id.toString(),
      firstName: card.firstName,
      lastName: card.lastName,
      companyName: card.companyName,
      jobTitle: card.jobTitle,
      email: card.email,
      phone: card.phone,
      website: card.website,
      address: card.address,
      socialLinks: card.socialLinks,
      cardImageUrl: card.cardImageUrl,
      cardImageBackUrl: card.cardImageBackUrl,
      notes: card.notes,
      tags: card.tags,
      eventContext: card.eventContext,
      scanMethod: card.scanMethod,
      confidenceScore: card.confidenceScore ? Number(card.confidenceScore) : null,
      createdAt: card.createdAt.toISOString(),
      matchedUser: card.matchedUser
        ? {
            id: card.matchedUser.id.toString(),
            displayName: card.matchedUser.displayName,
            avatarUrl: card.matchedUser.avatarUrl,
          }
        : null,
      connectionStatus: card.connections[0]?.status || null,
    },
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const { contactId } = await params;
  const body = await request.json();

  const card = await prisma.scannedCard.findFirst({
    where: { id: BigInt(contactId), scannerUserId: user.id, deletedAt: null },
  });

  if (!card) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  }

  await prisma.scannedCard.update({
    where: { id: card.id },
    data: {
      ...(body.firstName !== undefined && { firstName: body.firstName }),
      ...(body.lastName !== undefined && { lastName: body.lastName }),
      ...(body.companyName !== undefined && { companyName: body.companyName }),
      ...(body.jobTitle !== undefined && { jobTitle: body.jobTitle }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.website !== undefined && { website: body.website }),
      ...(body.address !== undefined && { address: body.address }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.tags !== undefined && { tags: JSON.parse(JSON.stringify(body.tags)) }),
      ...(body.socialLinks !== undefined && { socialLinks: JSON.parse(JSON.stringify(body.socialLinks)) }),
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const { contactId } = await params;

  const card = await prisma.scannedCard.findFirst({
    where: { id: BigInt(contactId), scannerUserId: user.id, deletedAt: null },
  });

  if (!card) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  }

  // Soft delete
  await prisma.scannedCard.update({
    where: { id: card.id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
