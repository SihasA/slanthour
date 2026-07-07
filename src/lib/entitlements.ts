// ─── Entitlements ────────────────────────────────────────────────────
// Single boundary between account tier and product capability. The editor
// is never paywalled; limits apply to page count and images per page, and
// publishing passes through canPublish() so the billing provider has
// exactly one integration point. Webhooks write tier + tier_expires_at
// through src/lib/billing/effects.ts; everything else reads through here.

import type { Tier } from "@/types";

export interface Entitlements {
  maxPages: number;
  maxImagesPerPage: number;
  /** Whether this account may publish pages (all tiers today). */
  canPublish: boolean;
  /** Published pages carry no "Made with Slanthour" badge. */
  removeBadge: boolean;
  /** Uploads also generate the 2560px xl variant. */
  hiFiUploads: boolean;
  /** Page view counts are visible (they are recorded for everyone). */
  analytics: boolean;
}

const TIER_ENTITLEMENTS: Record<Tier, Entitlements> = {
  free: {
    maxPages: 5,
    maxImagesPerPage: 60,
    canPublish: true,
    removeBadge: false,
    hiFiUploads: false,
    analytics: false,
  },
  pro: {
    maxPages: 25,
    maxImagesPerPage: 200,
    canPublish: true,
    removeBadge: true,
    hiFiUploads: true,
    analytics: true,
  },
  studio: {
    maxPages: 100,
    maxImagesPerPage: 500,
    canPublish: true,
    removeBadge: true,
    hiFiUploads: true,
    analytics: true,
  },
};

/**
 * The tier a profile is actually on right now: a paid tier with a
 * `tier_expires_at` in the past has lapsed back to free. NULL expiry
 * means the tier doesn't lapse (free, or manually granted).
 */
export function resolveTier(
  tier: Tier | null | undefined,
  tierExpiresAt?: string | null
): Tier {
  const t = tier && tier in TIER_ENTITLEMENTS ? tier : "free";
  if (t === "free") return "free";
  if (tierExpiresAt && new Date(tierExpiresAt).getTime() < Date.now()) return "free";
  return t;
}

export function getEntitlements(tier: Tier | null | undefined): Entitlements {
  return TIER_ENTITLEMENTS[tier ?? "free"] ?? TIER_ENTITLEMENTS.free;
}

/** Convenience for callers holding a profile row (or fragment). */
export function getProfileEntitlements(
  profile: { tier?: Tier | null; tier_expires_at?: string | null } | null | undefined
): Entitlements {
  return getEntitlements(resolveTier(profile?.tier, profile?.tier_expires_at));
}
