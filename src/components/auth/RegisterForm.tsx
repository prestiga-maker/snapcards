'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export function RegisterForm() {
  const t = useTranslations('auth');
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createSupabaseBrowserClient();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName, locale },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(`/${locale}`);
    router.refresh();
  }

  async function handleOAuth(provider: 'google' | 'apple') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
    if (error) setError(error.message);
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t('signUp')}</h1>
      </div>

      {/* OAuth buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => handleOAuth('google')}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
        >
          {t('signInWith', { provider: 'Google' })}
        </button>
        <button
          onClick={() => handleOAuth('apple')}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-900 dark:border-gray-700"
        >
          {t('signInWith', { provider: 'Apple' })}
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500 dark:bg-gray-950 dark:text-gray-400">
            {t('orContinueWith')}
          </span>
        </div>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label htmlFor="displayName" className="mb-1 block text-sm font-medium">
            {t('displayName')}
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
        <div>
          <label htmlFor="reg-email" className="mb-1 block text-sm font-medium">
            {t('email')}
          </label>
          <input
            id="reg-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
        <div>
          <label htmlFor="reg-password" className="mb-1 block text-sm font-medium">
            {t('password')}
          </label>
          <input
            id="reg-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <p className="text-xs text-gray-500">{t('termsAgree')}</p>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? '...' : t('signUp')}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        {t('hasAccount')}{' '}
        <Link href={`/${locale}/login`} className="font-medium text-indigo-600 hover:text-indigo-500">
          {t('signIn')}
        </Link>
      </p>
    </div>
  );
}
