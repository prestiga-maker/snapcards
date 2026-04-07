import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const { pageId } = await params;

  const page = await prisma.businessPage.findUnique({
    where: { id: BigInt(pageId) },
  });

  if (!page || page.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.businessPage.update({
    where: { id: page.id },
    data: {
      isPublished: true,
      publishedAt: new Date(),
      seoTitle: page.seoTitle || page.businessName,
      seoDescription: page.seoDescription || (page.tagline ?? undefined),
    },
  });

  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'snap.cards';

  return NextResponse.json({
    success: true,
    url: `https://${page.slug}.${domain}`,
  });
}
