// ─── Public profile ──────────────────────────────────────────────────
// /:username — display name, bio, avatar and the person's published
// PUBLIC pages (unlisted and password-protected pages never appear here).
// Reads use the anon client: RLS only exposes published public pages.

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { storageUrl } from "@/lib/media";
import { getTheme } from "@/themes/registry";
import type { Page, Profile } from "@/types";

export const dynamic = "force-dynamic";

type RouteProps = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio")
    .eq("username", username)
    .single();
  if (!profile) return { title: "Not found — Slanthour" };
  return {
    title: `${profile.display_name} — Slanthour`,
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

type PageCard = Pick<Page, "id" | "slug" | "title" | "theme" | "cover_path" | "published_at">;

export default async function ProfilePage({ params }: RouteProps) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();
  if (!profile) notFound();
  const p = profile as Profile;

  const { data: pages } = await supabase
    .from("pages")
    .select("id, slug, title, theme, cover_path, published_at")
    .eq("user_id", p.id)
    .eq("is_published", true)
    .eq("visibility", "public")
    .order("published_at", { ascending: false });

  const cards = (pages ?? []) as PageCard[];

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
                    {page.cover_path ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={storageUrl(page.cover_path)}
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
