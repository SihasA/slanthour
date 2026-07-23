// ─── Proofing upload endpoint (owner-side) ───────────────────────────
// Receives the two proofing variants (md + sm — never lg/xl, §3.7),
// re-validates them server-side, stores them under an unguessable
// per-image path, and records a proofing_images row carrying the
// client's ORIGINAL filename — that filename is the deliverable.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isMfaChallengePending, MFA_PENDING_MESSAGE } from "@/lib/auth/mfa-server";
import { MEDIA_BUCKET } from "@/lib/constants";
import { checkDimensions, checkUploadedImage, safeFilename } from "@/lib/media-validation";
import { PROOFING_MAX_IMAGES } from "@/lib/proofing";
import { rateLimit } from "@/lib/rate-limit";
import type { ProofingGallery, ProofingImage } from "@/types";

export const runtime = "nodejs";

const VARIANT_KEYS = ["md", "sm"] as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ galleryId: string }> }
) {
  const { galleryId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (await isMfaChallengePending(supabase))
    return NextResponse.json({ error: MFA_PENDING_MESSAGE }, { status: 403 });

  // Proofing shoots are large; the per-photo work is light (two small
  // variants), so the window is wider than page uploads.
  const limited = rateLimit("proofing-upload", user.id, 120, 60);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many uploads. Wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  const { data: galleryRow } = await supabase
    .from("proofing_galleries")
    .select("id, user_id")
    .eq("id", galleryId)
    .single();
  const gallery = galleryRow as Pick<ProofingGallery, "id" | "user_id"> | null;
  if (!gallery || gallery.user_id !== user.id) {
    return NextResponse.json({ error: "Gallery not found." }, { status: 404 });
  }

  const { count } = await supabase
    .from("proofing_images")
    .select("id", { count: "exact", head: true })
    .eq("gallery_id", galleryId);
  if ((count ?? 0) >= PROOFING_MAX_IMAGES) {
    return NextResponse.json(
      { error: `A gallery holds up to ${PROOFING_MAX_IMAGES} photos.` },
      { status: 400 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const variants: Partial<Record<(typeof VARIANT_KEYS)[number], Uint8Array>> = {};
  for (const key of VARIANT_KEYS) {
    const blob = form.get(key);
    if (!(blob instanceof Blob))
      return NextResponse.json({ error: `Missing ${key} image.` }, { status: 400 });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const check = checkUploadedImage(bytes);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
    variants[key] = bytes;
  }

  const dims = checkDimensions(form.get("width"), form.get("height"));
  if (!dims) return NextResponse.json({ error: "Invalid image dimensions." }, { status: 400 });
  const filename = safeFilename(form.get("filename"));

  // Client-assigned batch order; falls back to 0 (queries then order by
  // filename, which matches capture order for camera files anyway).
  const rawPosition = Number(form.get("position"));
  const position = Number.isInteger(rawPosition) && rawPosition >= 0 ? rawPosition : 0;

  const imageId = crypto.randomUUID();
  const dir = `${user.id}/p/${galleryId}/${imageId}`;
  const uploaded: string[] = [];

  for (const key of VARIANT_KEYS) {
    const path = `${dir}/${key}.jpg`;
    const { error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(path, variants[key]!, { contentType: "image/jpeg", upsert: false });
    if (error) {
      if (uploaded.length > 0) await supabase.storage.from(MEDIA_BUCKET).remove(uploaded);
      return NextResponse.json({ error: "Storage is unavailable. Try again." }, { status: 502 });
    }
    uploaded.push(path);
  }

  const { data, error } = await supabase
    .from("proofing_images")
    .insert({
      id: imageId,
      gallery_id: galleryId,
      user_id: user.id,
      storage_path: `${dir}/md.jpg`,
      filename,
      width: dims.width,
      height: dims.height,
      position,
    })
    .select("*")
    .single();

  if (error || !data) {
    await supabase.storage.from(MEDIA_BUCKET).remove(uploaded);
    return NextResponse.json({ error: "Could not record the upload." }, { status: 500 });
  }

  return NextResponse.json({ image: data as ProofingImage });
}
