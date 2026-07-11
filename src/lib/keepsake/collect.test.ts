import { describe, expect, it } from "vitest";
import { createEmptyDocument, createSection, withSectionImages, type PageDocument, type PageImage } from "@/lib/page-document";
import { collectArchiveImages } from "./collect";

const img = (overrides: Partial<PageImage> = {}): PageImage => ({
  id: crypto.randomUUID(),
  assetId: crypto.randomUUID(),
  path: "user/m/abc/lg.jpg",
  hasVariants: true,
  width: 2000,
  height: 1333,
  alt: "",
  caption: "",
  blur: null,
  ...overrides,
});

function docWithSections(build: (doc: PageDocument) => void): PageDocument {
  const doc = createEmptyDocument();
  build(doc);
  return doc;
}

describe("collectArchiveImages", () => {
  it("collects the hero's single image", () => {
    const hero = withSectionImages(createSection("hero"), [img({ assetId: "a1" })]);
    // hero uses `image`, not `images` — withSectionImages sets it via sectionImageCapacity
    const doc = docWithSections((d) => d.sections.push(hero));
    const entries = collectArchiveImages(doc);
    expect(entries).toHaveLength(1);
    expect(entries[0].image.assetId).toBe("a1");
    expect(entries[0].localPath).toBe("images/001.jpg");
  });

  it("dedupes the same asset appearing in several sections", () => {
    const shared = img({ assetId: "shared-asset" });
    const doc = docWithSections((d) => {
      d.sections.push(withSectionImages(createSection("image"), [shared]));
      d.sections.push(withSectionImages(createSection("row"), [shared, img({ assetId: "a2" })]));
      d.sections.push(withSectionImages(createSection("grid"), [shared, img({ assetId: "a3" })]));
    });
    const entries = collectArchiveImages(doc);
    const assetIds = entries.map((e) => e.image.assetId);
    expect(assetIds).toEqual(["shared-asset", "a2", "a3"]);
    expect(new Set(entries.map((e) => e.localPath)).size).toBe(3);
  });

  it("dedupes by path when assetId is null (legacy/demo images)", () => {
    const legacy = img({ assetId: null, path: "https://example.com/photo.jpg" });
    const doc = docWithSections((d) => {
      d.sections.push(withSectionImages(createSection("image"), [legacy]));
      d.sections.push(
        withSectionImages(createSection("image"), [
          img({ assetId: null, path: "https://example.com/photo.jpg" }),
        ])
      );
    });
    expect(collectArchiveImages(doc)).toHaveLength(1);
  });

  it("produces stable, zero-padded local keys across every section type", () => {
    const doc = docWithSections((d) => {
      d.sections.push(withSectionImages(createSection("split"), [img(), img()]));
      d.sections.push(withSectionImages(createSection("sequence"), [img()]));
      d.sections.push(withSectionImages(createSection("contact-sheet"), [img()]));
    });
    const entries = collectArchiveImages(doc);
    expect(entries.map((e) => e.localKey)).toEqual(["001", "002", "003", "004"]);
    expect(entries.map((e) => e.localPath)).toEqual([
      "images/001.jpg",
      "images/002.jpg",
      "images/003.jpg",
      "images/004.jpg",
    ]);
  });

  it("ignores sections with no images (text, heading, quote, spacer)", () => {
    const doc = docWithSections((d) => {
      d.sections.push(createSection("text"), createSection("heading"), createSection("quote"), createSection("spacer"));
    });
    expect(collectArchiveImages(doc)).toEqual([]);
  });
});
