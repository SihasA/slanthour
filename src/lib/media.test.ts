import { describe, expect, it } from "vitest";
import { clampVariant, imageSrcSet } from "./media";

const asset = { path: "u/m/a/lg.jpg", hasVariants: true, hasXl: true, width: 2000 };

describe("clampVariant", () => {
  it("passes through without a cap", () => {
    expect(clampVariant("xl")).toBe("xl");
    expect(clampVariant("sm")).toBe("sm");
  });

  it("caps larger variants and keeps smaller ones", () => {
    expect(clampVariant("xl", "md")).toBe("md");
    expect(clampVariant("lg", "md")).toBe("md");
    expect(clampVariant("md", "md")).toBe("md");
    expect(clampVariant("sm", "md")).toBe("sm");
  });
});

describe("imageSrcSet serving cap", () => {
  it("offers every variant uncapped", () => {
    const set = imageSrcSet(asset)!;
    expect(set).toContain("sm.jpg 480w");
    expect(set).toContain("lg.jpg");
    expect(set).toContain("xl.jpg 2560w");
  });

  it("stops at md when capped", () => {
    const set = imageSrcSet(asset, "md")!;
    expect(set).toContain("sm.jpg 480w");
    expect(set).toContain("md.jpg 1000w");
    expect(set).not.toContain("lg.jpg");
    expect(set).not.toContain("xl.jpg");
  });
});
