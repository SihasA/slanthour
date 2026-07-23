import { describe, expect, it } from "vitest";
import { parseDocument, sectionImages } from "@/lib/page-document";
import { SHOWCASE_DOCUMENT, SHOWCASE_TITLE } from "./showcase";

// The showcase document is the single source cloned by both /demo and the
// "Start from an example" dashboard action (src/lib/actions/pages.ts). It
// must always survive the same sanitiser every stored draft goes through,
// with nothing dropped, so a first-run user's cloned page matches what the
// showcase itself renders.
describe("SHOWCASE_DOCUMENT", () => {
  it("parses cleanly through parseDocument with nothing dropped", () => {
    const parsed = parseDocument(SHOWCASE_DOCUMENT);
    expect(parsed.sections).toHaveLength(SHOWCASE_DOCUMENT.sections.length);
    expect(parsed.sections.map((s) => s.type)).toEqual(
      SHOWCASE_DOCUMENT.sections.map((s) => s.type)
    );
  });

  it("only references repo-owned /demo/*.jpg paths", () => {
    for (const section of SHOWCASE_DOCUMENT.sections) {
      for (const image of sectionImages(section)) {
        expect(image.path).toMatch(/^\/demo\/photo-\d+\.jpg$/);
        expect(image.assetId).toBeNull();
      }
    }
  });

  it("has a non-empty title", () => {
    expect(SHOWCASE_TITLE.trim().length).toBeGreaterThan(0);
  });
});
