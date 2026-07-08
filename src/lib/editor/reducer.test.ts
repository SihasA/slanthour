import { describe, expect, it } from "vitest";
import {
  canRedo,
  canUndo,
  editorReducer,
  initialEditorState,
  type EditorContent,
  type EditorState,
} from "./reducer";
import { createEmptyDocument, sectionImages, type PageImage } from "@/lib/page-document";
import { defaultThemeSettings } from "@/themes/registry";

const img = (path = "u/m/a/lg.jpg"): PageImage => ({
  id: crypto.randomUUID(),
  assetId: crypto.randomUUID(),
  path,
  width: 2000,
  height: 1333,
  alt: "",
  caption: "",
  blur: null,
});

function freshState(): EditorState {
  const content: EditorContent = {
    document: createEmptyDocument(),
    title: "Test page",
    theme: "monograph",
    themeSettings: defaultThemeSettings("monograph"),
  };
  return initialEditorState(content);
}

describe("section operations", () => {
  it("adds a section and selects it", () => {
    const state = editorReducer(freshState(), { type: "addSection", sectionType: "text" });
    expect(state.content.document.sections).toHaveLength(1);
    expect(state.content.document.sections[0].type).toBe("text");
    expect(state.selectedSectionId).toBe(state.content.document.sections[0].id);
  });

  it("inserts after a given section", () => {
    let state = editorReducer(freshState(), { type: "addSection", sectionType: "text" });
    const firstId = state.content.document.sections[0].id;
    state = editorReducer(state, { type: "addSection", sectionType: "quote" });
    state = editorReducer(state, { type: "addSection", sectionType: "grid", afterId: firstId });
    expect(state.content.document.sections.map((s) => s.type)).toEqual(["text", "grid", "quote"]);
  });

  it("deletes and reselects a neighbour", () => {
    let state = editorReducer(freshState(), { type: "addSection", sectionType: "text" });
    state = editorReducer(state, { type: "addSection", sectionType: "quote" });
    const quoteId = state.content.document.sections[1].id;
    state = editorReducer(state, { type: "deleteSection", id: quoteId });
    expect(state.content.document.sections).toHaveLength(1);
    expect(state.selectedSectionId).toBe(state.content.document.sections[0].id);
  });

  it("duplicates with fresh section and image ids", () => {
    let state = editorReducer(freshState(), { type: "addSection", sectionType: "grid" });
    const gridId = state.content.document.sections[0].id;
    const image = img();
    state = editorReducer(state, { type: "addImages", sectionId: gridId, images: [image] });
    state = editorReducer(state, { type: "duplicateSection", id: gridId });
    const [original, copy] = state.content.document.sections;
    expect(copy.type).toBe("grid");
    expect(copy.id).not.toBe(original.id);
    expect(sectionImages(copy)[0].id).not.toBe(sectionImages(original)[0].id);
    expect(sectionImages(copy)[0].assetId).toBe(image.assetId); // shared asset
  });

  it("reorders sections with clamped indices", () => {
    let state = freshState();
    for (const t of ["text", "quote", "grid"] as const)
      state = editorReducer(state, { type: "addSection", sectionType: t });
    const [a] = state.content.document.sections;
    state = editorReducer(state, { type: "moveSection", id: a.id, toIndex: 99 });
    expect(state.content.document.sections[2].id).toBe(a.id);
  });
});

describe("image operations", () => {
  function withGrid() {
    let state = editorReducer(freshState(), { type: "addSection", sectionType: "grid" });
    const id = state.content.document.sections[0].id;
    const images = [img("a"), img("b"), img("c")];
    state = editorReducer(state, { type: "addImages", sectionId: id, images });
    return { state, id, images };
  }

  it("adds, removes and reorders images", () => {
    const { state, id, images } = withGrid();
    let next = editorReducer(state, { type: "moveImage", sectionId: id, imageId: images[2].id, direction: -1 });
    expect(sectionImages(next.content.document.sections[0]).map((i) => i.path)).toEqual(["a", "c", "b"]);
    next = editorReducer(next, { type: "removeImage", sectionId: id, imageId: images[0].id });
    expect(sectionImages(next.content.document.sections[0])).toHaveLength(2);
  });

  it("respects capacity when adding to a split section", () => {
    let state = editorReducer(freshState(), { type: "addSection", sectionType: "split" });
    const id = state.content.document.sections[0].id;
    state = editorReducer(state, { type: "addImages", sectionId: id, images: [img("a"), img("b"), img("c")] });
    expect(sectionImages(state.content.document.sections[0])).toHaveLength(2);
  });

  it("updates captions without touching ids", () => {
    const { state, id, images } = withGrid();
    const next = editorReducer(state, {
      type: "updateImage",
      sectionId: id,
      imageId: images[1].id,
      patch: { caption: "Dusk", id: "malicious-override" as string },
    });
    const updated = sectionImages(next.content.document.sections[0])[1];
    expect(updated.caption).toBe("Dusk");
    expect(updated.id).toBe(images[1].id);
  });
});

