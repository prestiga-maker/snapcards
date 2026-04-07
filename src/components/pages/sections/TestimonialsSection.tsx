import Image from 'next/image';
import type { ColorScheme } from '@/types';

interface TestimonialItem {
  quote?: string;
  author?: string;
  role?: string;
  company?: string;
  rating?: number;
  avatarUrl?: string;
  property?: string;
}

interface TestimonialsConfig {
  heading?: string;
  items?: TestimonialItem[];
}

interface TestimonialsSectionProps {
  config: TestimonialsConfig;
  colorScheme: ColorScheme;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}>
          ★
        </span>
      ))}
    </div>
  );
}

export function TestimonialsSection({ config, colorScheme }: TestimonialsSectionProps) {
  const isDark = colorScheme.primary !== '#ffffff' && colorScheme.primary !== '#fff';

  return (
    <section className="px-6 py-16" style={{ backgroundColor: colorScheme.secondary }}>
      <div className="mx-auto max-w-6xl">
        {config.heading && (
          <h2
            className="mb-12 text-center text-3xl font-bold"
            style={{ color: isDark ? '#ffffff' : '#1a1a1a' }}
          >
            {config.heading}
          </h2>
        )}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {config.items?.map((item, i) => (
            <div
              key={i}
              className="rounded-xl p-6"
              style={{ backgroundColor: colorScheme.primary }}
            >
              {item.rating && <StarRating rating={item.rating} />}
              {item.quote && (
                <p
                  className="mt-3 text-sm italic leading-relaxed"
                  style={{ color: isDark ? '#ffffffcc' : '#555' }}
                >
                  &ldquo;{item.quote}&rdquo;
                </p>
              )}
              <div className="mt-4 flex items-center gap-3">
                {item.avatarUrl && (
                  <Image
                    src={item.avatarUrl}
                    alt={item.author || ''}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                    unoptimized
                  />
                )}
                <div>
                  {item.author && (
                    <p className="text-sm font-semibold" style={{ color: isDark ? '#ffffff' : '#1a1a1a' }}>
                      {item.author}
                    </p>
                  )}
                  {(item.role || item.company || item.property) && (
                    <p className="text-xs" style={{ color: isDark ? '#ffffff99' : '#888' }}>
                      {[item.role, item.company, item.property].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
