import type { Theme, LayoutTheme } from "@/types";
import { LAYOUT_THEMES } from "@/lib/constants";

// Maps DB font names → CSS variable references
const FONT_CSS_MAP: Record<string, string> = {
  "Cormorant Garamond": "var(--font-cormorant), serif",
  "DM Mono": "var(--font-dm-mono), monospace",
  "Libre Baskerville": "var(--font-libre-baskerville), serif",
  Inter: "var(--font-inter), sans-serif",
  "Space Grotesk": "var(--font-space-grotesk), sans-serif",
  "IBM Plex Mono": "var(--font-ibm-plex-mono), monospace",
};

export function getFontCss(fontName: string): string {
  return FONT_CSS_MAP[fontName] ?? `'${fontName}', sans-serif`;
}

/**
 * Get the locked theme config for a layout_theme.
 * Only color_accent can be overridden by the user.
 */
export function getLockedTheme(layoutTheme: LayoutTheme, userAccent?: string) {
  const config = LAYOUT_THEMES[layoutTheme] ?? LAYOUT_THEMES.editorial;
  return {
    mode: config.mode,
    fontHeading: config.fontHeading,
    fontBody: config.fontBody,
    bg: config.colors.background,
    text: config.colors.text,
    accent: userAccent || config.colors.accent,
    muted: config.colors.muted,
    surface: config.colors.surface,
    border: config.colors.border,
    isDark: config.mode === "dark",
    headerBg: hexToRgba(config.colors.background, config.mode === "dark" ? 0.88 : 0.92),
  };
}

export interface ThemeVars {
  "--theme-bg": string;
  "--theme-text": string;
  "--theme-accent": string;
  "--theme-heading": string;
  "--theme-body": string;
  "--theme-rule": string;
  "--theme-muted": string;
  "--theme-surface": string;
  "--theme-header-bg": string;
}

/**
 * Build CSS variables from a Theme record.
 * Derives everything from layout_theme; only color_accent is user-controlled.
 */
export function buildThemeVars(theme: Theme): ThemeVars {
  const locked = getLockedTheme(theme.layout_theme, theme.color_accent);
  return {
    "--theme-bg": locked.bg,
    "--theme-text": locked.text,
    "--theme-accent": locked.accent,
    "--theme-heading": getFontCss(locked.fontHeading),
    "--theme-body": getFontCss(locked.fontBody),
    "--theme-rule": locked.border,
    "--theme-muted": locked.muted,
    "--theme-surface": locked.surface,
    "--theme-header-bg": locked.headerBg,
  };
}

// ─── Color math helpers ──────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}
