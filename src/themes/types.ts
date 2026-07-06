// ─── Theme contract ──────────────────────────────────────────────────
// Every theme is data (definition) + a renderer. Definitions are pure
// TypeScript (no React) so server actions can validate settings without
// pulling in components; renderers live in src/themes/renderers.tsx.

import type { ThemeId } from "@/types";
import type { PageDocument, SectionType } from "@/lib/page-document";

export type ThemeSettingValue = string | boolean;
export type ThemeSettings = Record<string, ThemeSettingValue>;

export interface ThemeSettingOption {
  value: string;
  label: string;
}

export type ThemeSettingDef =
  | {
      key: string;
      label: string;
      type: "select";
      options: ThemeSettingOption[];
      default: string;
    }
  | {
      key: string;
      label: string;
      type: "toggle";
      default: boolean;
    };

/** Resolved design tokens — everything a renderer styles with. */
export interface ThemeTokens {
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  border: string;
  /** CSS font-family values (font vars come from the root layout). */
  headingFont: string;
  bodyFont: string;
  annotationFont: string;
  /** Reading-column width, wide-image width (CSS lengths). */
  maxTextWidth: string;
  maxWideWidth: string;
  /** Base vertical rhythm between sections (CSS length). */
  sectionGap: string;
  isDark: boolean;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  /** What kind of work this theme is for (shown in pickers). */
  purpose: string;
  settingsSchema: ThemeSettingDef[];
  /** Section types this theme renders with a bespoke treatment. All themes
   * render every section type (content is never lost on switch); this list
   * flags where the theme is at its best, for editor hints. */
  featuredSections: SectionType[];
  resolveTokens(settings: ThemeSettings): ThemeTokens;
}

/** Props every theme renderer receives — identical in editor preview,
 * and published page, so themes render consistently everywhere. */
export interface ThemeRenderProps {
  document: PageDocument;
  settings: ThemeSettings;
  title: string;
  /** Byline info for the published header/footer. */
  author?: { displayName: string; username: string } | null;
  /** preview = inside the editor (no page chrome side effects). */
  mode: "preview" | "published";
}

export const SETTINGS_VERSION_KEY = "_v";
export const SETTINGS_VERSION = 1;
