// ─── Anonymous proofing gallery route ────────────────────────────────
// Gallery rows are not anon-readable (prevents enumeration), so this
// route reads with the service-role client and applies the access rules
// in code: active status required, gate cookie required when a password
// is set. Never indexed — the link is shared privately.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasGalleryAccess } from "@/lib/proofing-gate";
import { proofingImageUrl } from "@/lib/proofing";
import { ProofGate } from "@/components/proofing/ProofGate";
import { ProofGalleryView, type ProofPhoto } from "@/components/proofing/ProofGalleryView";
import type { ProofingGallery, ProofingImage } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Client gallery · Slanthour",
};

export default async function ProofPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]{10,40}$/.test(slug)) notFound();

  const admin = createAdminClient();
  const { data: galleryRow } = await admin
    .from("proofing_galleries")
    .select("id, user_id, title, slug, password_hash, status")
    .eq("slug", slug)
    .single();
  const gallery = galleryRow as
    | Pick<ProofingGallery, "id" | "user_id" | "title" | "slug" | "password_hash" | "status">
    | null;
  if (!gallery) notFound();

  const { data: profile } = await admin
    .from("profiles")
    .select("display_name, username")
    .eq("id", gallery.user_id)
    .single();
  const photographer = profile?.display_name || profile?.username || "Your photographer";

  if (gallery.status !== "active") {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <p className="text-[10px] uppercase tracking-wide text-muted mb-3">{photographer}</p>
          <h1 className="font-heading text-2xl italic font-light mb-3">This gallery is closed.</h1>
          <p className="font-copy text-sm text-muted">
            The review period has ended. Contact your photographer if you still need it.
          </p>
        </div>
      </main>
    );
  }

  if (gallery.password_hash && !(await hasGalleryAccess(gallery.id))) {
    return <ProofGate slug={gallery.slug} title={gallery.title} photographer={photographer} />;
  }

  const [{ data: imageRows }, { data: selectionRows }] = await Promise.all([
    admin
      .from("proofing_images")
      .select("id, storage_path, filename")
      .eq("gallery_id", gallery.id)
      .order("position", { ascending: true })
      .order("filename", { ascending: true }),
    admin.from("proofing_selections").select("image_id").eq("gallery_id", gallery.id),
  ]);

  const photos: ProofPhoto[] = ((imageRows ?? []) as Pick<
    ProofingImage,
    "id" | "storage_path" | "filename"
  >[]).map((row) => ({
    id: row.id,
    smUrl: proofingImageUrl(row.storage_path, "sm"),
    mdUrl: proofingImageUrl(row.storage_path, "md"),
    filename: row.filename,
  }));
  const initiallySelected = ((selectionRows ?? []) as { image_id: string }[]).map(
    (row) => row.image_id
  );

  return (
    <ProofGalleryView
      slug={gallery.slug}
      title={gallery.title}
      photographer={photographer}
      photos={photos}
      initiallySelected={initiallySelected}
    />
  );
}
