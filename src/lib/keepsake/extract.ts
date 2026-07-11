// ─── .sh-page subtree extraction ──────────────────────────────────────
// Path B renders the real page inside a normal Next.js page (self-fetched
// as a complete HTML document, see render.ts), then this pulls out just the
// PageRenderer subtree — the single <div class="sh-page" ...> element that
// carries every --sh-* token inline (see src/themes/PageRenderer.tsx).
//
// A real DOM parser would be the "correct" way to do this, but this repo
// takes no new dependency for it. Balanced <div>/</div> counting is safe
// here because React's server renderer HTML-escapes all text and attribute
// content (a caption containing "<div" literally becomes "&lt;div" in the
// output), so no user-supplied text can ever forge a tag boundary — only
// React's own emitted div tags can.

const OPEN_SH_PAGE = /<div[^>]*\bclass="sh-page\b[^"]*"[^>]*>/;
const DIV_TAG = /<div\b[^>]*>|<\/div\s*>/gi;

/** Extract the outerHTML of the .sh-page root, or null if it isn't present
 * (e.g. the internal render redirected to a sign-in page instead). */
export function extractShPage(html: string): string | null {
  const open = OPEN_SH_PAGE.exec(html);
  if (!open) return null;

  const start = open.index;
  DIV_TAG.lastIndex = start;
  let depth = 0;
  let match: RegExpExecArray | null;
  while ((match = DIV_TAG.exec(html))) {
    if (match[0][1] === "/") {
      depth -= 1;
      if (depth === 0) return html.slice(start, match.index + match[0].length);
    } else {
      depth += 1;
    }
  }
  return null; // unbalanced — should never happen for React SSR output
}
