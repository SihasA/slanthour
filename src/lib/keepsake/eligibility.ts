// ─── Keepsake archive eligibility ─────────────────────────────────────
// A pure predicate so the four ways a download can be refused are named,
// tested and mapped to one status each — the route handler just returns
// whatever this says. "Not signed in at all" is handled earlier in the
// route (401, before a page is even loaded) — the isOwner branch here is
// the defensive re-check after an RLS-scoped fetch, which should already
// make owner mismatches look like "page not found" at the query level.

export interface ArchiveEligibilityInput {
  /** page.user_id === the signed-in user's id (re-checked in code; RLS
   * already scopes the query, so this branch is defense-in-depth). */
  isOwner: boolean;
  /** page.is_published. */
  isPublished: boolean;
  /** page.published !== null — the frozen snapshot actually exists. */
  hasPublishedSnapshot: boolean;
  /** A permanent_grants row exists for this page (the Keepsake purchase). */
  hasGrant: boolean;
}

export type ArchiveEligibilityResult =
  | { ok: true }
  | { ok: false; status: 401 | 403 | 404 | 409; reason: string };

export function archiveEligibility(input: ArchiveEligibilityInput): ArchiveEligibilityResult {
  if (!input.isOwner) {
    return { ok: false, status: 401, reason: "Sign in as the owner of this page to download its archive." };
  }
  if (!input.hasGrant) {
    return { ok: false, status: 403, reason: "This page does not have a Keepsake archive." };
  }
  if (!input.isPublished) {
    return { ok: false, status: 409, reason: "Publish this page before downloading its archive." };
  }
  if (!input.hasPublishedSnapshot) {
    return { ok: false, status: 404, reason: "Nothing has been published for this page yet." };
  }
  return { ok: true };
}
