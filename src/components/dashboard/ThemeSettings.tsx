"use client";

import { useState } from "react";
import { ThemePicker } from "./ThemePicker";
import { ThemeForm } from "./ThemeForm";
import type { Theme, LayoutTheme, Tier } from "@/types";
import { LAYOUT_THEMES } from "@/lib/constants";

interface ThemeSettingsProps {
  initialTheme: Theme;
  tier: Tier;
}

export function ThemeSettings({ initialTheme, tier }: ThemeSettingsProps) {
  const [theme, setTheme] = useState(initialTheme);

  function handleThemeChange(newLayout: LayoutTheme) {
    const config = LAYOUT_THEMES[newLayout];
    setTheme({
      ...theme,
      layout_theme: newLayout,
      mode: config.mode,
      color_background: config.colors.background,
      color_text: config.colors.text,
      color_accent: config.colors.accent,
      font_heading: config.fontHeading,
      font_body: config.fontBody,
    });
  }

  return (
    <>
      {/* Layout theme picker */}
      <section className="mb-16">
        <div className="flex items-center gap-5 mb-8">
          <span className="section-label whitespace-nowrap">Layout</span>
          <div className="flex-1 h-px bg-rule" />
        </div>
        <ThemePicker
          currentTheme={theme.layout_theme}
          userId={theme.user_id}
          tier={tier}
          onThemeChange={handleThemeChange}
        />
      </section>

      {/* Accent colour only */}
      <section id="theme">
        <div className="flex items-center gap-5 mb-8">
          <span className="section-label whitespace-nowrap">Accent</span>
          <div className="flex-1 h-px bg-rule" />
        </div>
        <ThemeForm theme={theme} />
      </section>
    </>
  );
}
