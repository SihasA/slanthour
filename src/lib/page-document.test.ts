import { describe, expect, it } from "vitest";
import {
  collectAssetIds,
  countImages,
  createEmptyDocument,
  createSection,
  firstImage,
  parseDocument,
  sanitizeSection,
  sectionImages,
  withSectionImages,
  type PageImage,
  type Section,
  type SectionType,
} from "./page-document";

const img = (overrides: Partial<PageImage> = {}): PageImage => ({
  id: crypto.randomUUID(),
  assetId: crypto.randomUUID(),
  path: "user/m/abc/lg.jpg",
  width: 2000,
  height: 1333,
  alt: "",
  caption: "",
  blur: null,
  ...overrides,
});

const ALL_TYPES: SectionType[] = [
  "hero", "image", "split", "row", "grid", "contact-sheet",
  "sequence", "text", "heading", "quote", "spacer",
];

describe("createSection", () => {
  it("creates every section type with a unique id", () => {
    const ids = new Set<string>();
    for (const type of ALL_TYPES) {
      const section = createSection(type);
      expect(section.type).toBe(type);
      expect(section.id).toBeTruthy();
      ids.add(section.id);
    }
    expect(ids.size).toBe(ALL_TYPES.length);
  });
});

describe("parseDocument", () => {
  it("returns an empty document for junk input", () => {
    for (const junk of [null, undefined, 42, "x", [], { sections: "nope" }]) {
      const doc = parseDocument(junk);
      expect(doc.version).toBe(1);
      expect(doc.sections).toEqual([]);
    }
  });

  it("round-trips a valid document unchanged in shape", () => {
    const doc = createEmptyDocument();
    doc.sections.push(createSection("hero"), createSection("grid"), createSection("text"));
    const parsed = parseDocument(JSON.parse(JSON.stringify(doc)));
    expect(parsed.sections.map((s) => s.type)).toEqual(["hero", "grid", "text"]);
    expect(parsed.sections.map((s) => s.id)).toEqual(doc.sections.map((s) => s.id));
  });

  it("drops unknown section types instead of throwing", () => {
    const doc = parseDocument({
      version: 1,
      sections: [{ id: "a", type: "hologram" }, createSection("text")],
    });
    expect(doc.sections).toHaveLength(1);
    expect(doc.sections[0].type).toBe("text");
  });

  it("regenerates duplicate section ids", () => {
    const a = { ...createSection("text"), id: "dup" };
    const b = { ...createSection("quote"), id: "dup" };
    const doc = parseDocument({ version: 1, sections: [a, b] });
    expect(doc.sections[0].id).toBe("dup");
    expect(doc.sections[1].id).not.toBe("dup");
  });

  it("clamps malformed enum fields to safe defaults", () => {
    const doc = parseDocument({
      version: 1,
      sections: [
        { id: "g", type: "grid", images: [], columns: 17, gap: "cosmic" },
        { id: "i", type: "image", image: null, width: "yuge" },
      ],
    });
    const grid = doc.sections[0];
    if (grid.type !== "grid") throw new Error("expected grid");
    expect(grid.columns).toBe(3);
    expect(grid.gap).toBe("regular");
    const image = doc.sections[1];
    if (image.type !== "image") throw new Error("expected image");
    expect(image.width).toBe("wide");
  });

  it("drops images without a path and clamps focal point", () => {
    const doc = parseDocument({
      version: 1,
      sections: [
        {
          id: "s",
          type: "sequence",
          images: [
            { id: "1", path: "" },
            { ...img(), focal: { x: 250, y: -10 } },
          ],
        },
      ],
    });
    const seq = doc.sections[0];
    if (seq.type !== "sequence") throw new Error("expected sequence");
    expect(seq.images).toHaveLength(1);
    expect(seq.images[0].focal).toEqual({ x: 100, y: 0 });
  });

  it("enforces per-type image capacity (split=2, row=3)", () => {
    const four = [img(), img(), img(), img()];
    const doc = parseDocument({
      version: 1,
      sections: [
        { id: "sp", type: "split", images: four },
        { id: "ro", type: "row", images: four },
      ],
    });
    expect(sectionImages(doc.sections[0])).toHaveLength(2);
    expect(sectionImages(doc.sections[1])).toHaveLength(3);
  });
});

describe("sanitizeSection", () => {
  it("preserves text content within limits", () => {
    const section = sanitizeSection({ id: "t", type: "quote", text: "hello", attribution: "me" });
    expect(section).toMatchObject({ type: "quote", text: "hello", attribution: "me" });
  });

  it("truncates oversized text", () => {
    const section = sanitizeSection({ id: "t", type: "quote", text: "x".repeat(5000), attribution: "" });
    if (section?.type !== "quote") throw new Error("expected quote");
    expect(section.text).toHaveLength(1000);
  });
});

describe("withSectionImages", () => {
  it("sets single-image sections from the first image", () => {
    const hero = createSection("hero");
    const updated = withSectionImages(hero, [img({ path: "a.jpg" }), img({ path: "b.jpg" })]);
    if (updated.type !== "hero") throw new Error("expected hero");
    expect(updated.image?.path).toBe("a.jpg");
  });

  it("leaves non-image sections untouched", () => {
    const text = createSection("text");
    expect(withSectionImages(text, [img()])).toBe(text);
  });
});

describe("document queries", () => {
  const build = (): Section[] => [
    createSection("heading"),
    withSectionImages(createSection("hero"), [img({ assetId: "asset-1", path: "h.jpg" })]),
    withSectionImages(createSection("grid"), [
      img({ assetId: "asset-2" }),
      img({ assetId: null }),
      img({ assetId: "asset-2" }),
    ]),
  ];

  it("collectAssetIds dedupes and skips null assetIds", () => {
    const ids = collectAssetIds({ version: 1, sections: build() });
    expect(ids).toEqual(new Set(["asset-1", "asset-2"]));
  });

  it("firstImage returns first image in document order", () => {
    expect(firstImage({ version: 1, sections: build() })?.path).toBe("h.jpg");
    expect(firstImage(createEmptyDocument())).toBeNull();
  });

  it("countImages counts across all sections", () => {
    expect(countImages({ version: 1, sections: build() })).toBe(4);
  });
});
