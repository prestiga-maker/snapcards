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
  const tScan = useTranslations('scan');
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

  const sortOptions: { key: SortOption; label: string }[] = [
    { key: 'date', label: t('sortDate') },
    { key: 'name', label: t('sortName') },
    { key: 'company', label: t('sortCompany') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <button
          onClick={() => router.push('/scan')}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {tScan('title')}
        </button>
      </div>

      {/* Search and sort bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t('search')}
            className="w-full rounded-xl border border-gray-300 py-2.5 pe-4 ps-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
          />
          <span className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </div>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          {sortOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => { setSort(opt.key); setPage(1); }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                sort === opt.key
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Total count */}
      {!loading && total > 0 && (
        <p className="text-sm text-gray-500">
          {total} contact{total !== 1 ? 's' : ''}
        </p>
      )}

      {/* Contact list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="rounded-xl border border-gray-200 p-12 text-center text-gray-500 dark:border-gray-800">
          <div className="mb-3 text-4xl">👥</div>
          <p className="font-medium">{t('noContacts')}</p>
          <p className="mt-1 text-sm">{t('noContactsHint')}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-600"
          >
            ‹
          </button>
          <span className="text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-600"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
