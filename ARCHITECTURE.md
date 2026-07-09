# Slanthour — Architecture

Slanthour turns collections of photographs into designed, shareable web pages at
`slanthour.com/:username/:slug`. This document describes the system as it stands after the
migration from the original single-portfolio app. It is the reference for how the pieces
fit together and, just as importantly, *why*.

Companion documents:
- **[SPECIFICATION_MAP.md](SPECIFICATION_MAP.md)** — requirement-by-requirement traceability.
- **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)** — the audit of the starting point and the
  plan that produced this state.

---

## 1. Stack & conventions

- **Next.js 15** (App Router) + **React 19** + **TypeScript** (strict).
- **Tailwind CSS** for styling; theme output uses scoped CSS custom properties (`--sh-*`).
- **Supabase**: Postgres (with Row-Level Security), Auth (Google OAuth + email/password),
  Storage.
- **Vitest** for unit tests.
- Server state is mutated **only** through server actions and route handlers — never by
  browser-direct database writes (see §4).

Path alias `@/*` → `src/*`. Commands: `npm run dev | build | lint | test | typecheck`.

---

## 2. Route map

Public:

| Route | Purpose |
|---|---|
| `/` | Landing page with a live five-theme showcase |
| `/pricing`, `/privacy`, `/terms` | Marketing / legal |
| `/login`, `/signup`, `/forgot-password`, `/reset-password` | Auth |
| `/:username` | Public profile — lists that user's **published, public** pages |
| `/:username/:slug` | A published page (frozen snapshot; password gate when protected) |

Authenticated:

| Route | Purpose |
|---|---|
| `/dashboard` | The user's pages, with lifecycle actions |
| `/pages/new` | Create a page → redirect into the editor |
| `/editor/:pageId` | The section editor (sections · live preview · inspector) |
| `/proofing`, `/proofing/:galleryId` | Proofing dashboard: gallery list + management (Pro/Studio) |
| `/settings/profile`, `/settings/account` | Profile and account management |

Anonymous (shared privately, never indexed): `/proof/:slug` — a client proofing gallery
(unguessable slug, optional password gate; see §10).

API route handlers: `/api/media` + `/api/media/:id` (upload / delete),
`/api/proofing/:galleryId/images` (owner proofing upload),
`/api/proof/:slug/select` (anonymous pick toggle, gated), `/api/auth/callback`
(OAuth). The `/arborAI` page and `/api/arbor/*` handlers belong to a **separate product**
(Arbor) and are retained untouched — see §16.

Legacy static rewrite `/sihas-abeywickrama → public/legacy/...` is preserved (a publicly
shared URL that predates the platform). `next.config.ts` redirects the two removed
portfolio-era dashboard routes to their replacements.

---

## 3. Data model

Four tables carry the platform (`supabase/migrations/20260703000000_pages_platform.sql`):

- **`profiles`** — one per user: `username` (unique, validated), `display_name`, `bio`,
  `avatar_url`, `tier`, timestamps.
- **`pages`** — the heart of the system:
  - `slug` (unique per user), `title`, `theme`, `theme_settings` (jsonb)
  - `draft` (jsonb `PageDocument`) + `draft_rev` (monotonic, drives optimistic concurrency)
  - `published` (jsonb `PublishedSnapshot` — null until first publish) + `published_at`
  - `is_published`, `visibility` (`public | unlisted | password`), `password_hash`
  - `cover_path` (denormalised first image, for cards and Open Graph)
- **`media_assets`** — one row per uploaded photo: `storage_path`, `has_variants`,
  intrinsic `width`/`height`, `blur_data_url`, `size_bytes`.

Legacy `portfolios` / `photos` tables are left in place (deprecated) so the migration is
reversible; nothing in the new code reads them.

### 3.1 The page document (`src/lib/page-document.ts`)

A `PageDocument` is a versioned, ordered list of **sections**. Eleven section types:
`hero`, `image`, `split`, `row`, `grid`, `contact-sheet`, `sequence`, `text`, `heading`,
`quote`, `spacer`. Image-bearing sections hold `PageImage[]` (stable `id`, `assetId`,
`path`, dimensions, `alt`, `caption`, optional `focal` point, `blur`).

