import Image from 'next/image';
import type { ColorScheme } from '@/types';

interface TeamMember {
  name?: string;
  role?: string;
  specialty?: string;
  bio?: string;
  photoUrl?: string;
}

interface TeamConfig {
  heading?: string;
  members?: TeamMember[];
}

interface TeamSectionProps {
  config: TeamConfig;
  colorScheme: ColorScheme;
}

export function TeamSection({ config, colorScheme }: TeamSectionProps) {
  const isDark = colorScheme.primary !== '#ffffff' && colorScheme.primary !== '#fff';
  const textColor = isDark ? '#ffffff' : '#1a1a1a';

  return (
    <section className="px-6 py-16" style={{ backgroundColor: colorScheme.primary }}>
      <div className="mx-auto max-w-6xl">
        {config.heading && (
          <h2 className="mb-12 text-center text-3xl font-bold" style={{ color: textColor }}>
            {config.heading}
          </h2>
        )}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {config.members?.map((member, i) => (
            <div key={i} className="text-center">
              <div
                className="relative mx-auto mb-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full"
                style={{ backgroundColor: colorScheme.secondary }}
              >
                {member.photoUrl ? (
                  <Image src={member.photoUrl} alt={member.name || ''} fill className="object-cover" unoptimized />
                ) : (
                  <span className="text-4xl">👤</span>
                )}
              </div>
              {member.name && (
                <h3 className="text-lg font-semibold" style={{ color: textColor }}>
                  {member.name}
                </h3>
              )}
              {(member.role || member.specialty) && (
                <p className="text-sm" style={{ color: colorScheme.accent }}>
                  {member.role || member.specialty}
                </p>
              )}
              {member.bio && (
                <p className="mt-2 text-sm" style={{ color: isDark ? '#ffffffcc' : '#555' }}>
                  {member.bio}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
