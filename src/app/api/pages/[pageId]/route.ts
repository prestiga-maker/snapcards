import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';
import { canUseFeature, featureGatedResponse } from '@/lib/services/subscription';
import { compileKnowledgeBase } from '@/lib/services/knowledge-base';

export async function GET(
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
    include: {
      template: { select: { slug: true, name: true, category: true, schema: true, defaultConfig: true } },
      sections: { where: { isVisible: true }, orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!page || page.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: page.id.toString(),
    slug: page.slug,
    businessName: page.businessName,
    tagline: page.tagline,
    isPublished: page.isPublished,
    chatbotEnabled: page.chatbotEnabled,
    customDomain: page.customDomain,
    domainVerified: page.domainVerified,
    pageConfig: page.pageConfig,
    colorScheme: page.colorScheme,
    fontFamily: page.fontFamily,
    template: {
      ...page.template,
      id: undefined,
    },
    sections: page.sections.map((s) => ({
      id: s.id.toString(),
      sectionType: s.sectionType,
      sortOrder: s.sortOrder,
      isVisible: s.isVisible,
      config: s.config,
    })),
  });
}

export async function PATCH(
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
  const id = BigInt(pageId);

  const page = await prisma.businessPage.findUnique({
    where: { id },
  });

  if (!page || page.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const { chatbotEnabled } = body;

  const data: Record<string, unknown> = {};
  if (typeof chatbotEnabled === 'boolean') {
    // Enabling chatbot requires Pro plan
    if (chatbotEnabled && !canUseFeature(user.subscriptionTier, 'chatbot')) {
      return featureGatedResponse('chatbot');
    }
    data.chatbotEnabled = chatbotEnabled;

    // Compile knowledge base when enabling chatbot
    if (chatbotEnabled) {
      await compileKnowledgeBase(id);
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  await prisma.businessPage.update({
    where: { id },
    data,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
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
    data: { isPublished: false },
  });

  return NextResponse.json({ success: true });
}
