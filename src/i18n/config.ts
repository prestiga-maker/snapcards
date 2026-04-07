import type { Locale } from '@/types';

export const locales: Locale[] = ['en', 'he'];
export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  he: 'עברית',
};

export const localeDirection: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  he: 'rtl',
};
