import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';

export async function GET(request: NextRequest) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'date'; // date | name | company
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    scannerUserId: user.id,
    isConfirmed: true,
    isSelfScan: false,
    deletedAt: null,
  };

  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { companyName: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
    ];
  }

  // Sort
  let orderBy: Record<string, string>;
  switch (sort) {
    case 'name':
      orderBy = { firstName: 'asc' };
      break;
    case 'company':
      orderBy = { companyName: 'asc' };
      break;
    default:
      orderBy = { createdAt: 'desc' };
  }

  const [contacts, total] = await Promise.all([
    prisma.scannedCard.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
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
    }),
    prisma.scannedCard.count({ where }),
  ]);

  const mapped = contacts.map((c) => ({
    id: c.id.toString(),
    firstName: c.firstName,
    lastName: c.lastName,
    companyName: c.companyName,
    jobTitle: c.jobTitle,
    email: c.email,
    phone: c.phone,
    website: c.website,
    address: c.address,
    cardImageUrl: c.cardImageUrl,
    notes: c.notes,
    tags: c.tags,
    eventContext: c.eventContext,
    scanMethod: c.scanMethod,
    createdAt: c.createdAt.toISOString(),
    matchedUser: c.matchedUser
      ? {
          id: c.matchedUser.id.toString(),
          displayName: c.matchedUser.displayName,
          avatarUrl: c.matchedUser.avatarUrl,
        }
      : null,
    connectionStatus: c.connections[0]?.status || null,
  }));

  return NextResponse.json({
    contacts: mapped,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
