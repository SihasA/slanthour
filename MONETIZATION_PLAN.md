# Slanthour — Monetization Plan (tier ladder v2)

Decisions of 8 July 2026, superseding the 7 July structure. Four segments, one
one-time product: Free (individuals), **Hobby $36/yr**, Pro **$7/mo · $60/yr**,
Studio **$18/mo · $150/yr**, Keepsake permanent page **$39 one-time**. Free-tier
pages carry a subtle "Made with Slanthour" badge. Billing provider still
deferred (see §2). Cost model and margin math live in the founder's vault
finance note; the summary is in §5.

---

## 1. Who each tier is for

- **Free**: individuals. A teenager sharing a link, a page made for someone,
  a first taste of the editor. Free plus a Keepsake purchase is the complete
  product for the memories audience; they never need a subscription.
- **Hobby**: the photographer who shoots for the love of it and wants a home
  for the work. Entry paid tier, priced like renting your own corner of the
  web. Annual only, by design: a monthly price under ~$4 loses more than 12%
  to the fixed per-transaction fee (see §5).
- **Pro**: the working power user. Everything a solo professional needs to
  present, plus client proofing when it ships (§3.7).
- **Studio**: the business tier. Scale, unlimited proofing, high-fidelity
  client delivery, and later sub-account seats. One admin user for now.

| | Free | Hobby — $36/yr | Pro — $7/mo · $60/yr | Studio — $18/mo · $150/yr |
|---|---|---|---|---|
| Pages | 3 | 10 | 25 | 100 |
| Images per page | 40 | 100 | 200 | 500 |
| Themes & settings | All | All | All | All |
| Visibility (public / unlisted / password) | All | All | All | All |
| "Made with Slanthour" badge | On published pages | Removed | Removed | Removed |
| High-fidelity images (2560px) | — | — | ✓ | ✓ |
| Page analytics | — | — | ✓ | ✓ |
| Custom domain (phase 4) | — | — | 1 domain | 5 domains |
| Proofing galleries (§3.7, coming) | — | — | 3 active | Unlimited |
| Hi-fi client downloads (§3.8, coming) | — | — | — | ✓ |
| Watermarking (§3.9, coming) | ✓ | ✓ | ✓ | ✓ |
| Sub-account seats | — | — | — | Later |

**Keepsake page — $39 one-time, per page.** Stays published as long as
Slanthour exists, with at least ten years written into the terms (§6).
Positioned at the memories audience (weddings, memorials, tributes), priced
against a good printed photobook. Available to any account, including free.

Principles encoded in the codebase and kept here:

- The editor is never paywalled. Limits apply only to page count, images per
  page, and features around the published artifact.
  `src/lib/entitlements.ts` stays the single tier→capability boundary.
- **Slanthour is not a digital archive.** No raw or original storage; the
  product is a high-fidelity presentation (high resolution, aggressively
  optimized file sizes) plus honest delivery options. Data practices are
  stated plainly wherever they matter.
- Proofing serves low-resolution previews; showcase pages serve the
  high-fidelity variants. This is both the cost model and the photographer's
  protection for unsold work.

## 2. Billing provider — deferred, but constrained

Founder is an individual in Sri Lanka with no registered business, which rules
out Stripe. The practical route is a **merchant of record** (they are legally
the seller, handle global VAT/GST, and pay out to individuals):

- **Paddle**: 5% + 50¢, chargeback handling included. LKR is not a payout
  currency, so payout is a USD SWIFT wire at $15 per payout; set a quarterly
  payout threshold to amortize it.
- **Lemon Squeezy**: 5% + 50¢ plus surcharges (+0.5% subscriptions, +1.5%
  international cards, 1% non-US bank payout). Simpler API.

**Payoneer is closed to new Sri Lanka registrations** (checked 8 Jul 2026), so
the payout rail is direct bank transfer in both cases. Action before phase 1
ships: create accounts on both, confirm (a) individual onboarding from Sri
Lanka passes verification, (b) a real payout lands in an LKR account, (c)
subscription *and* one-time products are enabled. Annual billing is pushed
throughout the UI: it roughly halves fee drag (see §5).

Tax note: foreign service income remitted through a bank is taxed at a
concessionary cap of 15% (first LKR 1.8M exempt); remitting through the
banking system is both the payout rail and the tax strategy. Local VAT/SSCL
thresholds (LKR 60M) are years away. Accountant confirmation stays open.

### Provider-agnostic integration contract

All provider contact lives in `src/lib/billing/` with one narrow interface:

- **Checkout**: server action creates a provider checkout link for
  `{ product: "hobby" | "pro" | "studio" | "keepsake", interval?, pageId? }`
  and redirects. Hobby has no monthly interval.
- **Webhook**: `src/app/api/billing/webhook/route.ts` verifies the provider
  signature and reduces every event to one of three internal effects:
  `setTier(userId, tier, currentPeriodEnd)`, `clearTier(userId)`,
  `grantPermanentPage(pageId, orderId, expiresAt)`.
- **DB**: `profiles.tier` (`free | hobby | pro | studio`, constraint widened
  in migration `20260708000000_hobby_tier.sql`), `profiles.tier_expires_at`,
  and the `billing_events` idempotency ledger.
- Nothing else in the app knows the provider exists. `getEntitlements()`
  remains the only read path.

## 3. Feature implementation map

### 3.1 Free-tier badge — shipped
Published route only. Hobby and above remove it; Keepsake grants remove it per
page. Quiet footer line linking to `/?ref=<username>`.

### 3.2 High-fidelity images (Pro+) — shipped
`xl` variant, 2560px @ q0.85, generated at upload when the uploader's tier
allows and the source is genuinely larger. Applies to uploads made while on
Pro+; originals are discarded by design, so a "re-upload to upgrade" hint is
the honest retro path.

