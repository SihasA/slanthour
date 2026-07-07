// ─── Dashboard ───────────────────────────────────────────────────────
// The user's pages, newest edits first. Each card carries the full page
// lifecycle: edit, view, publish/unpublish, duplicate, delete.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileEntitlements } from "@/lib/entitlements";
import { PageCard, type DashboardPage } from "@/components/dashboard/PageCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: pages, error }] = await Promise.all([
    supabase.from("profiles").select("username, tier, tier_expires_at").eq("id", user.id).single(),
    supabase
      .from("pages")
      .select("id, slug, title, theme, cover_path, is_published, visibility, updated_at, published_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
  ]);

  // 30-day view totals per page — shown on tiers with analytics. Views are
  // recorded for everyone (RLS: owner-read), so upgrading reveals history.
  const analytics = getProfileEntitlements(profile).analytics;
  const viewsByPage = new Map<string, number>();
  if (analytics && (pages ?? []).length > 0) {
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
    const { data: rows } = await supabase
      .from("page_view_daily")
      .select("page_id, views")
      .in("page_id", (pages ?? []).map((p) => p.id))
      .gte("day", since);
    for (const row of rows ?? []) {
      viewsByPage.set(row.page_id, (viewsByPage.get(row.page_id) ?? 0) + row.views);
    }
  }

  if (error) {
    return (
      <div className="px-6 py-16 max-w-3xl">
        <h1 className="font-heading text-2xl italic font-light mb-3">Your pages</h1>
        <p className="text-sm text-red-400 font-copy">
          Could not load your pages — refresh to try again.
        </p>
      </div>
    );
  }

  const list = (pages ?? []) as DashboardPage[];
  const username = profile?.username ?? "";

  return (
    <div className="px-6 py-10 sm:py-14 max-w-5xl">
      <div className="flex items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="font-heading text-3xl italic font-light">Your pages</h1>
          {username && (
            <a
              href={`/${username}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-[10px] uppercase tracking-wide text-muted hover:text-accent transition-colors"
            >
              slanthour.com/{username} ↗
            </a>
          )}
        </div>
        <Link
          href="/pages/new"
          className="shrink-0 px-4 py-2.5 text-[10px] uppercase tracking-wide bg-foreground text-background hover:bg-accent transition-colors"
        >
          + New page
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="border border-dashed border-rule py-20 text-center">
          <p className="font-heading italic text-xl text-foreground mb-2">No pages yet.</p>
          <p className="font-copy text-sm text-muted mb-8 max-w-sm mx-auto">
            Turn a collection of photographs into a beautifully designed page — a series, a trip,
            a person, a project.
          </p>
          <Link
            href="/pages/new"
            className="inline-block px-6 py-3 text-[10px] uppercase tracking-wide bg-foreground text-background hover:bg-accent transition-colors"
          >
            Create your first page
          </Link>
        </div>
      ) : (
        <>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((page) => (
              <PageCard
                key={page.id}
                page={page}
                username={username}
                views={analytics ? (viewsByPage.get(page.id) ?? 0) : null}
              />
            ))}
          </ul>
          {!analytics && list.some((p) => p.is_published) && (
            <p className="mt-8 text-[11px] font-copy text-muted/70">
              Views of your published pages are being counted.{" "}
              <Link href="/pricing" className="text-muted underline underline-offset-2 hover:text-accent transition-colors">
                See them on Pro
              </Link>
              .
            </p>
          )}
        </>
      )}
    </div>
  );
}
