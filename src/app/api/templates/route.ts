import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const templates = await prisma.pageTemplate.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      description: true,
      thumbnailUrl: true,
      sortOrder: true,
    },
    orderBy: { sortOrder: 'asc' },
  });

  // Serialize BigInt ids to strings
  const serialized = templates.map((t) => ({
    ...t,
    id: t.id.toString(),
  }));

  return NextResponse.json(serialized);
}
