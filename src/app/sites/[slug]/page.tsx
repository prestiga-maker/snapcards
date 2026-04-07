import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { TemplateRenderer } from '@/components/pages/TemplateRenderer';
import { ChatbotWidget } from '@/components/chatbot/ChatbotWidget';
import { PageTracker } from '@/components/pages/PageTracker';
import type { PageConfig } from '@/types';

interface SitePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SitePageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.businessPage.findUnique({
    where: { slug, isPublished: true },
    select: { businessName: true, seoTitle: true, seoDescription: true, seoImageUrl: true, slug: true },
  });

  if (!page) return {};

  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'snap.cards';

  return {
    title: page.seoTitle || page.businessName,
    description: page.seoDescription || undefined,
    openGraph: {
      title: page.seoTitle || page.businessName,
      description: page.seoDescription || undefined,
      images: page.seoImageUrl ? [page.seoImageUrl] : undefined,
      url: `https://${page.slug}.${domain}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: page.seoTitle || page.businessName,
      description: page.seoDescription || undefined,
      images: page.seoImageUrl ? [page.seoImageUrl] : undefined,
    },
    alternates: {
      canonical: `https://${page.slug}.${domain}`,
    },
  };
}

function buildJsonLd(page: {
  businessName: string;
  seoDescription: string | null;
  slug: string;
  tagline: string | null;
  seoImageUrl: string | null;
}) {
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'snap.cards';
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: page.businessName,
    description: page.seoDescription || page.tagline || '',
    url: `https://${page.slug}.${domain}`,
    ...(page.seoImageUrl && { image: page.seoImageUrl }),
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

  const config = page.pageConfig as unknown as PageConfig;
  const jsonLd = buildJsonLd(page);
  const accentColor = (config.global?.colorScheme as { accent?: string } | undefined)?.accent || '#2563eb';

  return (
    <html lang={config.global?.direction === 'rtl' ? 'he' : 'en'} dir={config.global?.direction || 'ltr'}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
