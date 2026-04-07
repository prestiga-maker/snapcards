import { prisma } from '@/lib/db';

interface DedupCheck {
  isDuplicate: boolean;
  existingCardId: bigint | null;
  matchedUserId: bigint | null;
  isSelfScan: boolean;
}

/**
 * Check for duplicate scanned cards and self-scan detection.
 *
 * Dedup rules from spec:
 * - Primary key: email (UNIQUE per scanner)
 * - Secondary: first_name + last_name + company_name (application-level)
 * - Self-scan: scanned email matches scanner's email
 */
export async function checkDuplicate(
  scannerUserId: bigint,
  scannerEmail: string,
  fields: {
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
  }
): Promise<DedupCheck> {
  let isSelfScan = false;

  // Self-scan detection
  if (fields.email && fields.email.toLowerCase() === scannerEmail.toLowerCase()) {
    isSelfScan = true;
  }

  // Check for platform user match (by email)
  let matchedUserId: bigint | null = null;
  if (fields.email) {
    const matchedUser = await prisma.user.findUnique({
      where: { email: fields.email.toLowerCase() },
      select: { id: true },
    });
    if (matchedUser) {
      matchedUserId = matchedUser.id;
    }
  }

  // Check for existing scanned card (primary: email)
  if (fields.email) {
    const existing = await prisma.scannedCard.findFirst({
      where: {
        scannerUserId,
        email: fields.email,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (existing) {
      return {
        isDuplicate: true,
        existingCardId: existing.id,
        matchedUserId,
        isSelfScan,
      };
    }
  }

  // Secondary dedup: name + company (only if no email)
  if (!fields.email && fields.firstName && fields.lastName) {
    const existing = await prisma.scannedCard.findFirst({
      where: {
        scannerUserId,
        firstName: fields.firstName,
        lastName: fields.lastName,
        companyName: fields.companyName || undefined,
        email: null,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (existing) {
      return {
        isDuplicate: true,
        existingCardId: existing.id,
        matchedUserId,
        isSelfScan,
      };
    }
  }

  return {
    isDuplicate: false,
    existingCardId: null,
    matchedUserId,
    isSelfScan,
  };
}

/**
 * Auto-create an accepted connection between scanner and matched user.
 */
export async function createAutoConnection(
  scannerUserId: bigint,
  matchedUserId: bigint,
  scannedCardId: bigint
): Promise<void> {
  // Check if connection already exists (either direction)
  const existing = await prisma.connection.findFirst({
    where: {
      OR: [
        { requesterId: scannerUserId, receiverId: matchedUserId },
        { requesterId: matchedUserId, receiverId: scannerUserId },
      ],
    },
  });

  if (existing) {
    // Update to accepted if pending
    if (existing.status === 'pending') {
      await prisma.connection.update({
        where: { id: existing.id },
        data: { status: 'accepted' },
      });
    }
    return;
  }

  // Create auto-accepted connection
  await prisma.connection.create({
    data: {
      requesterId: scannerUserId,
      receiverId: matchedUserId,
      status: 'accepted',
      source: 'scan',
      scannedCardId,
    },
  });
}

/**
 * Calculate profile completeness for self-scan prompt.
 */
export async function getProfileGaps(
  userId: bigint,
  scannedFields: Record<string, string | null>
): Promise<{ completeness: number; missingFields: string[] }> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return {
      completeness: 0,
      missingFields: ['firstName', 'lastName', 'jobTitle', 'companyName', 'bio', 'website', 'location'],
    };
  }

  const fieldMap: Record<string, string | null> = {
    firstName: profile.firstName || null,
    lastName: profile.lastName || null,
    jobTitle: profile.jobTitle,
    companyName: profile.companyName,
    bio: profile.bio,
    website: profile.website,
    location: profile.location,
    phone: null, // Check user table
  };

  const missingFields: string[] = [];
  const totalFields = Object.keys(fieldMap).length;
  let filledCount = 0;

  for (const [field, value] of Object.entries(fieldMap)) {
    if (value && value.trim()) {
      filledCount++;
    } else if (scannedFields[field]) {
      // Card has this field but profile doesn't — suggest filling it
      missingFields.push(field);
    } else {
      missingFields.push(field);
    }
  }

  return {
    completeness: Math.round((filledCount / totalFields) * 100),
    missingFields,
  };
}
