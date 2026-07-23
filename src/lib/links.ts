// ─── External-link safety ────────────────────────────────────────────
// The first place this codebase renders a user-supplied href. Every value
// that becomes an href MUST pass through safeExternalUrl first: it returns
// a normalised absolute URL only for http(s), and null for everything
// else (javascript:, data:, vbscript:, mailto:, protocol-relative //host).
// Pure and dependency-free so it runs identically on the server
// (authoritative) and in unit tests.
//
// Implemented with the WHATWG URL constructor rather than hand-written
// scheme matching: the parser strips tab/newline/CR from input before
// parsing (so a smuggled "java<TAB>script:" still resolves to a non-http
// protocol and is rejected) and lowercases the protocol (so "JavaScript:"
// is caught). A protocol-relative "//evil" throws with no base and is
// rejected. This is the robust, ASCII-clean approach.

/**
 * Normalise an arbitrary string into a safe external URL, or return null.
 * Only http: and https: pass. Never throws.
 */
export function safeExternalUrl(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  return url.href;
}

/**
 * Accept a website value the way a user is likely to type it (bare domain,
 * with or without scheme) and return a safe absolute http(s) URL or null.
 * A scheme-less value is assumed https; anything non-http(s) is rejected.
 */
export function normalizeWebsiteUrl(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // A value that already carries a (possibly hostile) scheme is passed
  // through unchanged so safeExternalUrl can reject it, rather than us
  // silently prefixing https:// onto it. Only truly scheme-less input is
  // assumed to be https.
  const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) ? trimmed : `https://${trimmed}`;
  return safeExternalUrl(candidate);
}

// Instagram handles: letters, digits, period and underscore, up to 30.
const INSTAGRAM_HANDLE = /^[a-zA-Z0-9._]{1,30}$/;

/**
 * Extract and validate an Instagram handle from a handle, @handle, or a
 * pasted instagram.com URL. Returns the bare handle (no @) or null.
 */
export function normalizeInstagramHandle(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  let handle = raw.trim();
  // Pull the handle out of a pasted profile URL if present.
  const fromUrl = handle.match(/instagram\.com\/([a-zA-Z0-9._]+)/i);
  if (fromUrl) handle = fromUrl[1];
  handle = handle.replace(/^@+/, "").replace(/\/+$/, "");
  if (!INSTAGRAM_HANDLE.test(handle)) return null;
  return handle;
}

/** Build the public profile URL for a validated Instagram handle, or null. */
export function instagramUrl(handle: string | null | undefined): string | null {
  const normalized = normalizeInstagramHandle(handle);
  if (!normalized) return null;
  // Route through the same guard so the output is provably an http(s) href.
  return safeExternalUrl(`https://instagram.com/${normalized}`);
}

// A deliberately conservative shape check: one @, no whitespace, a dot in
// the domain. Not RFC-complete; enough to reject obvious garbage before we
// ever render a mailto:.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** True if the value is a plausible email address. */
export function isPlausibleEmail(raw: string | null | undefined): boolean {
  if (typeof raw !== "string") return false;
  const trimmed = raw.trim();
  return trimmed.length <= 254 && EMAIL.test(trimmed);
}

/** Normalise a contact email for storage, or null if implausible. */
export function normalizeEmail(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return isPlausibleEmail(trimmed) ? trimmed : null;
}

/** Build a mailto: href for a validated email, or null. */
export function mailtoHref(raw: string | null | undefined): string | null {
  const email = normalizeEmail(raw);
  return email ? `mailto:${email}` : null;
}
