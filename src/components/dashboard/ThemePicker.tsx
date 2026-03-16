"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LAYOUT_THEMES } from "@/lib/constants";
import type { LayoutTheme } from "@/types";

interface ThemePickerProps {
  currentTheme: LayoutTheme;
  userId: string;
  onThemeChange: (newTheme: LayoutTheme) => void;
}

const THEME_IDS: LayoutTheme[] = ["editorial", "journal", "cinematic"];

export function ThemePicker({
  currentTheme,
  userId,
  onThemeChange,
}: ThemePickerProps) {
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState<LayoutTheme | null>(null);
  const [justSwitched, setJustSwitched] = useState<LayoutTheme | null>(null);

  async function handleSwitch(newTheme: LayoutTheme) {
    if (newTheme === currentTheme) return;
    setShowConfirm(newTheme);
  }

  async function confirmSwitch() {
    if (!showConfirm) return;
    setSaving(true);

    const config = LAYOUT_THEMES[showConfirm];

    const supabase = createClient();
    const { error } = await supabase
      .from("themes")
      .update({
        layout_theme: showConfirm,
        mode: config.mode,
        color_background: config.colors.background,
        color_text: config.colors.text,
        color_accent: config.colors.accent,
        font_heading: config.fontHeading,
        font_body: config.fontBody,
      })
      .eq("user_id", userId);

    if (!error) {
      onThemeChange(showConfirm);
      setJustSwitched(showConfirm);
      setTimeout(() => setJustSwitched(null), 3000);
    }

    setSaving(false);
    setShowConfirm(null);
  }

  const switchingFromJournal = currentTheme === "journal" && showConfirm && showConfirm !== "journal";

  return (
    <div>
      <div className="flex flex-col gap-3">
        {THEME_IDS.map((id) => {
          const t = LAYOUT_THEMES[id];
          const isActive = id === currentTheme;

          return (
            <button
              key={id}
              type="button"
              onClick={() => handleSwitch(id)}
              disabled={saving}
              className={`relative flex items-start gap-4 p-4 border text-left transition-all duration-200 ${
                isActive
                  ? "border-accent bg-accent/[0.06]"
                  : "border-rule hover:border-muted hover:bg-surface"
              }`}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-3 bottom-3 w-[2px] bg-accent" />
              )}

              {/* Color preview swatch */}
              <div className="flex gap-1 mt-0.5 shrink-0 ml-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: t.colors.background, border: "1px solid rgba(128,128,128,0.3)" }}
                />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: t.colors.accent }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-heading text-sm italic ${isActive ? "text-foreground" : "text-muted"}`}>
                    {t.label}
                  </p>
                  {isActive && (
                    <span className="text-[8px] uppercase tracking-widest text-accent font-body">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                  {t.description}
                  {id === "journal" && (
                    <span className="text-accent"> Captions visible to visitors.</span>
                  )}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Success feedback */}
      {justSwitched && (
        <p className="text-[11px] font-heading italic text-accent mt-3 transition-opacity">
          Switched to {LAYOUT_THEMES[justSwitched].label}. Your portfolio has been updated.
        </p>
      )}

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-rule p-6 max-w-sm mx-4">
            <p className="text-[9px] uppercase tracking-label text-accent mb-3">
              Switch theme
            </p>
            <p className="font-heading italic text-foreground text-lg mb-3">
              Switch to {LAYOUT_THEMES[showConfirm].label}?
            </p>
            <p className="text-[12px] text-muted leading-relaxed mb-2">
              This will update your portfolio&apos;s layout, fonts, and colours.
              Your accent colour will be reset to {LAYOUT_THEMES[showConfirm].label} defaults.
            </p>
            {switchingFromJournal && (
              <p className="text-[12px] text-accent leading-relaxed mb-4">
                Captions will no longer be visible to visitors.
              </p>
            )}
            {!switchingFromJournal && <div className="mb-4" />}
            <div className="flex items-center gap-4">
              <button
                onClick={confirmSwitch}
                disabled={saving}
                className="text-[10px] uppercase tracking-wide text-foreground border-b border-foreground pb-0.5 hover:text-accent hover:border-accent transition-colors disabled:opacity-50"
              >
                {saving ? "Switching..." : "Confirm"}
              </button>
              <button
                onClick={() => setShowConfirm(null)}
                className="text-[10px] uppercase tracking-wide text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
