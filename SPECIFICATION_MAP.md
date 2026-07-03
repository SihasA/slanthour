# Slanthour — Specification Map

Traceability from the product specification to the implementation. "Before" describes
`main` @ `d332b04` (pre-implementation). Statuses are updated as work lands; nothing is
marked **Done** unless implemented *and* verified.

Legend: ✅ Done · 🟡 Partial (limitation documented) · ❌ Not done · ➖ Intentionally out of scope

| Requirement | Before | Gap | Implementation | Verification | Status |
|---|---|---|---|---|---|
| **Routes** | | | | | |
| `/` landing per spec §18 | Portfolio-era landing, no theme showcase | Rework structure + showcase | `src/app/page.tsx` + `src/components/landing/ThemeShowcase.tsx` | Build + visual check (desktop/mobile) | ✅ |
| `/pricing` | Absent (hardcoded £6.99 modal in ThemePicker) | New honest pricing page | `src/app/pricing/page.tsx` | Loads, no fake claims | ✅ |
| `/login`, `/signup`, `/forgot-password` | Single combined `/login` | Split routes + reset flow | `src/app/(auth)/login,signup,forgot-password/page.tsx` | Manual auth flow | ✅ |
| `/privacy`, `/terms` | Absent | New legal pages | `src/app/privacy`, `src/app/terms` | Load, linked in footer | ✅ |
| `/:username` public profile + page index | Rendered single portfolio directly | Profile page listing published public pages | `src/app/[username]/page.tsx` | Signed-out view | ✅ |
| `/:username/:slug` published page | Absent | New route rendering published snapshot | `src/app/[username]/[slug]/page.tsx` | Signed-out view, all visibilities | ✅ |
| `/dashboard` page cards | Status widget only, single portfolio | Full page-card dashboard | `src/app/dashboard/page.tsx` | Manual flow, all states | ✅ |
| `/pages/new` | Absent | Create action → editor | `src/app/pages/new/page.tsx` | Creates + redirects | ✅ |
| `/editor/:pageId` | Absent (form-based portfolio editor) | Full section editor | `src/app/editor/[pageId]/` | Manual create-to-publish flow | ✅ |
| `/settings/profile`, `/settings/account` | Single `/dashboard/settings` | Split settings, add account mgmt | `src/app/settings/` | Manual flow | ✅ |
| Remove random/irrelevant subpages (§8) | Orphaned waitlist stack, dead `legacy/`, old prototypes | Remove + route inventory | Deletions; inventory in `ARCHITECTURE.md` §5 | Grep, build | ✅ |
| `/arborAI` (user's other business) | Present, self-contained | **Retain untouched** (documented exception) | unchanged | Untouched in diff | ✅ |
| **Core flow (§9)** | | | | | |
| Account creation / sign-in | Google OAuth + email | Add signup page + password reset | `(auth)` routes | Manual | ✅ |
| Create page, title, upload, arrange, theme, captions, preview, autosave, visibility, slug, publish, signed-out view, edit/republish, unpublish, delete | Only flat photo upload + single publish boolean | Everything else | Editor + server actions + public routes | E2E walkthrough (documented in §Verification of final report) | ✅ |
| **Data model** | | | | | |
| Versioned page document, stable section IDs, ordered sections (§4.7, §7) | Flat `photos.sort_order` | New JSONB document model v1 | `src/lib/page-document.ts`, `pages.draft/published` | Unit tests | ✅ |
| Draft/published separation, atomic republish, unpublish (§12) | Single `is_published` boolean on live rows | Snapshot model | `publishPage`/`unpublishPage` server actions | Unit + manual | ✅ |
| Slug uniqueness + reserved words (§12, §23) | `RESERVED_SLUGS` const existed, unused for pages | Validation + DB unique constraint | `src/lib/validation.ts`, migration | Unit tests | ✅ |
| Migration of existing data (§28) | Founder's live portfolio | Backfill portfolios→pages, photos→sections/assets | Migration `20260703000000` | Applied to linked project; old URL redirect documented | ✅ |
| **Editor (§11)** | | | | | |
| Section types (hero, image, full-width, split, 3-row, grid, contact sheet, text, title, quote, spacer, image+caption, sequence) | None | Full section union | `page-document.ts` + shared renderers | Unit + visual | ✅ |
| Add/delete/duplicate/reorder sections, image ops, captions, alt, focal point | Photo grid reorder only | Editor actions | `src/components/editor/` | Manual | ✅ |
| Undo / redo | None | History stacks in reducer | `src/lib/editor/reducer.ts` | Unit tests | ✅ |
| Autosave (debounced, states, no stale overwrite, retry) | None (manual save buttons) | Rev-checked autosave | Editor + `savePageDraft` action | Unit + manual | ✅ |
| Mobile editor usability | 3-col dashboard forms | Responsive editor w/ sheet panels | Editor layout | Viewport check | ✅ |
| **Themes (§15–16)** | | | | | |
| Typed registry, shared contract, no scattered conditionals | 3 hardcoded layouts, conditional branching | New `src/themes/` engine | `src/themes/registry.ts`, `types.ts` | Registry unit tests | ✅ |
| Monograph / Roll 36 / Keepsake / After Dark / Cabinet, each with tokens + settings + distinct layout behaviour | Editorial/Journal/Cinematic (colour+font variations of similar galleries) | Five new themes | `src/themes/<id>/` | Rendered demo pages, both viewports, reduced motion | ✅ |
| Theme switch preserves content; unsupported settings ignored safely | n/a | Shared document + settings sanitiser | `sanitizeThemeSettings` | Unit tests | ✅ |
| **Media (§17)** | | | | | |
| Drag-drop, picker, multi-file, progress, retry, validation errors | Partial (uploader existed) | Rebuilt uploader on new pipeline | `src/components/editor/MediaUploader.tsx` | Manual | ✅ |
| Magic-byte validation, size caps (server-side) | Client-only checks | Server route validation | `src/app/api/media/route.ts` | Unit tests on validator | ✅ |
| Responsive variants + blur placeholder + dimensions | Single 2000px JPEG | 3 variants + blur | `src/lib/image.ts` | Manual + code review | ✅ |
| EXIF/GPS stripping | Incidental via canvas | Kept + documented as guarantee | `ARCHITECTURE.md` §9 | Code review | ✅ |
| Deletion respects published snapshots | No safeguards | Reference check before delete | `deleteMediaAsset` | Unit tests | ✅ |
| **Visibility (§13)** | | | | | |
| Public / unlisted (noindex, hidden from profile) / password (PBKDF2 hash, HMAC session cookie, no metadata leak) | Only public/unpublished | Full visibility model | `pages.visibility`, `src/lib/page-gate.ts`, `page-password.ts` | Unit + manual signed-out checks | ✅ |
| **Profile (§14)** | | | | | |
| Display name, username, bio, avatar, published pages; no social features | Profile fields existed | New profile page | `src/app/[username]/page.tsx` | Manual | ✅ |
| **Security (§23)** | | | | | |
| Server-side ownership checks on all mutations | RLS only, browser-direct writes | Server actions layer | `src/lib/actions/` | Code review + tests | ✅ |
| Secrets hygiene | Service-role key in non-ignored local file | Gitignored + rotation documented | `.gitignore`; report | `git ls-files` | 🟡 (key rotation is a user action) |
| Private draft images | Public bucket, guessable-ish paths | Unguessable UUID paths; limitation documented | `media` paths + `ARCHITECTURE.md` §13 | Code review | 🟡 (capability-URL model, documented) |
| Rate limiting | None | Best-effort in-memory limiter on password + upload endpoints; platform-level limiting documented | `src/lib/rate-limit.ts` | Unit test | 🟡 |
| **Entitlements (§19)** | | | | | |
| Clean entitlement abstraction, editor never paywalled | Tier-gated themes + fake £6.99 modal | `src/lib/entitlements.ts`; theme gating removed | Entitlements module | Unit test | ✅ |
| **Accessibility (§20)** | Minimal | Semantic headings, alt text, focus states, reduced motion, dialog focus management | Throughout; per-theme | Manual keyboard pass | ✅ |
| **Analytics (§24)** | None | Not implemented (kept out of scope; documented) | — | — | ➖ (documented limitation) |
| **Error/empty states (§22)** | Sparse | States for all listed cases | Dashboard/editor/public routes | Manual | ✅ |
| **Tests (§25)** | None | Vitest unit suite + build/lint/typecheck; browser E2E of core flow | `src/**/*.test.ts`, `vitest.config.ts` | `npm test`, `npm run build`, `npm run lint` | 🟡 (no Playwright CI suite; documented) |
| **Demo content (§26)** | None | Demo assets from founder's own photos + seed script | `public/demo/`, `scripts/seed-demo.mjs` | Landing showcase renders | ✅ |
| **Docs (§4, §29)** | PLANNING_CONTEXT.md only | Three canonical docs | `ARCHITECTURE.md`, this file, `IMPLEMENTATION_PLAN.md` | Review | ✅ |
| Domain purchasing / social features / ecommerce | Absent | Must stay absent | — | Grep | ➖ |
