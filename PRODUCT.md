# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

South Africans learning about organ donation, most of them for the first time and most of them on a phone. Some arrive already inside Save7 (volunteers, campaigners); others have never been exposed to the subject. Advanced Level learners are healthcare-adjacent people who advocate for donation in practice. A small staff group (Owner and Admins) uses the admin dashboards.

## Product Purpose

Save7 Learn is Save7's organ-donation awareness course at learn.save7.org, replacing its Google Classroom. It takes a learner from "I don't know much about organ donation" to understanding the issue, how the system works in South Africa, how to answer common misconceptions, and feeling confident starting the conversation.

Success is **knowledge improvement**: Baseline Sitting 1 against a later Sitting. Not page views, not time on site.

## Positioning

A free, sourced, South African course from an organ-donation charity, where every medical and legal claim is traceable to a document someone else can open, and where the learner's own before-and-after score is the proof they learned something.

## Operating Context

- Three Levels (Beginner, Intermediate, Advanced), each a complete achievement with its own certificate. Stages within a Level; numbering restarts per Level.
- Order of every Level: Baseline (up to four Sittings, no pass mark), plain-language lessons with interactive blocks, a Stage Quiz per Stage (five from fifteen, four right passes, unlimited retries), a certificate with a public verification ID.
- One registered film, *The Journey of a Gift*, in Stage 3 of Beginner.
- Google sign-in only; enrolment through the shared Save7 Supabase project.

## Capabilities and Constraints

- Next.js 16 App Router, React 19, Tailwind v4, on Vercel. Rules that matter live in SQL in `save7-os`.
- Course copy is data (`content/`, `prisma/content/`), never hardcoded into components.
- The client cannot grade, write its own progress, or issue certificates.
- Analytics store no IP and no user agent.

## Brand Commitments

- The Save7 brand kit is fixed (confirmed 2026-10-28): navy `#0c173b`, pink `#df0e62`, teal `#16b9b4` (fill or text on navy only), teal-ink for teal text on light, amber as decoration only; Montserrat for headings and eyebrows, Lexend for everything read. Tokens and contrast rules: `assets/brand/README.md`, `src/app/globals.css`.
- Single light identity; white page. Little navy as a surface. Pink sparingly.
- Bold is rare: headings, eyebrows, scores, the current item.
- No Level colour-coding; the Level name is always text.
- No em dashes in anything a visitor sees.

## Evidence on Hand

- Brand files in `assets/brand/` and `public/brand/`.
- The film and its transcript (`src/lib/films.ts`, `public/media/`).
- No photography is available (confirmed 2026-10-28). Do not use stock photos presented as Save7 people, and do not invent testimonials, learner counts, or outcome statistics.

## Product Principles

1. Learning is the outcome; anything engaging serves understanding and the before-and-after score, never time on site.
2. Sourced or absent: a claim without a source does not ship.
3. Plain language, phone first, for someone meeting the subject for the first time.
4. Respect the subject: this is about death, grief and gifts of life. Warmth and momentum, never trivialising.
5. The learner always knows where they are and what comes next.

## Accessibility & Inclusion

WCAG AA contrast as measured in the brand README; tap targets at least 44px; keyboard traversable; no horizontal scroll at 375px; feedback never by colour alone; focus ring 3px navy (white on navy). Many learners are on low-end Android phones and metered data.