Every section and image carries a **stable id** so reorders, undo/redo, and republish never
disturb identity. The document also carries optional page-level **display settings**
(`protectPhotos` blocks right-click/drag on photos; `maxPhotoRes: "md"` caps the served
variant at 1000px), available on every tier, sanitised like everything else and frozen
into the published snapshot; SmartImage and the Lightbox read them through a context
provided by PageRenderer. The module also exports pure helpers (`collectAssetIds`, `firstImage`,
`countImages`, `sectionImages`, capacity rules) and, crucially, **sanitisers** that parse
untrusted jsonb without throwing — the render path can never crash on a malformed document.

---

## 4. Authorization model (defence in depth)

Three independent layers, each assuming the others might fail:

1. **Middleware** (`src/middleware.ts`) refreshes the Supabase session and gates
   `/dashboard`, `/editor`, `/settings`, `/pages`.
2. **Server actions** (`src/lib/actions/*`) are the *only* mutation path. Each one:
   authenticates the caller → loads the resource through the user-scoped client → **explicitly
   re-checks ownership in code** → sanitises input before persisting. They return
   discriminated `{ ok }` results rather than throwing across the boundary.
3. **Row-Level Security** on every table is the backstop, so a bug in a higher layer cannot
   silently expose data.

Reads of *protected* pages (unlisted/password) deliberately bypass RLS via the service-role
client and enforce visibility **in code** (§8), because RLS alone cannot express "anyone with
the link, but not listed."

---

## 5. Editor

`/editor/:pageId` loads the page server-side (ownership enforced) and hydrates a client shell.

- **Reducer** (`src/lib/editor/reducer.ts`) — a pure state machine over
  `{ content, past, future, selectedSectionId, changeCount, lastEditKey }`. Handles section
  CRUD, reorder, cross-type **conversion** (grid ↔ contact-sheet ↔ sequence ↔ row ↔ split),
  image ops, theme + settings, and undo/redo. Rapid text edits **coalesce** by `lastEditKey`
  so a typing burst collapses into a single undo step; history is capped at 50 entries. The
  reducer is exhaustively unit-tested and type-conversion cannot be smuggled through
  `updateSection`.
- **Shell** (`src/components/editor/Editor.tsx`) — three panes on desktop (sections · live
  preview · inspector), bottom-sheet panels on mobile. Autosave is debounced (~1.2s) and
  **rev-checked**: each save sends `draft_rev`; a mismatch surfaces a conflict state with a
  reload offer instead of clobbering. Save states: saved / saving / dirty / failed (retry) /
  conflict. A `beforeunload` guard protects unsaved edits.
- **Live preview** uses the *same* `PageRenderer` as the published page, so what you design
  is exactly what publishes.
- **Templates** (`src/lib/page-templates.ts`) — quick-start section skeletons, offered in two
  places: the `/pages/new` picker (`createPage` takes an optional `templateId`, validated by
  `isTemplateId`, unknown ids fall back to blank) and as cards in the empty-editor state
  (`applyTemplate` reducer action appends the whole skeleton as **one undo step**). A template
  is *not* a theme: it only creates sections, never touches theme or settings; cards show a
  soft "pairs well with" hint. The structure line on each card is derived from `build()`
  output so it cannot drift. Like theme ids, the template catalogue is **code-defined only**:
  never mirror it into a DB constraint (see §6 on the retired `pages_theme_check`). Designed
  to compose with the tray: template gives structure, "Fill sections in order" pours photos in.

---

## 6. Theme engine

Eight themes: **Monograph** (editorial), **Roll 36** (film contact sheet), **Keepsake**
(scrapbook), **After Dark** (gallery/dark), **Cabinet** (museum), **Riviera** (sun-lit
postcard, scroll-rail carousel), **Klaxon** (risograph zine, index-table sheets) and
**Verdigris** (botanical dusk, arched plate frames). Each is a
`ThemeDefinition` (`src/themes/definitions/*`) exposing typed setting schemas (selects /
toggles) and a `resolveTokens()` that maps settings → `--sh-*` CSS variables.

