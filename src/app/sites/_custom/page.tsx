import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { TemplateRenderer } from '@/components/pages/TemplateRenderer';
import { ChatbotWidget } from '@/components/chatbot/ChatbotWidget';
import { PageTracker } from '@/components/pages/PageTracker';
import type { PageConfig } from '@/types';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const customDomain = headersList.get('x-custom-domain');
  if (!customDomain) return {};

  const page = await prisma.businessPage.findUnique({
    where: { customDomain, isPublished: true, domainVerified: true },
    select: { businessName: true, seoTitle: true, seoDescription: true, seoImageUrl: true },
  });

  if (!page) return {};

  return {
    title: page.seoTitle || page.businessName,
    description: page.seoDescription || undefined,
    openGraph: {
      title: page.seoTitle || page.businessName,
      description: page.seoDescription || undefined,
      images: page.seoImageUrl ? [page.seoImageUrl] : undefined,
      url: `https://${customDomain}`,
      type: 'website',
    },
  };
}

export default async function CustomDomainPage() {
  const headersList = await headers();
  const customDomain = headersList.get('x-custom-domain');
  if (!customDomain) notFound();

  const page = await prisma.businessPage.findUnique({
    where: { customDomain, isPublished: true, domainVerified: true },
    include: {
      user: { select: { googleCalendarConnected: true } },
    },
  });

  if (!page) notFound();

  const config = page.pageConfig as unknown as PageConfig;
  const accentColor = (config.global?.colorScheme as { accent?: string } | undefined)?.accent || '#2563eb';

  return (
    <html lang={config.global?.direction === 'rtl' ? 'he' : 'en'} dir={config.global?.direction || 'ltr'}>
      <head />
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
