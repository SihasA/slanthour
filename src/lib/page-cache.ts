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

/** Safety-net revalidate window for the cached published-page fetch (seconds). */
export const PUBLISHED_PAGE_REVALIDATE = 3600;
