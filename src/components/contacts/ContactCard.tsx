'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

interface Contact {
  id: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  jobTitle: string | null;
  email: string | null;
  phone: string | null;
  cardImageUrl: string;
  tags: string[] | null;
  eventContext: string | null;
  scanMethod: string;
  createdAt: string;
  matchedUser: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
  connectionStatus: string | null;
}

interface ContactCardProps {
  contact: Contact;
  onDelete: (id: string) => void;
}

export function ContactCard({ contact, onDelete }: ContactCardProps) {
  const t = useTranslations('contacts');
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Unknown';
  const initials = (contact.firstName?.[0] || '') + (contact.lastName?.[0] || '');
  const tags = Array.isArray(contact.tags) ? contact.tags : [];

  async function handleDelete() {
    if (!confirm(t('confirmDelete'))) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, { method: 'DELETE' });
      if (res.ok) {
        onDelete(contact.id);
      }
    } finally {
      setDeleting(false);
    }
  }

  const statusBadge = contact.connectionStatus === 'accepted'
    ? { label: t('connected'), color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' }
    : contact.connectionStatus === 'pending'
    ? { label: t('pending'), color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' }
    : null;

  return (
    <div
      className={`group relative rounded-xl border border-gray-200 p-4 transition-shadow hover:shadow-md dark:border-gray-700 ${
        deleting ? 'opacity-50' : ''
      }`}
    >
      {/* Three-dot menu */}
      <div className="absolute end-2 top-2">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="rounded-lg p-1.5 text-gray-400 opacity-0 hover:bg-gray-100 group-hover:opacity-100 dark:hover:bg-gray-800"
        >
          ⋮
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute end-0 top-8 z-20 min-w-[140px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <button
                onClick={() => { setShowMenu(false); router.push(`/contacts/${contact.id}`); }}
                className="w-full px-3 py-1.5 text-start text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {t('viewCard')}
              </button>
              <button
                onClick={() => { setShowMenu(false); router.push(`/contacts/${contact.id}?edit=true`); }}
                className="w-full px-3 py-1.5 text-start text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {t('editContact')}
              </button>
              <button
                onClick={() => { setShowMenu(false); handleDelete(); }}
                className="w-full px-3 py-1.5 text-start text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
              >
                {t('deleteContact')}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Card content */}
      <button
        onClick={() => router.push(`/contacts/${contact.id}`)}
        className="w-full text-start"
      >
        <div className="flex items-start gap-3">
          {/* Avatar / initials */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-lg font-bold text-white">
            {contact.matchedUser?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={contact.matchedUser.avatarUrl}
                alt={name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              initials.toUpperCase() || '?'
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold">{name}</h3>
              {statusBadge && (
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadge.color}`}>
                  {statusBadge.label}
                </span>
              )}
            </div>
            {contact.jobTitle && (
              <p className="truncate text-sm text-gray-500">
                {contact.jobTitle}
                {contact.companyName && ` · ${contact.companyName}`}
              </p>
            )}
            {!contact.jobTitle && contact.companyName && (
              <p className="truncate text-sm text-gray-500">{contact.companyName}</p>
            )}

            {/* Quick contact info */}
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
              {contact.email && <span>✉ {contact.email}</span>}
              {contact.phone && <span>📞 {contact.phone}</span>}
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {tags.slice(0, 3).map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  >
                    {tag}
                  </span>
                ))}
                {tags.length > 3 && (
                  <span className="text-[10px] text-gray-400">+{tags.length - 3}</span>
                )}
              </div>
            )}

            {/* Event context */}
            {contact.eventContext && (
              <p className="mt-1 text-[10px] text-gray-400">
                📍 {contact.eventContext}
              </p>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}
