// ─── Slug / username / input validation ─────────────────────────────
// Shared by server actions (authoritative) and client forms (feedback).

import { RESERVED_SLUGS } from "@/lib/constants";

export const SLUG_MAX_LENGTH = 60;
export const USERNAME_MAX_LENGTH = 30;
export const PAGE_TITLE_MAX_LENGTH = 120;
export const PAGE_PASSWORD_MIN_LENGTH = 4;
export const PAGE_PASSWORD_MAX_LENGTH = 72;

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

/** Normalise arbitrary text into slug form (used for suggestions, not validation). */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, SLUG_MAX_LENGTH);
}

export function validateSlug(slug: string): ValidationResult {
  if (!slug) return { ok: false, error: "A link name is required." };
  if (slug.length > SLUG_MAX_LENGTH)
    return { ok: false, error: `Keep it under ${SLUG_MAX_LENGTH} characters.` };
  if (!SLUG_PATTERN.test(slug))
    return { ok: false, error: "Use lowercase letters, numbers and hyphens only." };
  if ((RESERVED_SLUGS as readonly string[]).includes(slug))
    return { ok: false, error: "That name is reserved." };
  return { ok: true };
}

export function validateUsername(username: string): ValidationResult {
  if (!username) return { ok: false, error: "A username is required." };
  if (username.length < 3) return { ok: false, error: "At least 3 characters." };
  if (username.length > USERNAME_MAX_LENGTH)
    return { ok: false, error: `Keep it under ${USERNAME_MAX_LENGTH} characters.` };
  if (!SLUG_PATTERN.test(username))
    return { ok: false, error: "Use lowercase letters, numbers and hyphens only." };
  if ((RESERVED_SLUGS as readonly string[]).includes(username))
    return { ok: false, error: "That username is reserved." };
  return { ok: true };
}

export function validatePagePassword(password: string): ValidationResult {
  if (password.length < PAGE_PASSWORD_MIN_LENGTH)
    return { ok: false, error: `At least ${PAGE_PASSWORD_MIN_LENGTH} characters.` };
  if (password.length > PAGE_PASSWORD_MAX_LENGTH)
    return { ok: false, error: `Keep it under ${PAGE_PASSWORD_MAX_LENGTH} characters.` };
  return { ok: true };
}
