// ─── Billing effects ─────────────────────────────────────────────────
// The provider-agnostic half of billing. A future webhook route
// (src/app/api/billing/webhook) verifies the provider's signature, then
// reduces every event to one of the three effects below. Nothing outside
// this module writes tier, tier_expires_at, billing_events or
// permanent_grants. Server-only: uses the service-role client.
//
// No provider is integrated yet (see MONETIZATION_PLAN.md §2); these are
// exercised by the webhook when one lands, and by admin tooling until then.

import { createAdminClient } from "@/lib/supabase/admin";
import type { Tier } from "@/types";

export type EffectResult = { ok: true } | { ok: false; error: string };

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
  return error ? { ok: false, error: error.message } : { ok: true };
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
  return error ? { ok: false, error: error.message } : { ok: true };
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
  return error ? { ok: false, error: error.message } : { ok: true };
}
