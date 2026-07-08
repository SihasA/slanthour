import { describe, expect, it } from "vitest";
import { parseDocument } from "./page-document";
import {
  createTemplateDocument,
  getTemplate,
  isTemplateId,
  PAGE_TEMPLATES,
  templateStructure,
} from "./page-templates";

describe("PAGE_TEMPLATES", () => {
  it("has unique ids and non-empty card copy", () => {
    const ids = new Set(PAGE_TEMPLATES.map((t) => t.id));
    expect(ids.size).toBe(PAGE_TEMPLATES.length);
    for (const t of PAGE_TEMPLATES) {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.description.length).toBeGreaterThan(0);
      expect(t.pairsWith.length).toBeGreaterThan(0);
    }
  });

  it("builds sections that survive the document sanitizer unchanged", () => {
    for (const t of PAGE_TEMPLATES) {
      const doc = createTemplateDocument(t.id);
      const parsed = parseDocument(JSON.parse(JSON.stringify(doc)));
      expect(parsed).toEqual(doc);
      expect(parsed.sections.length).toBeGreaterThan(1);
    }
  });

  it("generates fresh section ids on every build", () => {
    for (const t of PAGE_TEMPLATES) {
      const first = t.build().map((s) => s.id);
      const second = t.build().map((s) => s.id);
      expect(new Set([...first, ...second]).size).toBe(first.length * 2);
    }
  });

  it("every template can hold photos via fill", () => {
    // Each skeleton needs at least one image-capable section, otherwise
    // "Fill sections in order" would have nowhere to pour the tray.
    for (const t of PAGE_TEMPLATES) {
      const imageTypes = ["hero", "image", "split", "row", "grid", "contact-sheet", "sequence"];
      expect(t.build().some((s) => imageTypes.includes(s.type))).toBe(true);
    }
  });

  it("keeps user-facing copy free of em dashes", () => {
    for (const t of PAGE_TEMPLATES) {
      const everything = JSON.stringify({ ...t, build: undefined }) + JSON.stringify(t.build());
      expect(everything).not.toContain("—");
    }
  });
});

describe("isTemplateId / getTemplate / templateStructure", () => {
  it("accepts known ids and rejects everything else", () => {
    expect(isTemplateId("portfolio")).toBe(true);
    expect(isTemplateId("zine")).toBe(true);
    expect(isTemplateId("blank")).toBe(false);
    expect(isTemplateId("")).toBe(false);
    expect(isTemplateId(null)).toBe(false);
    expect(isTemplateId(42)).toBe(false);
  });

  it("describes the real structure", () => {
    const zine = getTemplate("zine");
    expect(templateStructure(zine)).toContain("Contact sheet");
  });
});
