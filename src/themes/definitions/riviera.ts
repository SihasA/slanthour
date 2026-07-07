import type { ThemeDefinition, ThemeSettings } from "../types";

const DISPLAY = "var(--font-fraunces), serif";
const BODY = "var(--font-inter), sans-serif";
const MONO = "var(--font-dm-mono), monospace";

// Accent per light setting — the same named accent shifts value so it keeps
// contrast on every ground.
const ACCENTS: Record<string, { day: string; dusk: string }> = {
  azure: { day: "#1d5fc4", dusk: "#7ea8e8" },
  coral: { day: "#c94f33", dusk: "#e8927c" },
  palm: { day: "#2e7d54", dusk: "#7ec49a" },
};

export const riviera: ThemeDefinition = {
  id: "riviera",
  name: "Riviera",
  description:
    "Sun-lit postcard — shell-white paper, azure ink, postcard mats and a horizontal photo rail.",
  purpose: "Travel diaries, summer series, holidays, city walks and anything shot in the sun.",
  featuredSections: ["contact-sheet", "sequence", "hero", "grid", "quote"],
  settingsSchema: [
    {
      key: "light",
      label: "Time of day",
      type: "select",
      options: [
        { value: "noon", label: "Noon" },
        { value: "sunset", label: "Sunset" },
        { value: "dusk", label: "Dusk (dark)" },
      ],
      default: "noon",
    },
    {
      key: "accent",
      label: "Ink",
      type: "select",
      options: [
        { value: "azure", label: "Azure" },
        { value: "coral", label: "Coral" },
        { value: "palm", label: "Palm" },
      ],
      default: "azure",
    },
    { key: "postmarks", label: "Postmarks", type: "toggle", default: true },
    { key: "tilt", label: "Tilted frames", type: "toggle", default: true },
    {
      key: "rail",
      label: "Photo rail",
      type: "select",
      options: [
        { value: "postcards", label: "Postcards" },
        { value: "strip", label: "Strip" },
      ],
      default: "postcards",
    },
  ],
  resolveTokens(settings: ThemeSettings) {
    const accent = ACCENTS[String(settings.accent)] ?? ACCENTS.azure;
    if (settings.light === "dusk") {
      return {
        background: "#182338",
        surface: "#20304c",
        text: "#ece4d2",
        muted: "#98a3b8",
        accent: accent.dusk,
        border: "#2d3d5c",
        headingFont: DISPLAY,
        bodyFont: BODY,
        annotationFont: MONO,
        maxTextWidth: "38rem",
        maxWideWidth: "74rem",
        sectionGap: "5.5rem",
        isDark: true,
      };
    }
    const sunset = settings.light === "sunset";
    return {
      background: sunset ? "#f8e9d7" : "#f7f2e6",
      surface: sunset ? "#f0dec5" : "#efe7d3",
      text: "#20293a",
      muted: sunset ? "#96876f" : "#8b8874",
      accent: accent.day,
      border: sunset ? "#e2cfae" : "#ded4b9",
      headingFont: DISPLAY,
      bodyFont: BODY,
      annotationFont: MONO,
      maxTextWidth: "38rem",
      maxWideWidth: "74rem",
      sectionGap: "5.5rem",
      isDark: false,
    };
  },
};
