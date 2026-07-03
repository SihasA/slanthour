import type { ThemeDefinition, ThemeSettings } from "../types";

const SERIF = "var(--font-libre-baskerville), serif";
const HAND = "var(--font-caveat), cursive";
const BODY = "var(--font-inter), sans-serif";

const PAPER: Record<string, { bg: string; surface: string; border: string }> = {
  cream: { bg: "#f7f0e3", surface: "#efe6d4", border: "#ddd1ba" },
  white: { bg: "#fbfaf7", surface: "#f2f0ea", border: "#e2ded4" },
  kraft: { bg: "#e5d7c0", surface: "#dccbaf", border: "#c9b593" },
};

const PALETTE_ACCENT: Record<string, string> = {
  warm: "#c05f3c",
  neutral: "#6d6459",
  cool: "#5c7894",
};

export const keepsake: ThemeDefinition = {
  id: "keepsake",
  name: "Keepsake",
  description: "Warm scrapbook composition — layered paper, tape and pin accents, handwritten annotations.",
  purpose: "Friends, family memories, travel, birthdays, weddings and personal diaries.",
  featuredSections: ["hero", "split", "row", "image", "quote", "text"],
  settingsSchema: [
    {
      key: "paper",
      label: "Paper",
      type: "select",
      options: [
        { value: "cream", label: "Cream" },
        { value: "white", label: "White" },
        { value: "kraft", label: "Kraft" },
      ],
      default: "cream",
    },
    {
      key: "palette",
      label: "Palette",
      type: "select",
      options: [
        { value: "warm", label: "Warm" },
        { value: "neutral", label: "Neutral" },
        { value: "cool", label: "Cool" },
      ],
      default: "warm",
    },
    {
      key: "edges",
      label: "Photo edges",
      type: "select",
      options: [
        { value: "border", label: "White border" },
        { value: "polaroid", label: "Polaroid" },
        { value: "plain", label: "Plain" },
      ],
      default: "border",
    },
    {
      key: "rotation",
      label: "Rotation",
      type: "select",
      options: [
        { value: "none", label: "None" },
        { value: "subtle", label: "Subtle" },
        { value: "playful", label: "Playful" },
      ],
      default: "subtle",
    },
    {
      key: "annotation",
      label: "Annotations",
      type: "select",
      options: [
        { value: "hand", label: "Handwritten" },
        { value: "print", label: "Printed" },
      ],
      default: "hand",
    },
    {
      key: "accents",
      label: "Accents",
      type: "select",
      options: [
        { value: "tape", label: "Tape" },
        { value: "pins", label: "Pins" },
        { value: "none", label: "None" },
      ],
      default: "tape",
    },
  ],
  resolveTokens(settings: ThemeSettings) {
    const paper = PAPER[String(settings.paper)] ?? PAPER.cream;
    return {
      background: paper.bg,
      surface: paper.surface,
      text: "#3a3126",
      muted: "#8c7f6d",
      accent: PALETTE_ACCENT[String(settings.palette)] ?? PALETTE_ACCENT.warm,
      border: paper.border,
      headingFont: SERIF,
      bodyFont: BODY,
      annotationFont: settings.annotation === "print" ? BODY : HAND,
      maxTextWidth: "38rem",
      maxWideWidth: "64rem",
      sectionGap: "5.5rem",
      isDark: false,
    };
  },
};
