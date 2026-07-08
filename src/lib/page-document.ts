// ─── Slanthour page document model ───────────────────────────────────
//
// A page is a versioned JSONB document: an ordered list of sections with
// stable IDs. The same document renders in the editor, the preview, and
// (via a frozen snapshot) the published page. Documents embed everything
// needed to render — image paths, dimensions, blur placeholders — so
// rendering never joins other tables.

export const DOCUMENT_VERSION = 1;

export interface PageImage {
  /** Stable within the document (not the same as assetId). */
  id: string;
  /** media_assets row id; null for backfilled banners / demo fixtures. */
  assetId: string | null;
  /** Storage path of the large variant inside the media bucket, or an absolute URL (demo fixtures). */
  path: string;
  /** True when md/sm variants exist alongside lg at the same directory. */
  hasVariants?: boolean;
  /** True when a 2560px xl variant also exists (hi-fi uploads, Pro+). */
  hasXl?: boolean;
  width: number | null;
  height: number | null;
  alt: string;
  caption: string;
  blur?: string | null;
  /** Crop focal point, percentages 0–100. Defaults to centre. */
  focal?: { x: number; y: number };
}

export type SectionType =
  | "hero"
  | "image"
  | "split"
  | "row"
  | "grid"
  | "contact-sheet"
  | "sequence"
  | "text"
  | "heading"
  | "quote"
  | "spacer";

interface SectionBase {
  id: string;
  type: SectionType;
}

export interface HeroSection extends SectionBase {
  type: "hero";
  image: PageImage | null;
  title: string;
  subtitle: string;
  height: "full" | "half";
}

export interface ImageSection extends SectionBase {
  type: "image";
  image: PageImage | null;
  /** text = reading column, wide = wider than text, full = full-bleed */
  width: "text" | "wide" | "full";
}

export interface SplitSection extends SectionBase {
  type: "split";
  images: PageImage[]; // up to 2
}

export interface RowSection extends SectionBase {
  type: "row";
  images: PageImage[]; // up to 3
}

export interface GridSection extends SectionBase {
  type: "grid";
  images: PageImage[];
  columns: 2 | 3 | 4;
  gap: "tight" | "regular" | "loose";
}

export interface ContactSheetSection extends SectionBase {
  type: "contact-sheet";
  images: PageImage[];
  numbered: boolean;
}

export interface SequenceSection extends SectionBase {
  type: "sequence";
  images: PageImage[];
}

export interface TextSection extends SectionBase {
  type: "text";
  body: string;
  align: "left" | "center";
}

export interface HeadingSection extends SectionBase {
  type: "heading";
  title: string;
  subtitle: string;
  level: 1 | 2;
}

export interface QuoteSection extends SectionBase {
  type: "quote";
  text: string;
  attribution: string;
}

export interface SpacerSection extends SectionBase {
  type: "spacer";
  size: "small" | "medium" | "large";
  divider: boolean;
}

export type Section =
  | HeroSection
  | ImageSection
  | SplitSection
  | RowSection
  | GridSection
  | ContactSheetSection
  | SequenceSection
  | TextSection
  | HeadingSection
  | QuoteSection
  | SpacerSection;

/**
 * Page-level display settings. Live inside the document so they freeze into
 * the published snapshot like everything else; absent means all defaults
 * (older documents parse unchanged). Available on every tier by design.
 */
export interface PageDisplaySettings {
  /** Block right-click and drag on photos. Deters casual copying only. */
  protectPhotos: boolean;
  /** Largest variant served to visitors: "md" caps files at 1000px. */
  maxPhotoRes: "full" | "md";
}

export const DEFAULT_DISPLAY_SETTINGS: PageDisplaySettings = {
  protectPhotos: false,
  maxPhotoRes: "full",
};

export interface PageDocument {
  version: number;
  sections: Section[];
  settings?: PageDisplaySettings;
  /**
   * The page tray: photos uploaded to the page but not yet placed in a
   * section. Absent when empty (older documents parse unchanged). Tray
   * photos count toward the page image limit and are stripped from the
   * published snapshot at publish time.
   */
  tray?: PageImage[];
}

/** Read a document's tray with the default applied. */
export function trayImages(doc: PageDocument): PageImage[] {
  return doc.tray ?? [];
}

/** Read a document's display settings with defaults applied. */
export function displaySettings(doc: PageDocument): PageDisplaySettings {
  return doc.settings ?? DEFAULT_DISPLAY_SETTINGS;
}

