// ─── Full-screen live demo ───────────────────────────────────────────
// Renders the showcase document exactly the way a recipient of a shared
// link would experience it — full viewport, real theme engine, lightbox.
// ?theme= switches between themes (validated, defaults to monograph).

import Link from "next/link";
import type { Metadata } from "next";
import { PageRenderer } from "@/themes/PageRenderer";
import { THEME_IDS, THEMES, defaultThemeSettings, isThemeId } from "@/themes/registry";
import { SHOWCASE_DOCUMENT, SHOWCASE_TITLE } from "@/lib/demo/showcase";
import type { ThemeId } from "@/types";

export const metadata: Metadata = {
  title: "Live demo — Slanthour",
  description: "A real Slanthour page, rendered live. Switch themes and see the same photographs redesigned.",
  robots: { index: false, follow: false },
};

type RouteProps = { params: Promise<Record<string, never>>; searchParams: Promise<{ theme?: string }> };

export default async function DemoPage({ searchParams }: RouteProps) {
  const { theme: raw } = await searchParams;
  const theme: ThemeId = isThemeId(raw) ? raw : "monograph";
  const tokens = THEMES[theme].resolveTokens(defaultThemeSettings(theme));

  return (
    <div className="min-h-screen" style={{ background: tokens.background }}>
      {/* Demo bar — landing tokens, deliberately not the theme's */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-rule px-4 md:px-8 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5">
        <span className="text-[9px] uppercase tracking-wide text-muted whitespace-nowrap">
          A live Slanthour page
        </span>
        <nav className="flex flex-wrap items-center gap-3" aria-label="Try another theme">
          {THEME_IDS.map((id) => (
            <Link
              key={id}
              href={`/demo?theme=${id}`}
              className={`text-[9px] uppercase tracking-wide transition-colors ${
                id === theme ? "text-foreground underline underline-offset-4" : "text-muted/70 hover:text-foreground"
              }`}
            >
              {THEMES[id].name}
            </Link>
          ))}
        </nav>
        <Link
          href="/signup"
          className="ml-auto text-[9px] uppercase tracking-wide text-accent hover:text-foreground transition-colors whitespace-nowrap"
        >
          Create your own <span className="text-xs">&rarr;</span>
        </Link>
      </div>

      <div className="pt-16">
        <PageRenderer
          key={theme}
          document={SHOWCASE_DOCUMENT}
          theme={theme}
          themeSettings={defaultThemeSettings(theme)}
          title={SHOWCASE_TITLE}
          author={{ displayName: "Demo", username: "demo" }}
          mode="preview"
        />
      </div>
    </div>
  );
}
