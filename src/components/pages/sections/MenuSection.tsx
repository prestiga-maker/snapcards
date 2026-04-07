import type { ColorScheme } from '@/types';

interface MenuItem {
  name?: string;
  description?: string;
  price?: string;
  image?: string;
  badges?: Array<{ label: string }>;
}

interface MenuCategory {
  name?: string;
  items?: MenuItem[];
}

interface MenuConfig {
  heading?: string;
  categories?: MenuCategory[];
}

interface MenuSectionProps {
  config: MenuConfig;
  colorScheme: ColorScheme;
}

export function MenuSection({ config, colorScheme }: MenuSectionProps) {
  const isDark = colorScheme.primary !== '#ffffff' && colorScheme.primary !== '#fff';
  const textColor = isDark ? '#ffffff' : '#1a1a1a';
  const subtextColor = isDark ? '#ffffffcc' : '#555';

  return (
    <section className="px-6 py-16" style={{ backgroundColor: colorScheme.primary }}>
      <div className="mx-auto max-w-4xl">
        {config.heading && (
          <h2 className="mb-12 text-center text-3xl font-bold" style={{ color: textColor }}>
            {config.heading}
          </h2>
        )}
        <div className="space-y-10">
          {config.categories?.map((category, ci) => (
            <div key={ci}>
              {category.name && (
                <h3
                  className="mb-6 border-b pb-2 text-xl font-semibold"
                  style={{ color: colorScheme.accent, borderColor: isDark ? '#ffffff22' : '#eee' }}
                >
                  {category.name}
                </h3>
              )}
              <div className="space-y-4">
                {category.items?.map((item, ii) => (
                  <div key={ii} className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium" style={{ color: textColor }}>
                          {item.name}
                        </h4>
                        {item.badges?.map((badge, bi) => (
                          <span
                            key={bi}
                            className="rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: colorScheme.accent, color: '#fff' }}
                          >
                            {badge.label}
                          </span>
                        ))}
                      </div>
                      {item.description && (
                        <p className="mt-1 text-sm" style={{ color: subtextColor }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                    {item.price && (
                      <span className="whitespace-nowrap font-semibold" style={{ color: colorScheme.accent }}>
                        {item.price}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
