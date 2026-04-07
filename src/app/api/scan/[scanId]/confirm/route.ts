import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';
import { checkDuplicate, createAutoConnection, getProfileGaps } from '@/lib/services/dedup';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const { scanId } = await params;
  const body = await request.json();

  const card = await prisma.scannedCard.findFirst({
    where: { id: BigInt(scanId), scannerUserId: user.id },
  });

  if (!card) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
  }

  // User-confirmed fields (they may have edited them)
  const fields = {
    firstName: body.firstName || card.firstName,
    lastName: body.lastName || card.lastName,
    jobTitle: body.jobTitle || card.jobTitle,
    companyName: body.companyName || card.companyName,
    email: body.email || card.email,
    phone: body.phone || card.phone,
    website: body.website || card.website,
    address: body.address || card.address,
    socialLinks: body.socialLinks || card.socialLinks,
    notes: body.notes || null,
    tags: body.tags || null,
    eventContext: body.eventContext || card.eventContext,
  };

  // Dedup check
  const dedup = await checkDuplicate(user.id, user.email, {
    email: fields.email,
    firstName: fields.firstName,
    lastName: fields.lastName,
    companyName: fields.companyName,
  });

  // If duplicate, update existing card instead of creating conflict
  if (dedup.isDuplicate && dedup.existingCardId) {
    await prisma.scannedCard.update({
      where: { id: dedup.existingCardId },
      data: {
        // Merge: keep existing data, fill gaps with new scan
        firstName: fields.firstName,
        lastName: fields.lastName,
        jobTitle: fields.jobTitle,
        companyName: fields.companyName,
        email: fields.email,
        phone: fields.phone,
        website: fields.website,
        address: fields.address,
        ...(fields.socialLinks && { socialLinks: JSON.parse(JSON.stringify(fields.socialLinks)) }),
        ...(fields.notes && { notes: fields.notes }),
        ...(fields.tags && { tags: JSON.parse(JSON.stringify(fields.tags)) }),
        // Keep the new card photo but don't lose the original
        cardImageUrl: card.cardImageUrl,
        isConfirmed: true,
        matchedUserId: dedup.matchedUserId,
        isSelfScan: dedup.isSelfScan,
      },
    });

    // Delete the duplicate scan record (keep the original)
    if (dedup.existingCardId !== card.id) {
      await prisma.scannedCard.update({
        where: { id: card.id },
        data: { deletedAt: new Date() },
      });
    }

    return NextResponse.json({
      isDuplicate: true,
      existingCardId: dedup.existingCardId.toString(),
      isSelfScan: dedup.isSelfScan,
      matchedUserId: dedup.matchedUserId?.toString() || null,
    });
  }

  // Not a duplicate — confirm the card
  await prisma.scannedCard.update({
    where: { id: card.id },
    data: {
      firstName: fields.firstName,
      lastName: fields.lastName,
      jobTitle: fields.jobTitle,
      companyName: fields.companyName,
      email: fields.email,
      phone: fields.phone,
      website: fields.website,
      address: fields.address,
      ...(fields.socialLinks && { socialLinks: JSON.parse(JSON.stringify(fields.socialLinks)) }),
      ...(fields.notes && { notes: fields.notes }),
      ...(fields.tags && { tags: JSON.parse(JSON.stringify(fields.tags)) }),
      ...(fields.eventContext && { eventContext: fields.eventContext }),
      isConfirmed: true,
      matchedUserId: dedup.matchedUserId,
      isSelfScan: dedup.isSelfScan,
    },
  });

  // Auto-create connection if matched to platform user
  if (dedup.matchedUserId && !dedup.isSelfScan) {
    await createAutoConnection(user.id, dedup.matchedUserId, card.id);

    // Increment scan_count on the matched user's profile
    await prisma.profile.updateMany({
      where: { userId: dedup.matchedUserId },
      data: { scanCount: { increment: 1 } },
    });
  }

  // Self-scan response
  if (dedup.isSelfScan) {
    const gaps = await getProfileGaps(user.id, fields as Record<string, string | null>);
    return NextResponse.json({
      isSelfScan: true,
      isDuplicate: false,
      scanId: card.id.toString(),
      profileGaps: gaps,
    });
  }

  return NextResponse.json({
    isSelfScan: false,
    isDuplicate: false,
    scanId: card.id.toString(),
    matchedUserId: dedup.matchedUserId?.toString() || null,
    connectionCreated: !!dedup.matchedUserId,
  });
}
