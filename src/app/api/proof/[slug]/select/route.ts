// ─── Proofing selection endpoint (anonymous client) ──────────────────
// The client's tap-to-favourite writes. Gallery rows are not
// anon-readable, so this runs on the service-role client with the checks
// in code: the gallery must be active, the gate cookie must be present
// when a password is set, and the image must belong to the gallery.

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasGalleryAccess } from "@/lib/proofing-gate";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const headerStore = await headers();
  const ip = (headerStore.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  const limited = rateLimit("proofing-select", `${ip}:${slug}`, 240, 60);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many changes at once. Wait a moment." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  let body: { imageId?: unknown; selected?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const imageId = typeof body.imageId === "string" ? body.imageId : "";
  const selected = body.selected === true;
  if (!UUID_PATTERN.test(imageId)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: gallery } = await admin
    .from("proofing_galleries")
    .select("id, status, password_hash")
    .eq("slug", slug)
    .single();
  if (!gallery || gallery.status !== "active") {
    return NextResponse.json({ error: "This gallery is no longer available." }, { status: 404 });
  }
  if (gallery.password_hash && !(await hasGalleryAccess(gallery.id))) {
    return NextResponse.json({ error: "Enter the gallery password first." }, { status: 401 });
  }

  const { data: image } = await admin
    .from("proofing_images")
    .select("id")
    .eq("id", imageId)
    .eq("gallery_id", gallery.id)
    .single();
  if (!image) return NextResponse.json({ error: "Photo not found." }, { status: 404 });

  if (selected) {
    const { error } = await admin
      .from("proofing_selections")
      .upsert({ image_id: imageId, gallery_id: gallery.id }, { onConflict: "image_id" });
    if (error) {
      return NextResponse.json({ error: "Could not save the pick. Try again." }, { status: 500 });
    }
  } else {
    const { error } = await admin.from("proofing_selections").delete().eq("image_id", imageId);
    if (error) {
      return NextResponse.json({ error: "Could not save the change. Try again." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, selected });
}
