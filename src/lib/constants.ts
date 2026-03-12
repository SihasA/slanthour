export const FONT_PAIRS = [
  {
    id: "editorial",
    label: "Editorial",
    heading: "Cormorant Garamond",
    body: "DM Mono",
    preview: "Elegant serif meets monospace",
  },
  {
    id: "classic",
    label: "Classic",
    heading: "Playfair Display",
    body: "Source Sans 3",
    preview: "Traditional serif with clean sans",
  },
  {
    id: "modern",
    label: "Modern",
    heading: "Space Grotesk",
    body: "IBM Plex Mono",
    preview: "Geometric sans with technical mono",
  },
  {
    id: "clean",
    label: "Clean",
    heading: "Libre Baskerville",
    body: "Inter",
    preview: "Refined serif with neutral sans",
  },
] as const;

export const ACCENT_PRESETS = [
  { color: "#9c8e7a", label: "Gold" },
  { color: "#8b7355", label: "Bronze" },
  { color: "#6b8f71", label: "Sage" },
  { color: "#7a8c9c", label: "Slate" },
  { color: "#9c7a7a", label: "Rose" },
  { color: "#7a9c8e", label: "Teal" },
] as const;

export const MODE_DEFAULTS = {
  dark: { background: "#0f0e0d", text: "#f7f5f2" },
  light: { background: "#f7f5f2", text: "#1c1a18" },
} as const;

export const RESERVED_SLUGS = [
  "login",
  "signup",
  "dashboard",
  "settings",
  "admin",
  "api",
  "about",
  "contact",
  "terms",
  "privacy",
  "blog",
  "help",
  "explore",
  "search",
  "new",
  "edit",
  "delete",
] as const;
