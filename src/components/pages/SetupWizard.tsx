'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import type { WizardAnswers } from '@/types';

interface WizardStep {
  key: keyof WizardAnswers;
  label: string;
  labelHe: string;
  placeholder: string;
  placeholderHe: string;
  type: 'text' | 'textarea' | 'social';
  required: boolean;
}

const WIZARD_STEPS: WizardStep[] = [
  { key: 'businessName', label: 'What is your business name?', labelHe: 'מה שם העסק שלך?', placeholder: "e.g., Joe's Pizza", placeholderHe: "למשל, הפיצה של יוסי", type: 'text', required: true },
  { key: 'industry', label: 'What industry or niche are you in?', labelHe: 'באיזה תחום או נישה אתה?', placeholder: 'e.g., Italian restaurant, Digital marketing', placeholderHe: 'למשל, מסעדה איטלקית, שיווק דיגיטלי', type: 'text', required: true },
  { key: 'problemSolved', label: 'What problem do you solve for your customers?', labelHe: 'איזו בעיה אתה פותר ללקוחות?', placeholder: 'e.g., We help busy families enjoy quality meals without cooking', placeholderHe: 'למשל, אנחנו עוזרים למשפחות עסוקות ליהנות מארוחות איכותיות', type: 'textarea', required: true },
  { key: 'solution', label: 'How do you solve it? What makes your approach unique?', labelHe: 'איך אתה פותר את זה? מה ייחודי בגישה שלך?', placeholder: 'e.g., Wood-fired authentic recipes passed down 3 generations', placeholderHe: 'למשל, מתכונים אותנטיים בתנור עצים שעוברים 3 דורות', type: 'textarea', required: true },
  { key: 'targetAudience', label: 'Who is your ideal customer?', labelHe: 'מיהו הלקוח האידיאלי שלך?', placeholder: 'e.g., Young professionals aged 25-40 in Tel Aviv', placeholderHe: 'למשל, אנשי מקצוע צעירים בגילאי 25-40 בתל אביב', type: 'text', required: true },
  { key: 'productsServices', label: 'List your main products or services', labelHe: 'פרט את המוצרים או השירותים העיקריים שלך', placeholder: 'e.g., Margherita pizza, Pasta carbonara, Tiramisu, Catering services', placeholderHe: 'למשל, פיצה מרגריטה, פסטה קרבונרה, טירמיסו, שירותי קייטרינג', type: 'textarea', required: true },
  { key: 'pricing', label: 'What is your pricing range or model?', labelHe: 'מה טווח המחירים או מודל התמחור שלך?', placeholder: 'e.g., Mains ₪45-85, Catering from ₪150/person', placeholderHe: 'למשל, מנות עיקריות ₪45-85, קייטרינג מ-₪150 לאדם', type: 'text', required: false },
  { key: 'socialLinks', label: 'Paste your social media profile URLs', labelHe: 'הדבק את כתובות פרופילי המדיה החברתית שלך', placeholder: '', placeholderHe: '', type: 'social', required: false },
  { key: 'uploads', label: 'Any additional details? (Logo description, brand colors, etc.)', labelHe: 'פרטים נוספים? (תיאור לוגו, צבעי מותג וכו׳)', placeholder: 'e.g., Our brand colors are red and white. We have a modern rustic vibe.', placeholderHe: 'למשל, צבעי המותג שלנו הם אדום ולבן. יש לנו אווירה מודרנית-כפרית.', type: 'textarea', required: false },
  { key: 'usp', label: 'What is the #1 reason customers choose you over competitors?', labelHe: 'מה הסיבה #1 שלקוחות בוחרים בך על פני המתחרים?', placeholder: 'e.g., Only restaurant in the city with a real wood-fired oven imported from Naples', placeholderHe: 'למשל, המסעדה היחידה בעיר עם תנור עצים אמיתי שיובא מנאפולי', type: 'textarea', required: true },
];

interface SetupWizardProps {
  templateId: string;
  templateName: string;
}

