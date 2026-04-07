import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string; sectionId: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const { pageId, sectionId } = await params;
  const body = await request.json();

  const page = await prisma.businessPage.findUnique({
    where: { id: BigInt(pageId) },
  });

  if (!page || page.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const section = await prisma.pageSection.findFirst({
    where: { id: BigInt(sectionId), businessPageId: page.id },
  });

  if (!section) {
    return NextResponse.json({ error: 'Section not found' }, { status: 404 });
  }

  await prisma.pageSection.update({
    where: { id: section.id },
    data: {
      config: body.config,
      isVisible: body.isVisible ?? section.isVisible,
    },
  });

  // Also update the section in page_config JSON
  const pageConfig = page.pageConfig as { sections: Array<{ id: string; type: string; config: object; visible: boolean }> };
  if (pageConfig?.sections) {
    const sectionIndex = pageConfig.sections.findIndex(
      (s) => s.type === section.sectionType
    );
    if (sectionIndex !== -1) {
      pageConfig.sections[sectionIndex].config = body.config;
      if (body.isVisible !== undefined) {
        pageConfig.sections[sectionIndex].visible = body.isVisible;
      }
      await prisma.businessPage.update({
        where: { id: page.id },
        data: { pageConfig },
      });
    }
  }

  return NextResponse.json({ success: true });
}
