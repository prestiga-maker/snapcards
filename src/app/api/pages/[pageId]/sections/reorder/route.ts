import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';

export async function POST(
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
  const { sectionIds } = (await request.json()) as { sectionIds: string[] };

  const page = await prisma.businessPage.findUnique({
    where: { id: BigInt(pageId) },
  });

  if (!page || page.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Update sort order for each section
  for (let i = 0; i < sectionIds.length; i++) {
    await prisma.pageSection.updateMany({
      where: { id: BigInt(sectionIds[i]), businessPageId: page.id },
      data: { sortOrder: i },
    });
  }

  // Update page_config sections order
  const pageConfig = page.pageConfig as { sections: Array<{ id: string; sortOrder: number }> };
  if (pageConfig?.sections) {
    const sectionMap = new Map(pageConfig.sections.map((s) => [s.id, s]));
    pageConfig.sections = sectionIds
      .map((id, i) => {
        const section = sectionMap.get(id);
        if (section) return { ...section, sortOrder: i };
        return null;
      })
      .filter(Boolean) as typeof pageConfig.sections;

    await prisma.businessPage.update({
      where: { id: page.id },
      data: { pageConfig },
    });
  }

  return NextResponse.json({ success: true });
}
