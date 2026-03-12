"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FONT_PAIRS, ACCENT_PRESETS, MODE_DEFAULTS } from "@/lib/constants";
import type { Theme } from "@/types";

interface ThemeFormProps {
  theme: Theme;
}

export function ThemeForm({ theme }: ThemeFormProps) {
  const [mode, setMode] = useState<"light" | "dark">(theme.mode);
  const [fontPairId, setFontPairId] = useState(() => {
    const match = FONT_PAIRS.find(
      (p) => p.heading === theme.font_heading && p.body === theme.font_body
    );
    return match?.id ?? "editorial";
  });
  const [accentColor, setAccentColor] = useState(theme.color_accent);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus("idle");

    const fontPair = FONT_PAIRS.find((p) => p.id === fontPairId) ?? FONT_PAIRS[0];
    const defaults = MODE_DEFAULTS[mode];

    const supabase = createClient();
    const { error } = await supabase
      .from("themes")
      .update({
        mode,
        font_heading: fontPair.heading,
        font_body: fontPair.body,
        color_background: defaults.background,
        color_text: defaults.text,
        color_accent: accentColor,
      })
      .eq("user_id", theme.user_id);

    setSaving(false);
    setStatus(error ? "error" : "saved");
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-8">
      {/* Mode */}
      <div>
        <p className="text-[9px] uppercase tracking-label text-accent mb-3">
          Mode
        </p>
        <div className="flex gap-3">
          {(["dark", "light"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setStatus("idle");
              }}
              className={`px-5 py-2.5 border text-[10px] uppercase tracking-wide transition-colors ${
                mode === m
                  ? "border-accent text-foreground"
                  : "border-rule text-muted hover:border-muted"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Font pair */}
      <div>
        <p className="text-[9px] uppercase tracking-label text-accent mb-3">
          Fonts
        </p>
        <div className="flex flex-col gap-2">
          {FONT_PAIRS.map((pair) => (
            <button
              key={pair.id}
              type="button"
              onClick={() => {
                setFontPairId(pair.id);
                setStatus("idle");
              }}
              className={`flex items-center justify-between px-4 py-3 border text-left transition-colors ${
                fontPairId === pair.id
                  ? "border-accent"
                  : "border-rule hover:border-muted"
              }`}
            >
              <div>
                <p className="font-heading text-sm italic text-foreground">
                  {pair.label}
                </p>
                <p className="text-[11px] text-muted mt-0.5">
                  {pair.heading} + {pair.body}
                </p>
              </div>
              {fontPairId === pair.id && (
                <span className="text-accent text-xs">&#10003;</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Accent color */}
      <div>
        <p className="text-[9px] uppercase tracking-label text-accent mb-3">
          Accent colour
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          {ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.color}
              type="button"
              onClick={() => {
                setAccentColor(preset.color);
                setStatus("idle");
              }}
              title={preset.label}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                accentColor === preset.color
                  ? "border-foreground scale-110"
                  : "border-transparent hover:border-muted"
              }`}
              style={{ backgroundColor: preset.color }}
            />
          ))}

          {/* Custom color input */}
          <label
            className="w-8 h-8 rounded-full border border-rule cursor-pointer flex items-center justify-center overflow-hidden relative"
            title="Custom colour"
          >
            <input
              type="color"
              value={accentColor}
              onChange={(e) => {
                setAccentColor(e.target.value);
                setStatus("idle");
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <span className="text-muted text-xs">+</span>
          </label>
        </div>
        <p className="text-[11px] text-muted mt-2">{accentColor}</p>
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-3 text-[10px] uppercase tracking-wide text-foreground border-b border-foreground pb-1 hover:text-accent hover:border-accent transition-all duration-200 disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save theme"}
          <span className="text-sm">&rarr;</span>
        </button>

        {status === "saved" && (
          <span className="text-[11px] font-heading italic text-accent">
            Saved
          </span>
        )}
        {status === "error" && (
          <span className="text-[11px] font-heading italic text-red-400">
            Failed to save
          </span>
        )}
      </div>
    </form>
  );
}
