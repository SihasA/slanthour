// ─── Archive CSS compilation ───────────────────────────────────────────
// Tailwind compiled at export time against the *exact* rendered HTML
// string — not a precomputed superset — so the archive's stylesheet can
// never drift from what the markup actually uses. tailwindcss + postcss +
// autoprefixer are existing dependencies (used at dev/build time); this is
// the one runtime use of them.

import postcss from "postcss";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import tailwindConfig from "../../../tailwind.config";
import { revealOverrideCss } from "./localize";

// Only what the theme renderers hand-author outside of Tailwind's own
// utility scan: the reveal-on-scroll keyframe and the horizontal-scroll
// scrollbar hider (see src/app/globals.css). Everything else a renderer
// uses is a Tailwind utility class, discovered by scanning the raw HTML.
const BASE_INPUT_CSS = `
@tailwind base;
@tailwind utilities;

.no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
.no-scrollbar::-webkit-scrollbar { display: none; }

@keyframes shFade { from { opacity: 0; } to { opacity: 1; } }
`;

/** Compile the archive's stylesheet: real Tailwind output for the exact
 * HTML being shipped, plus the reveal/opacity override so the page isn't
 * blank with no JS to run it. */
export async function compileArchiveCss(html: string): Promise<string> {
  const result = await postcss([
    tailwindcss({
      ...tailwindConfig,
      content: [{ raw: html, extension: "html" }],
    }),
    autoprefixer(),
  ]).process(BASE_INPUT_CSS, { from: undefined });
  return `${result.css}\n${revealOverrideCss()}`;
}
