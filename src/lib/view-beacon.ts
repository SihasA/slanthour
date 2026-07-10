// ─── View beacon request validation ──────────────────────────────────
// Pure parsing/validation for POST /api/views, split out of the route
// handler so it is unit-testable without constructing a Request/Response.

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidPageId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/** Extracts a valid pageId from a parsed JSON body, or null. pageId is a non-secret UUID. */
export function parseBeaconBody(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const pageId = (body as { pageId?: unknown }).pageId;
  return isValidPageId(pageId) ? pageId : null;
}
