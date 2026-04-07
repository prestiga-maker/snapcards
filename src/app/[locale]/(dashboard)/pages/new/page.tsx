'use client';

import { useEffect, useState } from 'react';
import { TemplateSelector } from '@/components/pages/TemplateSelector';
import { SetupWizard } from '@/components/pages/SetupWizard';

interface Template {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  thumbnailUrl: string;
}

export default function NewPageWizard() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/templates')
      .then((res) => res.json())
      .then((data) => {
        setTemplates(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (!selectedTemplate) {
    return <TemplateSelector templates={templates} onSelect={setSelectedTemplate} />;
  }

  return (
    <SetupWizard
      templateId={selectedTemplate.id}
      templateName={selectedTemplate.name}
    />
  );
}
