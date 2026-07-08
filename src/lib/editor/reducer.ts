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
  withSectionImages,
  type PageDisplaySettings,
  type PageDocument,
  type PageImage,
  type Section,
  type SectionType,
} from "@/lib/page-document";
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
  | { type: "deleteSection"; id: string }
  | { type: "duplicateSection"; id: string }
  | { type: "moveSection"; id: string; toIndex: number }
  | { type: "updateSection"; id: string; patch: Record<string, unknown>; coalesceKey?: string }
  | { type: "convertSection"; id: string; toType: SectionType }
  | { type: "addImages"; sectionId: string; images: PageImage[] }
  | { type: "removeImage"; sectionId: string; imageId: string }
  | { type: "moveImage"; sectionId: string; imageId: string; direction: -1 | 1 }
  | { type: "updateImage"; sectionId: string; imageId: string; patch: Partial<PageImage>; coalesceKey?: string }
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
