// ─── Page view analytics ─────────────────────────────────────────────
// First-party, cookie-less, aggregate-only: one counter per page per day
// (page_view_daily), incremented from POST /api/views (see
// src/app/api/views/route.ts) once the client's ViewBeacon fires. No IPs,
// no fingerprints, no per-visitor rows — consistent with the privacy
// posture. Views are recorded for every account; the numbers are *shown*
// only on tiers with the analytics entitlement.

// Crawlers and link-preview fetchers (WhatsApp, Slack, etc.) are not views.
const BOT_UA =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|skype|slack|discord|embed|curl|wget|python|node|axios|go-http|headless|lighthouse|pingdom|uptime/i;

/** A missing user-agent is treated as a bot too — real browsers always send one. */
export function isBotUserAgent(ua: string): boolean {
  return ua === "" || BOT_UA.test(ua);
}
