// ─── Public profile ──────────────────────────────────────────────────
// /:username — display name, bio, avatar and the person's published
// PUBLIC pages (unlisted and password-protected pages never appear here).
//
// The Supabase read is cached via unstable_cache, tagged with
// profileCacheTag(username); a cache hit makes zero Supabase calls. Every
// mutation that can change the header or the published-page grid
// invalidates that tag (see src/lib/actions/profile.ts and
// src/lib/actions/pages.ts), so a republish or profile edit is never served
// stale. Reads use the anon client — RLS only exposes published public
// pages — via a cookie-free instance (see src/lib/supabase/anon.ts), since
// the cached function must carry no request-scoped state (no
// cookies()/headers() inside unstable_cache).

import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import { createAnonClient } from "@/lib/supabase/anon";
import { storageUrl } from "@/lib/media";
import { getTheme } from "@/themes/registry";
import { profileCacheTag, PUBLISHED_PAGE_REVALIDATE } from "@/lib/page-cache";
import type { PublishedSnapshot } from "@/lib/page-document";
import type { Profile } from "@/types";

type RouteProps = { params: Promise<{ username: string }> };

// Title and cover come from the frozen published snapshot, never the live
// pages.title/cover_path columns (autosave keeps those pointed at the
// unpublished draft, which would leak onto this public surface).
type PageRow = { id: string; slug: string; theme: string; published: PublishedSnapshot | null };
type PageCard = { id: string; slug: string; theme: string; title: string; cover: string | null };

// Profile + its published public pages in one round trip (pages embedded
// through the user_id FK; RLS only exposes published public rows to anon).
// Wrapped per-call in unstable_cache, tagged per profile and revalidated
// hourly as a safety net (explicit mutations invalidate instantly via the
// tag). The outer React cache() dedupes across generateMetadata and the
// page body within a single request.
const loadProfile = cache(async (username: string) => {
  return unstable_cache(
    async () => {
      const supabase = createAnonClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("*, pages(id, slug, theme, published, published_at)")
        .eq("username", username)
        .eq("pages.is_published", true)
        .eq("pages.visibility", "public")
        .order("published_at", { referencedTable: "pages", ascending: false })
        .single();
      if (!profile) return null;
      const { pages, ...rest } = profile as Profile & { pages: PageRow[] };
      const cards: PageCard[] = (pages ?? []).map((p) => ({
        id: p.id,
        slug: p.slug,
        theme: p.theme,
        title: p.published?.title ?? "Untitled",
        cover: p.published?.cover ?? null,
      }));
      return { profile: rest as Profile, cards };
    },
    ["profile", username],
    { tags: [profileCacheTag(username)], revalidate: PUBLISHED_PAGE_REVALIDATE }
  )();
});

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { username } = await params;
  const loaded = await loadProfile(username);
  if (!loaded) return { title: "Not found · Slanthour" };
  const { profile } = loaded;
  return {
    title: `${profile.display_name} · Slanthour`,
    description: profile.bio ?? `${profile.display_name}'s pages on Slanthour.`,
    openGraph: {
      title: profile.display_name,
      description: profile.bio ?? `${profile.display_name}'s pages on Slanthour.`,
      url: `https://slanthour.com/${username}`,
      siteName: "Slanthour",
      type: "profile",
    },
  };
}

export default async function ProfilePage({ params }: RouteProps) {
  const { username } = await params;
  const loaded = await loadProfile(username);
  if (!loaded) notFound();
  const { profile: p, cards } = loaded;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-5xl mx-auto px-6 py-16 sm:py-24">
        {/* ── Identity ── */}
        <header className="text-center mb-16">
          {p.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={storageUrl(p.avatar_url)}
              alt=""
              className="w-20 h-20 rounded-full object-cover mx-auto mb-6 border border-rule"
            />
          )}
          <h1 className="font-heading text-4xl sm:text-5xl font-light italic">{p.display_name}</h1>
          <p className="mt-2 text-[11px] uppercase tracking-label text-muted">@{p.username}</p>
          {p.bio && (
            <p className="mt-6 font-copy text-[15px] leading-relaxed text-muted max-w-xl mx-auto">
              {p.bio}
            </p>
          )}
        </header>

        {/* ── Pages ── */}
        {cards.length === 0 ? (
          <p className="text-center text-muted font-copy text-sm">Nothing published yet.</p>
        ) : (
          <ul className="grid gap-8 sm:grid-cols-2">
            {cards.map((page) => (
              <li key={page.id}>
                <Link href={`/${p.username}/${page.slug}`} className="group block">
                  <div className="aspect-[4/3] overflow-hidden bg-surface border border-rule">
                    {page.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={storageUrl(page.cover)}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted/40 font-heading italic text-xl">
                        {page.title.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline justify-between gap-3">
                    <h2 className="font-heading text-lg font-light italic group-hover:text-accent transition-colors truncate">
                      {page.title}
                    </h2>
                    <span className="shrink-0 text-[9px] uppercase tracking-label text-muted">
                      {getTheme(page.theme).name}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      <footer className="py-10 text-center">
        <Link
          href="/"
          className="text-[9px] uppercase tracking-label text-muted/60 hover:text-muted transition-colors"
        >
          Made with Slanthour
        </Link>
      </footer>
    </div>
  );
}
