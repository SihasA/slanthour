# Homepage conversion tasks — for Sonnet agents

Seven self-contained tasks to raise signup conversion on the Slanthour landing page.
Each task is written to be handed to an agent cold: it carries its own context, files,
scope, and acceptance criteria. Run them one at a time (T1 → T7 is the suggested
order); they touch overlapping files, so don't run them in parallel.

## Shared context (include with every task)

Slanthour (slanthour.com) turns collections of photographs into designed, shareable
web pages — "a designed object, not a feed." Audiences: photographers (portfolios,
series) and memory-keepers (weddings, tributes, family archives). Next.js App Router +
Tailwind + Supabase, deployed on Vercel.

**Design language — hard constraints.** The site is quiet and editorial. Serif
display headings (`font-heading`, light, often italic), body copy via `font-copy`,
micro-labels as `text-[10px] uppercase tracking-wide`, colors only through existing
tokens (`text-foreground`, `text-muted`, `text-accent`, `bg-background`,
`border-rule`; see `src/app/globals.css`). Thin 1px rules, generous whitespace,
square corners. **Never add**: rounded corners, gradients, emoji, drop shadows,
marketing-speak ("supercharge", "unleash"), or fake testimonials/user counts — the
product has no public users yet and invented social proof is forbidden.

**Key files**: landing `src/app/page.tsx` (~200 lines, sections: header, hero,
theme showcase, how-it-works, use-cases, publishing note, footer);
`src/components/landing/ThemeShowcase.tsx` (live-renders a demo document through the
real theme engine); demo content `src/lib/demo/showcase.ts`; demo photos in
`public/demo/`; pricing `src/app/pricing/page.tsx`.

**Verification (every task)**: `npx tsc --noEmit`, `npm run lint`, `npm run build`
all clean. Then start the dev server, screenshot the affected section at desktop
(~1280px) and mobile (~390px), and confirm the change visually before finishing.

---

## T1 — Put photography above the fold

**Problem**: the first screen a visitor sees contains zero photographs — a text-only
hero for a visual product. The five-theme showcase (the strongest asset) is below the
fold.

**Task**: redesign the hero in `src/app/page.tsx` so real imagery from
`public/demo/` is visible without scrolling at common desktop and mobile sizes,
while keeping the existing headline ("A home for photos that deserve more than a
post."), subcopy, and CTAs. Suggested direction (not mandatory): a restrained
photo strip or offset two-column hero using 2–4 demo photos with theme-like
framing — not a carousel, no autoplay motion. Reduce vertical padding
(`pt-40/pt-52`) as needed so the imagery clears the fold. Images must use proper
`width`/`height` or aspect wrappers (no layout shift) and be plain `<img>` or
`next/image` consistent with the rest of the file.

**Accept when**: at 1280×800 and 390×844 at least one photograph is fully visible
without scrolling; headline + primary CTA still visible; no CLS visible on reload;
build/lint clean.

## T2 — Full-screen live demo route (/demo)

**Problem**: the showcase is a 640px scrollable frame; visitors can't experience a
finished page the way a recipient of a shared link would — which is the actual
product moment.

**Task**: create `src/app/demo/page.tsx` that renders `SHOWCASE_DOCUMENT` from
`src/lib/demo/showcase.ts` full-page through `PageRenderer` (see how
`ThemeShowcase.tsx` calls it), with a `?theme=` search param (validated against
`THEME_IDS`, default `monograph`) and a minimal fixed top bar: "This is a live
Slanthour page — Try another theme [five links] · Create your own →" (links to
`/signup`). Add metadata (title "Demo — Slanthour", noindex is fine). In
`ThemeShowcase.tsx`, add a small "Open full-screen →" link under the frame passing
the active theme. Keep the top bar styled in landing tokens, not theme tokens.

**Accept when**: `/demo?theme=keepsake` renders the Keepsake page full-viewport
with working theme switching; signup CTA present; landing showcase links to it;
build/lint clean.

## T3 — Objection-handling FAQ section

**Problem**: the three biggest conversion objections are unanswered on the page:
"can I get my photos out?", "will my photos look worse?", "will this site still
exist in a few years?".

**Task**: add a compact FAQ section to `src/app/page.tsx` between the publishing
section and the footer, following the existing section pattern (border-t, section
label "Questions", two-column grid on desktop). 5–6 Q&As, factual and grounded in
the codebase — verify each claim before writing it (media pipeline:
`src/lib/image.ts`, `src/lib/constants.ts`; visibility/password:
ARCHITECTURE.md §7–8; privacy/EXIF stripping: `src/app/privacy/page.tsx`). Cover:
image quality (2000px display variants, srcset), photo ownership + export, EXIF/GPS
stripping (privacy as a feature), visibility options, whether viewers need an
account (no), what happens if you stop paying / permanence (keep wording consistent
with `src/app/terms/page.tsx` — if MONETIZATION_PLAN.md §6 has shipped to the terms
page, reference the Keepsake guarantee; otherwise answer conservatively). Plain
prose answers, 2–3 sentences each, no accordion JS — static text is fine and better
for SEO.

