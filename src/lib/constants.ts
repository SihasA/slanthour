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

// ─── Layout themes (locked packages — user only picks theme + accent) ───
import type { LayoutTheme } from "@/types";

export interface LayoutThemeConfig {
  id: LayoutTheme;
  label: string;
  description: string;
  mode: "light" | "dark";
  fontHeading: string;
  fontBody: string;
  colors: {
    background: string;
    text: string;
    accent: string;
    muted: string;
    surface: string;
    border: string;
  };
}

export const LAYOUT_THEMES: Record<LayoutTheme, LayoutThemeConfig> = {
  editorial: {
    id: "editorial",
    label: "Editorial",
    description: "Dense grid, dramatic overlay. Built for street and documentary.",
    mode: "dark",
    fontHeading: "Cormorant Garamond",
    fontBody: "DM Mono",
    colors: {
      background: "#0a0908",
      text: "#f0ece4",
      accent: "#9c8e7a",
      muted: "#5a5550",
      surface: "#151312",
      border: "#2a2725",
    },
  },
  journal: {
    id: "journal",
    label: "Journal",
    description: "Staggered layout with visible captions. Built for lifestyle and travel.",
    mode: "light",
    fontHeading: "Libre Baskerville",
    fontBody: "Inter",
    colors: {
      background: "#f4f0ea",
      text: "#2c2825",
      accent: "#a0876e",
      muted: "#8a837a",
      surface: "#eae5dd",
      border: "#d6d0c7",
    },
  },
  cinematic: {
    id: "cinematic",
    label: "Cinematic",
    description: "Full-bleed sequence. Built for wildlife and landscape.",
    mode: "dark",
    fontHeading: "Space Grotesk",
    fontBody: "IBM Plex Mono",
    colors: {
      background: "#0e1010",
      text: "#e4e2de",
      accent: "#7a9c8e",
      muted: "#5a6560",
      surface: "#161a1a",
      border: "#252a2a",
    },
  },
};

// ─── Portfolio field limits ─────────────────────────────────
export const TITLE_MAX_LENGTH = 25;
export const SUBTITLE_MAX_LENGTH = 90;

// ─── Photo upload constraints ────────────────────────────────
export const PHOTO_MAX_DIMENSION = 2000;
export const PHOTO_QUALITY = 0.8;
export const PHOTO_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
export const PHOTO_MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
export const BANNER_MAX_DIMENSION = 2400;
export const BANNER_QUALITY = 0.85;

// ─── Tier limits ─────────────────────────────────────────────
export const TIER_LIMITS = {
  free: { maxPhotos: 18 },
  pro: { maxPhotos: 48 },
  studio: { maxPhotos: 240 },
} as const;

// ─── Reserved slugs ─────────────────────────────────────────
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
