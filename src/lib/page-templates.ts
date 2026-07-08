// ─── Page templates ──────────────────────────────────────────────────
// A template is a quick-start section skeleton: ready-made structure the
// user pours photos into (tray + "Fill sections in order") instead of
// assembling sections one at a time. A template is NOT a theme — a theme
// is how the page looks, a template is which sections exist. Applying a
// template never changes the theme; at most a card hints at a pairing.
//
// Templates are code-defined like theme definitions. Never move this
// catalogue into the database (see ARCHITECTURE.md on the retired
// pages_theme_check constraint for why lockstep DB lists go stale).

import {
  createEmptyDocument,
  createSection,
  SECTION_LABELS,
  type PageDocument,
  type Section,
  type SectionType,
} from "@/lib/page-document";

export type TemplateId =
  | "portfolio"
  | "photo-essay"
  | "trip-journal"
  | "zine"
  | "one-series";

export interface PageTemplate {
  id: TemplateId;
  name: string;
  /** One card line: who this start is for. No em dashes, ever. */
  description: string;
  /** Soft pairing suggestion shown on the card. Never applied. */
  pairsWith: string;
  /** Fresh sections with new ids on every call. */
  build: () => Section[];
}

/** createSection with a patch, keeping the generated id and type. */
function make(type: SectionType, patch: Record<string, unknown> = {}): Section {
  const section = createSection(type);
  return { ...section, ...patch, id: section.id, type: section.type } as Section;
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: "portfolio",
    name: "Portfolio",
    description: "A classic showcase: one strong opener, then your best work in rows and a grid.",
    pairsWith: "Verdigris",
    build: () => [
      make("hero"),
      make("heading", { title: "Selected work", level: 2 }),
      make("row"),
      make("split"),
      make("grid"),
    ],
  },
  {
    id: "photo-essay",
    name: "Photo essay",
    description: "For a story told in pictures, paced with words between them.",
    pairsWith: "Keepsake",
    build: () => [
      make("hero", { height: "half" }),
      make("text", { body: "Start the story here. A few sentences is plenty." }),
      make("image"),
      make("sequence"),
      make("quote", { text: "Pull one line out and let it breathe." }),
      make("image", { width: "full" }),
    ],
  },
  {
    id: "trip-journal",
    name: "Trip journal",
    description: "Chaptered by day or place. Drop each batch under its own heading.",
    pairsWith: "Cabinet",
    build: () => [
      make("heading", { title: "Day one" }),
      make("grid"),
      make("heading", { title: "Day two", level: 2 }),
      make("row"),
      make("text", { body: "Notes from the road." }),
    ],
  },
  {
    id: "zine",
    name: "Zine",
    description: "A loud little issue: contact sheet up front, sequence in the back.",
    pairsWith: "Klaxon",
    build: () => [
      make("heading", { title: "Issue 01" }),
      make("contact-sheet"),
      make("quote", { text: "Shout something here." }),
      make("sequence"),
    ],
  },
  {
    id: "one-series",
    name: "One series",
    description: "A single body of work, opened big and left to run.",
    pairsWith: "After Dark",
    build: () => [
      make("hero"),
      make("text", { body: "A few words about this series." }),
      make("sequence"),
    ],
  },
];

const TEMPLATE_MAP = new Map(PAGE_TEMPLATES.map((t) => [t.id, t]));

export function isTemplateId(value: unknown): value is TemplateId {
  return typeof value === "string" && TEMPLATE_MAP.has(value as TemplateId);
}

export function getTemplate(id: TemplateId): PageTemplate {
  return TEMPLATE_MAP.get(id)!;
}

/** "Hero image · Heading · Three-image row · …" — derived from build()
 * so the card can never drift from the real structure. */
export function templateStructure(template: PageTemplate): string {
  return template.build().map((s) => SECTION_LABELS[s.type]).join(" · ");
}

/** A fresh document for createPage when the user starts from a template. */
export function createTemplateDocument(id: TemplateId): PageDocument {
  return { ...createEmptyDocument(), sections: getTemplate(id).build() };
}
