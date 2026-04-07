'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';

interface ScanResult {
  scanId: string;
  imageUrl: string;
  backImageUrl?: string | null;
}

interface FileUploadProps {
  onScanComplete: (result: ScanResult) => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

export function FileUpload({ onScanComplete }: FileUploadProps) {
  const t = useTranslations('scan');
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string>('');
  const [backFile, setBackFile] = useState<File | null>(null);
  const [backPreview, setBackPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  function validateFile(file: File): boolean {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Invalid file type. Use JPG, PNG, WebP, or HEIC.');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Max 10MB.');
      return false;
    }
    return true;
  }

  function handleFrontFile(file: File) {
    if (!validateFile(file)) return;
    setError('');
    setFrontFile(file);
    setFrontPreview(URL.createObjectURL(file));
  }

  function handleBackFile(file: File) {
    if (!validateFile(file)) return;
    setError('');
    setBackFile(file);
    setBackPreview(URL.createObjectURL(file));
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files[0]) handleFrontFile(files[0]);
    if (files[1]) handleBackFile(files[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpload() {
    if (!frontFile) return;
    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('front', frontFile);
    if (backFile) {
      formData.append('back', backFile);
    }
    formData.append('scanMethod', 'photo');

    try {
      const res = await fetch('/api/scan/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }
      const data = await res.json();
      onScanComplete({
        scanId: data.scanId,
        imageUrl: data.imageUrl,
        backImageUrl: data.backImageUrl,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  // No file selected — show dropzone
  if (!frontFile) {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950'
            : 'border-gray-300 dark:border-gray-700'
        }`}
      >
        <div className="text-5xl">📄</div>
        <div>
          <p className="text-lg font-medium">{t('dragDrop')}</p>
          <p className="mt-1 text-sm text-gray-500">{t('orBrowse')}</p>
        </div>
        <button
          onClick={() => frontInputRef.current?.click()}
          className="rounded-xl bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700"
        >
          {t('upload')}
        </button>
        <p className="text-xs text-gray-400">{t('uploadHint')}</p>
        {error && <p className="text-sm text-red-600">{error}</p>}

        <input
          ref={frontInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFrontFile(e.target.files[0])}
        />
      </div>
    );
  }

  // File selected — show preview + optional back upload
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Front card preview */}
        <div className="relative">
          <div className="absolute start-3 top-3 z-10 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-medium text-white">
            {t('frontSide')}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={frontPreview}
            alt="Front of card"
            className="aspect-[3/2] w-full rounded-xl object-cover"
          />
          <button
            onClick={() => {
              setFrontFile(null);
              if (frontPreview) URL.revokeObjectURL(frontPreview);
              setFrontPreview('');
            }}
            className="absolute end-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white hover:bg-black/80"
          >
            ✕
          </button>
        </div>

        {/* Back card preview or upload button */}
        <div className="relative">
          {backFile ? (
            <>
              <div className="absolute start-3 top-3 z-10 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-medium text-white">
                {t('backSide')}
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={backPreview}
                alt="Back of card"
                className="aspect-[3/2] w-full rounded-xl object-cover"
              />
              <button
                onClick={() => {
                  setBackFile(null);
                  if (backPreview) URL.revokeObjectURL(backPreview);
                  setBackPreview('');
                }}
                className="absolute end-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white hover:bg-black/80"
              >
                ✕
              </button>
            </>
          ) : (
            <button
              onClick={() => backInputRef.current?.click()}
              className="flex aspect-[3/2] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-500 dark:border-gray-700"
            >
              <span className="text-2xl">+</span>
              <span className="text-sm">{t('captureBack')}</span>
            </button>
          )}
          <input
            ref={backInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleBackFile(e.target.files[0])}
          />
        </div>
      </div>

      {error && <p className="text-center text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={() => {
            setFrontFile(null);
            setBackFile(null);
            if (frontPreview) URL.revokeObjectURL(frontPreview);
            if (backPreview) URL.revokeObjectURL(backPreview);
            setFrontPreview('');
            setBackPreview('');
          }}
          className="flex-1 rounded-xl border border-gray-300 py-3 font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          {t('retake')}
        </button>
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="flex-1 rounded-xl bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? t('processing') : t('usePhoto')}
        </button>
      </div>
    </div>
  );
}
