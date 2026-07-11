// ─── Proofing gallery management route (owner) ───────────────────────

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { proofingImageUrl } from "@/lib/proofing";
import { ProofingManager, type ManagedPhoto } from "@/components/proofing/ProofingManager";
import type { ProofingGallery, ProofingImage } from "@/types";

export const dynamic = "force-dynamic";

export default async function ManageGalleryPage({
  params,
}: {
  params: Promise<{ galleryId: string }>;
}) {
  const { galleryId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: galleryRow } = await supabase
    .from("proofing_galleries")
    .select("*")
    .eq("id", galleryId)
    .single();
  const gallery = galleryRow as ProofingGallery | null;
  if (!gallery || gallery.user_id !== user.id) notFound();

  const [{ data: imageRows }, { data: selectionRows }] = await Promise.all([
    supabase
      .from("proofing_images")
      .select("id, storage_path, filename")
      .eq("gallery_id", gallery.id)
      .order("position", { ascending: true })
      .order("filename", { ascending: true }),
    supabase.from("proofing_selections").select("image_id").eq("gallery_id", gallery.id),
  ]);

  const selectedIds = new Set(
    ((selectionRows ?? []) as { image_id: string }[]).map((row) => row.image_id)
  );
  const photos: ManagedPhoto[] = ((imageRows ?? []) as Pick<
    ProofingImage,
    "id" | "storage_path" | "filename"
  >[]).map((row) => ({
    id: row.id,
    smUrl: proofingImageUrl(row.storage_path, "sm"),
    filename: row.filename,
    selected: selectedIds.has(row.id),
  }));

  return (
    <div className="px-6 py-10 sm:py-14 max-w-5xl">
      <div className="mb-8">
        <Link
          href="/proofing"
          className="text-[10px] uppercase tracking-wide text-muted hover:text-accent transition-colors"
        >
          ← Proofing
        </Link>
        <div className="mt-2 flex items-baseline gap-3 flex-wrap">
          <h1 className="font-heading text-3xl italic font-light">{gallery.title}</h1>
          <span
            className={`text-[9px] uppercase tracking-wide ${
              gallery.status === "active" ? "text-accent" : "text-muted"
            }`}
          >
            {gallery.status}
          </span>
        </div>
      </div>

      <ProofingManager
        gallery={{
          id: gallery.id,
          title: gallery.title,
          slug: gallery.slug,
          status: gallery.status,
          hasPassword: gallery.password_hash !== null,
        }}
        photos={photos}
      />
    </div>
  );
}
