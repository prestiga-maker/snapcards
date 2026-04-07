import type { ColorScheme } from '@/types';

interface ServiceItem {
  title?: string;
  description?: string;
  icon?: string;
  price?: string;
  duration?: string;
  features?: Array<{ text: string }>;
}

interface ServicesConfig {
  heading?: string;
  items?: ServiceItem[];
}

interface ServicesSectionProps {
  config: ServicesConfig;
  colorScheme: ColorScheme;
}

export function ServicesSection({ config, colorScheme }: ServicesSectionProps) {
  const isDark = colorScheme.primary !== '#ffffff' && colorScheme.primary !== '#fff';
  const textColor = isDark ? '#ffffff' : '#1a1a1a';
  const subtextColor = isDark ? '#ffffffcc' : '#555';

  return (
    <section className="px-6 py-16" style={{ backgroundColor: colorScheme.primary }}>
      <div className="mx-auto max-w-6xl">
        {config.heading && (
          <h2 className="mb-12 text-center text-3xl font-bold" style={{ color: textColor }}>
            {config.heading}
          </h2>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {config.items?.map((item, i) => (
            <div
              key={i}
              className="rounded-xl p-6 transition-shadow hover:shadow-lg"
              style={{ backgroundColor: colorScheme.secondary }}
            >
              {item.icon && <div className="mb-3 text-3xl">{item.icon}</div>}
              {item.title && (
                <h3 className="mb-2 text-lg font-semibold" style={{ color: textColor }}>
                  {item.title}
                </h3>
              )}
              {item.description && (
                <p className="mb-3 text-sm leading-relaxed" style={{ color: subtextColor }}>
                  {item.description}
                </p>
              )}
              {(item.price || item.duration) && (
                <div className="flex items-center gap-2">
                  {item.price && (
                    <span className="font-semibold" style={{ color: colorScheme.accent }}>
                      {item.price}
                    </span>
                  )}
                  {item.duration && (
                    <span className="text-sm" style={{ color: subtextColor }}>
                      · {item.duration}
                    </span>
                  )}
                </div>
              )}
              {item.features && item.features.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {item.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm" style={{ color: subtextColor }}>
                      <span style={{ color: colorScheme.accent }}>✓</span>
                      {f.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
