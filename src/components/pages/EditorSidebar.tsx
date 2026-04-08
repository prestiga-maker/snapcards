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

const sectionSubtext: Record<string, string> = {
  hero: 'Main attraction',
  services: 'items listed',
  testimonials: 'Customer feedback',
  faq: 'questions',
  contact: 'Contact form',
  gallery: 'Image gallery',
  about: 'About section',
  hours: 'Business hours',
  team: 'Team members',
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
    <div className="flex flex-col gap-8 px-5 pb-8">
      {/* Global Styles */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>
            Global Styles
          </h3>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-variant)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </div>

        <div className="flex gap-3">
          {/* Brand Color */}
          <div className="flex-1 rounded-2xl p-4" style={{ background: 'var(--surface-container-low)' }}>
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>Brand Color</span>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-7 w-7 rounded-full" style={{ backgroundColor: currentColorScheme.primary }} />
              <span className="text-xs font-mono" style={{ color: 'var(--on-surface)' }}>{currentColorScheme.primary}</span>
            </div>
          </div>

          {/* Typography */}
          <div className="flex-1 rounded-2xl p-4" style={{ background: 'var(--surface-container-low)' }}>
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>Typography</span>
            <div className="mt-2">
              <select
                value={currentFont}
                onChange={(e) => onFontChange(e.target.value)}
                className="w-full bg-transparent text-sm font-medium focus:outline-none"
                style={{ color: 'var(--on-surface)' }}
              >
                {fonts.map((font) => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Page Sections */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>
            Page Sections
          </h3>
          <button className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--primary)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add
          </button>
        </div>

        <div className="space-y-3">
          {sorted.map((section, index) => (
            <div
              key={section.id}
              className={`flex items-center gap-3 rounded-2xl p-4 transition-all ${
                section.visible !== false ? '' : 'opacity-40'
              }`}
              style={{ background: 'var(--surface-container-low)' }}
            >
              {/* Drag handle */}
              <div className="flex flex-col gap-0.5 cursor-grab" style={{ color: 'var(--outline-variant)' }}>
                <button onClick={() => index > 0 && onReorder(index, index - 1)} disabled={index === 0} className="disabled:invisible">
                  <svg width="16" height="6" viewBox="0 0 16 6"><circle cx="3" cy="3" r="1.5" fill="currentColor"/><circle cx="8" cy="3" r="1.5" fill="currentColor"/><circle cx="13" cy="3" r="1.5" fill="currentColor"/></svg>
                </button>
                <button onClick={() => index < sorted.length - 1 && onReorder(index, index + 1)} disabled={index === sorted.length - 1} className="disabled:invisible">
                  <svg width="16" height="6" viewBox="0 0 16 6"><circle cx="3" cy="3" r="1.5" fill="currentColor"/><circle cx="8" cy="3" r="1.5" fill="currentColor"/><circle cx="13" cy="3" r="1.5" fill="currentColor"/></svg>
                </button>
              </div>

              {/* Section info */}
              <button
                onClick={() => onSelectSection(section.id)}
                className="flex flex-1 flex-col text-start"
              >
                <span className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
                  {sectionLabels[section.type] || section.type}
                </span>
                <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                  {sectionSubtext[section.type] || 'Section content'}
                </span>
              </button>

              {/* Edit icon */}
              <button
                onClick={() => onSelectSection(section.id)}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--surface-container-lowest)]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-variant)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Color Scheme Picker */}
      <div>
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>{t('colorScheme')}</h3>
        <div className="grid grid-cols-2 gap-2">
          {colorSchemes.map((cs) => {
            const isActive =
              cs.primary === currentColorScheme.primary &&
              cs.accent === currentColorScheme.accent;
            return (
              <button
                key={cs.name}
                onClick={() => onColorSchemeChange({ primary: cs.primary, secondary: cs.secondary, accent: cs.accent })}
                className="rounded-xl p-3 text-start transition-all"
                style={{
                  background: isActive ? 'var(--surface-container-lowest)' : 'var(--surface-container-low)',
                  boxShadow: isActive ? '0 0 0 2px var(--primary)' : 'none',
                }}
              >
                <div className="mb-1.5 flex gap-1.5">
                  <div className="h-5 w-5 rounded-full" style={{ backgroundColor: cs.primary }} />
                  <div className="h-5 w-5 rounded-full" style={{ backgroundColor: cs.secondary }} />
                  <div className="h-5 w-5 rounded-full" style={{ backgroundColor: cs.accent }} />
                </div>
                <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{cs.name}</span>
              </button>
            );
          })}
        </div>

        {/* Custom color inputs */}
        <div className="mt-4 space-y-2">
          {[
            { label: t('primary'), key: 'primary' as const },
            { label: t('secondary'), key: 'secondary' as const },
            { label: t('accent'), key: 'accent' as const },
          ].map(({ label, key }) => (
            <div key={key} className="flex items-center gap-3">
              <input
                type="color"
                value={currentColorScheme[key]}
                onChange={(e) => onColorSchemeChange({ ...currentColorScheme, [key]: e.target.value })}
                className="h-8 w-8 cursor-pointer rounded-lg"
                style={{ border: 'none' }}
              />
              <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
