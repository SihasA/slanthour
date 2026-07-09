// ─── Editor state reducer ────────────────────────────────────────────
// Pure and fully unit-testable. One source of truth for the page being
// edited: the content (document + title + theme + settings) plus undo/redo
// stacks. Rapid text edits coalesce into a single history entry so undo
// steps feel intentional rather than per-keystroke.

import {
  createSection,
  displaySettings,
  newSectionId,
  sanitizeDisplaySettings,
  sectionImageCapacity,
  sectionImages,
  trayImages,
  withSectionImages,
  type PageDisplaySettings,
  type PageDocument,
  type PageImage,
  type Section,
  type SectionType,
} from "@/lib/page-document";
import { getTemplate, type TemplateId } from "@/lib/page-templates";
import type { ThemeSettings } from "@/themes/types";
import { defaultThemeSettings, sanitizeThemeSettings } from "@/themes/registry";
import type { ThemeId } from "@/types";

export interface EditorContent {
  document: PageDocument;
  title: string;
  theme: ThemeId;
  themeSettings: ThemeSettings;
}

export interface EditorState {
  content: EditorContent;
  past: EditorContent[];
  future: EditorContent[];
  selectedSectionId: string | null;
  /** Monotonic counter bumped on every content change — drives autosave. */
  changeCount: number;
  /** Coalescing key of the last edit (text fields), or null. */
  lastEditKey: string | null;
}

const HISTORY_LIMIT = 50;

export type EditorAction =
  | { type: "addSection"; sectionType: SectionType; afterId?: string | null }
  | { type: "applyTemplate"; templateId: TemplateId }
  | { type: "deleteSection"; id: string }
  | { type: "duplicateSection"; id: string }
  | { type: "moveSection"; id: string; toIndex: number }
  | { type: "updateSection"; id: string; patch: Record<string, unknown>; coalesceKey?: string }
  | { type: "convertSection"; id: string; toType: SectionType }
  | { type: "addImages"; sectionId: string; images: PageImage[] }
  | { type: "removeImage"; sectionId: string; imageId: string }
  | { type: "moveImage"; sectionId: string; imageId: string; direction: -1 | 1 }
  | { type: "updateImage"; sectionId: string; imageId: string; patch: Partial<PageImage>; coalesceKey?: string }
  | { type: "addToTray"; images: PageImage[] }
  | { type: "removeFromTray"; imageId: string }
  | { type: "reorderTray"; imageId: string; toIndex: number }
  | { type: "trayToSection"; imageId: string; sectionId: string }
  | { type: "sectionToTray"; sectionId: string; imageId: string }
  | { type: "moveImageToSection"; fromSectionId: string; imageId: string; toSectionId: string }
  | { type: "fillFromTray" }
  | { type: "setTitle"; title: string; coalesceKey?: string }
  | { type: "setDisplaySettings"; patch: Partial<PageDisplaySettings> }
  | { type: "setTheme"; theme: ThemeId }
  | { type: "updateThemeSettings"; key: string; value: string | boolean }
  | { type: "selectSection"; id: string | null }
  | { type: "undo" }
  | { type: "redo" };

export function initialEditorState(content: EditorContent, selected?: string | null): EditorState {
  return {
    content,
    past: [],
    future: [],
    selectedSectionId: selected ?? content.document.sections[0]?.id ?? null,
    changeCount: 0,
    lastEditKey: null,
  };
}

function commit(
  state: EditorState,
  content: EditorContent,
  options: { coalesceKey?: string; select?: string | null } = {}
): EditorState {
  const coalesce =
    options.coalesceKey !== undefined && options.coalesceKey === state.lastEditKey;
  const past = coalesce
    ? state.past
    : [...state.past.slice(-(HISTORY_LIMIT - 1)), state.content];
  return {
    content,
    past,
    future: [],
    selectedSectionId: options.select !== undefined ? options.select : state.selectedSectionId,
    changeCount: state.changeCount + 1,
    lastEditKey: options.coalesceKey ?? null,
  };
}

function mapSection(
  document: PageDocument,
  id: string,
  fn: (section: Section) => Section
): PageDocument {
  return {
    ...document,
    sections: document.sections.map((s) => (s.id === id ? fn(s) : s)),
  };
}

/** Replace the tray, dropping the key when empty so untouched documents
 * stay byte-identical with their pre-tray shape. */
function withTray(document: PageDocument, tray: PageImage[]): PageDocument {
  if (tray.length === 0) {
    const { tray: _dropped, ...rest } = document;
    return rest;
  }
  return { ...document, tray };
}

