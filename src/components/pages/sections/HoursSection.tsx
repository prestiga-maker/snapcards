import type { ColorScheme } from '@/types';

interface HoursConfig {
  heading?: string;
  schedule?: Array<{ days?: string; hours?: string }>;
}

interface HoursSectionProps {
  config: HoursConfig;
  colorScheme: ColorScheme;
}

export function HoursSection({ config, colorScheme }: HoursSectionProps) {
  const isDark = colorScheme.primary !== '#ffffff' && colorScheme.primary !== '#fff';
  const textColor = isDark ? '#ffffff' : '#1a1a1a';

  return (
    <section className="px-6 py-16" style={{ backgroundColor: colorScheme.secondary }}>
      <div className="mx-auto max-w-md text-center">
        {config.heading && (
          <h2 className="mb-8 text-3xl font-bold" style={{ color: isDark ? '#ffffff' : '#1a1a1a' }}>
            {config.heading}
          </h2>
        )}
        <div className="space-y-3">
          {config.schedule?.map((slot, i) => (
            <div key={i} className="flex justify-between rounded-lg px-4 py-2" style={{ backgroundColor: colorScheme.primary }}>
              <span className="font-medium" style={{ color: textColor }}>{slot.days}</span>
              <span style={{ color: colorScheme.accent }}>{slot.hours}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
