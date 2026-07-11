// ─── Proofing dashboard: gallery list ────────────────────────────────
// One dashboard serves Pro and Studio; only the active-gallery allowance
// differs (Pro 3, Studio unlimited). Free and Hobby see the explainer —
// and any galleries left over from a lapsed plan stay visible (data is
// never held hostage), they just can't create or re-activate.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileEntitlements } from "@/lib/entitlements";
import { proofingLimitLabel } from "@/lib/proofing";
import { CreateGalleryForm } from "@/components/proofing/CreateGalleryForm";
import type { ProofingGallery } from "@/types";

export const dynamic = "force-dynamic";

export default async function ProofingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: galleryRows }] = await Promise.all([
    supabase.from("profiles").select("tier, tier_expires_at").eq("id", user.id).single(),
    supabase
      .from("proofing_galleries")
      .select("id, title, slug, status, password_hash, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const limit = getProfileEntitlements(profile).proofingGalleries;
  const galleries = (galleryRows ?? []) as Pick<
    ProofingGallery,
    "id" | "title" | "slug" | "status" | "password_hash" | "created_at"
  >[];
  const activeCount = galleries.filter((g) => g.status === "active").length;

  // Per-gallery photo + pick counts. Galleries are few by design (the
  // allowance is 3 for Pro), so head counts per gallery stay cheap.
  const counts = await Promise.all(
    galleries.map(async (g) => {
      const [{ count: photoCount }, { count: pickCount }] = await Promise.all([
        supabase
          .from("proofing_images")
          .select("id", { count: "exact", head: true })
          .eq("gallery_id", g.id),
        supabase
          .from("proofing_selections")
          .select("image_id", { count: "exact", head: true })
          .eq("gallery_id", g.id),
      ]);
      return { photos: photoCount ?? 0, picks: pickCount ?? 0 };
    })
  );

  return (
    <div className="px-6 py-10 sm:py-14 max-w-5xl">
      <div className="mb-10">
        <h1 className="font-heading text-3xl italic font-light">Proofing</h1>
        <p className="mt-2 font-copy text-sm text-muted max-w-xl">
          Private galleries where clients tap the photos they love. You get the select list;
          they never see a download button. Previews are served small on purpose.
        </p>
        {limit > 0 && (
          <p className="mt-3 text-[10px] uppercase tracking-wide text-muted tabular-nums">
            {activeCount} of {proofingLimitLabel(limit)} active galleries
          </p>
        )}
      </div>

      {limit === 0 ? (
        <div className="border border-dashed border-rule px-6 py-14 text-center max-w-2xl">
          <p className="font-heading italic text-xl text-foreground mb-2">
            Proofing is part of Pro.
          </p>
          <p className="font-copy text-sm text-muted mb-8 max-w-md mx-auto">
            Send clients a private link, let them pick their favourites, and export the
            select list straight into your editing workflow. Pro includes 3 active
            galleries; Studio has no limit.
          </p>
          <Link
            href="/pricing"
            className="inline-block px-6 py-3 text-[10px] uppercase tracking-wide bg-foreground text-background hover:bg-accent transition-colors"
          >
            See Pro
          </Link>
        </div>
      ) : (
        <div className="mb-10 max-w-2xl">
          <CreateGalleryForm />
        </div>
      )}

      {galleries.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {galleries.map((gallery, index) => (
            <li key={gallery.id}>
              <Link
                href={`/proofing/${gallery.id}`}
                className="block border border-rule px-5 py-4 hover:border-accent transition-colors"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-heading italic text-lg font-light truncate">
                    {gallery.title}
                  </h2>
                  <span
                    className={`shrink-0 text-[9px] uppercase tracking-wide ${
                      gallery.status === "active" ? "text-accent" : "text-muted"
                    }`}
                  >
                    {gallery.status}
                  </span>
                </div>
                <p className="mt-2 text-[10px] uppercase tracking-wide text-muted tabular-nums">
                  {counts[index].photos} photos · {counts[index].picks} picked
                  {gallery.password_hash ? " · password" : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {limit > 0 && galleries.length === 0 && (
        <div className="border border-dashed border-rule py-16 text-center max-w-2xl">
          <p className="font-heading italic text-xl text-foreground mb-2">No galleries yet.</p>
          <p className="font-copy text-sm text-muted max-w-sm mx-auto">
            Create one, upload the shoot, and send the link. Picks appear here as your
            client taps.
          </p>
        </div>
      )}
    </div>
  );
}
