// ─── Dashboard ───────────────────────────────────────────────────────
// The user's pages, newest edits first. Each card carries the full page
// lifecycle: edit, view, publish/unpublish, duplicate, delete.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageCard, type DashboardPage } from "@/components/dashboard/PageCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: pages, error }] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", user.id).single(),
    supabase
      .from("pages")
      .select("id, slug, title, theme, cover_path, is_published, visibility, updated_at, published_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
  ]);

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
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((page) => (
            <PageCard key={page.id} page={page} username={username} />
          ))}
        </ul>
      )}
    </div>
  );
}
