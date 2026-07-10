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
  return label.slice(0, MEDIA_WATERMARK.maxChars);
}
