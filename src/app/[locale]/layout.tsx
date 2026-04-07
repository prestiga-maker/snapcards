import type { Metadata } from 'next';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { Inter, Heebo } from 'next/font/google';
import { routing } from '@/i18n/routing';
import { localeDirection } from '@/i18n/config';
import type { Locale } from '@/types';
import '@/app/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const heebo = Heebo({ subsets: ['hebrew', 'latin'], variable: '--font-heebo' });

export const metadata: Metadata = {
  title: {
    default: 'SNAP.Cards — AI-Powered Business Networking',
    template: '%s | SNAP.Cards',
  },
  description:
    'Build AI-powered business pages, scan business cards, and network with professionals.',
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

  return (
    <html lang={locale} dir={dir} className={fontClass}>
      <body className="min-h-screen bg-white text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
