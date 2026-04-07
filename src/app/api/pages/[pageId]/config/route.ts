import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const { pageId } = await params;
  const body = await request.json();

  const page = await prisma.businessPage.findUnique({
    where: { id: BigInt(pageId) },
  });

  if (!page || page.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.businessPage.update({
    where: { id: page.id },
    data: {
      pageConfig: body.pageConfig,
      colorScheme: body.colorScheme ?? page.colorScheme,
      fontFamily: body.fontFamily ?? page.fontFamily,
      tagline: body.tagline ?? page.tagline,
      businessName: body.businessName ?? page.businessName,
    },
  });

  return NextResponse.json({ success: true });
}
