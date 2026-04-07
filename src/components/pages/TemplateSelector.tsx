'use client';

import { useTranslations } from 'next-intl';

interface Template {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  thumbnailUrl: string;
}

const categoryIcons: Record<string, string> = {
  generic: '🏢',
  restaurant: '🍕',
  professional_services: '💼',
  ecommerce: '🛍️',
  portfolio_creative: '🎨',
  health_wellness: '🧘',
  real_estate: '🏠',
};

interface TemplateSelectorProps {
  templates: Template[];
  onSelect: (template: Template) => void;
}

export function TemplateSelector({ templates, onSelect }: TemplateSelectorProps) {
  const t = useTranslations('pages');

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t('chooseTemplate')}</h1>
        <p className="mt-2 text-gray-500">{t('chooseTemplateHint')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template)}
            className="group rounded-xl border border-gray-200 p-6 text-start transition-all hover:border-indigo-300 hover:shadow-lg dark:border-gray-800 dark:hover:border-indigo-700"
          >
            <div className="mb-3 text-4xl">
              {categoryIcons[template.category] || '🌐'}
            </div>
            <h3 className="text-lg font-semibold group-hover:text-indigo-600">
              {template.name}
            </h3>
            <p className="mt-1 text-sm text-gray-500">{template.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