### 3.3 Page analytics (Pro+) — shipped
First-party, cookie-less, aggregate daily counts. Free and Hobby see the
teaser ("Views tracked, upgrade to see them") over real accumulating data.

### 3.4 Custom domains (Pro: 1, Studio: 5) — phase 4
Vercel Domains API + `domains` table + middleware host rewrite. Still the
most-cited reason photographers pay; sequenced after proofing because proofing
is what makes the paid ladder coherent.

### 3.5 Keepsake permanent pages — model shipped, purchase flow phase 2
`permanent_grants` table live; a granted page is exempt from page limits,
carries no badge, and only the owner can unpublish it. Static archive download
ships with the purchase flow (it is the credibility half of the product): a
self-contained zip of the published snapshot. Terms provision live (§6).

### 3.6 Keep-originals add-on — **dropped**
Cut by the not-an-archive principle (8 Jul). The need it served is now met by
hi-fi showcase pages plus Studio client downloads (§3.8). No storage metering
anywhere in the product.

### 3.7 Proofing galleries (Pro: 3 active, Studio: unlimited) — phase 3
The client-selects-their-favourites workflow:

- A proofing gallery is its own object, not a page: link + password access,
  no client accounts.
- Serves **sm/md variants only** (~100KB/photo). A full 800-photo shoot costs
  roughly $0.002/month to store; economics hold at any realistic volume.
- Clients tap to favourite; selections persist per gallery.
- The photographer's deliverable is the select list (filenames, exportable,
  pastes straight into Lightroom). Downloads and per-photo comments come
  later.
- Copy states the data practice: previews in the gallery, finals on the
  showcase page.

### 3.8 Hi-fi client downloads (Studio) — phase 5
A showcase page's owner can enable client download of the xl variants (zip or
per-photo). This is the delivery story: high fidelity in resolution,
aggressively optimized in bytes, and described exactly that way in the UI.

### 3.9 Watermarking (all tiers) — phase 3, with proofing
Opt-in per page or per upload. Preferred implementation: generate watermarked
*and* clean variants at upload and toggle at render time; storage roughly
doubles per photo (0.55MB → 1.1MB) which is still negligible, and turning a
watermark off never requires a re-upload. Decide final UX at build time.

## 4. Phasing

1. **Phase 1 — billing core** (launch): provider decision (§2), checkout +
   webhook + `billing_events`, retire remaining "free while young" copy.
   Tier numbers already live in entitlements.
2. **Phase 2 — Keepsake purchase flow** + static archive export.
3. **Phase 3 — proofing galleries + watermarking** (the Pro/Studio ladder's
   defining features).
4. **Phase 4 — custom domains** (Pro 1 / Studio 5).
5. **Phase 5 — Studio delivery**: hi-fi client downloads; sub-account seats
   when there is pull for them.

## 5. Unit economics (summary of the 8 Jul full check)

- Fixed base at first paying customer ≈ **$58/mo all-in**: Vercel Pro $20 +
  Supabase Pro $25, plus Sri Lanka's 18% VAT on non-resident digital services
  (in force July 2026) on those bills, plus amortized payout wire.
- Storage is a rounding error (~0.55MB/photo, ~1MB with xl; $0.02/GB).
  **Egress is the only real variable cost** (~3–8MB per page view; Supabase
  cached egress $0.03/GB past 250GB). Cloudflare's free CDN in front of the
  site and image serving removes ~90% of that exposure and is scheduled
  pre-launch.
- Fee drag: Paddle 5% + 50¢ ≈ 12% on monthly Pro but ~6% annual. Hence
  annual-first everywhere and no monthly Hobby.
- All-in margins ≈ 84–89% per tier. Break-even ≈ **10 monthly Pros or 4
  Studios** (or ~17 Hobby accounts). Floor cost per Pro subscription ≈
  $1.15/mo, so prices can move down 40–50% without going underwater; the two
  rigid pieces are the 50¢/transaction and the $58 base.
- Keepsake $39: fee $2.45, lifetime infra of a typical event page $1–3. The
  ten-year commitment is funded several times over by the payment itself.

## 6. Terms of service — Keepsake provision

Live on `/terms` (reworded 8 Jul to the honest-small framing): the page stays
published as long as Slanthour exists; at least ten years from purchase is the
written commitment, independent of any subscription; twelve months' notice and
archive downloads if Slanthour ever winds down, surviving any sale; refundable
within 14 days if not shared publicly. The enforceable floor (ten years +
notice + export) is the trust backbone; "as long as we exist" is the honest
expectation set around it.

## 7. Status (8 July 2026)

Shipped and provider-independent:

- [x] Everything from the 7 Jul build: monetization migration, entitlements +
      expiry, billing effects lib, badge, hi-fi xl end to end, analytics,
      Keepsake grant model, terms provision.
- [x] Tier ladder v2 in code: `hobby` tier (migration
      `20260708000000_hobby_tier.sql`, applied), entitlements 3/40 · 10/100 ·
      25/200 · 100/500, settings plan panel, pricing page with four tiers +
      coming-feature honesty, landing pricing strip, Keepsake reframe on
      pricing + terms.

## 8. Open items

- [ ] **Pick the provider**: verify Paddle and Lemon Squeezy onboarding +
      direct bank payout from Sri Lanka (Payoneer rail is gone); then build
      checkout + webhook (reduces to the effects lib).
- [ ] Proofing galleries (§3.7) and watermarking (§3.9) — phase 3 build.
- [ ] Static archive export (§3.5) — ships with the Keepsake purchase flow.
- [ ] Cloudflare free CDN in front of site + storage (pre-launch, see §5).
- [ ] Local tax advice on foreign income (non-blocking).
- [ ] Landing copy rewrite when billing opens.
