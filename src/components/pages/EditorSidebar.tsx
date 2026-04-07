'use client';

import { useTranslations } from 'next-intl';
import type { SectionConfig, ColorScheme } from '@/types';

const sectionLabels: Record<string, string> = {
  hero: 'Hero Banner',
  about: 'About',
  services: 'Services',
  testimonials: 'Testimonials',
  contact: 'Contact',
  menu: 'Menu',
  gallery: 'Gallery',
  faq: 'FAQ',
  hours: 'Opening Hours',
  team: 'Team',
  practitioners: 'Practitioners',
  case_studies: 'Case Studies',
  featured_products: 'Featured Products',
  product_grid: 'Product Grid',
  portfolio_grid: 'Portfolio',
  skills: 'Skills',
  featured_listings: 'Listings',
};

const sectionIcons: Record<string, string> = {
  hero: '🖼️',
  about: '📝',
  services: '⚙️',
  testimonials: '💬',
  contact: '📧',
  menu: '🍽️',
  gallery: '🖼️',
  faq: '❓',
  hours: '🕐',
  team: '👥',
  practitioners: '👨‍⚕️',
  case_studies: '📊',
  featured_products: '🛍️',
  product_grid: '🏪',
  portfolio_grid: '🎨',
  skills: '💪',
  featured_listings: '🏠',
};

interface EditorSidebarProps {
  sections: SectionConfig[];
  colorSchemes: Array<{ name: string; primary: string; secondary: string; accent: string }>;
  fonts: string[];
  currentColorScheme: ColorScheme;
  currentFont: string;
  onSelectSection: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onColorSchemeChange: (cs: ColorScheme) => void;
  onFontChange: (font: string) => void;
}

export function EditorSidebar({
  sections,
  colorSchemes,
  fonts,
  currentColorScheme,
  currentFont,
  onSelectSection,
  onToggleVisibility,
  onReorder,
  onColorSchemeChange,
  onFontChange,
}: EditorSidebarProps) {
  const t = useTranslations('editor');
  const sorted = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Sections */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase text-gray-500">{t('sections')}</h3>
        <div className="space-y-2">
          {sorted.map((section, index) => (
            <div
              key={section.id}
              className={`flex items-center gap-2 rounded-lg border p-3 transition-colors ${
                section.visible !== false
                  ? 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
                  : 'border-gray-100 bg-gray-50 opacity-50 dark:border-gray-800 dark:bg-gray-950'
              }`}
            >
              {/* Reorder buttons */}
              <div className="flex flex-col">
                <button
                  onClick={() => index > 0 && onReorder(index, index - 1)}
                  disabled={index === 0}
                  className="text-xs text-gray-400 hover:text-gray-700 disabled:invisible"
                  aria-label="Move up"
                >
                  ▲
                </button>
                <button
                  onClick={() => index < sorted.length - 1 && onReorder(index, index + 1)}
                  disabled={index === sorted.length - 1}
                  className="text-xs text-gray-400 hover:text-gray-700 disabled:invisible"
                  aria-label="Move down"
                >
                  ▼
                </button>
              </div>

              {/* Section info + edit */}
              <button
                onClick={() => onSelectSection(section.id)}
                className="flex flex-1 items-center gap-2 text-start"
              >
                <span className="text-lg">{sectionIcons[section.type] || '📄'}</span>
                <span className="text-sm font-medium">
                  {sectionLabels[section.type] || section.type}
                </span>
              </button>

              {/* Visibility toggle */}
              <button
                onClick={() => onToggleVisibility(section.id)}
                className="text-lg"
                title={section.visible !== false ? t('hideSection') : t('showSection')}
              >
                {section.visible !== false ? '👁️' : '🚫'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Color Scheme */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase text-gray-500">{t('colorScheme')}</h3>
        <div className="grid grid-cols-2 gap-2">
          {colorSchemes.map((cs) => {
            const isActive =
              cs.primary === currentColorScheme.primary &&
              cs.accent === currentColorScheme.accent;
            return (
              <button
                key={cs.name}
                onClick={() => onColorSchemeChange({ primary: cs.primary, secondary: cs.secondary, accent: cs.accent })}
                className={`rounded-lg border p-2 text-start transition-all ${
                  isActive ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="mb-1 flex gap-1">
                  <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: cs.primary }} />
                  <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: cs.secondary }} />
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: cs.accent }} />
                </div>
                <span className="text-xs">{cs.name}</span>
              </button>
            );
          })}
        </div>

        {/* Custom color inputs */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={currentColorScheme.primary}
              onChange={(e) => onColorSchemeChange({ ...currentColorScheme, primary: e.target.value })}
              className="h-8 w-8 cursor-pointer rounded"
            />
            <span className="text-xs text-gray-500">{t('primary')}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={currentColorScheme.secondary}
              onChange={(e) => onColorSchemeChange({ ...currentColorScheme, secondary: e.target.value })}
              className="h-8 w-8 cursor-pointer rounded"
            />
            <span className="text-xs text-gray-500">{t('secondary')}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={currentColorScheme.accent}
              onChange={(e) => onColorSchemeChange({ ...currentColorScheme, accent: e.target.value })}
              className="h-8 w-8 cursor-pointer rounded"
            />
            <span className="text-xs text-gray-500">{t('accent')}</span>
          </div>
        </div>
      </div>

      {/* Font */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase text-gray-500">{t('font')}</h3>
        <select
          value={currentFont}
          onChange={(e) => onFontChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          {fonts.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
