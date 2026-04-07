import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { TemplateRenderer } from '@/components/pages/TemplateRenderer';
import { ChatbotWidget } from '@/components/chatbot/ChatbotWidget';
import { PageTracker } from '@/components/pages/PageTracker';
import { buildBusinessJsonLd, buildFaqJsonLd } from '@/lib/seo/json-ld';
import type { PageConfig } from '@/types';

interface SitePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SitePageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.businessPage.findUnique({
    where: { slug, isPublished: true },
    select: { businessName: true, seoTitle: true, seoDescription: true, seoImageUrl: true, slug: true, tagline: true, wizardAnswers: true },
  });

  if (!page) return {};

  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'snap.cards';
  const url = `https://${page.slug}.${domain}`;
  const title = page.seoTitle || page.businessName;
  const description = page.seoDescription || page.tagline || undefined;
  const wizard = page.wizardAnswers as Record<string, unknown> | null;

  return {
    title,
    description,
    keywords: [page.businessName, wizard?.industry as string, wizard?.targetAudience as string].filter(Boolean),
    authors: [{ name: page.businessName }],
    creator: page.businessName,
    publisher: 'SNAP.Cards',
    category: (wizard?.industry as string) || undefined,
    openGraph: {
      title,
      description,
      images: page.seoImageUrl ? [page.seoImageUrl] : undefined,
      url,
      type: 'website',
      siteName: page.businessName,
      locale: 'en',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: page.seoImageUrl ? [page.seoImageUrl] : undefined,
    },
    alternates: {
      canonical: url,
    },
    other: {
      'article:author': page.businessName,
      'article:section': (wizard?.industry as string) || '',
    },
  };
}

export default async function SitePage({ params }: SitePageProps) {
  const { slug } = await params;

  const page = await prisma.businessPage.findUnique({
    where: { slug, isPublished: true },
    include: {
      user: { select: { googleCalendarConnected: true } },
    },
  });

  if (!page) notFound();

  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'snap.cards';
  const url = `https://${page.slug}.${domain}`;
  const config = page.pageConfig as unknown as PageConfig;

  const businessJsonLd = buildBusinessJsonLd(
    {
      businessName: page.businessName,
      seoDescription: page.seoDescription,
      tagline: page.tagline,
      seoImageUrl: page.seoImageUrl,
      wizardAnswers: page.wizardAnswers as Record<string, unknown> | null,
      pageConfig: config,
    },
    url,
  );
  const faqJsonLd = buildFaqJsonLd(config, url);
  const accentColor = (config.global?.colorScheme as { accent?: string } | undefined)?.accent || '#2563eb';

  return (
    <html lang={config.global?.direction === 'rtl' ? 'he' : 'en'} dir={config.global?.direction || 'ltr'}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }}
        />
        {faqJsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
          />
        )}
      </head>
      <body>
        <PageTracker pageId={page.id.toString()} />
        <TemplateRenderer config={config} />
        {page.chatbotEnabled && (
          <ChatbotWidget
            pageId={page.id.toString()}
            businessName={page.businessName}
            accentColor={accentColor}
            calendarEnabled={page.user.googleCalendarConnected}
          />
        )}
      </body>
    </html>
  );
}