**Accept when**: section reads in the site voice, every factual claim is verifiable
in the repo, renders well at both breakpoints, build/lint clean.

## T4 — Pricing teaser + retire "free while young"

**Problem**: the landing page says publishing is "free while Slanthour is in its
early days" (hero section ~line 153) and the pricing page says "Free while Slanthour
is young." — both must change when paid tiers launch, and the homepage never states
what paying gets you.

**Task**: (coordinate with MONETIZATION_PLAN.md §1 — do this task only when tiers
are ready to be announced). Rewrite the "Publishing" section copy in
`src/app/page.tsx` to state the real model: free tier (5 pages, all themes, badge),
Pro $7/mo (more pages, high-fidelity images, analytics, no badge), one-time $39
Keepsake page (10-year guarantee, archive download). Add a three-column mini
pricing strip (Free / Pro / Keepsake) with a "Full pricing →" link. Rework
`src/app/pricing/page.tsx` into the full three-tier + Keepsake table in the same
editorial style (no SaaS pricing-card clichés; think price list in a catalogue).
Keep "No credit card required" for signup.

**Accept when**: no "free while young" phrasing remains anywhere
(`grep -ri "while.*young\|early days" src/`), prices match MONETIZATION_PLAN.md,
both pages build clean.

## T5 — Mobile navigation and sticky CTA

**Problem**: on mobile the header hides Themes and How-it-works (`hidden sm:block`),
leaving only Pricing and Log in — and "Log in" outranks signup. There is no
persistent path to signup while scrolling a long page.

**Task**: in `src/app/page.tsx` header: add a compact "Create" link (accent-styled,
`/signup`) visible at all sizes next to "Log in"; on mobile show the section links
in a slim second row under the header or an unobtrusive disclosure — no heavy
hamburger drawer, no new dependencies. Additionally, after the visitor scrolls past
the hero on mobile only, reveal a slim fixed bottom bar: "Create a page — free →"
(client component, IntersectionObserver on the hero, `motion-safe` transition,
dismissable ×, does not overlap the footer). Respect existing z-index of the fixed
header (z-50).

**Accept when**: at 390px the visitor can reach Themes/How-it-works/signup from the
header; bottom bar appears only after the hero and only on mobile; nothing overlaps
or jitters; build/lint clean.

## T6 — Metadata, Open Graph and structured data

**Problem**: shared links are the only acquisition channel, and the landing page has
no OG image or descriptions tuned for link previews.

**Task**: audit `src/app/layout.tsx` and the marketing routes (`/`, `/pricing`,
`/demo` if T2 landed). Add: complete `metadata` exports (title template,
description ~155 chars in the site voice, canonical), Open Graph + Twitter card
tags, and a static OG image `public/og/landing.png` (1200×630) — compose it from a
demo photograph + wordmark (`public/brand/`) using theme-consistent styling; a
simple script with `sharp` (already a dependency or use canvas in a one-off node
script committed to `scripts/`) or hand-assembled export is acceptable, but the
image must be committed. Add JSON-LD (`WebApplication` with offers once T4 pricing
is live; `WebSite` otherwise). Do not add analytics scripts or third-party tags.

**Accept when**: `curl localhost:3000 | grep og:` shows image/title/description;
OG image file exists at the referenced path and is 1200×630; validator-clean JSON-LD
(no console errors); build/lint clean.

## T7 — Landing performance / LCP pass

**Problem**: the theme showcase mounts a full `PageRenderer` with ~8 demo images on
initial load; hero fonts are large; conversion is sensitive to first-paint speed.

**Task**: measure first (dev server + Chrome DevTools Lighthouse or
`npx lighthouse http://localhost:3000 --preset=desktop` and mobile). Then fix the
top findings, likely: lazy-mount `ThemeShowcase` when scrolled near
(dynamic import + IntersectionObserver wrapper, keeping SSR text content for the
section heading), explicit `loading="lazy"`/`decoding="async"` on below-fold demo
images, `priority`/preload only for the actual LCP element (hero image if T1
landed), font loading audit (`next/font` display swap already?), and confirm demo
JPEGs in `public/demo/` are reasonably sized (<150KB each — recompress with `sharp`
via a one-off script if larger, preserving visual quality). Record before/after
scores in the PR/commit message.

**Accept when**: mobile Lighthouse performance improves measurably (target LCP
< 2.5s on simulated 4G), no visual regression in the showcase section, build/lint
clean.

---

### Dispatch note

Each task above can be launched as: *"Read HOMEPAGE_CONVERSION_TASKS.md in the repo
root. Execute task T<n> exactly as scoped, including the Shared context constraints
and the verification steps. Do not start any other task."*
