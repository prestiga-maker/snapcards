import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';
import { canCreatePage } from '@/lib/services/subscription';
import { scrapeSocialUrls } from '@/lib/services/scraper';
import { generatePageContent } from '@/lib/ai/page-generator';
import type { WizardAnswers } from '@/types';

// In-memory generation status tracking (replace with Redis/DB for production)
const generationStatus = new Map<string, { status: string; error?: string }>();

export { generationStatus };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.businessPage.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const body = await request.json();
  const { templateId, wizardAnswers, socialUrls, colorScheme, fontFamily } = body as {
    templateId: string;
    wizardAnswers: WizardAnswers;
    socialUrls?: string[];
    colorScheme?: { primary: string; secondary: string; accent: string };
    fontFamily?: string;
  };

  if (!templateId || !wizardAnswers?.businessName) {
    return NextResponse.json({ error: 'Missing templateId or businessName' }, { status: 400 });
  }

  // Check page creation limit
  const allowed = await canCreatePage(user.id, user.subscriptionTier);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Page limit reached. Upgrade to Pro for up to 10 pages.', upgrade: true },
      { status: 403 }
    );
  }

  const template = await prisma.pageTemplate.findUnique({
    where: { id: BigInt(templateId) },
  });

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  const defaultConfig = template.defaultConfig as { global?: { colorScheme?: object; fontFamily?: string } };
  const finalColorScheme = colorScheme ||
    (defaultConfig?.global?.colorScheme as { primary: string; secondary: string; accent: string }) ||
    { primary: '#ffffff', secondary: '#f8f9fa', accent: '#0066ff' };
  const finalFont = fontFamily || defaultConfig?.global?.fontFamily || 'Inter';

  const slug = await ensureUniqueSlug(slugify(wizardAnswers.businessName));

  // Create the page record immediately with empty config
  const page = await prisma.businessPage.create({
    data: {
      userId: user.id,
      templateId: template.id,
      slug,
      businessName: wizardAnswers.businessName,
      wizardAnswers: wizardAnswers as object,
      colorScheme: finalColorScheme,
      fontFamily: finalFont,
      pageConfig: { sections: [], global: { colorScheme: finalColorScheme, fontFamily: finalFont, logoUrl: null, faviconUrl: null, direction: user.locale === 'he' ? 'rtl' : 'ltr' } },
    },
  });

  const pageId = page.id.toString();
  generationStatus.set(pageId, { status: 'scraping' });

  // Async generation pipeline — don't await
  (async () => {
    try {
      // Step 1: Scrape social media
      let scrapedData: Record<string, unknown> | null = null;
      if (socialUrls?.length) {
        const scraped = await scrapeSocialUrls(socialUrls);
        scrapedData = scraped as unknown as Record<string, unknown>;
        await prisma.businessPage.update({
          where: { id: page.id },
          data: { scrapedSocialData: JSON.parse(JSON.stringify(scrapedData)) },
        });
      }

      generationStatus.set(pageId, { status: 'generating' });

      // Step 2: AI content generation
      const templateSchema = template.schema as { sections: Array<{ type: string; label: string; required: boolean; fields: Record<string, unknown> }> };
      const pageConfig = await generatePageContent({
        templatePrompt: template.aiPromptTemplate,
        templateSchema,
        wizardAnswers,
        scrapedData,
        locale: user.locale || 'en',
        colorScheme: finalColorScheme,
        fontFamily: finalFont,
      });

      // Step 3: Save generated config
      await prisma.businessPage.update({
        where: { id: page.id },
        data: { pageConfig: JSON.parse(JSON.stringify(pageConfig)) },
      });

      // Step 4: Create page_sections rows
      for (const section of pageConfig.sections) {
        await prisma.pageSection.create({
          data: {
            businessPageId: page.id,
            sectionType: section.type,
            sortOrder: section.sortOrder,
            config: JSON.parse(JSON.stringify(section.config)),
          },
        });
      }

      generationStatus.set(pageId, { status: 'ready' });
    } catch (error) {
      console.error('Page generation failed:', error);
      generationStatus.set(pageId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  })();

  return NextResponse.json({ pageId, slug });
}
