import type { ThemeDefinition, ThemeSettings } from "../types";

const MONO = "var(--font-ibm-plex-mono), monospace";
const GROTESK = "var(--font-space-grotesk), sans-serif";

export const roll36: ThemeDefinition = {
  id: "roll36",
  name: "Roll 36",
  description: "Contact-sheet and film-roll presentation: dense, organised grids with frame numbers and archival annotations.",
  purpose: "Street and film photography, event sequences, chronological and dense collections.",
  featuredSections: ["contact-sheet", "grid", "row", "heading", "text"],
  settingsSchema: [
    {
      key: "surface",
      label: "Surface",
      type: "select",
      options: [
        { value: "lighttable", label: "Light table" },
        { value: "darkroom", label: "Darkroom" },
      ],
      default: "darkroom",
    },
    {
      key: "density",
      label: "Grid density",
      type: "select",
      options: [
        { value: "loose", label: "Loose" },
        { value: "standard", label: "Standard" },
        { value: "dense", label: "Dense" },
      ],
      default: "standard",
    },
    { key: "frameNumbers", label: "Frame numbers", type: "toggle", default: true },
    { key: "borders", label: "Frame borders", type: "toggle", default: true },
    { key: "showCaptions", label: "Captions", type: "toggle", default: true },
    {
      key: "crop",
      label: "Frames",
      type: "select",
      options: [
        { value: "uniform", label: "Uniform crop" },
        { value: "natural", label: "Natural ratio" },
      ],
      default: "uniform",
    },
  ],
  resolveTokens(settings: ThemeSettings) {
    const dark = settings.surface !== "lighttable";
    return {
      background: dark ? "#0d0d0c" : "#e8e6e1",
      surface: dark ? "#161615" : "#dedbd4",
      text: dark ? "#dcd9d3" : "#26241f",
      muted: dark ? "#6e6b64" : "#77736a",
      accent: dark ? "#d9822b" : "#b8551e",
      border: dark ? "#2a2a28" : "#c8c4bb",
      headingFont: GROTESK,
      bodyFont: MONO,
      annotationFont: MONO,
      maxTextWidth: "38rem",
      maxWideWidth: "80rem",
      sectionGap: "4rem",
      isDark: dark,
    };
  },
};
