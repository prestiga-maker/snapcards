'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface ProfileData {
  displayName: string;
  email: string;
  avatarUrl: string | null;
  profile: {
    firstName: string;
    lastName: string;
    jobTitle: string | null;
    companyName: string | null;
    bio: string | null;
    website: string | null;
    socialLinks: Record<string, string> | null;
    location: string | null;
    profileCompleteness: number;
    qrCodeUrl: string | null;
    scanCount: number;
  } | null;
}

export default function ProfilePage() {
  const t = useTranslations('profile');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [generatingQR, setGeneratingQR] = useState(false);

  useEffect(() => {
    fetch('/api/profile')
      .then((res) => res.json())
      .then(setProfile)
      .catch(console.error);
  }, []);

  async function handleGenerateQR() {
    setGeneratingQR(true);
    const res = await fetch('/api/profile/qr-generate', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setProfile((prev) =>
        prev && prev.profile
          ? { ...prev, profile: { ...prev.profile, qrCodeUrl: data.qrUrl } }
          : prev
      );
    }
    setGeneratingQR(false);
  }

  if (!profile) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  const p = profile.profile;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      {/* Profile card */}
      <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
        <div className="flex items-start gap-4">
          <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-900">
            {profile.avatarUrl ? (
              <Image src={profile.avatarUrl} alt="" fill className="object-cover" unoptimized />
            ) : (
              <span className="text-3xl">👤</span>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{profile.displayName}</h2>
            {p?.jobTitle && <p className="text-gray-600 dark:text-gray-400">{p.jobTitle}</p>}
            {p?.companyName && <p className="text-sm text-gray-500">{p.companyName}</p>}
            <p className="mt-1 text-sm text-gray-500">{profile.email}</p>
          </div>
        </div>

        {p?.bio && <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{p.bio}</p>}

        {/* Completeness */}
        <div className="mt-4">
          <div className="flex justify-between text-sm">
            <span>{t('completeness', { percent: p?.profileCompleteness || 0 })}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-indigo-600"
              style={{ width: `${p?.profileCompleteness || 0}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-indigo-600">{p?.scanCount || 0}</p>
            <p className="text-xs text-gray-500">{t('cardScans')}</p>
          </div>
        </div>
      </div>

      {/* QR Code */}
      <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
        <h3 className="mb-4 text-lg font-semibold">{t('myCard')}</h3>
        {p?.qrCodeUrl ? (
          <div className="flex flex-col items-center gap-4">
            <Image src={p.qrCodeUrl} alt="QR Code" width={192} height={192} unoptimized />
            <p className="text-sm text-gray-500">{t('shareQR')}</p>
            <button
              onClick={handleGenerateQR}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              {t('regenerateQR')}
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-4 text-sm text-gray-500">{t('generateQRHint')}</p>
            <button
              onClick={handleGenerateQR}
              disabled={generatingQR}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {generatingQR ? t('generatingQR') : t('generateQR')}
            </button>
          </div>
        )}
      </div>

      {/* Social Links */}
      {p?.socialLinks && Object.keys(p.socialLinks).length > 0 && (
        <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
          <h3 className="mb-4 text-lg font-semibold">{t('socialLinks')}</h3>
          <div className="space-y-2">
            {Object.entries(p.socialLinks).map(([platform, url]) =>
              url ? (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  <span className="capitalize">{platform}</span>
                </a>
              ) : null
            )}
          </div>
        </div>
      )}
    </div>
  );
}