The registry (`src/themes/registry.ts`) is the single source of truth: `getTheme`,
`isThemeId`, `defaultThemeSettings`, and `sanitizeThemeSettings` (safe across theme switches
— unknown keys fall back to defaults). It is also the *only* place theme validity is
enforced: the database deliberately has no theme constraint (a hardcoded `pages.theme`
CHECK silently broke draft saves for themes 6–8 and was dropped in migration
`20260708100000`). Adding a theme therefore needs no migration, but theme QA must include
switching a real page to the new theme and confirming the save lands on the hosted DB. Renderers share primitives: `SmartImage`, `Lightbox`,
`Container`, `Reveal` (scroll reveal), `SpacerBlock`. `PageRenderer.tsx` is the single entry
point used by both the editor preview and the published route.

Every theme has a dark presentation: Monograph (`paper: dark`), Roll 36 (`surface:
darkroom`, the default), After Dark (dark by definition), Keepsake (`paper: midnight` —
black album pages), Cabinet (`background: slate` — dark gallery wall).

**Mixed-orientation layout** (`src/themes/shared/photo-layout.ts` + `PhotoRow.tsx`): `split`
and `row` sections are planned, not naively gridded. Justified rows give each image a grid
column weighted by its aspect ratio (`r₁fr r₂fr …`), which makes every image in the row
exactly the same height with zero cropping. A 3-up row with exactly one portrait becomes a
mosaic: the portrait full-height on one side, the two landscapes stacked beside it (bottom
cell cover-fills, so the columns stay flush). Extreme crops (panoramas, tall slivers) are
clamped to a layout ratio band and gently cover-cropped so one odd file can't wreck a row.
Standalone portrait images (`image`/`sequence`) are width-capped via `portraitConstraint` so
a vertical photo tops out near viewport height instead of towering. All decisions are pure
functions with unit tests; themes keep their own figure chrome via a render prop.

Theme colours are scoped to `.sh-page`; the published route additionally sets the page
`<body>` background inline so a theme's palette never leaks into the rest of the app.

---

## 7. Publishing & the draft/published split

The draft is a living document; the **published snapshot is frozen**. `publishPage`
serialises the current draft (document + theme + settings + title) into `published` and flips
`is_published`. Editing afterward touches only the draft — the live page is unaffected until
the next publish. `unpublishPage` clears `is_published` without discarding the snapshot;
`deletePage` removes both and prunes now-orphaned media (§9).

The published route renders `published`, **never** `draft`, so an in-progress edit can never
appear on a live URL.

---

## 8. Visibility & the password gate

- **public** — listed on the profile, indexable.
- **unlisted** — reachable by link only; `noindex`, hidden from the profile.
- **password** — a gate stands in front of the page.

Because unlisted/password pages must be readable without a session but must not be listed,
the published route loads through the **service-role client** and enforces visibility in
code. Metadata for protected pages leaks nothing (`robots: noindex`, generic title).

Password gates use the **Arbor-proven pattern** (§16): the password is stored as a PBKDF2
hash (`src/lib/page-password.ts`); on unlock (`unlockPage`, rate-limited per IP+page) a
short-lived **HMAC-signed cookie** grants access for 12 hours (`src/lib/page-gate.ts`). No
password is ever stored or logged in the clear.

---

## 9. Media pipeline

Uploads are prepared **client-side** (`src/lib/image.ts`): the browser re-encodes each photo
through a canvas into three JPEG variants (`lg` ≤2000px, `md` ≤1000px, `sm` ≤480px) plus a
tiny blur placeholder. Canvas re-encoding **strips all EXIF metadata, including GPS**, by
construction — location data never leaves the device.

The upload is orchestrated by `src/lib/upload-client.ts` (XHR with progress) and lands at
`POST /api/media`, which **re-validates server-side** (`src/lib/media-validation.ts`):
magic-byte sniffing (not trusting the declared MIME type), dimension and size checks. On
success it writes `{userId}/m/{assetId}/{lg,md,sm}.jpg` to storage and records a
`media_assets` row; any failure rolls back. The endpoint is rate-limited.

