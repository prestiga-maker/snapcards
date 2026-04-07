'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams, useParams } from 'next/navigation';

interface ContactDetail {
  id: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  jobTitle: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  socialLinks: Record<string, string> | null;
  cardImageUrl: string;
  cardImageBackUrl: string | null;
  notes: string | null;
  tags: string[] | null;
  eventContext: string | null;
  scanMethod: string;
  confidenceScore: number | null;
  createdAt: string;
  matchedUser: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
  connectionStatus: string | null;
}

export default function ContactDetailPage() {
  const t = useTranslations('contacts');
  const tScan = useTranslations('scan');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const contactId = params.contactId as string;
  const startEditing = searchParams.get('edit') === 'true';

  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(startEditing);
  const [editFields, setEditFields] = useState<Record<string, string>>({});
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [showBack, setShowBack] = useState(false);

  const fetchContact = useCallback(async () => {
    try {
      const res = await fetch(`/api/contacts/${contactId}`);
      if (!res.ok) {
        router.push('/contacts');
        return;
      }
      const data = await res.json();
      setContact(data.contact);
      setEditFields({
        firstName: data.contact.firstName || '',
        lastName: data.contact.lastName || '',
        companyName: data.contact.companyName || '',
        jobTitle: data.contact.jobTitle || '',
        email: data.contact.email || '',
        phone: data.contact.phone || '',
        website: data.contact.website || '',
        address: data.contact.address || '',
        notes: data.contact.notes || '',
      });
      setEditTags(Array.isArray(data.contact.tags) ? data.contact.tags : []);
    } finally {
      setLoading(false);
    }
  }, [contactId, router]);

  useEffect(() => {
    fetchContact();
  }, [fetchContact]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFields,
          tags: editTags.length > 0 ? editTags : null,
        }),
      });
      if (res.ok) {
        setEditing(false);
        fetchContact();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(t('confirmDelete'))) return;
    const res = await fetch(`/api/contacts/${contactId}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/contacts');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  if (!contact) return null;

  const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Unknown';
  const tags = Array.isArray(contact.tags) ? contact.tags : [];

  const infoFields: { key: string; label: string; icon: string; href?: string }[] = [
    { key: 'email', label: tScan('email'), icon: '✉', href: contact.email ? `mailto:${contact.email}` : undefined },
    { key: 'phone', label: tScan('phone'), icon: '📞', href: contact.phone ? `tel:${contact.phone}` : undefined },
    { key: 'website', label: tScan('website'), icon: '🌐', href: contact.website || undefined },
    { key: 'address', label: tScan('address'), icon: '📍' },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push('/contacts')}
        className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        ← {tCommon('back')}
      </button>

      {/* Card image */}
      <div className="relative overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={showBack && contact.cardImageBackUrl ? contact.cardImageBackUrl : contact.cardImageUrl}
          alt={t('cardImage')}
          className="aspect-[3/2] w-full object-cover"
        />
        {contact.cardImageBackUrl && (
          <div className="absolute bottom-3 end-3 flex gap-1 rounded-lg bg-black/60 p-0.5">
            <button
              onClick={() => setShowBack(false)}
              className={`rounded-md px-3 py-1 text-xs font-medium ${!showBack ? 'bg-white text-black' : 'text-white'}`}
            >
              {tScan('frontSide')}
            </button>
            <button
              onClick={() => setShowBack(true)}
              className={`rounded-md px-3 py-1 text-xs font-medium ${showBack ? 'bg-white text-black' : 'text-white'}`}
            >
              {tScan('backSide')}
            </button>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{name}</h1>
          {contact.jobTitle && (
            <p className="text-gray-500">
              {contact.jobTitle}
              {contact.companyName && ` · ${contact.companyName}`}
            </p>
          )}
          {!contact.jobTitle && contact.companyName && (
            <p className="text-gray-500">{contact.companyName}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            {editing ? tCommon('cancel') : tCommon('edit')}
          </button>
          {contact.matchedUser && (
            <button
              onClick={() => router.push(`/messages?user=${contact.matchedUser!.id}`)}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              {t('sendMessage')}
            </button>
          )}
        </div>
      </div>

      {/* Connection status */}
      {contact.connectionStatus && (
        <div className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
          contact.connectionStatus === 'accepted'
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
        }`}>
          {contact.connectionStatus === 'accepted' ? t('connected') : t('pending')}
        </div>
      )}

      {editing ? (
        /* Edit mode */
        <div className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { key: 'firstName', label: tScan('firstName') },
              { key: 'lastName', label: tScan('lastName') },
              { key: 'email', label: tScan('email') },
              { key: 'phone', label: tScan('phone') },
              { key: 'companyName', label: tScan('company') },
              { key: 'jobTitle', label: tScan('jobTitle') },
              { key: 'website', label: tScan('website') },
              { key: 'address', label: tScan('address') },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {label}
                </label>
                <input
                  type="text"
                  value={editFields[key] || ''}
                  onChange={(e) => setEditFields((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800"
                />
              </div>
            ))}
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {tScan('notes')}
            </label>
            <textarea
              value={editFields.notes || ''}
              onChange={(e) => setEditFields((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {tScan('tags')}
            </label>
            <div className="flex flex-wrap gap-2">
              {editTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {tag}
                  <button onClick={() => setEditTags((prev) => prev.filter((t) => t !== tag))}>×</button>
                </span>
              ))}
              <div className="flex">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const tag = tagInput.trim();
                      if (tag && !editTags.includes(tag)) {
                        setEditTags((prev) => [...prev, tag]);
                      }
                      setTagInput('');
                    }
                  }}
                  placeholder={tScan('addTag')}
                  className="w-28 rounded-s-lg border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                />
                <button
                  onClick={() => {
                    const tag = tagInput.trim();
                    if (tag && !editTags.includes(tag)) {
                      setEditTags((prev) => [...prev, tag]);
                    }
                    setTagInput('');
                  }}
                  className="rounded-e-lg border border-s-0 border-gray-300 px-2 text-sm text-gray-500 hover:bg-gray-100 dark:border-gray-600"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setEditing(false)}
              className="flex-1 rounded-xl border border-gray-300 py-2.5 font-medium hover:bg-gray-50 dark:border-gray-600"
            >
              {tCommon('cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-xl bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? tCommon('loading') : tCommon('save')}
            </button>
          </div>
        </div>
      ) : (
        /* View mode */
        <div className="space-y-4">
          {/* Contact info */}
          <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 dark:border-gray-700 dark:divide-gray-800">
            {infoFields.map(({ key, label, icon, href }) => {
              const value = contact[key as keyof ContactDetail] as string | null;
              if (!value) return null;
              return (
                <div key={key} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-lg">{icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-400">{label}</p>
                    {href ? (
                      <a href={href} className="truncate text-sm text-blue-600 hover:underline dark:text-blue-400" target="_blank" rel="noopener noreferrer">
                        {value}
                      </a>
                    ) : (
                      <p className="truncate text-sm">{value}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Social links */}
          {contact.socialLinks && Object.keys(contact.socialLinks).length > 0 && (
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="mb-2 text-sm font-medium text-gray-500">Social</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(contact.socialLinks).map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm capitalize text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                  >
                    {platform}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Notes */}
          {contact.notes && (
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="mb-2 text-sm font-medium text-gray-500">{tScan('notes')}</h3>
              <p className="whitespace-pre-wrap text-sm">{contact.notes}</p>
            </div>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-400">
            <span>
              {t('scannedOn', { date: new Date(contact.createdAt).toLocaleDateString() })}
            </span>
            {contact.eventContext && (
              <span>{t('scannedAt', { event: contact.eventContext })}</span>
            )}
            <span className="uppercase">{contact.scanMethod}</span>
          </div>

          {/* Delete */}
          <button
            onClick={handleDelete}
            className="text-sm text-red-500 hover:text-red-700"
          >
            {t('deleteContact')}
          </button>
        </div>
      )}
    </div>
  );
}
