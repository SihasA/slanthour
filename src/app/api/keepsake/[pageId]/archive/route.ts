// ─── Keepsake static archive export ───────────────────────────────────
// "Every Keepsake page includes a downloadable archive: a self-contained
// copy of the page that works on any web host, without Slanthour."
// (src/app/terms/page.tsx, "Permanent pages" section — the whole contract.)
//
// Owner-only, grant-gated, streamed from here so nothing is ever
// pre-generated or stored: real PageRenderer output (see
// src/lib/keepsake/render.ts for why that's a self-fetch, not a direct
// renderToStaticMarkup call), Tailwind compiled against that exact HTML,
// images localized to files, reveal animations neutralized for no-JS
// viewing. Draft content is never read here — only page.published.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { archiveEligibility } from "@/lib/keepsake/eligibility";
import { collectArchiveImages } from "@/lib/keepsake/collect";
import { localizeHtml } from "@/lib/keepsake/localize";
import { compileArchiveCss } from "@/lib/keepsake/css";
import { fetchPublishedFragment, wrapArchiveDocument } from "@/lib/keepsake/render";
import { ZipWriter } from "@/lib/keepsake/zip";
import { displaySettings, parseDocument, type PublishedSnapshot } from "@/lib/page-document";
import { imageUrl } from "@/lib/media";
import { resolveThemeTokens } from "@/themes/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Bounded so a 100-photo page can't open 100 simultaneous fetches; keeps
// memory bounded too, since each entry streams to the response as soon as
// its bytes arrive rather than being held until the whole zip is ready.
const IMAGE_FETCH_CONCURRENCY = 6;

type RouteProps = { params: Promise<{ pageId: string }> };

function readmeText(params: { title: string; publishedAt: string }): string {
  const date = new Date(params.publishedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${params.title}
A self-contained archive exported from Slanthour.

TO VIEW
Open index.html in any web browser. No internet connection is required;
every photograph is included in the images folder alongside it.

TO HOST ELSEWHERE
Upload this whole folder, index.html, assets, and images, to any static
web host and point a domain at it. It needs no server, database, or
Slanthour account to work.

NOTES
This copy reflects the page as it was published on ${date}.
If the live page is unlisted or password protected, this downloaded
copy carries none of that protection. Keep it as private as you want
the page itself to be.

Exported from slanthour.com.
`;
}

export async function GET(request: Request, { params }: RouteProps) {
  const { pageId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to download this archive." }, { status: 401 });
  }

  // RLS also permits reading anyone's published-public page (needed
  // elsewhere for the live route), so ownership is a code-level check —
  // not merely a defensive double-check, see archiveEligibility.
  const { data: page } = await supabase
    .from("pages")
    .select(
      "id, user_id, slug, title, is_published, published, profiles!inner(display_name, username)"
    )
    .eq("id", pageId)
    .single();
  if (!page) {
    return NextResponse.json({ error: "Page not found." }, { status: 404 });
  }

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
  if (!eligibility.ok) {
    return NextResponse.json({ error: eligibility.reason }, { status: eligibility.status });
  }

  // Only page.published is ever read from here down — a draft can never
  // leak into an archive.
  const snapshot = page.published as PublishedSnapshot;
  const document = parseDocument(snapshot.document);
  const watermarkOn = displaySettings(document).watermark;
  const images = collectArchiveImages(document);

  let fragment: string;
  try {
    fragment = await fetchPublishedFragment(pageId, {
      origin: new URL(request.url).origin,
      cookieHeader: request.headers.get("cookie"),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not render the page for export. Try again." },
      { status: 502 }
    );
  }

  const localizedFragment = localizeHtml(fragment, images);
  const css = await compileArchiveCss(localizedFragment);
  const tokens = resolveThemeTokens(snapshot.theme, snapshot.themeSettings);
  const html = wrapArchiveDocument({
    fragment: localizedFragment,
    css,
    title: snapshot.title,
    background: tokens.background,
    text: tokens.text,
  });
  const readme = readmeText({ title: snapshot.title, publishedAt: snapshot.publishedAt });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const writer = new ZipWriter();
      try {
        controller.enqueue(writer.addFile("index.html", new TextEncoder().encode(html)));
        controller.enqueue(writer.addFile("assets/style.css", new TextEncoder().encode(css)));

        // Bounded-concurrency image pool. Chunks are enqueued in
        // *completion* order, not document order — each ZIP entry carries
        // its own name/offset independently, so that costs nothing while
        // keeping memory bounded to ~IMAGE_FETCH_CONCURRENCY images in
        // flight regardless of how many photos the page has.
        let cursor = 0;
        async function worker() {
          while (cursor < images.length) {
            const entry = images[cursor];
            cursor += 1;
            try {
              const res = await fetch(imageUrl(entry.image, "lg", watermarkOn));
              if (res.ok) {
                const bytes = new Uint8Array(await res.arrayBuffer());
                controller.enqueue(writer.addFile(entry.localPath, bytes));
              }
            } catch {
              // Best effort: one unreachable photo shouldn't sink the export.
            }
          }
        }
        await Promise.all(
          Array.from({ length: Math.min(IMAGE_FETCH_CONCURRENCY, images.length) }, worker)
        );

        controller.enqueue(writer.addFile("README.txt", new TextEncoder().encode(readme)));
        controller.enqueue(writer.finish());
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${page.slug}-slanthour-archive.zip"`,
    },
  });
}
