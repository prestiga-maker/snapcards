'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface ScanResult {
  scanId: string;
  imageUrl: string;
  backImageUrl?: string | null;
  contact?: {
    scanId: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    jobTitle?: string;
  };
  isSelfScan?: boolean;
  connectionCreated?: boolean;
}

interface NFCReaderProps {
  onScanComplete: (result: ScanResult) => void;
}

export function NFCReader({ onScanComplete }: NFCReaderProps) {
  const t = useTranslations('scan');
  const [supported] = useState(() =>
    typeof window !== 'undefined' ? 'NDEFReader' in window : false
  );
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  async function startReading() {
    if (!('NDEFReader' in window)) return;

    setError('');
    setReading(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ndef = new (window as any).NDEFReader();
      await ndef.scan();

      ndef.addEventListener('reading', async ({ message }: { message: { records: Array<{ recordType: string; data: ArrayBuffer }> } }) => {
        setProcessing(true);
        setReading(false);

        // Extract URL from NFC tag
        let url = '';
        for (const record of message.records) {
          if (record.recordType === 'url' || record.recordType === 'text') {
            const decoder = new TextDecoder();
            url = decoder.decode(record.data);
            break;
          }
        }

        if (!url) {
          setError('No URL found on NFC tag');
          setProcessing(false);
          return;
        }

        // Process like a QR scan
        try {
          const res = await fetch('/api/scan/qr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qrData: url }),
          });

          const data = await res.json();

          if (!res.ok) {
            setError(data.error || 'Could not process NFC tag');
            setProcessing(false);
            return;
          }

          if (data.isSelfScan) {
            onScanComplete({ scanId: '', imageUrl: '', isSelfScan: true });
            return;
          }

          onScanComplete({
            scanId: data.contact?.scanId || '',
            imageUrl: '',
            contact: data.contact,
            connectionCreated: data.connectionCreated,
          });
        } catch {
          setError('Failed to process NFC tag');
          setProcessing(false);
        }
      });

      ndef.addEventListener('readingerror', () => {
        setError('Could not read NFC tag. Try again.');
        setReading(false);
      });
    } catch {
      setError('NFC permission denied or unavailable');
      setReading(false);
    }
  }

  if (processing) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        <p className="text-gray-500">{t('processing')}</p>
      </div>
    );
  }

  if (supported === null) {
    return null; // Still checking
  }

  if (!supported) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-800 dark:bg-amber-950">
        <div className="text-5xl">📡</div>
        <p className="font-medium text-amber-800 dark:text-amber-200">
          {t('nfcNotSupported')}
        </p>
        <p className="text-sm text-amber-600 dark:text-amber-400">
          NFC scanning requires Chrome on Android. Try the QR or Photo tab instead.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* NFC animation */}
      <div className="relative flex h-40 w-40 items-center justify-center">
        {reading && (
          <>
            <div className="absolute h-full w-full animate-ping rounded-full bg-blue-400/20" />
            <div className="absolute h-[80%] w-[80%] animate-ping rounded-full bg-blue-400/30 [animation-delay:200ms]" />
          </>
        )}
        <div className={`flex h-24 w-24 items-center justify-center rounded-full text-5xl ${
          reading ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'
        }`}>
          📡
        </div>
      </div>

      <p className="text-center text-gray-500">
        {reading ? t('nfcInstructions') : 'Tap the button to start reading NFC tags'}
      </p>

      {error && <p className="text-center text-sm text-red-600">{error}</p>}

      {!reading && (
        <button
          onClick={startReading}
          className="rounded-xl bg-blue-600 px-8 py-3 font-medium text-white hover:bg-blue-700"
        >
          {t('scanNFC')}
        </button>
      )}
    </div>
  );
}
