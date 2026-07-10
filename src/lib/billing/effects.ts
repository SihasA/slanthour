// ─── Billing effects ─────────────────────────────────────────────────
// The provider-agnostic half of billing. A future webhook route
// (src/app/api/billing/webhook) verifies the provider's signature, then
// reduces every event to one of the three effects below. Nothing outside
// this module writes tier, tier_expires_at, billing_events or
// permanent_grants. Server-only: uses the service-role client.
//
// No provider is integrated yet (see MONETIZATION_PLAN.md §2); these are
// exercised by the webhook when one lands, and by admin tooling until then.

import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { pageCacheTag } from "@/lib/page-cache";
import type { Tier } from "@/types";

export type EffectResult = { ok: true } | { ok: false; error: string };

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * The published-page cache freezes the badge decision (tier + grants) for up
 * to an hour, so a tier or grant change must invalidate the affected pages or
 * a paid badge-removal / a refund revocation lingers. Wrapped defensively:
 * revalidateTag only works inside a request, and these effects may also run
 * from admin tooling outside one.
 */
async function revalidateUserPages(admin: AdminClient, userId: string): Promise<void> {
  const { data } = await admin
    .from("pages")
    .select("slug, profiles!inner(username)")
    .eq("user_id", userId)
    .eq("is_published", true);
  for (const row of data ?? []) {
    const username = (row.profiles as unknown as { username: string }).username;
    try {
      revalidateTag(pageCacheTag(username, row.slug as string));
    } catch {
      // Not in a request context (admin script); the 1h revalidate covers it.
    }
  }
}

/**
 * Record a provider event before applying its effect. Returns
 * `alreadyProcessed: true` when this (provider, eventId) was seen before —
 * the caller must then skip the effect, making webhook redelivery safe.
 */
export async function recordBillingEvent(
  provider: string,
  eventId: string,
  eventType: string,
  payload: unknown
): Promise<{ ok: boolean; alreadyProcessed: boolean }> {
  const admin = createAdminClient();
  const { error } = await admin.from("billing_events").insert({
    provider,
    event_id: eventId,
    event_type: eventType,
    payload: payload ?? {},
  });
  if (!error) return { ok: true, alreadyProcessed: false };
  // 23505 = unique violation → redelivery of an event we already handled.
  if (error.code === "23505") return { ok: true, alreadyProcessed: true };
  return { ok: false, alreadyProcessed: false };
}

/** Subscription started or renewed: set the tier and its paid-until date. */
export async function setTier(
  userId: string,
  tier: Exclude<Tier, "free">,
  currentPeriodEnd: Date
): Promise<EffectResult> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ tier, tier_expires_at: currentPeriodEnd.toISOString() })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };
  await revalidateUserPages(admin, userId);
  return { ok: true };
}

/**
 * Subscription refunded/charged back — revoke immediately. Ordinary
 * cancellation needs no effect at all: the tier lapses on its own when
 * tier_expires_at passes (see resolveTier in entitlements.ts).
 */
export async function clearTier(userId: string): Promise<EffectResult> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ tier: "free", tier_expires_at: null })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };
  await revalidateUserPages(admin, userId);
  return { ok: true };
}

/** Keepsake purchase: attach a 10-year publication guarantee to one page. */
export async function grantPermanentPage(
  pageId: string,
  userId: string,
  provider: string,
  orderId: string,
  purchasedAt: Date = new Date()
): Promise<EffectResult> {
  const guaranteedUntil = new Date(purchasedAt);
  guaranteedUntil.setFullYear(guaranteedUntil.getFullYear() + 10);

  const admin = createAdminClient();
  // The page must exist and belong to the buyer (checkout metadata could
  // be stale by delivery time — never grant against a mismatched page).
  const { data: page } = await admin
    .from("pages")
    .select("id, user_id")
    .eq("id", pageId)
    .single();
  if (!page || page.user_id !== userId)
    return { ok: false, error: "Page not found for this buyer." };

  const { error } = await admin.from("permanent_grants").upsert(
    {
      page_id: pageId,
      user_id: userId,
      provider,
      order_id: orderId,
      purchased_at: purchasedAt.toISOString(),
      guaranteed_until: guaranteedUntil.toISOString(),
    },
    { onConflict: "page_id" }
  );
  if (error) return { ok: false, error: error.message };
  // A grant drops the "Made with Slanthour" badge on this page — invalidate
  // so the buyer sees it gone without waiting out the cache window.
  await revalidateUserPages(admin, userId);
  return { ok: true };
}
