// ─── Internal Keepsake render page ────────────────────────────────────
// NOT a public route: owner-guarded, bare (no header/footer/badge), exists
// only so the archive route handler (src/app/api/keepsake/[pageId]/archive)
// can get a real Next.js SSR of the real PageRenderer by fetching this page
// over HTTP and extracting the .sh-page subtree (see src/lib/keepsake/
// render.ts — the step-0 spike found that rendering inside a route handler
// directly is rejected by Next's build). Re-runs the same eligibility check
// as the archive route: a page that isn't the caller's own, published, and
// Keepsake-granted renders nothing here either.

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { archiveEligibility } from "@/lib/keepsake/eligibility";
import { parseDocument, type PublishedSnapshot } from "@/lib/page-document";
import { PageRenderer } from "@/themes/PageRenderer";

type RouteProps = { params: Promise<{ pageId: string }> };

export default async function KeepsakeViewPage({ params }: RouteProps) {
  const { pageId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: page } = await supabase
    .from("pages")
    .select("id, user_id, title, is_published, published, profiles!inner(display_name, username)")
    .eq("id", pageId)
    .single();
  if (!page) notFound();

  const { data: grant } = await supabase
    .from("permanent_grants")
    .select("id")
    .eq("page_id", pageId)
    .maybeSingle();

  const eligibility = archiveEligibility({
    isOwner: page.user_id === user.id,
    isPublished: page.is_published === true,
    hasPublishedSnapshot: page.published !== null,
    hasGrant: grant !== null,
  });
  if (!eligibility.ok) notFound();

  const snapshot = page.published as PublishedSnapshot;
  const profile = page.profiles as unknown as { display_name: string; username: string };
  const document = parseDocument(snapshot.document);

  return (
    <PageRenderer
      document={document}
      theme={snapshot.theme}
      themeSettings={snapshot.themeSettings}
      title={snapshot.title}
      author={{ displayName: profile.display_name, username: profile.username }}
      mode="published"
      lightbox={false}
    />
  );
}
