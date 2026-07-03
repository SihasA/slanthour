// ─── Entitlements ────────────────────────────────────────────────────
// Single boundary between account tier and product capability. The editor
// is never paywalled; limits apply to page count and images per page, and
// publishing passes through canPublish() so a future billing provider has
// exactly one integration point. No payment provider is wired up today —
// every tier resolves locally and nothing fakes a purchase.

import type { Tier } from "@/types";

export interface Entitlements {
  maxPages: number;
  maxImagesPerPage: number;
  /** Whether this account may publish pages (all tiers today). */
  canPublish: boolean;
}

const TIER_ENTITLEMENTS: Record<Tier, Entitlements> = {
  free: { maxPages: 5, maxImagesPerPage: 60, canPublish: true },
  pro: { maxPages: 25, maxImagesPerPage: 200, canPublish: true },
  studio: { maxPages: 100, maxImagesPerPage: 500, canPublish: true },
};

export function getEntitlements(tier: Tier | null | undefined): Entitlements {
  return TIER_ENTITLEMENTS[tier ?? "free"] ?? TIER_ENTITLEMENTS.free;
}
