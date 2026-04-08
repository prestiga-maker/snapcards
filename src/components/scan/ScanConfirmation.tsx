'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

interface ScanConfirmationProps {
  scanId: string;
  imageUrl: string;
  backImageUrl?: string | null;
  onDone: () => void;
}

interface ExtractedFields {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  jobTitle: string;
  website: string;
  address: string;
  notes: string;
  tags: string[];
  eventContext: string;
}

interface NearbyEvent {
  id: string;
  name: string;
  location: string | null;
  distance: number;
}

export function ScanConfirmation({ scanId, imageUrl, backImageUrl, onDone }: ScanConfirmationProps) {
  const t = useTranslations('scan');
  const router = useRouter();

  const [fields, setFields] = useState<ExtractedFields>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    jobTitle: '',
    website: '',
    address: '',
    notes: '',
    tags: [],
    eventContext: '',
  });

  const [ocrStatus, setOcrStatus] = useState<'loading' | 'done' | 'failed'>('loading');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    isDuplicate?: boolean;
    isSelfScan?: boolean;
    connectionCreated?: boolean;
    profileGaps?: string[];
  } | null>(null);
  const [nearbyEvents, setNearbyEvents] = useState<NearbyEvent[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showBack, setShowBack] = useState(false);

  const runOCR = useCallback(async () => {
    try {
      const res = await fetch(`/api/scan/${scanId}/ocr`, { method: 'POST' });
      if (!res.ok) {
        setOcrStatus('failed');
        return;
      }
      const data = await res.json();
      setFields((prev) => ({
        ...prev,
        firstName: data.fields.firstName || '',
        lastName: data.fields.lastName || '',
        email: data.fields.email || '',
        phone: data.fields.phone || '',
        companyName: data.fields.companyName || '',
        jobTitle: data.fields.jobTitle || '',
        website: data.fields.website || '',
        address: data.fields.address || '',
      }));
      setConfidence(data.confidenceScore);
      setOcrStatus('done');
    } catch {
      setOcrStatus('failed');
    }
  }, [scanId]);

  const fetchNearbyEvents = useCallback(async () => {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      );
      const res = await fetch(
        `/api/scan/nearby-events?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`
      );
      if (res.ok) {
        const data = await res.json();
        setNearbyEvents(data.events || []);
      }
    } catch {
      // Location not available
    }
  }, []);

  useEffect(() => {
    runOCR();
    fetchNearbyEvents();
  }, [runOCR, fetchNearbyEvents]);

  function updateField(key: keyof ExtractedFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function addTag() {
    const tag = tagInput.trim();
    if (tag && !fields.tags.includes(tag)) {
      setFields((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setFields((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/scan/${scanId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...fields,
          tags: fields.tags.length > 0 ? fields.tags : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Save failed');
      }

      const data = await res.json();
      setSaveResult(data);

      setTimeout(() => {
        router.push('/contacts');
      }, 2500);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  // Success state
  if (saveResult) {
    return (
      <div className="mx-auto max-w-lg space-y-6 text-center">
        {saveResult.isSelfScan ? (
          <div className="rounded-2xl p-10 shadow-ambient" style={{ background: 'var(--surface-container-lowest)' }}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'var(--surface-container-low)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--on-surface)' }}>{t('selfScanDetected')}</h2>
            <p className="mt-2" style={{ color: 'var(--on-surface-variant)' }}>{t('selfScanHint')}</p>
            {saveResult.profileGaps && saveResult.profileGaps.length > 0 && (
              <div className="mt-4 text-start text-sm" style={{ color: 'var(--primary)' }}>
                <p className="mb-1 font-medium">Missing from your profile:</p>
                <ul className="list-inside list-disc">
                  {saveResult.profileGaps.map((gap) => (
                    <li key={gap}>{gap}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : saveResult.isDuplicate ? (
          <div className="rounded-2xl p-10 shadow-ambient" style={{ background: 'var(--surface-container-lowest)' }}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: '#fef3c7' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>{t('duplicate')}</h2>
          </div>
        ) : (
          <div className="rounded-2xl p-10 shadow-ambient" style={{ background: 'var(--surface-container-lowest)' }}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: '#dcfce7' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--on-surface)' }}>{t('saved')}</h2>
            {saveResult.connectionCreated && (
              <p className="mt-2" style={{ color: 'var(--on-surface-variant)' }}>{t('connectionCreated')}</p>
            )}
          </div>
        )}
        <button
          onClick={onDone}
          className="rounded-2xl px-8 py-3 font-medium"
          style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}
        >
          Scan Another
        </button>
      </div>
    );
  }

  const fieldConfig: { key: keyof ExtractedFields; label: string; type?: string; icon: string }[] = [
    { key: 'firstName', label: t('firstName'), icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' },
    { key: 'lastName', label: t('lastName'), icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' },
    { key: 'jobTitle', label: t('jobTitle'), icon: 'M20 7h-9M14 17H5' },
    { key: 'companyName', label: t('company'), icon: 'M3 21h18M3 7v14M21 7v14M6 11h.01M12 11h.01M18 11h.01M6 15h.01M12 15h.01M18 15h.01' },
    { key: 'email', label: t('email'), type: 'email', icon: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' },
    { key: 'phone', label: t('phone'), type: 'tel', icon: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onDone} className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: 'var(--surface-container-low)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: '#dcfce7' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>{t('confirm')}</h2>
          </div>
          <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{t('editFields')}</p>
        </div>
      </div>

      {/* Card image */}
      <div className="overflow-hidden rounded-2xl shadow-ambient">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={showBack && backImageUrl ? backImageUrl : imageUrl}
          alt="Scanned card"
          className="aspect-[16/10] w-full object-cover"
        />
        {backImageUrl && (
          <div className="absolute bottom-3 end-3 flex gap-1 rounded-xl p-0.5" style={{ background: 'rgba(20,27,43,0.6)', backdropFilter: 'blur(8px)' }}>
            <button
              onClick={() => setShowBack(false)}
              className="rounded-lg px-3 py-1 text-xs font-medium transition-colors"
              style={{ background: !showBack ? 'white' : 'transparent', color: !showBack ? 'var(--on-surface)' : 'white' }}
            >
              {t('frontSide')}
            </button>
            <button
              onClick={() => setShowBack(true)}
              className="rounded-lg px-3 py-1 text-xs font-medium transition-colors"
              style={{ background: showBack ? 'white' : 'transparent', color: showBack ? 'var(--on-surface)' : 'white' }}
            >
              {t('backSide')}
            </button>
          </div>
        )}
        <div className="px-4 py-2 text-xs font-medium" style={{ background: 'rgba(20,27,43,0.7)', color: 'white' }}>
          Original Capture
        </div>
      </div>

      {/* OCR status */}
      {ocrStatus === 'loading' && (
        <div className="flex items-center gap-3 rounded-2xl p-4" style={{ background: 'var(--surface-container-low)' }}>
          <div className="h-5 w-5 animate-spin rounded-full" style={{ border: '2px solid var(--surface-container-lowest)', borderTopColor: 'var(--primary)' }} />
          <span className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>{t('extracting')}</span>
        </div>
      )}

      {ocrStatus === 'failed' && (
        <div className="rounded-2xl p-4 text-sm" style={{ background: '#fef3c7', color: '#92400e' }}>
          {t('ocrFailed')}
        </div>
      )}

      {confidence !== null && confidence < 0.7 && (
        <div className="rounded-2xl p-4 text-sm" style={{ background: '#fef3c7', color: '#92400e' }}>
          {t('lowConfidence')}
        </div>
      )}

      {/* Editable fields — editorial style */}
      <div className="space-y-3">
        {fieldConfig.map(({ key, label, type }) => (
          <div key={key}>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>
              {label}
            </label>
            <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: 'var(--surface-container-low)' }}>
              <input
                type={type || 'text'}
                value={fields[key] as string}
                onChange={(e) => updateField(key, e.target.value)}
                placeholder={label}
                disabled={ocrStatus === 'loading'}
                className="flex-1 bg-transparent text-sm focus:outline-none disabled:opacity-50"
                style={{ color: 'var(--on-surface)' }}
              />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-variant)" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Auto-detected profiles */}
      {(fields.website) && (
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>
            Auto-Detected Profiles
          </label>
          <div className="flex gap-2">
            {fields.website && (
              <span className="flex items-center gap-2 rounded-2xl px-4 py-2 text-sm" style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                Website
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>
          {t('tags')}
        </label>
        <div className="flex flex-wrap gap-2">
          {fields.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-2xl px-3 py-1.5 text-sm font-medium"
              style={{ background: 'var(--surface-container-low)', color: 'var(--primary)' }}
            >
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:opacity-70">×</button>
            </span>
          ))}
          <div className="flex">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder={t('addTag')}
              className="w-28 rounded-s-2xl px-3 py-1.5 text-sm focus:outline-none"
              style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}
            />
            <button
              onClick={addTag}
              className="rounded-e-2xl px-3 text-sm"
              style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)' }}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Nearby events */}
      {nearbyEvents.length > 0 && (
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>
            {t('atEvent')}
          </label>
          <select
            value={fields.eventContext}
            onChange={(e) => updateField('eventContext', e.target.value)}
            className="w-full rounded-2xl px-4 py-3 text-sm focus:outline-none"
            style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}
          >
            <option value="">{t('selectEvent')}</option>
            {nearbyEvents.map((event) => (
              <option key={event.id} value={event.name}>
                {event.name} ({event.distance}km)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Save button */}
      <div className="pb-4 pt-2">
        <button
          onClick={handleSave}
          disabled={saving || ocrStatus === 'loading'}
          className="gradient-primary flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-white shadow-ambient disabled:opacity-50"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          {saving ? t('processing') : t('saveContact')}
        </button>
      </div>
    </div>
  );
}
