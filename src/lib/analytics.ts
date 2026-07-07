// ─── Page view analytics ─────────────────────────────────────────────
// First-party, cookie-less, aggregate-only: one counter per page per day
// (page_view_daily), incremented server-side from the published route.
// No IPs, no fingerprints, no per-visitor rows — consistent with the
// privacy posture. Views are recorded for every account; the numbers are
// *shown* only on tiers with the analytics entitlement.

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Crawlers and link-preview fetchers (WhatsApp, Slack, etc.) are not views.
const BOT_UA =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|skype|slack|discord|embed|curl|wget|python|node|axios|go-http|headless|lighthouse|pingdom|uptime/i;

/**
 * Decide whether the current request is a countable view: not a bot, and
 * not the page's owner looking at their own page. Called during render
 * (request context available); the returned closure does the write and is
 * safe to run after the response.
 */
export async function pageViewRecorder(
  pageId: string,
  ownerId: string
): Promise<(() => Promise<void>) | null> {
  const ua = (await headers()).get("user-agent") ?? "";
  if (ua === "" || BOT_UA.test(ua)) return null;

  // Signed-out visitors (the common case) skip the auth round-trip.
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id === ownerId) return null;
  }

  return async () => {
    const admin = createAdminClient();
    await admin.rpc("increment_page_view", { p_page_id: pageId });
  };
}
