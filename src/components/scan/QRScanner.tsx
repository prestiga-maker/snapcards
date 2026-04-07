'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Html5Qrcode } from 'html5-qrcode';

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

interface QRScannerProps {
  onScanComplete: (result: ScanResult) => void;
}

export function QRScanner({ onScanComplete }: QRScannerProps) {
  const t = useTranslations('scan');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<string>('qr-reader-' + Math.random().toString(36).slice(2));
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const processedRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Already stopped
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const handleQrCode = useCallback(async (decodedText: string) => {
    // Prevent double-processing
    if (processedRef.current) return;
    processedRef.current = true;

    setProcessing(true);
    await stopScanner();

    try {
      const res = await fetch('/api/scan/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData: decodedText }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('qrNotFound'));
        processedRef.current = false;
        setProcessing(false);
        return;
      }

      if (data.isSelfScan) {
        onScanComplete({
          scanId: '',
          imageUrl: '',
          isSelfScan: true,
        });
        return;
      }

      onScanComplete({
        scanId: data.contact?.scanId || '',
        imageUrl: '',
        contact: data.contact,
        connectionCreated: data.connectionCreated,
      });
    } catch {
      setError('Failed to process QR code');
      processedRef.current = false;
      setProcessing(false);
    }
  }, [onScanComplete, stopScanner, t]);

  const startScanner = useCallback(async () => {
    setError('');
    processedRef.current = false;

    try {
      const html5Qrcode = new Html5Qrcode(containerRef.current);
      scannerRef.current = html5Qrcode;

      await html5Qrcode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          handleQrCode(decodedText);
        },
        () => {
          // Scan failure — ignore, keep scanning
        }
      );

      setScanning(true);
    } catch {
      setError('Camera access denied or not available.');
    }
  }, [handleQrCode]);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (processing) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        <p className="text-gray-500">{t('processing')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        id={containerRef.current}
        className="overflow-hidden rounded-2xl bg-black"
      />

      {!scanning && !error && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-600" />
          <p className="text-sm text-gray-500">Starting camera...</p>
        </div>
      )}

      {scanning && (
        <p className="text-center text-sm text-gray-500">{t('pointCamera')}</p>
      )}

      {error && (
        <div className="space-y-3 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => {
              setError('');
              startScanner();
            }}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            {t('retake')}
          </button>
        </div>
      )}
    </div>
  );
}
