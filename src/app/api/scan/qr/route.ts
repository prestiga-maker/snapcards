import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';
import { createAutoConnection } from '@/lib/services/dedup';

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const { qrData } = await request.json();

  if (!qrData || typeof qrData !== 'string') {
    return NextResponse.json({ error: 'Invalid QR data' }, { status: 400 });
  }

  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'snap.cards';

  // Parse QR payload — expect snap.cards profile URL
  // Format: https://snap.cards/u/{userId} or https://{username}.snap.cards
  let targetUserId: bigint | null = null;

  // Match /u/{id} pattern
  const profileMatch = qrData.match(new RegExp(`${domain}/u/(\\d+)`));
  if (profileMatch) {
    targetUserId = BigInt(profileMatch[1]);
  }

  // Match {slug}.snap.cards pattern (business page QR)
  if (!targetUserId) {
    const slugMatch = qrData.match(new RegExp(`^https?://([\\w-]+)\\.${domain.replace('.', '\\.')}`));
    if (slugMatch) {
      const slug = slugMatch[1];
      const page = await prisma.businessPage.findUnique({
        where: { slug },
        select: { userId: true },
      });
      if (page) {
        targetUserId = page.userId;
      }
    }
  }

  if (!targetUserId) {
    return NextResponse.json({ error: 'Could not resolve QR code to a user' }, { status: 400 });
  }

  // Can't scan yourself
  if (targetUserId === user.id) {
    return NextResponse.json({
      isSelfScan: true,
      message: 'This is your own QR code',
    });
  }

  // Fetch target user info
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { profile: true },
  });

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Create scanned_cards record
  const card = await prisma.scannedCard.create({
    data: {
      scannerUserId: user.id,
      matchedUserId: targetUserId,
      cardImageUrl: targetUser.avatarUrl || '/default-card.png',
      scanMethod: 'qr',
      firstName: targetUser.profile?.firstName || null,
      lastName: targetUser.profile?.lastName || null,
      jobTitle: targetUser.profile?.jobTitle || null,
      companyName: targetUser.profile?.companyName || null,
      email: targetUser.email,
      phone: targetUser.phone,
      website: targetUser.profile?.website || null,
      isConfirmed: true,
    },
  });

  // Auto-create connection
  await createAutoConnection(user.id, targetUserId, card.id);

  // Increment scan count
  if (targetUser.profile) {
    await prisma.profile.update({
      where: { id: targetUser.profile.id },
      data: { scanCount: { increment: 1 } },
    });
  }

  return NextResponse.json({
    isSelfScan: false,
    connectionCreated: true,
    contact: {
      scanId: card.id.toString(),
      firstName: targetUser.profile?.firstName,
      lastName: targetUser.profile?.lastName,
      companyName: targetUser.profile?.companyName,
      jobTitle: targetUser.profile?.jobTitle,
    },
  });
}
