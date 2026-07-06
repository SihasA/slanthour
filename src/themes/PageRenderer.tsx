"use client";

// ─── PageRenderer ────────────────────────────────────────────────────
// The single entry point for rendering a page document with a theme.
// Used identically by the editor preview and the published route, so a
// page can never look different between the two. Theme CSS is scoped to
// this subtree via CSS custom properties — nothing leaks outward.

import { getTheme, sanitizeThemeSettings, themeCssVars } from "./registry";
import { THEME_RENDERERS } from "./renderers";
import { LightboxProvider } from "./shared/Lightbox";
import type { ThemeRenderProps } from "./types";
import type { PageDocument } from "@/lib/page-document";

export interface PageRendererProps {
  document: PageDocument;
  theme: string;
  themeSettings: unknown;
  title: string;
  author?: ThemeRenderProps["author"];
  mode: ThemeRenderProps["mode"];
  /** Disable the lightbox (editor canvas, tiny previews). */
  lightbox?: boolean;
}

export function PageRenderer({
  document,
  theme,
  themeSettings,
  title,
  author = null,
  mode,
  lightbox = true,
}: PageRendererProps) {
  const definition = getTheme(theme);
  const settings = sanitizeThemeSettings(definition.id, themeSettings);
  const tokens = definition.resolveTokens(settings);
  const Renderer = THEME_RENDERERS[definition.id];

  return (
    <div
      className="sh-page min-h-full"
      data-theme={definition.id}
      style={{
        ...themeCssVars(tokens),
        backgroundColor: "var(--sh-bg)",
        color: "var(--sh-text)",
        fontFamily: "var(--sh-body)",
      }}
    >
      <LightboxProvider enabled={lightbox}>
        <Renderer
          document={document}
          settings={settings}
          title={title}
          author={author}
          mode={mode}
        />
      </LightboxProvider>
    </div>
  );
}
