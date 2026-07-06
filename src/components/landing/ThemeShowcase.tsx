"use client";

// ─── Five-theme showcase ─────────────────────────────────────────────
// Renders the same demo document through the real theme engine — what you
// see is the actual product rendering, not screenshots or mockups.

import { useState } from "react";
import { THEME_IDS, THEMES, defaultThemeSettings } from "@/themes/registry";
import { PageRenderer } from "@/themes/PageRenderer";
import { SHOWCASE_DOCUMENT, SHOWCASE_TITLE } from "@/lib/demo/showcase";
import type { ThemeId } from "@/types";

export function ThemeShowcase() {
  const [active, setActive] = useState<ThemeId>("monograph");
  const theme = THEMES[active];

  return (
    <div>
      {/* Theme tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-3" role="tablist" aria-label="Themes">
        {THEME_IDS.map((id) => (
          <button
            key={id}
            role="tab"
            aria-selected={active === id}
            onClick={() => setActive(id)}
            className={`px-4 py-2 text-[10px] uppercase tracking-wide border transition-colors ${
              active === id
                ? "border-accent text-foreground"
                : "border-rule text-muted hover:text-foreground"
            }`}
          >
            {THEMES[id].name}
          </button>
        ))}
      </div>
      <p className="text-center font-copy text-[13px] text-muted mb-8 max-w-md mx-auto">
        {theme.purpose}
      </p>

      {/* Live render — same document, different theme */}
      <div className="border border-rule overflow-hidden">
        <div className="h-[560px] sm:h-[640px] overflow-y-auto overscroll-contain">
          <PageRenderer
            key={active}
            document={SHOWCASE_DOCUMENT}
            theme={active}
            themeSettings={defaultThemeSettings(active)}
            title={SHOWCASE_TITLE}
            author={{ displayName: "Demo", username: "demo" }}
            mode="preview"
            lightbox={false}
          />
        </div>
      </div>
      <p className="mt-3 text-center text-[10px] uppercase tracking-label text-muted/60">
        Live render — scroll inside the frame · same photos, five designs
      </p>
    </div>
  );
}