export function SetupWizard({ templateId, templateName }: SetupWizardProps) {
  const t = useTranslations('pages');
  const tc = useTranslations('common');
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const isHe = locale === 'he';

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({
    businessName: '',
    industry: '',
    problemSolved: '',
    solution: '',
    targetAudience: '',
    productsServices: '',
    pricing: '',
    socialLinks: '',
    uploads: '',
    usp: '',
  });
  const [socialUrls, setSocialUrls] = useState<Record<string, string>>({
    facebook: '',
    instagram: '',
    linkedin: '',
    tiktok: '',
    x: '',
    youtube: '',
  });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const step = WIZARD_STEPS[currentStep];
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;
  const canProceed = !step.required || (
    step.type === 'social'
      ? true
      : (answers[step.key] as string)?.trim().length > 0
  );

  function handleNext() {
    if (isLastStep) {
      handleGenerate();
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  function handleBack() {
    setCurrentStep((s) => Math.max(0, s - 1));
  }

  async function handleGenerate() {
    setGenerating(true);
    setError('');

    const socialLinksObj = Object.fromEntries(
      Object.entries(socialUrls).filter(([, v]) => v.trim())
    );
    const socialUrlsList = Object.values(socialLinksObj).filter(Boolean);

    const wizardAnswers: WizardAnswers = {
      businessName: answers.businessName as string,
      industry: answers.industry as string,
      problemSolved: answers.problemSolved as string,
      solution: answers.solution as string,
      targetAudience: answers.targetAudience as string,
      productsServices: answers.productsServices as string,
      pricing: answers.pricing as string,
      socialLinks: socialLinksObj as WizardAnswers['socialLinks'],
      uploads: [],
      usp: answers.usp as string,
    };

    try {
      const res = await fetch('/api/pages/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          wizardAnswers,
          socialUrls: socialUrlsList,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Generation failed');
      }

      const { pageId } = await res.json();
      router.push(`/${locale}/pages/${pageId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setGenerating(false);
    }
  }

  if (generating) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        <p className="text-lg font-medium">{t('generating')}</p>
        <p className="text-sm text-gray-500">This may take 30-60 seconds...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <p className="text-sm text-indigo-600">{templateName}</p>
        <h1 className="mt-1 text-2xl font-bold">{t('wizard')}</h1>
        <div className="mt-4 flex justify-center gap-1">
          {WIZARD_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-8 rounded-full ${i <= currentStep ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
            />
          ))}
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {currentStep + 1} / {WIZARD_STEPS.length}
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
        <label className="mb-3 block text-lg font-medium">
          {isHe ? step.labelHe : step.label}
          {step.required && <span className="text-red-500"> *</span>}
        </label>

        {step.type === 'social' ? (
          <div className="space-y-3">
            {Object.entries(socialUrls).map(([platform, value]) => (
              <div key={platform} className="flex items-center gap-3">
                <span className="w-24 text-sm font-medium capitalize">{platform}</span>
                <input
                  type="url"
                  value={value}
                  onChange={(e) => setSocialUrls((prev) => ({ ...prev, [platform]: e.target.value }))}
                  placeholder={`https://${platform}.com/...`}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
                />
              </div>
            ))}
          </div>
        ) : step.type === 'textarea' ? (
          <textarea
            value={answers[step.key] as string}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [step.key]: e.target.value }))}
            placeholder={isHe ? step.placeholderHe : step.placeholder}
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
          />
        ) : (
          <input
            type="text"
            value={answers[step.key] as string}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [step.key]: e.target.value }))}
            placeholder={isHe ? step.placeholderHe : step.placeholder}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
            onKeyDown={(e) => e.key === 'Enter' && canProceed && handleNext()}
          />
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <div className="flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-30 dark:border-gray-700 dark:hover:bg-gray-900"
        >
          {tc('back')}
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLastStep ? tc('submit') : tc('next')}
        </button>
      </div>
    </div>
  );
}
