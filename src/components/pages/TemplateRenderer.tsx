'use client';

import Image from 'next/image';
import type { PageConfig, ColorScheme } from '@/types';
import { HeroSection } from './sections/HeroSection';
import { AboutSection } from './sections/AboutSection';
import { ServicesSection } from './sections/ServicesSection';
import { TestimonialsSection } from './sections/TestimonialsSection';
import { ContactSection } from './sections/ContactSection';
import { MenuSection } from './sections/MenuSection';
import { GallerySection } from './sections/GallerySection';
import { FAQSection } from './sections/FAQSection';
import { HoursSection } from './sections/HoursSection';
import { TeamSection } from './sections/TeamSection';
import { CaseStudiesSection } from './sections/CaseStudiesSection';
import { FeaturedProductsSection } from './sections/FeaturedProductsSection';
import { PortfolioGridSection } from './sections/PortfolioGridSection';
import { SkillsSection } from './sections/SkillsSection';
import { FeaturedListingsSection } from './sections/FeaturedListingsSection';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SECTION_MAP: Record<string, React.ComponentType<{ config: any; colorScheme: ColorScheme }>> = {
  hero: HeroSection,
  about: AboutSection,
  services: ServicesSection,
  testimonials: TestimonialsSection,
  contact: ContactSection,
  menu: MenuSection,
  gallery: GallerySection,
  faq: FAQSection,
  hours: HoursSection,
  team: TeamSection,
  practitioners: TeamSection, // Reuse team layout for practitioners
  case_studies: CaseStudiesSection,
  featured_products: FeaturedProductsSection,
  product_grid: FeaturedProductsSection, // Reuse products layout
  portfolio_grid: PortfolioGridSection,
  skills: SkillsSection,
  featured_listings: FeaturedListingsSection,
};

interface TemplateRendererProps {
  config: PageConfig;
}

export function TemplateRenderer({ config }: TemplateRendererProps) {
  const colorScheme = config.global?.colorScheme || { primary: '#ffffff', secondary: '#f8f9fa', accent: '#0066ff' };
  const direction = config.global?.direction || 'ltr';

  const visibleSections = (config.sections || [])
    .filter((s) => s.visible !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div dir={direction} style={{ fontFamily: config.global?.fontFamily || 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      {config.global?.logoUrl && (
        <header className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: colorScheme.primary }}>
          <Image src={config.global.logoUrl} alt="Logo" width={120} height={40} className="h-10 w-auto" unoptimized />
        </header>
      )}

      {/* Sections */}
      {visibleSections.map((section) => {
        const SectionComponent = SECTION_MAP[section.type];
        if (!SectionComponent) {
          return (
            <div key={section.id} className="bg-yellow-50 p-4 text-center text-sm text-yellow-700">
              Unknown section type: {section.type}
            </div>
          );
        }
        return (
          <SectionComponent
            key={section.id}
            config={section.config}
            colorScheme={colorScheme}
          />
        );
      })}

      {/* Footer */}
      <footer
        className="px-6 py-8 text-center text-sm"
        style={{ backgroundColor: colorScheme.primary, color: colorScheme.primary === '#ffffff' ? '#999' : '#ffffff80' }}
      >
        <p>Powered by SNAP.Cards</p>
      </footer>
    </div>
  );
}