/** Free image slots in a section (0 for non-image sections). */
function sectionFreeCapacity(section: Section): number {
  const capacity = sectionImageCapacity(section.type);
  if (capacity === 0) return 0;
  if (capacity === Infinity) return Infinity;
  return Math.max(0, capacity - sectionImages(section).length);
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  const { content } = state;
  const doc = content.document;

  switch (action.type) {
    case "addSection": {
      const section = createSection(action.sectionType);
      const index =
        action.afterId != null
          ? doc.sections.findIndex((s) => s.id === action.afterId) + 1
          : doc.sections.length;
      const sections = [...doc.sections];
      sections.splice(index === 0 ? doc.sections.length : index, 0, section);
      return commit(state, { ...content, document: { ...doc, sections } }, { select: section.id });
    }

    case "applyTemplate": {
      // A template appends its whole skeleton as ONE history entry, so a
      // single undo removes it again. Appending (not replacing) keeps the
      // action safe even if sections already exist.
      const added = getTemplate(action.templateId).build();
      const sections = [...doc.sections, ...added];
      return commit(state, { ...content, document: { ...doc, sections } }, { select: added[0]?.id ?? null });
    }

    case "deleteSection": {
      const sections = doc.sections.filter((s) => s.id !== action.id);
      if (sections.length === doc.sections.length) return state;
      const removedIndex = doc.sections.findIndex((s) => s.id === action.id);
      const nextSelected =
        state.selectedSectionId === action.id
          ? (sections[Math.min(removedIndex, sections.length - 1)]?.id ?? null)
          : state.selectedSectionId;
      return commit(state, { ...content, document: { ...doc, sections } }, { select: nextSelected });
    }

    case "duplicateSection": {
      const index = doc.sections.findIndex((s) => s.id === action.id);
      if (index === -1) return state;
      const source = doc.sections[index];
      const clone = { ...source, id: newSectionId() };
      const cloned = withSectionImages(
        clone,
        sectionImages(clone).map((img) => ({ ...img, id: newSectionId() }))
      );
      const sections = [...doc.sections];
      sections.splice(index + 1, 0, cloned);
      return commit(state, { ...content, document: { ...doc, sections } }, { select: cloned.id });
    }

    case "moveSection": {
      const from = doc.sections.findIndex((s) => s.id === action.id);
      if (from === -1) return state;
      const to = Math.max(0, Math.min(doc.sections.length - 1, action.toIndex));
      if (from === to) return state;
      const sections = [...doc.sections];
      const [moved] = sections.splice(from, 1);
      sections.splice(to, 0, moved);
      return commit(state, { ...content, document: { ...doc, sections } });
    }

    case "updateSection": {
      const target = doc.sections.find((s) => s.id === action.id);
      if (!target) return state;
      // The patch is merged then narrowed by the section's own type — fields
      // that don't belong to the type are ignored at render/serialisation.
      const document = mapSection(doc, action.id, (s) => ({ ...s, ...action.patch, id: s.id, type: s.type }) as Section);
      return commit(state, { ...content, document }, { coalesceKey: action.coalesceKey });
    }

    case "convertSection": {
      const target = doc.sections.find((s) => s.id === action.id);
      if (!target || target.type === action.toType) return state;
      // Build a fresh section of the target type, keep the stable id, and
      // carry the images across (capacity-clamped by withSectionImages).
      const fresh = { ...createSection(action.toType), id: target.id };
      const converted = withSectionImages(fresh, sectionImages(target));
      const document = mapSection(doc, action.id, () => converted);
      return commit(state, { ...content, document });
    }

    case "addImages": {
      const target = doc.sections.find((s) => s.id === action.sectionId);
      if (!target || action.images.length === 0) return state;
      const capacity = sectionImageCapacity(target.type);
      if (capacity === 0) return state;
      const merged = [...sectionImages(target), ...action.images];
      const document = mapSection(doc, action.sectionId, (s) => withSectionImages(s, merged));
      return commit(state, { ...content, document });
    }

    case "removeImage": {
      const target = doc.sections.find((s) => s.id === action.sectionId);
      if (!target) return state;
      const images = sectionImages(target).filter((img) => img.id !== action.imageId);
      if (images.length === sectionImages(target).length) return state;
      const document = mapSection(doc, action.sectionId, (s) => withSectionImages(s, images));
      return commit(state, { ...content, document });
    }

    case "moveImage": {
      const target = doc.sections.find((s) => s.id === action.sectionId);
      if (!target) return state;
      const images = [...sectionImages(target)];
      const from = images.findIndex((img) => img.id === action.imageId);
      const to = from + action.direction;
      if (from === -1 || to < 0 || to >= images.length) return state;
      [images[from], images[to]] = [images[to], images[from]];
      const document = mapSection(doc, action.sectionId, (s) => withSectionImages(s, images));
      return commit(state, { ...content, document });
    }

    case "updateImage": {
      const target = doc.sections.find((s) => s.id === action.sectionId);
      if (!target) return state;
      const images = sectionImages(target).map((img) =>
        img.id === action.imageId ? { ...img, ...action.patch, id: img.id } : img
      );
      const document = mapSection(doc, action.sectionId, (s) => withSectionImages(s, images));
      return commit(state, { ...content, document }, { coalesceKey: action.coalesceKey });
    }

    case "addToTray": {
      if (action.images.length === 0) return state;
      const document = withTray(doc, [...trayImages(doc), ...action.images]);
      return commit(state, { ...content, document });
    }

    case "removeFromTray": {
      const tray = trayImages(doc).filter((img) => img.id !== action.imageId);
      if (tray.length === trayImages(doc).length) return state;
      return commit(state, { ...content, document: withTray(doc, tray) });
    }

    case "reorderTray": {
      const tray = [...trayImages(doc)];
      const from = tray.findIndex((img) => img.id === action.imageId);
      if (from === -1) return state;
      const to = Math.max(0, Math.min(tray.length - 1, action.toIndex));
      if (from === to) return state;
      const [moved] = tray.splice(from, 1);
      tray.splice(to, 0, moved);
      return commit(state, { ...content, document: withTray(doc, tray) });
    }

    case "trayToSection": {
      const image = trayImages(doc).find((img) => img.id === action.imageId);
      const target = doc.sections.find((s) => s.id === action.sectionId);
      if (!image || !target || sectionFreeCapacity(target) < 1) return state;
      const tray = trayImages(doc).filter((img) => img.id !== action.imageId);
      const document = withTray(
        mapSection(doc, action.sectionId, (s) => withSectionImages(s, [...sectionImages(s), image])),
        tray
      );
      return commit(state, { ...content, document }, { select: action.sectionId });
    }

    case "sectionToTray": {
      const target = doc.sections.find((s) => s.id === action.sectionId);
      if (!target) return state;
      const image = sectionImages(target).find((img) => img.id === action.imageId);
      if (!image) return state;
      const remaining = sectionImages(target).filter((img) => img.id !== action.imageId);
      const document = withTray(
        mapSection(doc, action.sectionId, (s) => withSectionImages(s, remaining)),
        [...trayImages(doc), image]
      );
      return commit(state, { ...content, document });
    }

    case "moveImageToSection": {
      if (action.fromSectionId === action.toSectionId) return state;
      const from = doc.sections.find((s) => s.id === action.fromSectionId);
      const to = doc.sections.find((s) => s.id === action.toSectionId);
      if (!from || !to || sectionFreeCapacity(to) < 1) return state;
      const image = sectionImages(from).find((img) => img.id === action.imageId);
      if (!image) return state;
      let document = mapSection(doc, action.fromSectionId, (s) =>
        withSectionImages(s, sectionImages(s).filter((img) => img.id !== action.imageId))
      );
      document = mapSection(document, action.toSectionId, (s) =>
        withSectionImages(s, [...sectionImages(s), image])
      );
      return commit(state, { ...content, document }, { select: action.toSectionId });
    }

    case "fillFromTray": {
      // One-shot flow: tray photos pour into sections top to bottom, each
      // section taking up to its free capacity. Open-ended sections (grid,
      // sheet, sequence) take everything left, so order matters and the
      // whole fill is a single undo step. Never a live binding: captions
      // and crops belong to placements, and reflows must not surprise.
      const tray = [...trayImages(doc)];
      if (tray.length === 0) return state;
      const sections = doc.sections.map((section) => {
        if (tray.length === 0) return section;
        const free = sectionFreeCapacity(section);
        if (free < 1) return section;
        const taken = tray.splice(0, free === Infinity ? tray.length : free);
        return withSectionImages(section, [...sectionImages(section), ...taken]);
      });
      if (tray.length === trayImages(doc).length) return state;
      const document = withTray({ ...doc, sections }, tray);
      return commit(state, { ...content, document });
    }

    case "setTitle":
      return commit(state, { ...content, title: action.title }, { coalesceKey: action.coalesceKey });

    case "setDisplaySettings": {
      // Normalize through the sanitizer so defaults collapse back to an
      // absent settings key, keeping untouched documents byte-identical.
      const settings = sanitizeDisplaySettings({ ...displaySettings(doc), ...action.patch });
      const document: PageDocument = settings
        ? { ...doc, settings }
        : (({ settings: _dropped, ...rest }) => rest)(doc);
      return commit(state, { ...content, document });
    }

    case "setTheme": {
      if (action.theme === content.theme) return state;
      // Re-derive settings under the new theme's schema: shared keys are
      // ignored safely, defaults fill the rest. Content is untouched.
      const themeSettings = sanitizeThemeSettings(action.theme, {
        ...defaultThemeSettings(action.theme),
      });
      return commit(state, { ...content, theme: action.theme, themeSettings });
    }

    case "updateThemeSettings": {
      const themeSettings = sanitizeThemeSettings(content.theme, {
        ...content.themeSettings,
        [action.key]: action.value,
      });
      return commit(state, { ...content, themeSettings });
    }

    case "selectSection":
      return { ...state, selectedSectionId: action.id, lastEditKey: null };

    case "undo": {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        content: previous,
        past: state.past.slice(0, -1),
        future: [state.content, ...state.future],
        selectedSectionId: state.selectedSectionId,
        changeCount: state.changeCount + 1,
        lastEditKey: null,
      };
    }

    case "redo": {
      if (state.future.length === 0) return state;
      const [next, ...rest] = state.future;
      return {
        content: next,
        past: [...state.past, state.content],
        future: rest,
        selectedSectionId: state.selectedSectionId,
        changeCount: state.changeCount + 1,
        lastEditKey: null,
      };
    }
  }
}

export const canUndo = (state: EditorState) => state.past.length > 0;
export const canRedo = (state: EditorState) => state.future.length > 0;