describe("undo / redo", () => {
  it("round-trips through undo and redo", () => {
    let state = editorReducer(freshState(), { type: "addSection", sectionType: "text" });
    state = editorReducer(state, { type: "addSection", sectionType: "quote" });
    expect(canUndo(state)).toBe(true);

    state = editorReducer(state, { type: "undo" });
    expect(state.content.document.sections).toHaveLength(1);
    expect(canRedo(state)).toBe(true);

    state = editorReducer(state, { type: "redo" });
    expect(state.content.document.sections).toHaveLength(2);
  });

  it("a new edit clears the redo stack", () => {
    let state = editorReducer(freshState(), { type: "addSection", sectionType: "text" });
    state = editorReducer(state, { type: "addSection", sectionType: "quote" });
    state = editorReducer(state, { type: "undo" });
    state = editorReducer(state, { type: "addSection", sectionType: "grid" });
    expect(canRedo(state)).toBe(false);
  });

  it("coalesces rapid text edits into one history entry", () => {
    let state = editorReducer(freshState(), { type: "addSection", sectionType: "text" });
    const id = state.content.document.sections[0].id;
    const key = `updateSection:${id}:body`;
    state = editorReducer(state, { type: "updateSection", id, patch: { body: "H" }, coalesceKey: key });
    state = editorReducer(state, { type: "updateSection", id, patch: { body: "He" }, coalesceKey: key });
    state = editorReducer(state, { type: "updateSection", id, patch: { body: "Hello" }, coalesceKey: key });

    state = editorReducer(state, { type: "undo" });
    const section = state.content.document.sections[0];
    if (section.type !== "text") throw new Error("expected text");
    expect(section.body).toBe(""); // one undo reverts the whole typing burst
  });

  it("does not coalesce across different fields", () => {
    let state = editorReducer(freshState(), { type: "addSection", sectionType: "heading" });
    const id = state.content.document.sections[0].id;
    state = editorReducer(state, { type: "updateSection", id, patch: { title: "A" }, coalesceKey: `t:${id}` });
    state = editorReducer(state, { type: "updateSection", id, patch: { subtitle: "B" }, coalesceKey: `s:${id}` });
    state = editorReducer(state, { type: "undo" });
    const section = state.content.document.sections[0];
    if (section.type !== "heading") throw new Error("expected heading");
    expect(section.title).toBe("A");
    expect(section.subtitle).toBe("");
  });

  it("caps history at the limit", () => {
    let state = editorReducer(freshState(), { type: "addSection", sectionType: "text" });
    const id = state.content.document.sections[0].id;
    for (let i = 0; i < 80; i++) {
      state = editorReducer(state, { type: "updateSection", id, patch: { body: `v${i}` } });
    }
    expect(state.past.length).toBeLessThanOrEqual(50);
  });
});

describe("section conversion", () => {
  it("converts between collection types keeping images and id", () => {
    let state = editorReducer(freshState(), { type: "addSection", sectionType: "grid" });
    const id = state.content.document.sections[0].id;
    const images = [img("a"), img("b")];
    state = editorReducer(state, { type: "addImages", sectionId: id, images });

    state = editorReducer(state, { type: "convertSection", id, toType: "sequence" });
    const converted = state.content.document.sections[0];
    expect(converted.type).toBe("sequence");
    expect(converted.id).toBe(id);
    expect(sectionImages(converted).map((i) => i.path)).toEqual(["a", "b"]);
  });

  it("clamps images when converting into a smaller capacity", () => {
    let state = editorReducer(freshState(), { type: "addSection", sectionType: "grid" });
    const id = state.content.document.sections[0].id;
    state = editorReducer(state, { type: "addImages", sectionId: id, images: [img("a"), img("b"), img("c")] });
    state = editorReducer(state, { type: "convertSection", id, toType: "split" });
    expect(sectionImages(state.content.document.sections[0])).toHaveLength(2);
  });

  it("updateSection cannot smuggle a type change", () => {
    let state = editorReducer(freshState(), { type: "addSection", sectionType: "text" });
    const id = state.content.document.sections[0].id;
    state = editorReducer(state, { type: "updateSection", id, patch: { type: "grid", body: "hi" } });
    expect(state.content.document.sections[0].type).toBe("text");
  });
});

