import type { ThemeDefinition, ThemeSettings } from "../types";

const SERIF = "var(--font-libre-baskerville), serif";
const MONO = "var(--font-ibm-plex-mono), monospace";
const BODY = "var(--font-inter), sans-serif";

export const cabinet: ThemeDefinition = {
  id: "cabinet",
  name: "Cabinet",
  description: "Museum catalogue — archival labels, index numbering, structured groups, quiet typography.",
  purpose: "Family archives, historical collections, artist catalogues, object studies and long-term projects.",
  featuredSections: ["grid", "heading", "image", "text", "row"],
  settingsSchema: [
    {
      key: "background",
      label: "Archive background",
      type: "select",
      options: [
        { value: "paper", label: "Paper" },
        { value: "stone", label: "Stone" },
        { value: "slate", label: "Slate (dark)" },
      ],
      default: "paper",
    },
    {
      key: "labels",
      label: "Labels",
      type: "select",
      options: [
        { value: "typewritten", label: "Typewritten" },
        { value: "print", label: "Print" },
      ],
      default: "typewritten",
    },
    { key: "numbering", label: "Index numbers", type: "toggle", default: true },
    {
      key: "mat",
      label: "Mount",
      type: "select",
      options: [
        { value: "none", label: "None" },
        { value: "thin", label: "Thin mat" },
        { value: "deep", label: "Deep mat" },
      ],
      default: "thin",
    },
    {
      key: "metadata",
      label: "Metadata",
      type: "select",
      options: [
        { value: "minimal", label: "Minimal" },
        { value: "full", label: "Full record" },
      ],
      default: "minimal",
    },
    {
      key: "gridScale",
      label: "Grid scale",
      type: "select",
      options: [
        { value: "compact", label: "Compact" },
        { value: "standard", label: "Standard" },
        { value: "large", label: "Large" },
      ],
      default: "standard",
    },
  ],
  resolveTokens(settings: ThemeSettings) {
    const stone = settings.background === "stone";
    const slate = settings.background === "slate"; // dark gallery wall
    if (slate) {
      return {
        background: "#232323",
        surface: "#2c2c2b",
        text: "#e7e4dd",
        muted: "#98938a",
        accent: "#93a7d6",
        border: "#3d3c39",
        headingFont: SERIF,
        bodyFont: BODY,
        annotationFont: settings.labels === "print" ? BODY : MONO,
        maxTextWidth: "40rem",
        maxWideWidth: "76rem",
        sectionGap: "5rem",
        isDark: true,
      };
    }
    return {
      background: stone ? "#e9e7e2" : "#f5f3ee",
      surface: stone ? "#e0ddd6" : "#edeae2",
      text: "#26241f",
      muted: "#8b8579",
      accent: "#40538a",
      border: stone ? "#cfccc3" : "#ddd9cf",
      headingFont: SERIF,
      bodyFont: BODY,
      annotationFont: settings.labels === "print" ? BODY : MONO,
      maxTextWidth: "40rem",
      maxWideWidth: "76rem",
      sectionGap: "5rem",
      isDark: false,
    };
  },
};
