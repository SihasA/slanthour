# Slanthour — Implementation Plan

Derived from the architecture audit of `main` @ `d332b04` (see `ARCHITECTURE.md` for the
final-state description). This plan turns the existing **single-portfolio-per-user** app
into the target product: **multi-page photo publications** at `/:username/:slug` with a
section-based editor, five themes, draft/published separation, and
public/unlisted/password visibility.

## Audit summary (what we started from)

- Next.js 15 App Router + React 19 + Tailwind + Supabase (auth, Postgres, storage).
- One portfolio per user (`portfolios.UNIQUE(user_id)`), flat `photos` list, 3 locked
  themes rendered by conditional branching (~1,500 duplicated lines).
- Browser-direct Supabase writes relying entirely on RLS; no draft/published split;
  no tests; no autosave; public storage bucket exposes draft images.
- **Live data**: the founder's published portfolio (`sihas`) + a static legacy copy
  served at `/sihas-abeywickrama` via rewrite.
- **`/arborAI` + `/api/arbor/*` is a separate, self-contained product (Arbor) — retained
  untouched by design.** It shares only the root layout, `globals.css` helpers,
  `createAdminClient`, and its own `ARBOR_*` env vars.

## Guiding decisions

1. **Additive migration, no rewrite.** New `pages` + `media_assets` tables; existing
   `profiles` kept as-is; old `portfolios`/`photos`/`themes` rows backfilled into the new
   model and the legacy tables left in place (deprecated, not dropped) so rollback is trivial.
2. **JSONB page document** (versioned, `version: 1`) holding ordered sections with stable
   IDs. `pages.draft` is the working copy; `pages.published` is a frozen self-contained
   snapshot (document + theme + settings + denormalised image data) so public rendering
   never depends on editor state or `media_assets` reads.
3. **Server-side authorization.** All mutations move behind server actions / route
   handlers with explicit ownership checks (`page.user_id === user.id`), with RLS as a
   second layer — fixing the audit's "client-trusted writes" risk.
4. **Typed theme registry** (`src/themes/`) with a shared contract: tokens, settings
   schema, renderer. Shared section primitives (responsive image, lightbox, text blocks);
   theme renderers compose them. No `if theme === ...` scattered through the tree.
5. **Password pages** reuse the proven Arbor HMAC-cookie pattern (generalised, per-page,
   time-limited) + PBKDF2 password hashes via Web Crypto (no new dependency).
6. **Media**: client-side canvas re-encode (already strips EXIF/GPS) extended to produce
   3 responsive variants + blur placeholder; server route validates magic bytes and size
   before storing under unguessable `userId/m/{assetId}/` paths.
7. **Demo assets** are downscaled from the founder's own photographs already in the repo
   (`public/legacy/...`) — repo-owned, properly licensed, no remote URLs.

## Vertical slices (execution order)

| # | Slice | Contents | Verification |
|---|-------|----------|--------------|
| 0 | Repository stabilisation | Gitignore the local settings file containing the service-role key (done); branch `claude/slanthour-v2`; scrub secrets from tracked docs | `git ls-files`, grep |
| 1 | Core data model | Migration `20260703000000_pages_platform.sql`: `pages`, `media_assets`, RLS, updated signup trigger, backfill of existing portfolios/photos; TS document model (`src/lib/page-document.ts`), slug/username validation (`src/lib/validation.ts`) | Unit tests; migration applied |
| 2 | Auth & authorization | `/signup`, `/forgot-password`, reworked `/login`; middleware matcher expanded to `/editor`, `/settings`, `/pages`; server actions layer with ownership checks | Unit tests + manual flow |
| 3 | Media pipeline | `POST /api/media` (magic-byte + size validation), client variant generation + blur placeholder, `DELETE /api/media/:id` with published-snapshot protection | Unit tests on validation; upload flow |
| 4 | Theme engine | `src/themes/` registry, contract types, shared primitives (SmartImage, Lightbox, text primitives), theme CSS-variable scoping | Type checks; registry unit tests |
| 5 | Five themes | Monograph, Roll 36, Keepsake, After Dark, Cabinet — tokens, settings schemas, renderers, reduced-motion support | Rendered on demo content, both viewports |
| 6 | Editor | `/pages/new`, `/editor/:pageId`: document reducer with undo/redo, debounced rev-checked autosave, section CRUD + reorder, image management, captions/alt, theme panel, desktop/mobile preview | Reducer unit tests; manual editor flow |
| 7 | Publishing & public routes | Publish/unpublish snapshot actions, slug uniqueness + reserved words, `/:username` profile, `/:username/:slug` published page, unlisted noindex, password gate | Unit tests; signed-out viewing |
| 8 | Dashboard & settings | Dashboard page cards (all states), duplicate/delete, `/settings/profile`, `/settings/account` (incl. delete account), redirects from old routes | Manual flow |
| 9 | Marketing & legal | Landing rework with five-theme showcase (demo content), `/pricing`, `/privacy`, `/terms` | Build + visual check |
| 10 | Route cleanup | Remove waitlist stack, old portfolio editor + 3 legacy layouts, dead `legacy/` dir, `FONT_PAIRS`; retain `/arborAI` and the `/sihas-abeywickrama` rewrite | Grep for dead imports; build |
| 11 | Tests & hardening | Vitest suite (document model, reducer, validation, hashing, registry, upload validation), lint, typecheck, production build, end-to-end create→publish walkthrough | All commands green |
| 12 | Documentation | `ARCHITECTURE.md` (final state), `SPECIFICATION_MAP.md` statuses, README setup, demo seed script | Docs review |

## Entitlement boundary

`profiles.tier` already exists (`free`/`pro`/`studio`). The plan keeps a single clean
entitlement module (`src/lib/entitlements.ts`) mapping tier → limits (pages, photos per
page). **The editor is never paywalled**; publishing checks entitlements in one place.
No payment provider exists — the abstraction leaves a single integration point and the
UI states are real (limit reached → clear message), with no fake payment flows.

## Backwards compatibility

- Existing published portfolio (`/sihas`) → after migration, `/sihas` becomes the profile
  page listing the migrated page, and the content lives at `/sihas/portfolio` (Monograph
  theme, hero + captioned images backfilled from `portfolios`/`photos`).
- The static legacy site at `/sihas-abeywickrama` (rewrite in `next.config.ts`) is
  **retained** — it is a legitimate, publicly shared URL.
- Old tables are not dropped; the signup trigger stops creating `portfolios`/`themes`
  rows and keeps creating `profiles`.
- Arbor: untouched (tables, bucket, env, routes, components).

## External steps that cannot be completed from the repo

1. **Rotate the Supabase service-role key** (it sat in a non-gitignored local file).
2. Apply migrations to the linked project (`npx supabase db push`) before deploying.
3. Optional: set `PAGE_GATE_SECRET` (falls back to a key derived from the service key).
