// ─── Published page route ────────────────────────────────────────────
// Serves the frozen published snapshot — never the draft. Unlisted and
// password-protected pages are not anonymously readable through RLS, so
// the lookup uses the service-role client and visibility is enforced here
// in code (the metadata for protected pages leaks nothing).

import { notFound } from "next/navigation";
import { after } from "next/server";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasPageAccess } from "@/lib/page-gate";
import { pageViewRecorder } from "@/lib/analytics";
import { getProfileEntitlements } from "@/lib/entitlements";
import { parseDocument, type PublishedSnapshot } from "@/lib/page-document";
import { storageUrl } from "@/lib/media";
import { PageRenderer } from "@/themes/PageRenderer";
import { PasswordGate } from "@/components/public/PasswordGate";
import { getTheme, sanitizeThemeSettings } from "@/themes/registry";
import type { Page, Profile } from "@/types";

export const dynamic = "force-dynamic";

type RouteProps = { params: Promise<{ username: string; slug: string }> };

async function loadPage(username: string, slug: string) {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, username, display_name, tier, tier_expires_at")
    .eq("username", username)
    .single();
  if (!profile) return null;

  const { data: page } = await admin
    .from("pages")
    .select("id, user_id, slug, title, visibility, is_published, published, cover_path")
    .eq("user_id", profile.id)
    .eq("slug", slug)
    .single();
  if (!page || !page.is_published || !page.published) return null;

  return {
    profile: profile as Pick<
      Profile,
      "id" | "username" | "display_name" | "tier" | "tier_expires_at"
    >,
    page: page as Pick<Page, "id" | "user_id" | "slug" | "title" | "visibility" | "is_published" | "cover_path"> & {
      published: PublishedSnapshot;
    },
  };
}

/** Keepsake pages and paid tiers publish without the Slanthour badge. */
async function showBadge(
  profile: { tier: Profile["tier"]; tier_expires_at: string | null },
  pageId: string
): Promise<boolean> {
  if (getProfileEntitlements(profile).removeBadge) return false;
  const admin = createAdminClient();
  const { data: grant } = await admin
    .from("permanent_grants")
    .select("id")
    .eq("page_id", pageId)
    .maybeSingle();
  return grant === null;
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { username, slug } = await params;
  const loaded = await loadPage(username, slug);
  if (!loaded) return { title: "Not found — Slanthour" };
  const { page, profile } = loaded;

  // Protected pages must not expose their content through metadata.
  if (page.visibility === "password") {
    return { title: "Protected page — Slanthour", robots: { index: false, follow: false } };
  }

  const title = `${page.published.title} — ${profile.display_name}`;
  return {
    title,
    description: `A page by ${profile.display_name} on Slanthour.`,
    robots: page.visibility === "unlisted" ? { index: false, follow: false } : undefined,
    openGraph: {
      title: page.published.title,
      description: `A page by ${profile.display_name} on Slanthour.`,
      url: `https://slanthour.com/${profile.username}/${page.slug}`,
      siteName: "Slanthour",
      type: "article",
      images: page.cover_path ? [{ url: storageUrl(page.cover_path) }] : undefined,
    },
  };
}

export default async function PublishedPage({ params }: RouteProps) {
  const { username, slug } = await params;
  const loaded = await loadPage(username, slug);
  if (!loaded) notFound();
  const { page, profile } = loaded;

  if (page.visibility === "password") {
    const unlocked = await hasPageAccess(page.id);
    if (!unlocked) return <PasswordGate pageId={page.id} />;
  }

  // Count the view once the response is on its way (never blocks render);
  // bots, link-preview fetchers and the owner's own visits are excluded.
  const recordView = await pageViewRecorder(page.id, page.user_id);
  if (recordView) after(recordView);

  const badge = await showBadge(profile, page.id);

  const snapshot = page.published;
  const document = parseDocument(snapshot.document);
  const tokens = getTheme(snapshot.theme).resolveTokens(
    sanitizeThemeSettings(snapshot.theme, snapshot.themeSettings)
  );

  return (
    <>
      {/* Page-scoped body background (theme colours never leak elsewhere). */}
      <style
        dangerouslySetInnerHTML={{
          __html: `body { background: ${tokens.background} !important; color: ${tokens.text} !important; }`,
        }}
      />
      <PageRenderer
        document={document}
        theme={snapshot.theme}
        themeSettings={snapshot.themeSettings}
        title={snapshot.title}
        author={{ displayName: profile.display_name, username: profile.username }}
        mode="published"
      />
      <footer className="py-8 text-center" style={{ background: tokens.background }}>
        <a
          href={`/${profile.username}`}
          className="text-[10px] uppercase tracking-[0.25em] opacity-50 hover:opacity-90 transition-opacity"
          style={{ color: tokens.muted }}
        >
          More by {profile.display_name}
        </a>
        {badge && (
          <a
            href={`/?ref=${profile.username}`}
            className="block mt-2 text-[9px] uppercase tracking-[0.25em] opacity-35 hover:opacity-70 transition-opacity"
            style={{ color: tokens.muted }}
          >
            Made with Slanthour
          </a>
        )}
      </footer>
    </>
  );
}
