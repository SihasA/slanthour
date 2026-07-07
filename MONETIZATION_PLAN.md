# Slanthour — Monetization Plan

Decisions locked 7 July 2026: Pro **$7/mo · $60/yr**, Studio **$18/mo · $150/yr**,
Keepsake permanent page **$39 one-time / 10-year term**, free-tier pages carry a subtle
"Made with Slanthour" badge. Billing provider deliberately deferred (see §2).

---

## 1. Tiers

| | Free | Pro — $7/mo · $60/yr | Studio — $18/mo · $150/yr |
|---|---|---|---|
| Pages | 5 | 25 | 100 |
| Images per page | 60 | 200 | 500 |
| Themes & settings | All | All | All |
| Visibility (public / unlisted / password) | All | All | All |
| "Made with Slanthour" badge | On published pages | Removed | Removed |
| High-fidelity images (2560px) | — | ✓ | ✓ |
| Page analytics | — | ✓ | ✓ |
| Custom domain | — | 1 domain | 5 domains |
| Keep-originals archive | — | Add-on (metered) | Add-on (metered) |

**Keepsake page — $39 one-time, per page.** Published for a guaranteed minimum of
10 years, no badge, static archive download included, wind-down protection (§6).
Positioned at the memories audience (weddings, memorials, tributes) where a
subscription is the wrong shape. Available to any account, including free.

Principles already encoded in the codebase and kept here: the editor is never
paywalled; limits apply only to page count / images per page / features around the
published artifact. `src/lib/entitlements.ts` stays the single tier→capability boundary.

## 2. Billing provider — deferred, but constrained

Founder is an individual in Sri Lanka with no registered business. That rules out
Stripe directly (Sri Lanka is not a supported Stripe country) unless a foreign entity
is incorporated (Stripe Atlas, ~$500 + ongoing US filings — not worth it pre-revenue).

The practical route is a **merchant of record** — they are legally the seller,
handle global VAT/GST, and pay out to individuals:

- **Paddle** — MoR, supports individual sellers, subscription + one-time products,
  payouts via Payoneer/wire. ~5% + 50¢ fees.
- **Lemon Squeezy** — MoR (Stripe-owned), simpler API, similar fees, Payoneer payouts.

**Action before phase 1 ships:** create accounts on both, confirm (a) individual
onboarding from Sri Lanka passes verification, (b) payout rail actually works
(Payoneer → LKR account), (c) subscription *and* one-time products enabled. Pick
whichever clears first; the integration below is provider-agnostic so this choice
doesn't block development. Separately: confirm local income-tax treatment of foreign
receipts with a Sri Lankan accountant (not blocking).

### Provider-agnostic integration contract

All provider contact lives in `src/lib/billing/` with one narrow interface:

- **Checkout**: server action creates a provider checkout link for
  `{ product: "pro" | "studio" | "keepsake", interval?, pageId? }` and redirects.
- **Webhook**: `src/app/api/billing/webhook/route.ts` verifies the provider
  signature and reduces every event to one of three internal effects:
  `setTier(userId, tier, currentPeriodEnd)`, `clearTier(userId)`,
  `grantPermanentPage(pageId, orderId, expiresAt)`.
- **DB**: `profiles.tier` already exists. Add `profiles.tier_expires_at timestamptz`
  (grace handling: keep tier until period end on cancellation) and a
  `billing_events` table (provider event id, payload, processed_at) for idempotency.
- Nothing else in the app knows the provider exists. `getEntitlements()` remains the
  only read path.

## 3. Feature implementation map

### 3.1 Free-tier badge (conversion lever + growth loop)
Published route only (never the editor/preview). Server-side: the published page
already loads the owner profile — if resolved tier is `free` and the page has no
permanent grant, render a quiet footer line: `Made with Slanthour` linking to
`/?ref=<username>`. Style per theme tokens (muted, 10px, uppercase-tracked) so it
belongs to the page rather than defacing it. Copy on pricing page: "Remove the
Slanthour badge" as a Pro line item.

### 3.2 High-fidelity images (Pro+)
Add an `xl` variant to `MEDIA_VARIANTS` in `src/lib/constants.ts`: **2560px @ q0.85**
(alongside lg 2000/md 1000/sm 480). Generated client-side at upload like the others;
gated by the uploader's tier at upload time. `SmartImage` srcset and the Lightbox pick
up `xl` when present. Two honest caveats to encode in UI copy:
- Applies to uploads made while on Pro — originals are discarded by design, so
  existing photos can't be retro-upgraded (offer "re-upload to upgrade" hint in editor).
- Downgrade doesn't delete existing `xl` variants; they just stop being generated.

### 3.3 Page analytics (Pro+)
First-party, no cookies, aggregate-only — consistent with the privacy posture:
- Table `page_view_daily (page_id, day, views int)` with RLS owner-read.
- Increment from the published route via a fire-and-forget server insert/upsert
  (service role), skipping the owner's own authenticated views.
- Dashboard: total + 30-day sparkline per page. Free users see the feature teased
  ("Views tracked — upgrade to see them") with real accumulating data, which is a
  strong upgrade trigger without withholding collection.

### 3.4 Custom domains (Pro: 1, Studio: 5) — phase 3
Vercel-hosted, so: Vercel Domains API to attach `pages.customdomain.com` to the
project + a `domains` table (domain, user_id, target: profile or specific page,
verified_at) + middleware host matching that rewrites to `/{username}` or
`/{username}/{slug}`. DNS instructions UI in settings; TXT verification before
serving. This is the largest infra item — do not block launch on it, but it is the
single most-cited reason photographers pay, so it is phase 3, not "someday."

