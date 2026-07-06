# Slanthour

Turn collections of photographs into designed, shareable web pages at
`slanthour.com/:username/:slug` — a designed object, not a feed.

Built on Next.js 15 (App Router), React 19, TypeScript, Tailwind, and Supabase.

## Quick start

```bash
npm install
cp .env.local.example .env.local   # fill in the values below
npm run dev                        # http://localhost:3000
```

### Environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key (server-only; never expose) |
| `PAGE_GATE_SECRET` | HMAC signing secret for page-password cookies |

`ARBOR_*` variables are consumed only by the separate Arbor product (`/arborAI`).

### Database

Migrations live in `supabase/migrations/`. Apply with the Supabase CLI:

```bash
npx supabase db push
```

The platform is defined by `20260703000000_pages_platform.sql` (pages, media_assets, RLS,
and a backfill from the legacy portfolio tables).

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint (`next/core-web-vitals` + `next/typescript`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit suite |

## How it fits together

- **`src/app`** — routes (see the route map in [ARCHITECTURE.md](ARCHITECTURE.md) §2).
- **`src/lib/page-document.ts`** — the versioned, section-based page document + sanitisers.
- **`src/lib/actions/`** — server actions; the only mutation path (auth + ownership + RLS).
- **`src/lib/editor/reducer.ts`** — pure editor state machine (undo/redo, coalescing).
- **`src/themes/`** — five themes, shared primitives, and the single `PageRenderer`.
- **`src/app/api/media/`** — upload pipeline (client-side variants, server-side validation).

Read **[ARCHITECTURE.md](ARCHITECTURE.md)** for the full picture and
**[SPECIFICATION_MAP.md](SPECIFICATION_MAP.md)** for requirement traceability.

## Demo content

`npm run seed:demo` (see `scripts/seed-demo.mjs`) creates a demo user with one published page
built from the repo-owned photographs in `public/demo/`, so a fresh environment has something
real to render at `/demo/north`. Idempotent; requires the environment variables above.

## A note on `/arborAI`

`/arborAI` and `/api/arbor/*` are a **separate product** that shares this repository. They are
intentionally untouched by the Slanthour platform code. See [ARCHITECTURE.md](ARCHITECTURE.md)
§16.
