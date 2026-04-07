'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface ScanResult {
  scanId: string;
  imageUrl: string;
  backImageUrl?: string | null;
}

interface CameraCaptureProps {
  onScanComplete: (result: ScanResult) => void;
}

type CaptureStep = 'camera' | 'review-front' | 'camera-back' | 'review-back' | 'uploading';

export function CameraCapture({ onScanComplete }: CameraCaptureProps) {
  const t = useTranslations('scan');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [step, setStep] = useState<CaptureStep>('camera');
  const [frontImage, setFrontImage] = useState<Blob | null>(null);
  const [frontPreview, setFrontPreview] = useState<string>('');
  const [backImage, setBackImage] = useState<Blob | null>(null);
  const [backPreview, setBackPreview] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setError('Camera access denied. Please allow camera permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (step === 'camera' || step === 'camera-back') {
      startCamera();
    }
    return () => {
      if (step === 'camera' || step === 'camera-back') {
        stopCamera();
      }
    };
  }, [step, startCamera, stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  function capturePhoto(): Blob | null {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);
    // Convert to blob synchronously via dataURL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const byteString = atob(dataUrl.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: 'image/jpeg' });
  }

  function handleCaptureFront() {
    const blob = capturePhoto();
    if (!blob) return;
    stopCamera();
    setFrontImage(blob);
    setFrontPreview(URL.createObjectURL(blob));
    setStep('review-front');
  }

  function handleCaptureBack() {
    const blob = capturePhoto();
    if (!blob) return;
    stopCamera();
    setBackImage(blob);
    setBackPreview(URL.createObjectURL(blob));
    setStep('review-back');
  }

  function handleRetakeFront() {
    if (frontPreview) URL.revokeObjectURL(frontPreview);
    setFrontImage(null);
    setFrontPreview('');
    setStep('camera');
  }

  function handleRetakeBack() {
    if (backPreview) URL.revokeObjectURL(backPreview);
    setBackImage(null);
    setBackPreview('');
    setStep('camera-back');
  }

  async function handleUpload(skipBack = false) {
    if (!frontImage) return;
    setUploading(true);
    setStep('uploading');

    const formData = new FormData();
    formData.append('front', new File([frontImage], 'front.jpg', { type: 'image/jpeg' }));
    if (!skipBack && backImage) {
      formData.append('back', new File([backImage], 'back.jpg', { type: 'image/jpeg' }));
    }
    formData.append('scanMethod', 'photo');

    // Add geolocation if available
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 })
      );
      formData.append('lat', pos.coords.latitude.toString());
      formData.append('lng', pos.coords.longitude.toString());
    } catch {
      // Location not available — that's fine
    }

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
      setStep('review-front');
    } finally {
      setUploading(false);
    }
  }

  if (error && (step === 'camera' || step === 'camera-back')) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-950">
        <div className="text-4xl">📷</div>
        <p className="text-red-700 dark:text-red-300">{error}</p>
        <button
          onClick={() => startCamera()}
          className="rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200"
        >
          {t('retake')}
        </button>
      </div>
    );
  }

  // Camera viewfinder
  if (step === 'camera' || step === 'camera-back') {
    return (
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-2xl bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="aspect-[3/2] w-full object-cover"
          />
          {/* Card frame overlay */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[70%] w-[85%] rounded-xl border-2 border-white/50" />
          </div>
          {/* Capture label */}
          <div className="absolute start-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
            {step === 'camera' ? t('frontSide') : t('backSide')}
          </div>
        </div>

        <p className="text-center text-sm text-gray-500">
          {step === 'camera' ? t('captureInstructions') : t('captureBackOptional')}
        </p>

        <div className="flex justify-center">
          <button
            onClick={step === 'camera' ? handleCaptureFront : handleCaptureBack}
            className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-blue-500 bg-white transition-transform hover:scale-105 active:scale-95 dark:bg-gray-200"
          >
            <div className="h-12 w-12 rounded-full bg-blue-500" />
          </button>
        </div>

        {step === 'camera-back' && (
          <button
            onClick={() => handleUpload(true)}
            className="mx-auto block text-sm text-gray-500 underline hover:text-gray-700 dark:hover:text-gray-300"
          >
            {t('skipBack')}
          </button>
        )}
      </div>
    );
  }

  // Review captured photo
  if (step === 'review-front' || step === 'review-back') {
    const preview = step === 'review-front' ? frontPreview : backPreview;
    const retake = step === 'review-front' ? handleRetakeFront : handleRetakeBack;

    return (
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt={step === 'review-front' ? 'Front of card' : 'Back of card'}
            className="aspect-[3/2] w-full rounded-2xl object-cover"
          />
          <div className="absolute start-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
            {step === 'review-front' ? t('frontSide') : t('backSide')}
          </div>
        </div>

        {error && (
          <p className="text-center text-sm text-red-600">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={retake}
            className="flex-1 rounded-xl border border-gray-300 py-3 font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            {t('retake')}
          </button>
          {step === 'review-front' ? (
            <>
              <button
                onClick={() => setStep('camera-back')}
                className="flex-1 rounded-xl bg-gray-200 py-3 font-medium hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                {t('captureBack')}
              </button>
              <button
                onClick={() => handleUpload(true)}
                disabled={uploading}
                className="flex-1 rounded-xl bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {t('usePhoto')}
              </button>
            </>
          ) : (
            <button
              onClick={() => handleUpload(false)}
              disabled={uploading}
              className="flex-1 rounded-xl bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {t('usePhoto')}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Uploading state
  if (step === 'uploading') {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        <p className="text-gray-500">{t('processing')}</p>
      </div>
    );
  }

  return null;
}
