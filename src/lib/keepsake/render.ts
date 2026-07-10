// ─── Archive rendering (Path B) ────────────────────────────────────────
// The step-0 spike (see plan) showed that calling renderToStaticMarkup
// directly inside a route handler is rejected by Next's build ("You're
// importing a component that imports react-dom/server... render or return
// the content directly as a Server Component instead") — a hard webpack
// guardrail on the App Router's react-server condition, not a soft warning.
//
// Path B instead reuses Next's own normal SSR: an owner-guarded internal
// page (src/app/keepsake-view/[pageId]/page.tsx) renders <PageRenderer/>
// exactly like the live published route does — the same mechanism /demo
// already proves works — and this module self-fetches that page over HTTP
// (same origin, same process), forwarding the caller's session cookie so
// the internal page's own auth check sees the same signed-in owner. The
// result is real, drift-free SSR output; this file only extracts the
// PageRenderer subtree out of the full HTML document that comes back.
//
// This function does real network I/O, so unlike every other keepsake/*
// module it is not unit-tested — it's covered by the orchestrator's
// browser QA. extractShPage (the pure part) has its own tests.

import { extractShPage } from "./extract";

export interface FetchFragmentContext {
  /** Request origin (scheme + host), e.g. from new URL(request.url).origin. */
  origin: string;
  /** The archive request's Cookie header, forwarded so the internal render
   * page's auth check authenticates as the same signed-in owner. */
  cookieHeader: string | null;
}

/** Self-fetch the internal render page and pull out the .sh-page subtree. */
export async function fetchPublishedFragment(
  pageId: string,
  ctx: FetchFragmentContext
): Promise<string> {
  const res = await fetch(`${ctx.origin}/keepsake-view/${pageId}`, {
    headers: ctx.cookieHeader ? { cookie: ctx.cookieHeader } : {},
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Internal render page returned ${res.status}.`);
  }
  const html = await res.text();
  const fragment = extractShPage(html);
  if (!fragment) {
    throw new Error("Internal render page did not contain the expected markup.");
  }
  return fragment;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Wrap the localized .sh-page fragment into a standalone HTML document:
 * doctype, meta charset/viewport, the compiled stylesheet inline, and a
 * body background/color matching the theme (so any area outside the
 * fragment — browser default margin, short pages — reads as the theme,
 * not a flash of white/black). No Slanthour footer, no badge, no external
 * links: this document must work with zero network access. */
export function wrapArchiveDocument(params: {
  fragment: string;
  css: string;
  title: string;
  background: string;
  text: string;
}): string {
  const { fragment, css, title, background, text } = params;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${css}</style>
</head>
<body style="margin:0;background:${background};color:${text};">
${fragment}
</body>
</html>
`;
}
