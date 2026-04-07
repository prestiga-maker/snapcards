'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  context?: string;
  className?: string;
}

export function ImageUpload({ value, onChange, context = 'general', className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('context', context);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const { url } = await res.json();
        onChange(url);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    }
    setUploading(false);
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        {value && (
          <div className="relative h-16 w-16 overflow-hidden rounded-lg border">
            <Image src={value} alt="" fill className="object-cover" unoptimized />
          </div>
        )}
        <div className="flex-1">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700"
          >
            {uploading ? 'Uploading...' : value ? 'Change Image' : 'Upload Image'}
          </button>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Or paste image URL"
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
      </div>
    </div>
  );
}
