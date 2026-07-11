import { describe, expect, it } from "vitest";
import { clampVariant, imageSrcSet, imageUrl } from "./media";

const asset = { path: "u/m/a/lg.jpg", hasVariants: true, hasXl: true, width: 2000 };
const wmAsset = { ...asset, hasWatermark: true };

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

describe("imageUrl watermarked", () => {
  it("resolves the watermarked sibling when hasWatermark is true", () => {
    expect(imageUrl(wmAsset, "lg", true)).toContain("lg.wm.jpg");
    expect(imageUrl(wmAsset, "md", true)).toContain("md.wm.jpg");
  });

  it("falls back to the clean file when hasWatermark is false", () => {
    expect(imageUrl(asset, "lg", true)).toContain("lg.jpg");
    expect(imageUrl(asset, "lg", true)).not.toContain(".wm.jpg");
  });

  it("ignores hasWatermark when the caller doesn't request it", () => {
    expect(imageUrl(wmAsset, "lg", false)).not.toContain(".wm.jpg");
  });
});

describe("imageSrcSet watermarked", () => {
  it("every entry resolves to the watermarked variant, including xl", () => {
    const set = imageSrcSet(wmAsset, undefined, true)!;
    expect(set).toContain("sm.wm.jpg 480w");
    expect(set).toContain("md.wm.jpg 1000w");
    expect(set).toContain("lg.wm.jpg");
    expect(set).toContain("xl.wm.jpg 2560w");
  });

  it("capped and watermarked stops at md.wm.jpg", () => {
    const set = imageSrcSet(wmAsset, "md", true)!;
    expect(set).toContain("sm.wm.jpg 480w");
    expect(set).toContain("md.wm.jpg 1000w");
    expect(set).not.toContain("lg.wm.jpg");
    expect(set).not.toContain("xl.wm.jpg");
  });
});