### 3.5 Keep-originals archive (add-on) — phase 4
The one place a storage meter is honest: user is genuinely buying bytes.
Opt-in per account: original files uploaded to a private `originals` bucket alongside
variant generation (no serving, download-only). Priced per 50GB block (~$2/mo) via a
provider add-on product. Deferred until a paying base exists; mentioned on pricing
page as "coming" only if truthful at launch.

### 3.6 Keepsake permanent pages — $39 / 10-year minimum
- `permanent_grants` table: page_id, user_id, order_id, purchased_at,
  `guaranteed_until` (purchase + 10 years).
- A page with an active grant: stays published regardless of tier or page-count
  limits (excluded from `maxPages` counting), no badge, cannot be blocked by
  downgrade — only the owner can unpublish/delete it.
- Purchase flow from the page's publish panel; one-time checkout (`pageId` in
  checkout metadata → webhook grants).
- **Static archive download** ships with this (it's the credibility half of the
  product): server route renders the published snapshot to a self-contained zip
  (HTML + CSS + the page's image variants, URLs rewritten to relative paths). The
  published document is already a frozen snapshot, so this is mechanical. Offer the
  download to *all* published pages' owners — permanence trust helps every tier —
  but market it with Keepsake.

## 4. Phasing

1. **Phase 1 — billing core + immediate value** (launch): provider decision (§2),
   checkout + webhook + `billing_events`, pricing page rework (three tiers + Keepsake),
   free badge, `xl` hi-fi variant, page analytics, landing "free while young" copy
   retired. Entitlements numbers unchanged (already 5/60 · 25/200 · 100/500).
2. **Phase 2 — Keepsake permanent pages**: grants table, purchase flow, static
   archive export, T&C provision (§6), publish-panel and pricing-page placement.
3. **Phase 3 — custom domains** (Pro 1 / Studio 5).
4. **Phase 4 — keep-originals add-on** (metered storage).

## 5. Unit economics sanity check

Per-photo storage across variants (incl. xl) ≈ 2.5MB worst case. A maxed Studio user
(100 pages × 500 images is theoretical; realistic heavy user ~2,000 photos) ≈ 5GB ≈
**$0.10/mo** storage. Egress dominates: 1,000 page views ≈ 10–30GB ≈ $1–3. At $7/mo,
even a heavily-viewed Pro account runs >70% infra margin before provider fees (~5%).
Keepsake at $39: lifetime infra cost of a typical event page is $1–3 → the 10-year
guarantee is comfortably funded by the payment itself. No pricing tier needs to meter
storage except the originals add-on, by design.

## 6. Terms of service — Keepsake / permanent pages provision (draft)

To be added to `src/app/terms/page.tsx` (style-matched to existing sections):

> **Permanent pages ("Keepsake pages")**
> A Keepsake page is a one-time purchase attached to a single published page. When
> you buy one, we commit to keeping that page published and served for at least ten
> years from the date of purchase, independent of any subscription. You can
> unpublish, edit or delete your own Keepsake page at any time; doing so doesn't
> extend or refund the purchase.
>
> Every Keepsake page includes a downloadable archive — a self-contained copy of the
> page that works on any web host, without Slanthour.
>
> If Slanthour ever winds down, we will give at least twelve months' notice to the
> email on your account, keep archive downloads available for that entire period,
> and make reasonable efforts to keep Keepsake pages reachable through the notice
> period. This commitment survives a sale of the service: any acquirer takes on
> these obligations.
>
> After the ten-year term we expect to keep Keepsake pages up at no further charge;
> if that ever has to change, you'll get twelve months' notice and the archive
> download, not a surprise takedown.
>
> Keepsake purchases are refundable within 14 days if the page hasn't been shared
> publicly. Content that violates the acceptable-use rules can be removed regardless
> of purchase, without refund.

Notes: "at least ten years" + "we expect to keep" is the under-promise/over-deliver
structure — the enforceable floor is 10 years + notice + export; anything beyond is
goodwill. Refund window mirrors MoR provider norms (Paddle/LS both require a stated
refund policy).

## 7. Status (7 July 2026)

Everything provider-independent is implemented and live in the codebase:

- [x] Migration `20260707000000_monetization.sql` (applied): `tier_expires_at`,
      `billing_events`, `page_view_daily` + `increment_page_view` RPC, `permanent_grants`,
      `media_assets.has_xl`.
- [x] Entitlements expansion (`removeBadge`/`hiFiUploads`/`analytics`) + `resolveTier`
      expiry handling; wired through page actions and the upload route.
- [x] Billing effects lib (`src/lib/billing/effects.ts`) with idempotency ledger.
- [x] Free-tier badge on published pages (link with `?ref=`), hidden for Pro+/Keepsake.
- [x] Hi-fi `xl` variant end to end (§3.2), including cleanup paths and Lightbox.
- [x] Analytics recording (§3.3) with bot/owner filtering; dashboard 30-day counts for
      Pro+, teaser line for free; verified live (bot UA filtered, browser UA counted).
- [x] Keepsake grant model: page-limit exemption + badge removal + T&C provision on /terms.
- [x] Pricing page reworked (three tiers + Keepsake, "billing opens soon" honesty banner);
      plan panel in Settings → Account.

## 8. Open items

- [ ] **Pick the provider**: verify Paddle and Lemon Squeezy onboarding + Payoneer payout
      from Sri Lanka; then build checkout + the webhook route (reduces to the effects lib).
- [ ] Static archive export (§3.6) — the download half of Keepsake; own work item.
- [ ] Local tax advice on foreign income (non-blocking).
- [ ] Landing copy rewrite when billing opens (HOMEPAGE_CONVERSION_TASKS.md T4).
