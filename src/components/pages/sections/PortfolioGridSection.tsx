'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { ColorScheme } from '@/types';

interface PortfolioItem {
  title?: string;
  category?: string;
  image?: string;
  link?: string;
}

interface PortfolioGridConfig {
  heading?: string;
  categories?: Array<{ name: string }>;
  items?: PortfolioItem[];
  layout?: 'grid' | 'masonry';
}

interface PortfolioGridSectionProps {
  config: PortfolioGridConfig;
  colorScheme: ColorScheme;
}

export function PortfolioGridSection({ config, colorScheme }: PortfolioGridSectionProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const isDark = colorScheme.primary !== '#ffffff' && colorScheme.primary !== '#fff';
  const textColor = isDark ? '#ffffff' : '#1a1a1a';

  const filteredItems = activeCategory
    ? config.items?.filter((item) => item.category === activeCategory)
    : config.items;

  return (
    <section className="px-6 py-16" style={{ backgroundColor: colorScheme.primary }}>
      <div className="mx-auto max-w-6xl">
        {config.heading && (
          <h2 className="mb-8 text-center text-3xl font-bold" style={{ color: textColor }}>
            {config.heading}
          </h2>
        )}
        {config.categories && config.categories.length > 0 && (
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: !activeCategory ? colorScheme.accent : 'transparent',
                color: !activeCategory ? '#fff' : textColor,
                border: `1px solid ${!activeCategory ? colorScheme.accent : isDark ? '#ffffff33' : '#ddd'}`,
              }}
            >
              All
            </button>
            {config.categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: activeCategory === cat.name ? colorScheme.accent : 'transparent',
                  color: activeCategory === cat.name ? '#fff' : textColor,
                  border: `1px solid ${activeCategory === cat.name ? colorScheme.accent : isDark ? '#ffffff33' : '#ddd'}`,
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems?.map((item, i) => (
            <a
              key={i}
              href={item.link || '#'}
              target={item.link ? '_blank' : undefined}
              rel={item.link ? 'noopener noreferrer' : undefined}
              className="group relative aspect-square overflow-hidden rounded-xl"
            >
              {item.image ? (
                <Image src={item.image} alt={item.title || ''} fill className="object-cover transition-transform group-hover:scale-105" unoptimized />
              ) : (
                <div className="flex aspect-square items-center justify-center text-5xl" style={{ backgroundColor: colorScheme.secondary }}>🎨</div>
              )}
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                <div className="p-4">
                  {item.title && <p className="font-semibold text-white">{item.title}</p>}
                  {item.category && <p className="text-sm text-white/80">{item.category}</p>}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
