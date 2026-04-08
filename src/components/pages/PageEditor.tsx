'use client';

import { useState, useCallback } from 'react';
import { TemplateRenderer } from './TemplateRenderer';
import { EditorSidebar } from './EditorSidebar';
import { SectionEditor } from './SectionEditor';
import type { PageConfig, ColorScheme } from '@/types';

interface PageEditorProps {
  pageId: string;
  initialConfig: PageConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  templateSchema: { sections: any[] };
  colorSchemes: Array<{ name: string; primary: string; secondary: string; accent: string }>;
  fonts: string[];
}

export function PageEditor({
  pageId,
  initialConfig,
  templateSchema,
  colorSchemes,
  fonts,
}: PageEditorProps) {
  const [config, setConfig] = useState<PageConfig>(initialConfig);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(false);

  const selectedSection = config.sections.find((s) => s.id === selectedSectionId) || null;
  const sectionSchema = selectedSection
    ? templateSchema.sections.find((s) => s.type === selectedSection.type)
    : null;

  const updateConfig = useCallback(async (newConfig: PageConfig) => {
    setConfig(newConfig);
    setSaving(true);
    try {
      await fetch(`/api/pages/${pageId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageConfig: newConfig,
          colorScheme: newConfig.global.colorScheme,
          fontFamily: newConfig.global.fontFamily,
        }),
      });
    } catch (err) {
      console.error('Failed to save:', err);
    }
    setSaving(false);
  }, [pageId]);

  function handleSectionUpdate(sectionId: string, newSectionConfig: Record<string, unknown>) {
    const updated = {
      ...config,
      sections: config.sections.map((s) =>
        s.id === sectionId ? { ...s, config: newSectionConfig } : s
      ),
    };
    updateConfig(updated);
  }

  function handleToggleVisibility(sectionId: string) {
    const updated = {
      ...config,
      sections: config.sections.map((s) =>
        s.id === sectionId ? { ...s, visible: !s.visible } : s
      ),
    };
    updateConfig(updated);
  }

  function handleReorder(fromIndex: number, toIndex: number) {
    const sections = [...config.sections];
    const [moved] = sections.splice(fromIndex, 1);
    sections.splice(toIndex, 0, moved);
    const reordered = sections.map((s, i) => ({ ...s, sortOrder: i }));
    updateConfig({ ...config, sections: reordered });
  }

  function handleColorSchemeChange(cs: ColorScheme) {
    updateConfig({
      ...config,
      global: { ...config.global, colorScheme: cs },
    });
  }

  function handleFontChange(font: string) {
    updateConfig({
      ...config,
      global: { ...config.global, fontFamily: font },
    });
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 overflow-hidden rounded-2xl" style={{ background: 'var(--surface)' }}>
      {/* Sidebar */}
      <div className={`${showPreview ? 'hidden lg:block' : ''} w-full shrink-0 overflow-y-auto lg:w-96`} style={{ background: 'var(--surface-container-lowest)' }}>
        {/* Editor Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ background: 'var(--surface-container-lowest)' }}>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-sm font-medium"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <span className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>SNAP.Cards</span>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="gradient-primary rounded-2xl px-5 py-2 text-sm font-semibold text-white lg:hidden"
          >
            {showPreview ? 'Edit' : 'Preview'}
          </button>
          <span className="hidden text-xs lg:block" style={{ color: 'var(--on-surface-variant)' }}>
            {saving ? 'Saving...' : 'Saved'}
          </span>
        </div>

        {selectedSection && sectionSchema ? (
          <SectionEditor
            key={selectedSection.id}
            section={selectedSection}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            schema={sectionSchema as any}
            onUpdate={(newConfig) => handleSectionUpdate(selectedSection.id, newConfig)}
            onBack={() => setSelectedSectionId(null)}
          />
        ) : (
          <EditorSidebar
            sections={config.sections}
            colorSchemes={colorSchemes}
            fonts={fonts}
            currentColorScheme={config.global.colorScheme}
            currentFont={config.global.fontFamily}
            onSelectSection={setSelectedSectionId}
            onToggleVisibility={handleToggleVisibility}
            onReorder={handleReorder}
            onColorSchemeChange={handleColorSchemeChange}
            onFontChange={handleFontChange}
          />
        )}
      </div>

      {/* Preview */}
      <div className={`${showPreview ? '' : 'hidden lg:flex'} flex flex-1 flex-col overflow-hidden`} style={{ background: 'var(--surface-container-low)' }}>
        {/* Preview toolbar */}
        <div className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--surface-container-lowest)' }}>
          <div className="flex gap-1 rounded-xl p-0.5" style={{ background: 'var(--surface-container-low)' }}>
            <button
              onClick={() => setPreviewMode('desktop')}
              className="rounded-lg px-4 py-1.5 text-sm font-medium transition-all"
              style={{
                background: previewMode === 'desktop' ? 'var(--surface-container-lowest)' : 'transparent',
                color: previewMode === 'desktop' ? 'var(--primary)' : 'var(--on-surface-variant)',
                boxShadow: previewMode === 'desktop' ? '0 2px 8px rgba(20,27,43,0.06)' : 'none',
              }}
            >
              Desktop
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className="rounded-lg px-4 py-1.5 text-sm font-medium transition-all"
              style={{
                background: previewMode === 'mobile' ? 'var(--surface-container-lowest)' : 'transparent',
                color: previewMode === 'mobile' ? 'var(--primary)' : 'var(--on-surface-variant)',
                boxShadow: previewMode === 'mobile' ? '0 2px 8px rgba(20,27,43,0.06)' : 'none',
              }}
            >
              Mobile
            </button>
          </div>
          <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
            LIVE PREVIEW
          </span>
        </div>

        {/* Preview frame */}
        <div className="flex-1 overflow-y-auto p-4">
          <div
            className={`mx-auto overflow-hidden rounded-2xl shadow-ambient-lg transition-all ${
              previewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-full'
            }`}
          >
            <TemplateRenderer config={config} />
          </div>
        </div>
      </div>
    </div>
  );
}
