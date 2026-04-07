import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';

export async function GET() {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const pages = await prisma.businessPage.findMany({
    where: { userId: user.id },
    include: { template: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    pages: pages.map((p) => ({
      id: p.id.toString(),
      slug: p.slug,
      businessName: p.businessName,
      isPublished: p.isPublished,
      templateName: p.template.name,
      createdAt: p.createdAt.toISOString(),
    })),
  });
}
