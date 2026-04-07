import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function DashboardPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = useTranslations('dashboard');
  const locale = params.locale;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{t('welcome', { name: '' })}</h1>

      {/* Quick Actions */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">{t('quickActions')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href={`/${locale}/scan`}
            className="rounded-xl border border-gray-200 p-6 transition-shadow hover:shadow-md dark:border-gray-800"
          >
            <div className="mb-2 text-3xl">📷</div>
            <h3 className="font-semibold">{t('scanCard')}</h3>
          </Link>
          <Link
            href={`/${locale}/pages`}
            className="rounded-xl border border-gray-200 p-6 transition-shadow hover:shadow-md dark:border-gray-800"
          >
            <div className="mb-2 text-3xl">🌐</div>
            <h3 className="font-semibold">{t('createPage')}</h3>
          </Link>
          <Link
            href={`/${locale}/contacts`}
            className="rounded-xl border border-gray-200 p-6 transition-shadow hover:shadow-md dark:border-gray-800"
          >
            <div className="mb-2 text-3xl">👥</div>
            <h3 className="font-semibold">{t('viewContacts')}</h3>
          </Link>
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">{t('recentActivity')}</h2>
        <div className="rounded-xl border border-gray-200 p-8 text-center text-gray-500 dark:border-gray-800">
          <p>{t('noActivity')}</p>
        </div>
      </section>
    </div>
  );
}
