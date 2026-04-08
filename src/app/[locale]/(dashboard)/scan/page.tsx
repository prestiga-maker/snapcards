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

  const tabs: { key: ScanTab; label: string }[] = [
    { key: 'photo', label: t('tabPhoto') },
    { key: 'upload', label: t('tabUpload') },
    { key: 'qr', label: t('tabQR') },
    { key: 'nfc', label: t('tabNFC') },
  ];

  function handleScanComplete(result: ScanResult) {
    setScanResult(result);
  }

  function handleReset() {
    setScanResult(null);
  }

  // If we have a scan result, show confirmation UI
  if (scanResult) {
    if (scanResult.connectionCreated) {
      return (
        <div className="mx-auto max-w-lg space-y-6 text-center">
          <div className="rounded-2xl p-10 shadow-ambient" style={{ background: 'var(--surface-container-lowest)' }}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: '#dcfce7' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--on-surface)' }}>
              {t('connectionCreated')}
            </h2>
            {scanResult.contact && (
              <p className="mt-2" style={{ color: 'var(--on-surface-variant)' }}>
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
            className="rounded-2xl px-8 py-3 font-medium transition-colors"
            style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}
          >
            {t('title')}
          </button>
        </div>
      );
    }

    if (scanResult.isSelfScan) {
      return (
        <div className="mx-auto max-w-lg space-y-6 text-center">
          <div className="rounded-2xl p-10 shadow-ambient" style={{ background: 'var(--surface-container-lowest)' }}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'var(--surface-container-low)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--on-surface)' }}>
              {t('selfScanDetected')}
            </h2>
            <p className="mt-2" style={{ color: 'var(--on-surface-variant)' }}>
              {t('selfScanHint')}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="rounded-2xl px-8 py-3 font-medium transition-colors"
            style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}
          >
            {t('title')}
          </button>
        </div>
      );
    }

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
    <div className="space-y-5">
      {/* Tab bar — pill style */}
      <div className="flex gap-1 rounded-2xl p-1" style={{ background: 'var(--surface-container-low)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-all"
            style={{
              background: activeTab === tab.key ? 'var(--surface-container-lowest)' : 'transparent',
              color: activeTab === tab.key ? 'var(--primary)' : 'var(--on-surface-variant)',
              boxShadow: activeTab === tab.key ? '0 2px 8px rgba(20,27,43,0.06)' : 'none',
            }}
          >
            {tab.label}
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

      {/* Tip */}
      <div className="flex items-center justify-center gap-2 py-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--primary)" stroke="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
          {t('goodLightingTip')}
        </span>
      </div>
    </div>
  );
}
