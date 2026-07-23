import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createAdminClient } from "@/lib/supabase/admin";
import { storageUrl } from "@/lib/media";
import type { PublishedSnapshot } from "@/lib/page-document";

// ─── Per-page link unfurl card ───────────────────────────────────────
// The image every shared page link resolves to. Composed from the page's
// PUBLISHED snapshot only (cover + title) — never draft columns, so an
// in-progress edit can never leak into a shared preview. Styled to match
// the root opengraph-image.tsx: dark ground, the cover scrimmed in on the
// right, the wordmark and orange slant tick sitting quietly lower-left,
// with the page title set in Cormorant above them.
//
// The title is drawn with a vendored, subset Cormorant italic face
// (public/fonts/cormorant-italic.ttf, SIL OFL 1.1 — see the OFL.txt
// alongside it). Satori needs a real font buffer for any text node; the
// file is a repo asset, not an npm dependency, and nothing here fetches
// from an external CDN.
//
// Privacy: password-protected pages render a generic branded card with no
// title or cover, so a locked page's contents never surface in an unfurl.
// Unlisted pages do show their card — the link itself is the secret, and
// anyone holding it can already open the page.

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "A page on Slanthour";

type Props = { params: Promise<{ username: string; slug: string }> };

type Loaded = {
  title: string;
  cover: string | null;
  visibility: string;
};

async function loadPublished(username: string, slug: string): Promise<Loaded | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("pages")
      .select("visibility, is_published, published, profiles!inner(username)")
      .eq("profiles.username", username)
      .eq("slug", slug)
      .single();
    if (!data || !data.is_published || !data.published) return null;
    const snapshot = data.published as unknown as PublishedSnapshot;
    return {
      title: snapshot.title,
      cover: snapshot.cover,
      visibility: data.visibility as string,
    };
  } catch {
    return null;
  }
}

/** Fetch the cover into a data URI so a failed load degrades to a coverless
 * card instead of throwing the whole image render. */
async function coverDataUri(path: string | null): Promise<string | null> {
  if (!path) return null;
  try {
    const res = await fetch(storageUrl(path));
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const type = res.headers.get("content-type") ?? "image/jpeg";
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function PageOpengraphImage({ params }: Props) {
  const { username, slug } = await params;
  const loaded = await loadPublished(username, slug);

  // Protected pages, or pages we could not resolve, get a generic branded
  // card with no leaked content.
  const isProtected = !loaded || loaded.visibility === "password";
  const title = isProtected ? "" : loaded.title;

  const [wordmark, fontData, coverSrc] = await Promise.all([
    readFile(join(process.cwd(), "public/brand/logo-light.svg")),
    readFile(join(process.cwd(), "public/fonts/cormorant-italic.ttf")),
    isProtected ? Promise.resolve(null) : coverDataUri(loaded!.cover),
  ]);
  const wordmarkSrc = `data:image/svg+xml;base64,${wordmark.toString("base64")}`;

  // Keep the title to a length that composes cleanly at this scale.
  const displayTitle = title.length > 90 ? `${title.slice(0, 89).trimEnd()}…` : title;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#0a0908",
          fontFamily: "Cormorant",
        }}
      >
        {/* Cover, right ~58% of the canvas, full height. */}
        {coverSrc && (
          <img
            src={coverSrc}
            alt=""
            width={696}
            height={630}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 696,
              height: 630,
              objectFit: "cover",
            }}
          />
        )}

        {/* Scrim: dark ground fading into the cover's left edge. */}
        {coverSrc && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 504,
              width: 340,
              height: 630,
              background:
                "linear-gradient(to right, #0a0908 0%, rgba(10,9,8,0.75) 45%, rgba(10,9,8,0) 100%)",
              display: "flex",
            }}
          />
        )}

        {/* Hairline frame. */}
        <div
          style={{
            position: "absolute",
            top: 28,
            left: 28,
            right: 28,
            bottom: 28,
            border: "1px solid #1f1e1d",
            display: "flex",
          }}
        />

        {/* Lower-left quiet zone: title, slant tick, wordmark. */}
        <div
          style={{
            position: "absolute",
            left: 72,
            bottom: 72,
            width: 440,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {displayTitle && (
            <div
              style={{
                display: "flex",
                fontSize: 52,
                lineHeight: 1.1,
                fontStyle: "italic",
                color: "#e8e4df",
                marginBottom: 28,
              }}
            >
              {displayTitle}
            </div>
          )}

          {/* Slant tick. */}
          <div
            style={{
              width: 44,
              height: 2,
              background: "#FF6B00",
              transform: "rotate(-18deg)",
              marginBottom: 26,
              display: "flex",
            }}
          />

          {/* Wordmark. */}
          <img src={wordmarkSrc} alt="Slanthour" width={210} height={40} />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Cormorant", data: fontData, style: "italic", weight: 500 }],
    }
  );
}
