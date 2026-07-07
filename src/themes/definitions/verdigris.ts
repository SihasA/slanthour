import type { ThemeDefinition, ThemeSettings } from "../types";

const DISPLAY = "var(--font-spectral), serif";
const BODY = "var(--font-inter), sans-serif";

export const verdigris: ThemeDefinition = {
  id: "verdigris",
  name: "Verdigris",
  description:
    "Botanical dusk — deep green, copper and patina, arched plate frames, engraved captions.",
  purpose: "Gardens and nature, quiet portraits, weddings at dusk, studies of place and season.",
  featuredSections: ["hero", "grid", "image", "quote", "split"],
  settingsSchema: [
    {
      key: "hour",
      label: "Hour",
      type: "select",
      options: [
        { value: "dusk", label: "Dusk (dark)" },
        { value: "conservatory", label: "Conservatory" },
        { value: "nocturne", label: "Nocturne (darkest)" },
      ],
      default: "dusk",
    },
    { key: "arches", label: "Arched frames", type: "toggle", default: true },
    {
      key: "plates",
      label: "Captions",
      type: "select",
      options: [
        { value: "botanical", label: "Botanical plates" },
        { value: "plain", label: "Plain" },
      ],
      default: "botanical",
    },
    { key: "filigree", label: "Filigree rules", type: "toggle", default: true },
  ],
  resolveTokens(settings: ThemeSettings) {
    const common = {
      headingFont: DISPLAY,
      bodyFont: BODY,
      annotationFont: DISPLAY,
      maxTextWidth: "37rem",
      maxWideWidth: "72rem",
      sectionGap: "6rem",
    };
    if (settings.hour === "conservatory") {
      return {
        ...common,
        background: "#eef0e3",
        surface: "#e4e8d4",
        text: "#24382b",
        muted: "#7d8a76",
        accent: "#b1683c",
        border: "#d1d8c0",
        isDark: false,
      };
    }
    if (settings.hour === "nocturne") {
      return {
        ...common,
        background: "#121e16",
        surface: "#19291e",
        text: "#dcd6c3",
        muted: "#84937d",
        accent: "#79b391",
        border: "#25392b",
        isDark: true,
      };
    }
    // dusk
    return {
      ...common,
      background: "#22382c",
      surface: "#2a4334",
      text: "#eae3cf",
      muted: "#a2b29f",
      accent: "#8fc7a4",
      border: "#3a5343",
      isDark: true,
    };
  },
};
