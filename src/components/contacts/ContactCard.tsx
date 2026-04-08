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
    ? { label: t('connected'), style: { background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)' } }
    : contact.connectionStatus === 'pending'
    ? { label: t('pending'), style: { background: '#fef3c7', color: '#92400e' } }
    : null;

  return (
    <div
      className={`group relative flex items-center gap-4 rounded-2xl p-4 transition-shadow hover:shadow-ambient ${
        deleting ? 'opacity-50' : ''
      }`}
      style={{ background: 'var(--surface-container-lowest)' }}
    >
      {/* Avatar */}
      <button
        onClick={() => router.push(`/contacts/${contact.id}`)}
        className="shrink-0"
      >
        {contact.matchedUser?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={contact.matchedUser.avatarUrl}
            alt={name}
            className="h-14 w-14 rounded-full object-cover"
            style={{ boxShadow: '0 2px 12px rgba(20,27,43,0.08)' }}
          />
        ) : (
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-container))' }}
          >
            {initials.toUpperCase() || '?'}
          </div>
        )}
        {/* Online indicator */}
        {contact.connectionStatus === 'accepted' && (
          <div className="absolute bottom-4 start-[3.25rem] h-3.5 w-3.5 rounded-full" style={{ background: '#22c55e', border: '2px solid var(--surface-container-lowest)' }} />
        )}
      </button>

      {/* Info */}
      <button
        onClick={() => router.push(`/contacts/${contact.id}`)}
        className="min-w-0 flex-1 text-start"
      >
        <h3 className="truncate text-base font-semibold" style={{ color: 'var(--on-surface)' }}>{name}</h3>
        <p className="truncate text-sm" style={{ color: 'var(--on-surface-variant)' }}>
          {contact.jobTitle && contact.companyName
            ? `${contact.jobTitle} at ${contact.companyName}`
            : contact.jobTitle || contact.companyName || ''}
        </p>
      </button>

      {/* Status badge */}
      {statusBadge && (
        <span
          className="shrink-0 rounded-2xl px-3 py-1 text-xs font-medium"
          style={statusBadge.style}
        >
          {statusBadge.label}
        </span>
      )}

      {/* Context menu */}
      <div className="relative shrink-0">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex h-8 w-8 items-center justify-center rounded-full opacity-0 transition-all group-hover:opacity-100"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute end-0 top-9 z-20 min-w-[160px] rounded-xl p-1 shadow-ambient" style={{ background: 'var(--surface-container-lowest)' }}>
              <button
                onClick={() => { setShowMenu(false); router.push(`/contacts/${contact.id}`); }}
                className="w-full rounded-lg px-3 py-2 text-start text-sm transition-colors hover:bg-[var(--surface-container-low)]"
                style={{ color: 'var(--on-surface)' }}
              >
                {t('viewCard')}
              </button>
              <button
                onClick={() => { setShowMenu(false); router.push(`/contacts/${contact.id}?edit=true`); }}
                className="w-full rounded-lg px-3 py-2 text-start text-sm transition-colors hover:bg-[var(--surface-container-low)]"
                style={{ color: 'var(--on-surface)' }}
              >
                {t('editContact')}
              </button>
              <button
                onClick={() => { setShowMenu(false); handleDelete(); }}
                className="w-full rounded-lg px-3 py-2 text-start text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                {t('deleteContact')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
