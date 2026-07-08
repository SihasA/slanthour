import type { ThemeDefinition, ThemeSettings } from "../types";

const SERIF = "var(--font-cormorant), serif";
const SANS = "var(--font-space-grotesk), sans-serif";
const BODY = "var(--font-inter), sans-serif";

const RHYTHM_GAP: Record<string, string> = {
  compact: "4rem",
  balanced: "6rem",
  spacious: "8.5rem",
};

export const monograph: ThemeDefinition = {
  id: "monograph",
  name: "Monograph",
  description: "Editorial magazine layout: strong typography, generous whitespace, large images.",
  purpose: "Photography series, portfolios, essays, documentary and fine-art work.",
  featuredSections: ["hero", "image", "text", "heading", "quote", "split"],
  settingsSchema: [
    {
      key: "paper",
      label: "Paper",
      type: "select",
      options: [
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ],
      default: "light",
    },
    {
      key: "headings",
      label: "Headings",
      type: "select",
      options: [
        { value: "serif", label: "Serif" },
        { value: "sans", label: "Modern sans" },
      ],
      default: "serif",
    },
    {
      key: "rhythm",
      label: "Rhythm",
      type: "select",
      options: [
        { value: "compact", label: "Compact" },
        { value: "balanced", label: "Balanced" },
        { value: "spacious", label: "Spacious" },
      ],
      default: "balanced",
    },
    {
      key: "captions",
      label: "Captions",
      type: "select",
      options: [
        { value: "below", label: "Below image" },
        { value: "margin", label: "In margin" },
      ],
      default: "below",
    },
    {
      key: "imageFrame",
      label: "Image frame",
      type: "select",
      options: [
        { value: "none", label: "None" },
        { value: "hairline", label: "Hairline" },
      ],
      default: "none",
    },
    { key: "chapterNumbers", label: "Chapter numbers", type: "toggle", default: false },
  ],
  resolveTokens(settings: ThemeSettings) {
    const dark = settings.paper === "dark";
    return {
      background: dark ? "#14120f" : "#faf8f4",
      surface: dark ? "#1c1915" : "#f1ede6",
      text: dark ? "#ece7de" : "#1c1a17",
      muted: dark ? "#7d776c" : "#8a847a",
      accent: dark ? "#c4a583" : "#8a4a2b",
      border: dark ? "#2c2822" : "#e0dbd2",
      headingFont: settings.headings === "sans" ? SANS : SERIF,
      bodyFont: BODY,
      annotationFont: SERIF,
      maxTextWidth: "40rem",
      maxWideWidth: "68rem",
      sectionGap: RHYTHM_GAP[String(settings.rhythm)] ?? RHYTHM_GAP.balanced,
      isDark: dark,
    };
  },
};