describe("theme switching", () => {
  it("changes theme without altering the document", () => {
    let state = editorReducer(freshState(), { type: "addSection", sectionType: "grid" });
    const id = state.content.document.sections[0].id;
    state = editorReducer(state, { type: "addImages", sectionId: id, images: [img()] });
    const before = state.content.document;

    state = editorReducer(state, { type: "setTheme", theme: "keepsake" });
    expect(state.content.theme).toBe("keepsake");
    expect(state.content.document).toEqual(before);
    expect(state.content.themeSettings.paper).toBe("cream");

    state = editorReducer(state, { type: "undo" });
    expect(state.content.theme).toBe("monograph");
    expect(state.content.document).toEqual(before);
  });

  it("updates a single theme setting with sanitisation", () => {
    let state = freshState();
    state = editorReducer(state, { type: "updateThemeSettings", key: "paper", value: "dark" });
    expect(state.content.themeSettings.paper).toBe("dark");
    state = editorReducer(state, { type: "updateThemeSettings", key: "paper", value: "plaid" });
    expect(state.content.themeSettings.paper).toBe("light"); // invalid → default
  });
});

describe("display settings", () => {
  it("sets, patches and collapses back to absent", () => {
    let state = freshState();
    state = editorReducer(state, { type: "setDisplaySettings", patch: { protectPhotos: true } });
    expect(state.content.document.settings).toEqual({ protectPhotos: true, maxPhotoRes: "full" });

    state = editorReducer(state, { type: "setDisplaySettings", patch: { maxPhotoRes: "md" } });
    expect(state.content.document.settings).toEqual({ protectPhotos: true, maxPhotoRes: "md" });

    state = editorReducer(state, {
      type: "setDisplaySettings",
      patch: { protectPhotos: false, maxPhotoRes: "full" },
    });
    expect(state.content.document.settings).toBeUndefined();
  });

  it("participates in undo", () => {
    let state = freshState();
    state = editorReducer(state, { type: "setDisplaySettings", patch: { protectPhotos: true } });
    state = editorReducer(state, { type: "undo" });
    expect(state.content.document.settings).toBeUndefined();
  });
});

