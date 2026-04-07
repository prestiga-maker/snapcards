'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { locales, localeNames } from '@/i18n/config';
import type { Locale } from '@/types';

export function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentLocale = params.locale as Locale;

  function switchLocale(newLocale: Locale) {
    const newPathname = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    router.push(newPathname);
  }

  return (
    <select
      value={currentLocale}
      onChange={(e) => switchLocale(e.target.value as Locale)}
      className="rounded-md border border-gray-300 bg-transparent px-2 py-1 text-sm dark:border-gray-700"
      aria-label="Select language"
    >
      {locales.map((locale) => (
        <option key={locale} value={locale}>
          {localeNames[locale]}
        </option>
      ))}
    </select>
  );
}
