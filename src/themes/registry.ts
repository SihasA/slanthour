// ─── Theme registry ──────────────────────────────────────────────────
// The single source of truth for theme metadata. Pure data + functions
// (no React) so it is importable from server actions, route handlers and
// tests. Renderers are registered separately in src/themes/renderers.tsx.

import type { ThemeId } from "@/types";
import { monograph } from "./definitions/monograph";
import { roll36 } from "./definitions/roll36";
import { keepsake } from "./definitions/keepsake";
import { afterdark } from "./definitions/afterdark";
import { cabinet } from "./definitions/cabinet";
import {
  SETTINGS_VERSION,
  SETTINGS_VERSION_KEY,
  type ThemeDefinition,
  type ThemeSettings,
  type ThemeTokens,
} from "./types";

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  monograph,
  roll36,
  keepsake,
  afterdark,
  cabinet,
};

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];
export const DEFAULT_THEME: ThemeId = "monograph";

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && value in THEMES;
}

export function getTheme(id: string): ThemeDefinition {
  return isThemeId(id) ? THEMES[id] : THEMES[DEFAULT_THEME];
}

export function defaultThemeSettings(id: ThemeId): ThemeSettings {
  const settings: ThemeSettings = { [SETTINGS_VERSION_KEY]: String(SETTINGS_VERSION) };
  for (const def of THEMES[id].settingsSchema) settings[def.key] = def.default;
  return settings;
}

/**
 * Validate untrusted settings against a theme's schema. Unknown keys are
 * dropped, invalid values replaced with the schema default — so settings
 * saved under another theme (or an older schema) are ignored safely and
 * switching themes never corrupts state.
 */
export function sanitizeThemeSettings(id: string, raw: unknown): ThemeSettings {
  const theme = getTheme(id);
  const input =
    typeof raw === "object" && raw !== null && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const settings: ThemeSettings = { [SETTINGS_VERSION_KEY]: String(SETTINGS_VERSION) };
  for (const def of theme.settingsSchema) {
    const value = input[def.key];
    if (def.type === "toggle") {
      settings[def.key] = typeof value === "boolean" ? value : def.default;
    } else {
      settings[def.key] = def.options.some((o) => o.value === value)
        ? (value as string)
        : def.default;
    }
  }
  return settings;
}

/** Resolved tokens for a theme + (sanitised) settings. */
export function resolveThemeTokens(id: string, raw: unknown): ThemeTokens {
  const theme = getTheme(id);
  return theme.resolveTokens(sanitizeThemeSettings(id, raw));
}

/** CSS custom properties driving every theme renderer. */
export function themeCssVars(tokens: ThemeTokens): Record<string, string> {
  return {
    "--sh-bg": tokens.background,
    "--sh-surface": tokens.surface,
    "--sh-text": tokens.text,
    "--sh-muted": tokens.muted,
    "--sh-accent": tokens.accent,
    "--sh-border": tokens.border,
    "--sh-heading": tokens.headingFont,
    "--sh-body": tokens.bodyFont,
    "--sh-annotation": tokens.annotationFont,
    "--sh-text-width": tokens.maxTextWidth,
    "--sh-wide-width": tokens.maxWideWidth,
    "--sh-gap": tokens.sectionGap,
  };
}
