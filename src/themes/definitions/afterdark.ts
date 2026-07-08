import type { ThemeDefinition, ThemeSettings } from "../types";

const GROTESK = "var(--font-space-grotesk), sans-serif";
const BODY = "var(--font-inter), sans-serif";

const ACCENTS: Record<string, string> = {
  red: "#e5484d",
  amber: "#e79b38",
  cyan: "#4cb8c4",
  white: "#f2f1ef",
};

export const afterdark: ThemeDefinition = {
  id: "afterdark",
  name: "After Dark",
  description: "Dark cinematic presentation: large frames, chapter cards, letterboxing, minimal interface.",
  purpose: "Cinematic and night photography, documentary, travel and dramatic visual narratives.",
  featuredSections: ["hero", "sequence", "heading", "image", "quote"],
  settingsSchema: [
    {
      key: "darkness",
      label: "Background",
      type: "select",
      options: [
        { value: "black", label: "Black" },
        { value: "charcoal", label: "Charcoal" },
      ],
      default: "black",
    },
    {
      key: "accent",
      label: "Accent",
      type: "select",
      options: [
        { value: "red", label: "Signal red" },
        { value: "amber", label: "Amber" },
        { value: "cyan", label: "Cyan" },
        { value: "white", label: "White" },
      ],
      default: "amber",
    },
    {
      key: "letterbox",
      label: "Letterbox",
      type: "select",
      options: [
        { value: "none", label: "Off" },
        { value: "widescreen", label: "16:9" },
        { value: "cinema", label: "2.39:1" },
      ],
      default: "none",
    },
    {
      key: "captions",
      label: "Captions",
      type: "select",
      options: [
        { value: "below", label: "Below frame" },
        { value: "overlay", label: "Overlay" },
      ],
      default: "below",
    },
    {
      key: "chapterStyle",
      label: "Chapter cards",
      type: "select",
      options: [
        { value: "minimal", label: "Minimal" },
        { value: "numbered", label: "Numbered" },
      ],
      default: "minimal",
    },
    { key: "transitions", label: "Reveal transitions", type: "toggle", default: true },
  ],
  resolveTokens(settings: ThemeSettings) {
    const charcoal = settings.darkness === "charcoal";
    return {
      background: charcoal ? "#101214" : "#050505",
      surface: charcoal ? "#181b1e" : "#0e0e0e",
      text: "#e6e4e0",
      muted: "#63666a",
      accent: ACCENTS[String(settings.accent)] ?? ACCENTS.amber,
      border: charcoal ? "#25292d" : "#1c1c1c",
      headingFont: GROTESK,
      bodyFont: BODY,
      annotationFont: GROTESK,
      maxTextWidth: "40rem",
      maxWideWidth: "84rem",
      sectionGap: "7rem",
      isDark: true,
    };
  },
};
