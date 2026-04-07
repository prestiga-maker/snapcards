@AGENTS.md

# SNAP.Cards — Development Guide

## Project Overview
Business networking platform: AI-powered business pages, card scanning (OCR), social feed, messaging, QR/NFC sharing. Hebrew + English, full RTL.

## Tech Stack
- **Framework**: Next.js 16 (App Router, TypeScript, Tailwind CSS)
- **Auth**: Supabase Auth (Google, Apple, email/password, magic links) — client-side SDK handles flows, `/api/auth/callback` syncs to MySQL
- **Database**: MySQL on cPanel (cleverdot.com) via Prisma 6
- **File Storage**: cPanel uploads + CloudFront CDN for reads
- **AI**: Claude or GPT (abstracted provider in `src/lib/ai/`)
- **OCR**: Google Cloud Vision API
- **i18n**: next-intl with EN/HE, RTL via CSS logical properties
- **Hosting**: Vercel

## Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npx prisma generate  # Regenerate Prisma client after schema changes
npx prisma db push   # Push schema to MySQL (dev only)
npx prisma migrate dev --name <name>  # Create migration
```

## Architecture

### Routing
- `/[locale]/(auth)/*` — Login, register (no navbar)
- `/[locale]/(dashboard)/*` — Authenticated pages (with navbar)
- `/api/*` — API routes (Supabase JWT auth via middleware)
- `/sites/[slug]` — Multi-tenant business pages (rewritten from `{slug}.snap.cards` via middleware)

### Key Patterns
- **Prisma singleton**: Always import from `@/lib/db` (not `@prisma/client` directly)
- **Supabase**: Server components use `createSupabaseServerClient()`, client components use `createSupabaseBrowserClient()`
- **i18n**: Use `useTranslations()` in components, add keys to both `en.json` and `he.json`
- **RTL**: Use CSS logical properties (`ms-`, `me-`, `ps-`, `pe-`, `inline-start/end`). Never use `ml-`/`mr-`/`pl-`/`pr-` for directional spacing.

### Database
- All tables defined in `prisma/schema.prisma`
- Tables use `@map("snake_case")` for MySQL column names, camelCase in TypeScript
- Polymorphic likes (post/comment) — no FK constraint, application-level queries by `likeableType` + `likeableId`
- Soft deletes via `deletedAt` where applicable

## Phased Development Plan

### Phase 1: Foundation + AI Page Builder (Weeks 1–6) ✅ COMPLETE
- [x] Week 1-2: Scaffolding, auth, layout, i18n, Prisma schema
- [x] Week 3-4: Template system, setup wizard, AI content generation, section components, TemplateRenderer
- [x] Week 5-6: Visual editor, image upload, publish flow, SEO, QR generation

### Phase 2: Card Scanning + Contacts (Weeks 7–10) ✅ COMPLETE
- [x] Camera capture + image upload
- [x] Google Cloud Vision OCR + LLM field extraction
- [x] Scan confirmation UI, dedup, self-scan detection
- [x] Contact list, tags, notes, QR/NFC sharing, connections

### Phase 3: Social Feed + Messaging (Weeks 11–15) ✅ COMPLETE
- [x] Post/comment/like/share with moderation
- [x] Trust score system
- [x] Direct messaging with 30s polling
- [x] Notifications (polling-based)

### Phase 4: AI Chatbot + Calendar (Weeks 16–19) ✅ COMPLETE
- [x] ChatbotWidget on business pages
- [x] Knowledge base compiler
- [x] Chatbot API with conversation context, escalation, lead capture
- [x] Google Calendar OAuth + booking integration

### Phase 5: Monetization + Launch (Weeks 20–24) ✅ COMPLETE
- [x] Stripe Pro tier ($20/mo) — checkout, webhook, customer portal
- [x] Subscription service with tier-gating (chatbot, custom domain, analytics, page limits)
- [x] Analytics dashboard with daily views chart, leads table
- [x] Custom domains — DNS verification, middleware routing
- [x] Page view tracking with rate-limited analytics collection
- [x] Performance + security: rate limiting on public APIs, input validation

## Conventions
- Components in `src/components/{feature}/` (e.g., `auth/`, `layout/`, `pages/`, `scan/`, `feed/`)
- Services/utils in `src/lib/{concern}/` (e.g., `db/`, `supabase/`, `ai/`, `services/`)
- API routes in `src/app/api/{resource}/`
- Types in `src/types/`
- All user-facing strings go through next-intl (both `en.json` and `he.json`)
- Full spec: see `SPEC.md`