`DELETE /api/media/:id` refuses if any **published** snapshot still references the asset, so a
delete can never break a live page. `GET /api/media` returns the caller's library
(metadata only, cursor-paginated 60 at a time) for the reuse picker; the same asset can be
placed on many pages while stored once, since each placement is a fresh `PageImage` with its
own caption/alt/focal.

**Photo pool.** A document carries an optional `tray: PageImage[]` of photos uploaded to the
page but not yet placed. The tray counts toward the page image limit (`countImages`), is
stripped from the published snapshot in `publishPage` (unplaced photos never ship or cost
egress), and drives the editor's drag-to-place flow. `ImageDrag.tsx` is a pointer-event drag
layer (not dnd-kit, which already owns section-row sorting) moving photos between tray and
sections; touch users get "Send to" / "Place" menus instead. `fillFromTray` is an explicit
one-shot that pours the tray into sections in document order, never a live binding. `src/lib/media.ts` resolves URLs and builds `srcset`;
`SmartImage` reserves aspect ratio (no layout shift), shows the blur placeholder, honours the
focal point via `object-position`, lazy-loads below the fold, and opens the lightbox.

> **Image reveal / hydration.** `SmartImage` fades in on load. React's synthetic `onLoad` is
> unreliable for server-rendered images — the browser can finish the download during the
> hydration gap, so the event is missed and the image would stay invisible. `SmartImage`
> therefore checks `img.complete` in a post-mount effect and, if still loading, attaches a
> native `load`/`error` listener that cannot be missed. This was found and fixed during the
> end-to-end verification pass.

---

## 10. Entitlements & monetization groundwork

`src/lib/entitlements.ts` maps `tier` → capability (free 3 pages / 40 images per page;
hobby 10 / 100; pro 25 / 200; studio 100 / 500) plus the paid-feature flags: `removeBadge`, `hiFiUploads`,
`analytics`. `resolveTier` handles expiry (`profiles.tier_expires_at`): a lapsed paid tier
reads as free with no writes needed. Enforced in `createPage`/`duplicatePage`/`savePageDraft`
and in the media upload route.

Everything except the payment provider is built (see MONETIZATION_PLAN.md):

- **Billing effects** (`src/lib/billing/effects.ts`) — `setTier`, `clearTier`,
  `grantPermanentPage`, and a `billing_events` idempotency ledger. A future webhook route
  verifies the provider signature and reduces events to these three calls; nothing else in
  the app will know the provider exists.
- **Badge** — free-tier published pages carry a "Made with Slanthour" footer link
  (`/?ref=<username>`); hidden for paid tiers and Keepsake pages.
- **Hi-fi uploads** — Pro+ uploads also produce `xl.jpg` (2560px, q0.85), generated
  client-side, tier-checked server-side, surfaced through `imageSrcSet` and the Lightbox.
  Never an upscale: sources ≤2000px skip it. `media_assets.has_xl` / `PageImage.hasXl`.
- **Analytics** — cookie-less daily aggregates (`page_view_daily`, `increment_page_view`
  RPC, service-role only), recorded via `next/server` `after()` on the published route with
  bot/link-preview UA filtering and owner-visit exclusion. Recorded for everyone; shown on
  the dashboard only with the `analytics` entitlement.
- **Keepsake pages** — `permanent_grants` rows (10-year `guaranteed_until`) exempt a page
  from `maxPages` and remove the badge; the T&C provision is live on /terms. Purchase flow
  arrives with the provider.
- **Proofing galleries** (§3.7, built 9 Jul) — the client-selects-favourites workflow.
  Three tables (`20260709000000_proofing.sql`): `proofing_galleries` (owner, title,
  unguessable 20-char `slug`, optional `password_hash`, `status active|archived`),
  `proofing_images` (md storage path + the client's ORIGINAL `filename` — the Lightroom
  deliverable — plus batch `position`), `proofing_selections` (row-exists = picked; one
  shared set per gallery, no client accounts). Entitlement `proofingGalleries` counts
  ACTIVE galleries only (free/hobby 0, pro 3, studio unlimited); archiving closes the
  `/proof` link and frees a slot, re-activating re-checks the limit. Images are md+sm
  ONLY (~100KB/photo, generated client-side by `prepareProofingUpload`) — lg/xl never
  exist for proofing, so previews stay small by construction. Gallery rows are not
  anon-readable (enumeration defence, same posture as password pages): `/proof/:slug`
  and the selection endpoint read via the service-role client with checks in code, and
  a password gallery sets an HMAC gate cookie namespaced separately from the page gate
  (`src/lib/proofing-gate.ts`). Owner mutations live in `src/lib/actions/proofing.ts`;
  gallery deletion removes storage objects first (rows cascade).

