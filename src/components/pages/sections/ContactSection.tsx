'use client';

import { useState } from 'react';
import type { ColorScheme } from '@/types';

interface ContactConfig {
  heading?: string;
  subheading?: string;
  showForm?: boolean;
  showPhone?: boolean;
  showEmail?: boolean;
  showWhatsapp?: boolean;
  showMap?: boolean;
}

interface ContactSectionProps {
  config: ContactConfig;
  colorScheme: ColorScheme;
}

export function ContactSection({ config, colorScheme }: ContactSectionProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const isDark = colorScheme.primary !== '#ffffff' && colorScheme.primary !== '#fff';
  const textColor = isDark ? '#ffffff' : '#1a1a1a';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: Submit to leads API
    setSubmitted(true);
  }

  return (
    <section id="contact" className="px-6 py-16" style={{ backgroundColor: colorScheme.primary }}>
      <div className="mx-auto max-w-2xl text-center">
        {config.heading && (
          <h2 className="mb-4 text-3xl font-bold" style={{ color: textColor }}>
            {config.heading}
          </h2>
        )}
        {config.subheading && (
          <p className="mb-8" style={{ color: isDark ? '#ffffffcc' : '#555' }}>
            {config.subheading}
          </p>
        )}

        {config.showForm !== false && !submitted && (
          <form onSubmit={handleSubmit} className="space-y-4 text-start">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              className="w-full rounded-lg border px-4 py-3"
              style={{ borderColor: isDark ? '#ffffff33' : '#ddd', backgroundColor: isDark ? '#ffffff11' : '#fff', color: textColor }}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              required
              className="w-full rounded-lg border px-4 py-3"
              style={{ borderColor: isDark ? '#ffffff33' : '#ddd', backgroundColor: isDark ? '#ffffff11' : '#fff', color: textColor }}
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your message"
              rows={4}
              required
              className="w-full rounded-lg border px-4 py-3"
              style={{ borderColor: isDark ? '#ffffff33' : '#ddd', backgroundColor: isDark ? '#ffffff11' : '#fff', color: textColor }}
            />
            <button
              type="submit"
              className="w-full rounded-lg py-3 font-semibold text-white transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: colorScheme.accent }}
            >
              Send Message
            </button>
          </form>
        )}

        {submitted && (
          <div className="rounded-lg bg-green-50 p-6 text-green-700">
            Thank you! We&apos;ll get back to you soon.
          </div>
        )}
      </div>
    </section>
  );
}