/** Frozen snapshot written on publish; the only thing public routes read. */
export interface PublishedSnapshot {
  snapshotVersion: 1;
  document: PageDocument;
  theme: string;
  themeSettings: Record<string, unknown>;
  title: string;
  publishedAt: string;
}

// ─── Constructors ────────────────────────────────────────────────────

export function newSectionId(): string {
  return crypto.randomUUID();
}

export function createEmptyDocument(): PageDocument {
  return { version: DOCUMENT_VERSION, sections: [] };
}

export function createSection(type: SectionType): Section {
  const id = newSectionId();
  switch (type) {
    case "hero":
      return { id, type, image: null, title: "", subtitle: "", height: "full" };
    case "image":
      return { id, type, image: null, width: "wide" };
    case "split":
      return { id, type, images: [] };
    case "row":
      return { id, type, images: [] };
    case "grid":
      return { id, type, images: [], columns: 3, gap: "regular" };
    case "contact-sheet":
      return { id, type, images: [], numbered: true };
    case "sequence":
      return { id, type, images: [] };
    case "text":
      return { id, type, body: "", align: "left" };
    case "heading":
      return { id, type, title: "", subtitle: "", level: 1 };
    case "quote":
      return { id, type, text: "", attribution: "" };
    case "spacer":
      return { id, type, size: "medium", divider: false };
  }
}

// ─── Section metadata (drives editor UI + theme support checks) ─────

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: "Hero image",
  image: "Photo",
  split: "Two-image split",
  row: "Three-image row",
  grid: "Grid",
  "contact-sheet": "Contact sheet",
  sequence: "Photo sequence",
  text: "Text",
  heading: "Heading",
  quote: "Quote",
  spacer: "Spacer",
};

/** Max images a section can hold (Infinity for open-ended collections). */
export function sectionImageCapacity(type: SectionType): number {
  switch (type) {
    case "hero":
    case "image":
      return 1;
    case "split":
      return 2;
    case "row":
      return 3;
    case "grid":
    case "contact-sheet":
    case "sequence":
      return Infinity;
    default:
      return 0;
  }
}

/** Read the images of any section uniformly. */
export function sectionImages(section: Section): PageImage[] {
  switch (section.type) {
    case "hero":
    case "image":
      return section.image ? [section.image] : [];
    case "split":
    case "row":
    case "grid":
    case "contact-sheet":
    case "sequence":
      return section.images;
    default:
      return [];
  }
}

/** Return a copy of the section with its image list replaced (capacity-clamped). */
export function withSectionImages(section: Section, images: PageImage[]): Section {
  const capacity = sectionImageCapacity(section.type);
  const capped = capacity === Infinity ? images : images.slice(0, capacity);
  switch (section.type) {
    case "hero":
    case "image":
      return { ...section, image: capped[0] ?? null };
    case "split":
    case "row":
    case "grid":
    case "contact-sheet":
    case "sequence":
      return { ...section, images: capped };
    default:
      return section;
  }
}

// ─── Validation / migration ──────────────────────────────────────────

const SECTION_TYPES: SectionType[] = [
  "hero", "image", "split", "row", "grid", "contact-sheet",
  "sequence", "text", "heading", "quote", "spacer",
];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function sanitizeImage(v: unknown): PageImage | null {
  if (!isRecord(v) || typeof v.path !== "string" || v.path === "") return null;
  return {
    id: typeof v.id === "string" ? v.id : newSectionId(),
    assetId: typeof v.assetId === "string" ? v.assetId : null,
    path: v.path,
    hasVariants: v.hasVariants === true,
    hasXl: v.hasXl === true,
    width: typeof v.width === "number" ? v.width : null,
    height: typeof v.height === "number" ? v.height : null,
    alt: typeof v.alt === "string" ? v.alt : "",
    caption: typeof v.caption === "string" ? v.caption : "",
    blur: typeof v.blur === "string" ? v.blur : null,
    focal:
      isRecord(v.focal) && typeof v.focal.x === "number" && typeof v.focal.y === "number"
        ? { x: Math.min(100, Math.max(0, v.focal.x)), y: Math.min(100, Math.max(0, v.focal.y)) }
        : undefined,
  };
}

function sanitizeImages(v: unknown, max: number): PageImage[] {
  if (!Array.isArray(v)) return [];
  const out: PageImage[] = [];
  for (const item of v) {
    const img = sanitizeImage(item);
    if (img) out.push(img);
    if (out.length >= max) break;
  }
  return out;
}

function oneOf<T extends string | number>(v: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback;
}

function str(v: unknown, max = 10_000): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

