// ─── Cache tag for published pages ───────────────────────────────────
// Every unstable_cache'd read backing /[username]/[slug] is tagged with
// this key, so a mutation that changes what that URL serves can invalidate
// exactly that entry via revalidateTag. URL-keyed: any mutation that moves
// a page (a slug change, or a username change) must invalidate BOTH the
// old and new tag — see the mutation table in src/lib/actions/pages.ts and
// src/lib/actions/profile.ts.
//
// Colons are stripped from each part before joining so a colon inside a
// username or slug can never manufacture a collision between two distinct
// pairs — without stripping, ("a", "b:c") and ("a:b", "c") would both
// produce "page:a:b:c".

export function pageCacheTag(username: string, slug: string): string {
  const strip = (part: string) => part.replaceAll(":", "");
  return `page:${strip(username)}:${strip(slug)}`;
}

// ─── Cache tag for public profiles ───────────────────────────────────
// Every unstable_cache'd read backing /[username] is tagged with this key,
// so a mutation that changes the profile header or its published-page grid
// can invalidate exactly that entry via revalidateTag. Single-segment key
// (just the username), so it uses the same colon-stripping as pageCacheTag
// but never joins on a second part. The "profile:" prefix keeps it from
// ever colliding with a "page:"-prefixed tag regardless of input.

export function profileCacheTag(username: string): string {
  return `profile:${username.replaceAll(":", "")}`;
}

/** Safety-net revalidate window for the cached published-page fetch (seconds). */
export const PUBLISHED_PAGE_REVALIDATE = 3600;