---

## 11. Rendering & performance

- Public routes are `force-dynamic` (visibility is per-request) but do the minimum work:
  a profile/page lookup and a pure render of already-sanitised jsonb.
- Responsive `srcset` + intrinsic dimensions mean the browser fetches the right variant and
  never reflows.
- Scroll reveals and image fades respect `prefers-reduced-motion`.

---

## 12. Security summary

Input is sanitised at every trust boundary (jsonb parsers, magic-byte sniffing, slug/username
validation with a reserved-word list, theme-setting sanitisation). Mutations are
authenticated + ownership-checked server-side with RLS behind them. Passwords (account and
page) are hashed. Upload paths are validated for folder ownership. Rate limiting guards the
password and upload endpoints.

**Documented limitations** (also in SPECIFICATION_MAP): storage is a public bucket with
unguessable UUID paths — a *capability-URL* model, not per-request authorization, so draft
images are unlisted but not access-controlled (surfaced to users in the privacy policy). The
rate limiter is in-memory (best-effort; a platform/edge limiter belongs in production). The
service-role key must be rotated by the user if it was ever exposed.

---

## 13. Testing

Unit suites (Vitest) cover the parts where correctness is subtle and regressions are
expensive: the editor reducer (section/image/undo/redo/coalescing/conversion), the page
document sanitisers, media validation (magic bytes, dimensions), slug/username validation,
theme registry sanitisation, and password/HMAC security helpers. `npm run build`,
`npm run lint`, and `npm run typecheck` all pass clean.

The full create → upload → arrange → theme → publish → view → delete flow was exercised
against the live database during the verification pass; that walkthrough is what surfaced the
SSR image-reveal bug and the orphaned-asset cleanup gap, both since fixed. A Playwright CI
suite is a documented future addition rather than a current deliverable.

---

## 14. Environment

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`PAGE_GATE_SECRET` (HMAC signing key for page cookies), plus the separate `ARBOR_*` variables
consumed only by the Arbor product. Secrets live in `.env.local` (gitignored).

---

## 15. Storage layout

```
{userId}/m/{assetId}/lg.jpg | md.jpg | sm.jpg   # platform uploads (variants)
{userId}/p/{galleryId}/{imageId}/md.jpg | sm.jpg # proofing previews (never lg/xl)
{userId}/photos/...                             # legacy portfolio images (still referenced)
{userId}/banner.jpg                             # legacy banner
```

The bucket name (`portfolios`) is retained for data continuity with pre-migration content.

---

## 16. The Arbor boundary

`/arborAI` + `/api/arbor/*` is a **separate, self-contained product** (the user's second
business) that happens to live in the same repo. It shares only the root layout,
`globals.css` helpers, the admin Supabase client factory, and its own `ARBOR_*` env vars. It
is intentionally left untouched by the platform work. The page password-gate pattern (§8) was
generalised *from* Arbor's proven approach, not the other way around.

---

## 17. What was removed

The migration deleted the entire portfolio-era surface: the form-based portfolio editor, the
three hard-branched theme layouts (~1,500 duplicated lines), nine dashboard components, the
orphaned waitlist stack (`/api/waitlist` + form), `/api/photos/reorder`, `lib/theme.ts`, dead
constants and types, and stray `legacy/` scripts. Retained by explicit decision: the Arbor
product, the `/sihas-abeywickrama` static rewrite, and the deprecated legacy DB tables (kept
for rollback). Full inventory in [SPECIFICATION_MAP.md](SPECIFICATION_MAP.md).
