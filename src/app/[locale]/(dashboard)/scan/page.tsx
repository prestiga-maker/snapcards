'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CameraCapture } from '@/components/scan/CameraCapture';
import { FileUpload } from '@/components/scan/FileUpload';
import { QRScanner } from '@/components/scan/QRScanner';
import { NFCReader } from '@/components/scan/NFCReader';
import { ScanConfirmation } from '@/components/scan/ScanConfirmation';

type ScanTab = 'photo' | 'upload' | 'qr' | 'nfc';

interface ScanResult {
  scanId: string;
  imageUrl: string;
  backImageUrl?: string | null;
  // QR scan results come with contact info directly
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

export default function ScanPage() {
  const t = useTranslations('scan');
  const [activeTab, setActiveTab] = useState<ScanTab>('photo');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const tabs: { key: ScanTab; label: string; icon: string }[] = [
    { key: 'photo', label: t('tabPhoto'), icon: '📷' },
    { key: 'upload', label: t('tabUpload'), icon: '📁' },
    { key: 'qr', label: t('tabQR'), icon: '🔲' },
    { key: 'nfc', label: t('tabNFC'), icon: '📡' },
  ];

  function handleScanComplete(result: ScanResult) {
    setScanResult(result);
  }

  function handleReset() {
    setScanResult(null);
  }

  // If we have a scan result, show confirmation UI
  if (scanResult) {
    // QR scans that created a connection directly skip confirmation
    if (scanResult.connectionCreated) {
      return (
        <div className="mx-auto max-w-lg space-y-6 text-center">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-8 dark:border-green-800 dark:bg-green-950">
            <div className="mb-4 text-5xl">✅</div>
            <h2 className="mb-2 text-xl font-bold text-green-800 dark:text-green-200">
              {t('connectionCreated')}
            </h2>
            {scanResult.contact && (
              <p className="text-green-700 dark:text-green-300">
                {scanResult.contact.firstName} {scanResult.contact.lastName}
                {scanResult.contact.companyName && (
                  <span className="block text-sm opacity-75">
                    {scanResult.contact.jobTitle && `${scanResult.contact.jobTitle} at `}
                    {scanResult.contact.companyName}
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={handleReset}
            className="rounded-lg bg-gray-100 px-6 py-2 font-medium hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            {t('title')}
          </button>
        </div>
      );
    }

    // Self-scan notification
    if (scanResult.isSelfScan) {
      return (
        <div className="mx-auto max-w-lg space-y-6 text-center">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8 dark:border-blue-800 dark:bg-blue-950">
            <div className="mb-4 text-5xl">🪞</div>
            <h2 className="mb-2 text-xl font-bold text-blue-800 dark:text-blue-200">
              {t('selfScanDetected')}
            </h2>
            <p className="text-blue-700 dark:text-blue-300">
              {t('selfScanHint')}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="rounded-lg bg-gray-100 px-6 py-2 font-medium hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            {t('title')}
          </button>
        </div>
      );
    }

    // Photo/upload scans go to confirmation with OCR
    return (
      <ScanConfirmation
        scanId={scanResult.scanId}
        imageUrl={scanResult.imageUrl}
        backImageUrl={scanResult.backImageUrl}
        onDone={handleReset}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {activeTab === 'photo' && (
          <CameraCapture onScanComplete={handleScanComplete} />
        )}
        {activeTab === 'upload' && (
          <FileUpload onScanComplete={handleScanComplete} />
        )}
        {activeTab === 'qr' && (
          <QRScanner onScanComplete={handleScanComplete} />
        )}
        {activeTab === 'nfc' && (
          <NFCReader onScanComplete={handleScanComplete} />
        )}
      </div>
    </div>
  );
}
