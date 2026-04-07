import type { Metadata } from 'next';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { Inter, Heebo } from 'next/font/google';
import { routing } from '@/i18n/routing';
import { localeDirection } from '@/i18n/config';
import { buildOrganizationJsonLd, buildWebSiteJsonLd, buildSoftwareAppJsonLd } from '@/lib/seo/json-ld';
import type { Locale } from '@/types';
import '@/app/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const heebo = Heebo({ subsets: ['hebrew', 'latin'], variable: '--font-heebo' });

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'snap.cards';

export const metadata: Metadata = {
  title: {
    default: 'SNAP.Cards — AI-Powered Business Networking',
    template: '%s | SNAP.Cards',
  },
  description:
    'Build AI-powered business pages, scan business cards, and network with professionals.',
  keywords: ['business cards', 'digital business card', 'AI business page', 'business networking', 'card scanner', 'OCR', 'QR code', 'NFC'],
  authors: [{ name: 'SNAP.Cards' }],
  creator: 'SNAP.Cards',
  publisher: 'SNAP.Cards',
  category: 'Business',
  metadataBase: new URL(`https://${domain}`),
  openGraph: {
    siteName: 'SNAP.Cards',
    type: 'website',
    locale: 'en',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@snapcards',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SNAP.Cards',
  },
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192.png', sizes: '192x192' },
    ],
  },
  other: {
    'application-name': 'SNAP.Cards',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-title': 'SNAP.Cards',
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = (await import(`@/i18n/messages/${locale}.json`)).default;
  const dir = localeDirection[locale as Locale];
  const fontClass = locale === 'he' ? heebo.variable : inter.variable;

  const orgJsonLd = buildOrganizationJsonLd(domain);
  const webSiteJsonLd = buildWebSiteJsonLd(domain);
  const softwareAppJsonLd = buildSoftwareAppJsonLd(domain);

  return (
    <html lang={locale} dir={dir} className={fontClass}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
        />
        <link rel="alternate" type="application/llms+txt" href={`https://${domain}/llms.txt`} />
      </head>
      <body className="min-h-screen bg-white text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
