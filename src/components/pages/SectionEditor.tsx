'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { SectionConfig } from '@/types';

interface FieldSchema {
  type: string;
  maxLength?: number;
  aiGenerated?: boolean;
  options?: string[];
  default?: unknown;
  itemFields?: Record<string, FieldSchema>;
  fields?: Record<string, FieldSchema>;
}

interface SectionSchema {
  type: string;
  label: string;
  fields: Record<string, FieldSchema>;
}

interface SectionEditorProps {
  section: SectionConfig;
  schema: SectionSchema;
  onUpdate: (config: Record<string, unknown>) => void;
  onBack: () => void;
}

function FieldEditor({
  name,
  schema,
  value,
  onChange,
}: {
  name: string;
  schema: FieldSchema;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const label = name.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());

  if (schema.type === 'text' || schema.type === 'richtext') {
    const isLong = schema.type === 'richtext' || (schema.maxLength && schema.maxLength > 100);
    return (
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
        {isLong ? (
          <textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            maxLength={schema.maxLength}
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
        ) : (
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            maxLength={schema.maxLength}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
        )}
      </div>
    );
  }

  if (schema.type === 'enum' && schema.options) {
    return (
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
        <select
          value={(value as string) || (schema.default as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          {schema.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (schema.type === 'boolean') {
    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={value as boolean ?? schema.default ?? true}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label className="text-sm text-gray-600">{label}</label>
      </div>
    );
  }

  if (schema.type === 'image') {
    return (
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
        <input
          type="text"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Image URL"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
      </div>
    );
  }

  if (schema.type === 'number') {
    return (
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
        <input
          type="number"
          value={(value as number) || 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
      </div>
    );
  }

  if (schema.type === 'object' && schema.fields) {
    const objValue = (value as Record<string, unknown>) || {};
    return (
      <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
        <label className="mb-2 block text-xs font-semibold text-gray-600">{label}</label>
        <div className="space-y-3">
          {Object.entries(schema.fields).map(([fieldName, fieldSchema]) => (
            <FieldEditor
              key={fieldName}
              name={fieldName}
              schema={fieldSchema}
              value={objValue[fieldName]}
              onChange={(val) => onChange({ ...objValue, [fieldName]: val })}
            />
          ))}
        </div>
      </div>
    );
  }

  if (schema.type === 'array' && schema.itemFields) {
    const arrValue = (value as Array<Record<string, unknown>>) || [];
    return (
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-600">{label}</label>
          <button
            onClick={() => onChange([...arrValue, {}])}
            className="rounded bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
          >
            + Add
          </button>
        </div>
        <div className="space-y-3">
          {arrValue.map((item, index) => (
            <div key={index} className="relative rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <button
                onClick={() => onChange(arrValue.filter((_, i) => i !== index))}
                className="absolute end-2 top-2 text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
              <div className="space-y-2 pe-12">
                {Object.entries(schema.itemFields!).map(([fieldName, fieldSchema]) => (
                  <FieldEditor
                    key={fieldName}
                    name={fieldName}
                    schema={fieldSchema}
                    value={item[fieldName]}
                    onChange={(val) => {
                      const updated = [...arrValue];
                      updated[index] = { ...updated[index], [fieldName]: val };
                      onChange(updated);
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

export function SectionEditor({ section, schema, onUpdate, onBack }: SectionEditorProps) {
  const t = useTranslations('editor');
  const [localConfig, setLocalConfig] = useState<Record<string, unknown>>(section.config);

  // Debounced save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (JSON.stringify(localConfig) !== JSON.stringify(section.config)) {
        onUpdate(localConfig);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localConfig, section.config, onUpdate]);

  function handleFieldChange(fieldName: string, value: unknown) {
    setLocalConfig((prev) => ({ ...prev, [fieldName]: value }));
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
      >
        {t('backToSections')}
      </button>

      <h3 className="text-lg font-semibold">{schema.label}</h3>

      <div className="space-y-4">
        {Object.entries(schema.fields).map(([fieldName, fieldSchema]) => (
          <FieldEditor
            key={fieldName}
            name={fieldName}
            schema={fieldSchema}
            value={localConfig[fieldName]}
            onChange={(val) => handleFieldChange(fieldName, val)}
          />
        ))}
      </div>
    </div>
  );
}
