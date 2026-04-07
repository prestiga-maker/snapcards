'use client';

import { useState } from 'react';
import type { ColorScheme } from '@/types';

interface FAQItem {
  question?: string;
  answer?: string;
}

interface FAQConfig {
  heading?: string;
  items?: FAQItem[];
}

interface FAQSectionProps {
  config: FAQConfig;
  colorScheme: ColorScheme;
}

export function FAQSection({ config, colorScheme }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const isDark = colorScheme.primary !== '#ffffff' && colorScheme.primary !== '#fff';
  const textColor = isDark ? '#ffffff' : '#1a1a1a';

  return (
    <section className="px-6 py-16" style={{ backgroundColor: colorScheme.primary }}>
      <div className="mx-auto max-w-3xl">
        {config.heading && (
          <h2 className="mb-12 text-center text-3xl font-bold" style={{ color: textColor }}>
            {config.heading}
          </h2>
        )}
        <div className="space-y-3">
          {config.items?.map((item, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl"
              style={{ backgroundColor: colorScheme.secondary }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-4 text-start"
              >
                <span className="font-medium" style={{ color: textColor }}>
                  {item.question}
                </span>
                <span
                  className="text-xl transition-transform"
                  style={{ transform: openIndex === i ? 'rotate(45deg)' : undefined, color: colorScheme.accent }}
                >
                  +
                </span>
              </button>
              {openIndex === i && item.answer && (
                <div className="px-6 pb-4">
                  <p className="text-sm leading-relaxed" style={{ color: isDark ? '#ffffffcc' : '#555' }}>
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
