import Image from 'next/image';
import type { ColorScheme } from '@/types';

interface AboutConfig {
  heading?: string;
  body?: string;
  image?: string;
}

interface AboutSectionProps {
  config: AboutConfig;
  colorScheme: ColorScheme;
}

export function AboutSection({ config, colorScheme }: AboutSectionProps) {
  return (
    <section className="px-6 py-16" style={{ backgroundColor: colorScheme.secondary }}>
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:items-center">
        <div>
          {config.heading && (
            <h2 className="mb-6 text-3xl font-bold" style={{ color: colorScheme.primary === '#ffffff' ? '#1a1a1a' : '#ffffff' }}>
              {config.heading}
            </h2>
          )}
          {config.body && (
            <div
              className="prose max-w-none whitespace-pre-line leading-relaxed"
              style={{ color: colorScheme.primary === '#ffffff' ? '#555' : '#ffffffcc' }}
            >
              {config.body}
            </div>
          )}
        </div>
        {config.image && (
          <div className="relative aspect-video overflow-hidden rounded-xl">
            <Image src={config.image} alt={config.heading || 'About'} fill className="object-cover" unoptimized />
          </div>
        )}
      </div>
    </section>
  );
}
