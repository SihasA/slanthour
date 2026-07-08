import type { ThemeDefinition, ThemeSettings } from "../types";

const DISPLAY = "var(--font-archivo), sans-serif";
const BODY = "var(--font-space-grotesk), sans-serif";
const MONO = "var(--font-ibm-plex-mono), monospace";

export const klaxon: ThemeDefinition = {
  id: "klaxon",
  name: "Klaxon",
  description:
    "Risograph zine: acid paper, ink outlines, index tags and headlines set like gig posters.",
  purpose: "Street photography, music and nightlife, zines, graduation shows and loud projects.",
  featuredSections: ["grid", "heading", "sequence", "contact-sheet", "quote"],
  settingsSchema: [
    {
      key: "paper",
      label: "Paper",
      type: "select",
      options: [
        { value: "acid", label: "Acid" },
        { value: "riso", label: "Riso" },
        { value: "ink", label: "Ink (dark)" },
      ],
      default: "acid",
    },
    {
      key: "outline",
      label: "Outlines",
      type: "select",
      options: [
        { value: "hairline", label: "Hairline" },
        { value: "bold", label: "Bold" },
        { value: "heavy", label: "Heavy" },
      ],
      default: "bold",
    },
    { key: "indexTags", label: "Index tags", type: "toggle", default: true },
    {
      key: "shout",
      label: "Headlines",
      type: "select",
      options: [
        { value: "caps", label: "All caps" },
        { value: "lower", label: "Lowercase" },
      ],
      default: "caps",
    },
  ],
  resolveTokens(settings: ThemeSettings) {
    const common = {
      headingFont: DISPLAY,
      bodyFont: BODY,
      annotationFont: MONO,
      maxTextWidth: "40rem",
      maxWideWidth: "78rem",
      sectionGap: "4.5rem",
    };
    if (settings.paper === "ink") {
      return {
        ...common,
        background: "#131217",
        surface: "#1c1b22",
        text: "#e9e7df",
        muted: "#8f8d96",
        accent: "#cdeb4a",
        border: "#33323c",
        isDark: true,
      };
    }
    if (settings.paper === "riso") {
      return {
        ...common,
        background: "#f4efe4",
        surface: "#ebe4d3",
        text: "#232120",
        muted: "#87816f",
        accent: "#2b53c7",
        border: "#232120",
        isDark: false,
      };
    }
    // acid
    return {
      ...common,
      background: "#d6ee45",
      surface: "#c9e138",
      text: "#161510",
      muted: "#5d6021",
      accent: "#c81f7a",
      border: "#161510",
      isDark: false,
    };
  },
};