describe("tray and cross-section moves", () => {
  function stateWithHeroAndGrid() {
    let state = freshState();
    state = editorReducer(state, { type: "addSection", sectionType: "hero" });
    state = editorReducer(state, { type: "addSection", sectionType: "grid" });
    return state;
  }
  const trayImgs = (state: EditorState) => state.content.document.tray ?? [];

  it("adds to the tray and moves tray photos into sections, capacity-aware", () => {
    let state = stateWithHeroAndGrid();
    const [hero] = state.content.document.sections;
    const a = img("u/m/a/lg.jpg");
    const b = img("u/m/b/lg.jpg");
    state = editorReducer(state, { type: "addToTray", images: [a, b] });
    expect(trayImgs(state)).toHaveLength(2);

    state = editorReducer(state, { type: "trayToSection", imageId: a.id, sectionId: hero.id });
    expect(trayImgs(state)).toHaveLength(1);
    expect(sectionImages(state.content.document.sections[0])).toHaveLength(1);

    // Hero is now full: the second move is a no-op.
    const before = state;
    state = editorReducer(state, { type: "trayToSection", imageId: b.id, sectionId: hero.id });
    expect(state).toBe(before);
  });

  it("returns a section image to the tray", () => {
    let state = stateWithHeroAndGrid();
    const [hero] = state.content.document.sections;
    const a = img();
    state = editorReducer(state, { type: "addImages", sectionId: hero.id, images: [a] });
    state = editorReducer(state, { type: "sectionToTray", sectionId: hero.id, imageId: a.id });
    expect(sectionImages(state.content.document.sections[0])).toHaveLength(0);
    expect(trayImgs(state).map((i) => i.id)).toEqual([a.id]);
  });

  it("moves an image directly between sections, capacity-aware", () => {
    let state = stateWithHeroAndGrid();
    const [hero, grid] = state.content.document.sections;
    const a = img();
    const b = img("u/m/b/lg.jpg");
    state = editorReducer(state, { type: "addImages", sectionId: grid.id, images: [a, b] });
    state = editorReducer(state, {
      type: "moveImageToSection", fromSectionId: grid.id, imageId: a.id, toSectionId: hero.id,
    });
    expect(sectionImages(state.content.document.sections[0]).map((i) => i.id)).toEqual([a.id]);
    expect(sectionImages(state.content.document.sections[1]).map((i) => i.id)).toEqual([b.id]);

    // Hero full: moving b too is a no-op.
    const before = state;
    state = editorReducer(state, {
      type: "moveImageToSection", fromSectionId: grid.id, imageId: b.id, toSectionId: hero.id,
    });
    expect(state).toBe(before);
  });

  it("reorders the tray", () => {
    let state = freshState();
    const a = img();
    const b = img("u/m/b/lg.jpg");
    state = editorReducer(state, { type: "addToTray", images: [a, b] });
    state = editorReducer(state, { type: "reorderTray", imageId: b.id, toIndex: 0 });
    expect(trayImgs(state).map((i) => i.id)).toEqual([b.id, a.id]);
  });

  it("fills sections top to bottom in one undo step", () => {
    let state = freshState();
    state = editorReducer(state, { type: "addSection", sectionType: "hero" });
    state = editorReducer(state, { type: "addSection", sectionType: "split" });
    state = editorReducer(state, { type: "addSection", sectionType: "grid" });
    const photos = Array.from({ length: 6 }, (_, i) => img(`u/m/p${i}/lg.jpg`));
    state = editorReducer(state, { type: "addToTray", images: photos });
    state = editorReducer(state, { type: "fillFromTray" });

    const [hero, split, grid] = state.content.document.sections;
    expect(sectionImages(hero)).toHaveLength(1);
    expect(sectionImages(split)).toHaveLength(2);
    expect(sectionImages(grid)).toHaveLength(3); // open-ended: takes the rest
    expect(trayImgs(state)).toHaveLength(0);
    expect(state.content.document.tray).toBeUndefined();

    state = editorReducer(state, { type: "undo" });
    expect(trayImgs(state)).toHaveLength(6);
    expect(sectionImages(state.content.document.sections[0])).toHaveLength(0);
  });
});

describe("applyTemplate", () => {
  it("appends the whole skeleton as one undo step and selects its first section", () => {
    let state = editorReducer(freshState(), { type: "applyTemplate", templateId: "portfolio" });
    const sections = state.content.document.sections;
    expect(sections.map((s) => s.type)).toEqual(["hero", "heading", "row", "split", "grid"]);
    expect(state.selectedSectionId).toBe(sections[0].id);
    expect(canUndo(state)).toBe(true);

    state = editorReducer(state, { type: "undo" });
    expect(state.content.document.sections).toHaveLength(0);
  });

  it("appends below existing sections instead of replacing them", () => {
    let state = editorReducer(freshState(), { type: "addSection", sectionType: "text" });
    state = editorReducer(state, { type: "applyTemplate", templateId: "one-series" });
    expect(state.content.document.sections.map((s) => s.type)).toEqual([
      "text", "hero", "text", "sequence",
    ]);
  });

  it("then fills from the tray straight into the template", () => {
    let state = editorReducer(freshState(), { type: "applyTemplate", templateId: "one-series" });
    const photos = Array.from({ length: 4 }, (_, i) => img(`u/m/t${i}/lg.jpg`));
    state = editorReducer(state, { type: "addToTray", images: photos });
    state = editorReducer(state, { type: "fillFromTray" });
    const [hero, , sequence] = state.content.document.sections;
    expect(sectionImages(hero)).toHaveLength(1);
    expect(sectionImages(sequence)).toHaveLength(3);
    expect(state.content.document.tray).toBeUndefined();
  });
});
