'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ContactCard } from '@/components/contacts/ContactCard';

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

type SortOption = 'date' | 'name' | 'company';

export default function ContactsPage() {
  const t = useTranslations('contacts');
  const router = useRouter();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('date');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        sort,
        page: page.toString(),
        limit: '20',
      });
      const res = await fetch(`/api/contacts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [search, sort, page]);

  useEffect(() => {
    const debounce = setTimeout(fetchContacts, search ? 300 : 0);
    return () => clearTimeout(debounce);
  }, [fetchContacts, search]);

  function handleDelete(id: string) {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setTotal((prev) => prev - 1);
  }

  const filterOptions: { key: SortOption; label: string }[] = [
    { key: 'date', label: t('filterAll') },
    { key: 'name', label: t('filterRecent') },
    { key: 'company', label: t('filterFavorites') },
  ];

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <svg className="absolute start-4 top-1/2 -translate-y-1/2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-variant)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t('search')}
          className="w-full rounded-2xl py-3.5 pe-4 ps-12 text-sm focus:outline-none"
          style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}
        />
      </div>

      {/* Filter pills */}
      <div className="flex gap-2">
        {filterOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => { setSort(opt.key); setPage(1); }}
            className="rounded-2xl px-5 py-2 text-sm font-medium transition-colors"
            style={{
              background: sort === opt.key ? 'var(--primary)' : 'var(--surface-container-low)',
              color: sort === opt.key ? 'var(--on-primary)' : 'var(--on-surface-variant)',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Contact list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full" style={{ border: '3px solid var(--surface-container-low)', borderTopColor: 'var(--primary)' }} />
        </div>
      ) : contacts.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--surface-container-lowest)' }}>
          <p className="text-lg font-semibold" style={{ color: 'var(--on-surface)' }}>{t('noContacts')}</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--on-surface-variant)' }}>{t('noContactsHint')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 py-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm disabled:opacity-30"
            style={{ background: 'var(--surface-container-low)' }}
          >
            ‹
          </button>
          <span className="text-sm font-medium" style={{ color: 'var(--on-surface-variant)' }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm disabled:opacity-30"
            style={{ background: 'var(--surface-container-low)' }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
