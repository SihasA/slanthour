// ─── Media upload endpoint ───────────────────────────────────────────
// Receives the three client-generated variants of one photo, re-validates
// them server-side (magic bytes + size), stores them under an unguessable
// per-asset path inside the caller's folder, and records a media_assets row.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MEDIA_BUCKET } from "@/lib/constants";
import {
  checkBlurDataUrl,
  checkDimensions,
  checkUploadedImage,
  safeFilename,
} from "@/lib/media-validation";
import { rateLimit } from "@/lib/rate-limit";
import type { MediaAsset } from "@/types";

export const runtime = "nodejs";

const VARIANT_KEYS = ["lg", "md", "sm"] as const;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const limited = rateLimit("media-upload", user.id, 60, 60);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many uploads — wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  // Validate every variant before writing anything.
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
  const blur = checkBlurDataUrl(form.get("blur"));
  const filename = safeFilename(form.get("filename"));

  const assetId = crypto.randomUUID();
  const dir = `${user.id}/m/${assetId}`;
  const uploaded: string[] = [];

  for (const key of VARIANT_KEYS) {
    const path = `${dir}/${key}.jpg`;
    const { error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(path, variants[key]!, { contentType: "image/jpeg", upsert: false });
    if (error) {
      // Roll back anything already written so failed uploads leave no orphans.
      if (uploaded.length > 0) await supabase.storage.from(MEDIA_BUCKET).remove(uploaded);
      return NextResponse.json({ error: "Storage is unavailable. Try again." }, { status: 502 });
    }
    uploaded.push(path);
  }

  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      id: assetId,
      user_id: user.id,
      storage_path: `${dir}/lg.jpg`,
      has_variants: true,
      filename,
      width: dims.width,
      height: dims.height,
      blur_data_url: blur,
      size_bytes: variants.lg!.byteLength,
    })
    .select("*")
    .single();

  if (error || !data) {
    await supabase.storage.from(MEDIA_BUCKET).remove(uploaded);
    return NextResponse.json({ error: "Could not record the upload." }, { status: 500 });
  }

  return NextResponse.json({ asset: data as MediaAsset });
}
