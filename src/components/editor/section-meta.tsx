// ─── Section metadata for the editor UI ──────────────────────────────
// Plain-language descriptions, tiny layout glyphs and per-theme control
// facts shared by the section list and the inspector. Editor-only:
// page-document.ts stays presentation-agnostic and published pages never
// read this file.

import type { SectionType } from "@/lib/page-document";

export const SECTION_GROUPS: { group: string; types: SectionType[] }[] = [
  {
    group: "Photos",
    types: ["hero", "image", "split", "row", "grid", "contact-sheet", "sequence"],
  },
  { group: "Words", types: ["heading", "text", "quote"] },
  { group: "Structure", types: ["spacer"] },
];

export const SECTION_DESCRIPTIONS: Record<SectionType, string> = {
  hero: "Full-screen or banner opener with your title over the photo.",
  image: "One photo: reading-column, wide, or full-bleed.",
  split: "Two photos side by side, matched to equal height.",
  row: "Three photos across, matched to equal height.",
  grid: "Even columns of cropped thumbnails; you pick 2, 3 or 4 across.",
  "contact-sheet": "A dense sheet of small frames, like a darkroom contact sheet.",
  sequence: "Photos one after another, each full width at its natural size.",
  text: "A paragraph or more of writing.",
  heading: "A titled break between groups of photos.",
  quote: "A pull quote, with optional attribution.",
  spacer: "Vertical breathing room, with an optional divider rule.",
};

/** How the section behaves on phones — surfaced next to the Layout picker. */
export function sectionMobileNote(type: SectionType): string | null {
  switch (type) {
    case "split":
    case "row":
    case "sequence":
      return "On phones these photos stack vertically, full width. Check the Mobile preview.";
    case "grid":
    case "contact-sheet":
      return "On phones this stays a grid of smaller thumbnails.";
    default:
      return null;
  }
}

// ── Per-theme control facts ──────────────────────────────────────────
// Some inspector controls are honoured only by certain themes; showing a
// dead control erodes trust, so the inspector hides them with a note.
// Extend these lists when a new theme honours the setting.

/** Themes whose grid renderer reads the section's `columns`. */
const GRID_COLUMNS_THEMES = [
  "monograph",
  "keepsake",
  "afterdark",
  "cabinet",
  "riviera",
  "klaxon",
  "verdigris",
];
/** Themes whose grid renderer reads the section's `gap`. */
const GRID_GAP_THEMES = ["monograph", "riviera", "klaxon", "verdigris"];
/** Themes that render contact-sheet frame numbers. */
const FRAME_NUMBER_THEMES = ["roll36", "riviera", "klaxon", "verdigris"];

export const gridColumnsApply = (theme: string) => GRID_COLUMNS_THEMES.includes(theme);
export const gridGapApplies = (theme: string) => GRID_GAP_THEMES.includes(theme);
export const frameNumbersApply = (theme: string) => FRAME_NUMBER_THEMES.includes(theme);

// ── Layout glyphs ────────────────────────────────────────────────────
// ~16×12 schematics of each arrangement, drawn with currentColor so they
// inherit the label's text colour wherever they appear.

export function SectionGlyph({ type, className }: { type: SectionType; className?: string }) {
  const props = {
    viewBox: "0 0 16 12",
    width: 16,
    height: 12,
    "aria-hidden": true,
    className,
    fill: "currentColor",
  } as const;

  switch (type) {
    case "hero":
      return (
        <svg {...props}>
          <rect x="0.5" y="0.5" width="15" height="11" fill="none" stroke="currentColor" />
          <rect x="3" y="7.5" width="10" height="1.4" />
        </svg>
      );
    case "image":
      return (
        <svg {...props}>
          <rect x="2.5" y="1.5" width="11" height="9" fill="none" stroke="currentColor" />
        </svg>
      );
    case "split":
      return (
        <svg {...props}>
          <rect x="0.5" y="1" width="7" height="10" />
          <rect x="8.5" y="1" width="7" height="10" />
        </svg>
      );
    case "row":
      return (
        <svg {...props}>
          <rect x="0.5" y="2" width="4.4" height="8" />
          <rect x="5.8" y="2" width="4.4" height="8" />
          <rect x="11.1" y="2" width="4.4" height="8" />
        </svg>
      );
    case "grid":
      return (
        <svg {...props}>
          {[0, 5.5, 11].map((x) =>
            [0, 6.5].map((y) => <rect key={`${x}-${y}`} x={x + 0.5} y={y + 0.5} width="4" height="4.5" />)
          )}
        </svg>
      );
    case "contact-sheet":
      return (
        <svg {...props}>
          <rect x="0.5" y="0.5" width="15" height="11" fill="none" stroke="currentColor" />
          {[2, 5.5, 9, 12.5].map((x) =>
            [2.2, 6.8].map((y) => <rect key={`${x}-${y}`} x={x} y={y} width="2.2" height="2.6" />)
          )}
        </svg>
      );
    case "sequence":
      return (
        <svg {...props}>
          <rect x="1.5" y="0.5" width="13" height="3" />
          <rect x="1.5" y="4.5" width="13" height="3" />
          <rect x="1.5" y="8.5" width="13" height="3" />
        </svg>
      );
    case "heading":
      return (
        <svg {...props}>
          <rect x="1" y="3" width="14" height="2.2" />
          <rect x="1" y="7" width="8" height="1.2" />
        </svg>
      );
    case "text":
      return (
        <svg {...props}>
          <rect x="1" y="1.5" width="14" height="1.1" />
          <rect x="1" y="4.3" width="14" height="1.1" />
          <rect x="1" y="7.1" width="14" height="1.1" />
          <rect x="1" y="9.9" width="9" height="1.1" />
        </svg>
      );
    case "quote":
      return (
        <svg {...props}>
          <text x="2" y="11" fontSize="13" fontFamily="Georgia, serif">
            &ldquo;
          </text>
          <rect x="8" y="5" width="7" height="1.1" />
          <rect x="8" y="7.8" width="5" height="1.1" />
        </svg>
      );
    case "spacer":
      return (
        <svg {...props}>
          <rect x="1" y="1" width="14" height="1.1" />
          <rect x="5.5" y="5.7" width="5" height="0.8" opacity="0.5" />
          <rect x="1" y="10" width="14" height="1.1" />
        </svg>
      );
  }
}
