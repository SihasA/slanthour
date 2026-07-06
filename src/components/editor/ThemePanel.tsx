"use client";

// ─── Theme panel ─────────────────────────────────────────────────────
// Theme selection (all five, switching never touches content) and the
// selected theme's settings, generated from its typed schema.

import { THEME_IDS, THEMES } from "@/themes/registry";
import type { EditorAction, EditorContent } from "@/lib/editor/reducer";
import type { ThemeId } from "@/types";

export function ThemePanel({
  content,
  dispatch,
}: {
  content: EditorContent;
  dispatch: React.Dispatch<EditorAction>;
}) {
  const active = THEMES[content.theme];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[9px] uppercase tracking-label text-accent mb-2">Theme</h2>
        <div className="space-y-1.5">
          {THEME_IDS.map((id) => {
            const theme = THEMES[id];
            const tokens = theme.resolveTokens({});
            const selected = id === content.theme;
            return (
              <button
                key={id}
                onClick={() => dispatch({ type: "setTheme", theme: id as ThemeId })}
                aria-pressed={selected}
                className={`w-full text-left border p-3 transition-colors ${
                  selected ? "border-accent" : "border-rule hover:border-muted"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Palette swatch strip */}
                  <span className="flex h-8 w-12 shrink-0 border border-rule overflow-hidden" aria-hidden>
                    <span className="flex-1" style={{ background: tokens.background }} />
                    <span className="w-2" style={{ background: tokens.accent }} />
                    <span className="w-2" style={{ background: tokens.surface }} />
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-[12px] ${selected ? "text-accent" : "text-foreground"}`}>
                      {theme.name}
                    </span>
                    <span className="block text-[11px] text-muted font-copy truncate">
                      {theme.purpose}
                    </span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-muted font-copy">
          Switching themes restyles the page — your sections and photos stay exactly as they are.
        </p>
      </div>

      <div>
        <h2 className="text-[9px] uppercase tracking-label text-accent mb-3">
          {active.name} settings
        </h2>
        <div className="space-y-4">
          {active.settingsSchema.map((def) => (
            <div key={def.key}>
              <label className="text-[10px] uppercase tracking-wide text-muted block mb-1.5">
                {def.label}
              </label>
              {def.type === "toggle" ? (
                <button
                  onClick={() =>
                    dispatch({
                      type: "updateThemeSettings",
                      key: def.key,
                      value: content.themeSettings[def.key] !== true,
                    })
                  }
                  role="switch"
                  aria-checked={content.themeSettings[def.key] === true}
                  className={`px-3 py-1.5 text-[11px] border transition-colors ${
                    content.themeSettings[def.key] === true
                      ? "border-accent text-foreground"
                      : "border-rule text-muted"
                  }`}
                >
                  {content.themeSettings[def.key] === true ? "On" : "Off"}
                </button>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {def.options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        dispatch({ type: "updateThemeSettings", key: def.key, value: option.value })
                      }
                      aria-pressed={content.themeSettings[def.key] === option.value}
                      className={`px-2.5 py-1.5 text-[11px] border transition-colors ${
                        content.themeSettings[def.key] === option.value
                          ? "border-accent text-foreground"
                          : "border-rule text-muted hover:text-foreground"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