/** Sanitize one raw section; returns null when unrecognisable. */
export function sanitizeSection(raw: unknown): Section | null {
  if (!isRecord(raw)) return null;
  const type = raw.type as SectionType;
  if (!SECTION_TYPES.includes(type)) return null;
  const id = typeof raw.id === "string" && raw.id !== "" ? raw.id : newSectionId();

  switch (type) {
    case "hero":
      return {
        id, type,
        image: sanitizeImage(raw.image),
        title: str(raw.title, 200),
        subtitle: str(raw.subtitle, 500),
        height: oneOf(raw.height, ["full", "half"] as const, "full"),
      };
    case "image":
      return {
        id, type,
        image: sanitizeImage(raw.image),
        width: oneOf(raw.width, ["text", "wide", "full"] as const, "wide"),
      };
    case "split":
      return { id, type, images: sanitizeImages(raw.images, 2) };
    case "row":
      return { id, type, images: sanitizeImages(raw.images, 3) };
    case "grid":
      return {
        id, type,
        images: sanitizeImages(raw.images, 500),
        columns: oneOf(raw.columns, [2, 3, 4] as const, 3),
        gap: oneOf(raw.gap, ["tight", "regular", "loose"] as const, "regular"),
      };
    case "contact-sheet":
      return { id, type, images: sanitizeImages(raw.images, 500), numbered: raw.numbered !== false };
    case "sequence":
      return { id, type, images: sanitizeImages(raw.images, 500) };
    case "text":
      return { id, type, body: str(raw.body), align: oneOf(raw.align, ["left", "center"] as const, "left") };
    case "heading":
      return { id, type, title: str(raw.title, 200), subtitle: str(raw.subtitle, 500), level: oneOf(raw.level, [1, 2] as const, 1) };
    case "quote":
      return { id, type, text: str(raw.text, 1000), attribution: str(raw.attribution, 200) };
    case "spacer":
      return { id, type, size: oneOf(raw.size, ["small", "medium", "large"] as const, "medium"), divider: raw.divider === true };
  }
}

/** Sanitize display settings; returns undefined when everything is default. */
export function sanitizeDisplaySettings(v: unknown): PageDisplaySettings | undefined {
  if (!isRecord(v)) return undefined;
  const settings: PageDisplaySettings = {
    protectPhotos: v.protectPhotos === true,
    maxPhotoRes: oneOf(v.maxPhotoRes, ["full", "md"] as const, "full"),
  };
  const isDefault = !settings.protectPhotos && settings.maxPhotoRes === "full";
  return isDefault ? undefined : settings;
}

/**
 * Parse + migrate an untrusted document (from the DB or a save request) into
 * the current version. Unknown sections are dropped, malformed fields
 * replaced with safe defaults, and duplicate section IDs regenerated.
 * Never throws.
 */
export function parseDocument(raw: unknown): PageDocument {
  if (!isRecord(raw) || !Array.isArray(raw.sections)) return createEmptyDocument();

  // Future schema versions hook in here (version 1 is current).
  const sections: Section[] = [];
  const seen = new Set<string>();
  for (const rawSection of raw.sections) {
    const section = sanitizeSection(rawSection);
    if (!section) continue;
    if (seen.has(section.id)) section.id = newSectionId();
    seen.add(section.id);
    sections.push(section);
  }
  const settings = sanitizeDisplaySettings(raw.settings);
  const tray = sanitizeImages(raw.tray, 500);
  const doc: PageDocument = { version: DOCUMENT_VERSION, sections };
  if (settings) doc.settings = settings;
  if (tray.length > 0) doc.tray = tray;
  return doc;
}

/** All media_assets ids referenced by a document (sections + tray). */
export function collectAssetIds(doc: PageDocument): Set<string> {
  const ids = new Set<string>();
  for (const section of doc.sections) {
    for (const img of sectionImages(section)) {
      if (img.assetId) ids.add(img.assetId);
    }
  }
  for (const img of trayImages(doc)) {
    if (img.assetId) ids.add(img.assetId);
  }
  return ids;
}

/** First image in document order — used as the page cover. */
export function firstImage(doc: PageDocument): PageImage | null {
  for (const section of doc.sections) {
    const imgs = sectionImages(section);
    if (imgs.length > 0) return imgs[0];
  }
  return null;
}

/** Count of images across the document, tray included, so the tray can
 * never become storage beyond the page's image limit (entitlement checks). */
export function countImages(doc: PageDocument): number {
  return doc.sections.reduce((n, s) => n + sectionImages(s).length, 0) + trayImages(doc).length;
}
