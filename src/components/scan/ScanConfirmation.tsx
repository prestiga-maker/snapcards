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

  // Run OCR on mount
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

  // Fetch nearby events for context
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

      // Navigate to contacts after short delay
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
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8 dark:border-blue-800 dark:bg-blue-950">
            <div className="mb-4 text-5xl">🪞</div>
            <h2 className="mb-2 text-xl font-bold text-blue-800 dark:text-blue-200">
              {t('selfScanDetected')}
            </h2>
            <p className="text-blue-700 dark:text-blue-300">{t('selfScanHint')}</p>
            {saveResult.profileGaps && saveResult.profileGaps.length > 0 && (
              <div className="mt-4 text-start text-sm text-blue-600 dark:text-blue-400">
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
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 dark:border-amber-800 dark:bg-amber-950">
            <div className="mb-4 text-5xl">🔄</div>
            <h2 className="text-lg font-bold text-amber-800 dark:text-amber-200">
              {t('duplicate')}
            </h2>
          </div>
        ) : (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-8 dark:border-green-800 dark:bg-green-950">
            <div className="mb-4 text-5xl">✅</div>
            <h2 className="mb-2 text-xl font-bold text-green-800 dark:text-green-200">
              {t('saved')}
            </h2>
            {saveResult.connectionCreated && (
              <p className="text-green-700 dark:text-green-300">{t('connectionCreated')}</p>
            )}
          </div>
        )}
        <button
          onClick={onDone}
          className="rounded-lg bg-gray-100 px-6 py-2 font-medium hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          Scan Another
        </button>
      </div>
    );
  }

  const fieldConfig: { key: keyof ExtractedFields; label: string; type?: string }[] = [
    { key: 'firstName', label: t('firstName') },
    { key: 'lastName', label: t('lastName') },
    { key: 'email', label: t('email'), type: 'email' },
    { key: 'phone', label: t('phone'), type: 'tel' },
    { key: 'companyName', label: t('company') },
    { key: 'jobTitle', label: t('jobTitle') },
    { key: 'website', label: t('website'), type: 'url' },
    { key: 'address', label: t('address') },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h2 className="text-xl font-bold">{t('confirm')}</h2>

      {/* Card image(s) */}
      <div className="relative">
        <div className="overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={showBack && backImageUrl ? backImageUrl : imageUrl}
            alt="Scanned card"
            className="aspect-[3/2] w-full object-cover"
          />
        </div>
        {backImageUrl && (
          <div className="absolute bottom-3 end-3 flex gap-1 rounded-lg bg-black/60 p-0.5">
            <button
              onClick={() => setShowBack(false)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                !showBack ? 'bg-white text-black' : 'text-white'
              }`}
            >
              {t('frontSide')}
            </button>
            <button
              onClick={() => setShowBack(true)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                showBack ? 'bg-white text-black' : 'text-white'
              }`}
            >
              {t('backSide')}
            </button>
          </div>
        )}
      </div>

      {/* OCR status */}
      {ocrStatus === 'loading' && (
        <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-4 dark:bg-blue-950">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          <span className="text-sm text-blue-700 dark:text-blue-300">{t('extracting')}</span>
        </div>
      )}

      {ocrStatus === 'failed' && (
        <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          {t('ocrFailed')}
        </div>
      )}

      {confidence !== null && confidence < 0.7 && (
        <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          ⚠️ {t('lowConfidence')}
        </div>
      )}

      {/* Editable fields */}
      <p className="text-sm text-gray-500">{t('editFields')}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {fieldConfig.map(({ key, label, type }) => (
          <div key={key}>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </label>
            <input
              type={type || 'text'}
              value={fields[key] as string}
              onChange={(e) => updateField(key, e.target.value)}
              placeholder={label}
              disabled={ocrStatus === 'loading'}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800"
            />
          </div>
        ))}
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('notes')}
        </label>
        <textarea
          value={fields.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder={t('notes')}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('tags')}
        </label>
        <div className="flex flex-wrap gap-2">
          {fields.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="hover:text-blue-600 dark:hover:text-blue-400"
              >
                ×
              </button>
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
              className="w-28 rounded-s-lg border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800"
            />
            <button
              onClick={addTag}
              className="rounded-e-lg border border-s-0 border-gray-300 px-2 text-sm text-gray-500 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Nearby events */}
      {nearbyEvents.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('atEvent')}
          </label>
          <select
            value={fields.eventContext}
            onChange={(e) => updateField('eventContext', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800"
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

      {/* Actions */}
      <div className="flex gap-3 pb-4">
        <button
          onClick={onDone}
          className="flex-1 rounded-xl border border-gray-300 py-3 font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          {t('retake')}
        </button>
        <button
          onClick={handleSave}
          disabled={saving || ocrStatus === 'loading'}
          className="flex-1 rounded-xl bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? t('processing') : t('saveContact')}
        </button>
      </div>
    </div>
  );
}
