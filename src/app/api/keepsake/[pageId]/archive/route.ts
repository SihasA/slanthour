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
import { isMfaChallengePending, MFA_PENDING_MESSAGE } from "@/lib/auth/mfa-server";
import { archiveEligibility } from "@/lib/keepsake/eligibility";
import { isArchivableImageCount } from "@/lib/keepsake/archive-size";
import { collectArchiveImages } from "@/lib/keepsake/collect";
import { localizeHtml } from "@/lib/keepsake/localize";
import { compileArchiveCss } from "@/lib/keepsake/css";
import { fetchPublishedFragment, wrapArchiveDocument } from "@/lib/keepsake/render";
import { ZipWriter } from "@/lib/keepsake/zip";
import { displaySettings, parseDocument, type PublishedSnapshot } from "@/lib/page-document";
import { imageUrl } from "@/lib/media";
import { resolveThemeTokens } from "@/themes/registry";
import { rateLimit } from "@/lib/rate-limit";

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
  if (await isMfaChallengePending(supabase))
    return NextResponse.json({ error: MFA_PENDING_MESSAGE }, { status: 403 });

  // Each export self-fetches an SSR render, compiles Tailwind against it, and
  // fetches every image — real CPU and bandwidth, so throttle per owner like
  // the upload routes do. Keyed on the authenticated user id, not an IP.
  const limited = rateLimit("keepsake-archive", user.id, 10, 60);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many downloads. Wait a minute and try again." },
      { status: 429 }
    );
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

  // Guard the OTHER failure mode from zip.ts's 4 GiB check: too many photos
  // to finish streaming within maxDuration. A platform timeout kill here
  // would leave a zip with no end-of-central-directory record — corrupt,
  // with no explanation — so refuse up front, before any expensive work
  // (SSR self-fetch, Tailwind compile, image fetches) has started.
  if (!isArchivableImageCount(images.length)) {
    return NextResponse.json(
      {
        error:
          "This page has too many photographs to export in one download. Split it into smaller pages, or contact slanthour.com and we will export it for you.",
      },
      { status: 413 }
    );
  }

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

  // Only two hosts are ever legitimate image sources: our own origin
  // (root-relative legacy/demo paths) and the Supabase storage host
  // (everything uploaded through the pipeline). Image `path` is stored
  // verbatim from the client document, so an owner could set it to an
  // internal URL (cloud metadata, localhost); fetching that here and
  // streaming the bytes back would be an SSRF read primitive. Allowlist
  // the two known hosts and skip anything else.
  const selfOrigin = new URL(request.url).origin;
  const storageHost = (() => {
    try {
      return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).host;
    } catch {
      return null;
    }
  })();
  function isAllowedImageUrl(src: URL): boolean {
    if (src.origin === selfOrigin) return true;
    return storageHost !== null && src.protocol === "https:" && src.host === storageHost;
  }

  const skipped: string[] = [];

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
              // Legacy/demo images carry root-relative paths; resolve them
              // against this request's origin so they fetch from our own
              // public assets instead of throwing on a relative URL.
              const src = new URL(imageUrl(entry.image, "lg", watermarkOn), selfOrigin);
              if (!isAllowedImageUrl(src)) {
                skipped.push(entry.localPath);
                continue;
              }
              const res = await fetch(src, { redirect: "error" });
              if (res.ok) {
                const bytes = new Uint8Array(await res.arrayBuffer());
                controller.enqueue(writer.addFile(entry.localPath, bytes));
              } else {
                skipped.push(entry.localPath);
              }
            } catch {
              // Best effort: one unreachable photo shouldn't sink the export.
              skipped.push(entry.localPath);
            }
          }
        }
        await Promise.all(
          Array.from({ length: Math.min(IMAGE_FETCH_CONCURRENCY, images.length) }, worker)
        );

        // A silent gap would leave the paid archive with broken image refs
        // and no signal. Record any photo we couldn't include so the owner
        // (and support) can see the export was partial.
        if (skipped.length > 0) {
          const notice =
            `${skipped.length} of ${images.length} photographs could not be included ` +
            `in this archive:\n\n${skipped.join("\n")}\n\n` +
            `Open the page in the editor and re-download to try again. If it ` +
            `keeps happening, contact slanthour.com.\n`;
          controller.enqueue(writer.addFile("MISSING-PHOTOS.txt", new TextEncoder().encode(notice)));
        }

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
