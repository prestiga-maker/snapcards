import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function LocaleNotFound() {
  const t = useTranslations('errors');

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-indigo-600">404</h1>
        <p className="mt-4 text-xl font-semibold">{t('notFoundTitle')}</p>
        <p className="mt-2 text-gray-500">{t('notFoundDescription')}</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {t('goHome')}
        </Link>
      </div>
    </div>
  );
}
