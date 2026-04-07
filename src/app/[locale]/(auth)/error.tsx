'use client';

import { useTranslations } from 'next-intl';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-bold">{t('errorTitle')}</h2>
        <p className="mt-2 text-gray-500">{t('errorDescription')}</p>
        {error.digest && (
          <p className="mt-1 text-xs text-gray-400">Error ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {t('tryAgain')}
        </button>
      </div>
    </div>
  );
}
