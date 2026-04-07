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
    <div className="flex h-[calc(100vh-8rem)] gap-0 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
      {/* Sidebar */}
      <div className="w-80 shrink-0 overflow-y-auto border-e border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
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
      <div className="flex flex-1 flex-col overflow-hidden bg-gray-100 dark:bg-gray-900">
        {/* Preview toolbar */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-800 dark:bg-gray-950">
          <div className="flex gap-2">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`rounded px-3 py-1 text-sm ${previewMode === 'desktop' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'text-gray-500'}`}
            >
              Desktop
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`rounded px-3 py-1 text-sm ${previewMode === 'mobile' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'text-gray-500'}`}
            >
              Mobile
            </button>
          </div>
          <span className="text-xs text-gray-400">
            {saving ? 'Saving...' : 'Saved'}
          </span>
        </div>

        {/* Preview frame */}
        <div className="flex-1 overflow-y-auto p-4">
          <div
            className={`mx-auto overflow-hidden rounded-lg shadow-lg transition-all ${
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
