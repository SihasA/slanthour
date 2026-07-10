// ─── Watermark label resolution ──────────────────────────────────────
// Pure text logic, separated from the canvas drawing code (src/lib/image.ts)
// so it is unit-testable without a DOM/canvas. Prefers the owner's display
// name; falls back to @username; empty when neither is set.

import { MEDIA_WATERMARK } from "./constants";

export function resolveWatermarkLabel(
  displayName?: string | null,
  username?: string | null
): string {
  const name = (displayName ?? "").trim();
  const label = name || (username ? `@${username}` : "");
  // Clamp by code point, not UTF-16 unit: a plain slice can cut through an
  // astral character (emoji, rare scripts) and leave a lone surrogate that
  // renders as a tofu box in the canvas watermark.
  return Array.from(label).slice(0, MEDIA_WATERMARK.maxChars).join("");
}
