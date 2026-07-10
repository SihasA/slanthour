import { describe, expect, it } from "vitest";
import type { PageImage } from "@/lib/page-document";
import { imageUrl } from "@/lib/media";
import type { ArchiveImageEntry } from "./collect";
import { localizeHtml, revealOverrideCss } from "./localize";

const img = (overrides: Partial<PageImage> = {}): PageImage => ({
  id: "img-1",
  assetId: "asset-1",
  path: "user1/m/asset-1/lg.jpg",
  hasVariants: true,
  width: 2000,
  height: 1333,
  alt: "",
  caption: "",
  blur: null,
  ...overrides,
});

const entry = (image: PageImage, localPath = "images/001.jpg"): ArchiveImageEntry => ({
  image,
  localKey: "001",
  localPath,
});

describe("localizeHtml", () => {
  it("collapses every responsive variant of one asset to the single local file", () => {
    const image = img();
    const html = `
      <img src="${imageUrl(image, "lg")}" srcset="${imageUrl(image, "sm")} 480w, ${imageUrl(image, "md")} 1000w, ${imageUrl(image, "lg")} 2000w" sizes="100vw">
    `;
    const out = localizeHtml(html, [entry(image)]);
    expect(out).toContain('src="images/001.jpg"');
    expect(out).not.toContain("supabase");
    expect(out).not.toContain(imageUrl(image, "sm"));
    expect(out).not.toContain(imageUrl(image, "md"));
  });

  it("strips srcset and sizes attributes entirely", () => {
    const image = img();
    const html = `<img src="${imageUrl(image, "lg")}" srcset="a 1w, b 2w" sizes="50vw" alt="x">`;
    const out = localizeHtml(html, [entry(image)]);
    expect(out).not.toMatch(/srcset="/);
    expect(out).not.toMatch(/ sizes="/);
    expect(out).toContain('alt="x"');
  });

  it("collapses the watermarked variant when the image has one", () => {
    const image = img({ hasWatermark: true });
    const html = `<img src="${imageUrl(image, "lg", true)}">`;
    const out = localizeHtml(html, [entry(image)]);
    expect(out).toBe('<img src="images/001.jpg">');
  });

  it("leaves non-image URLs and unrelated markup untouched", () => {
    const image = img();
    const html = `<a href="https://slanthour.com/about">About</a><img src="${imageUrl(image, "lg")}">`;
    const out = localizeHtml(html, [entry(image)]);
    expect(out).toContain('<a href="https://slanthour.com/about">About</a>');
    expect(out).toContain('<img src="images/001.jpg">');
  });

  it("only replaces the asset it was given, leaving other assets alone", () => {
    const a = img({ assetId: "a", path: "u/m/a/lg.jpg" });
    const b = img({ assetId: "b", path: "u/m/b/lg.jpg" });
    const html = `<img src="${imageUrl(a, "lg")}"><img src="${imageUrl(b, "lg")}">`;
    const out = localizeHtml(html, [entry(a, "images/001.jpg")]);
    expect(out).toContain('src="images/001.jpg"');
    expect(out).toContain(imageUrl(b, "lg")); // untouched — not in the image map
  });

  it("legacy (no-variant) images match their single fixed URL", () => {
    const image = img({ hasVariants: false, path: "legacy/old-photo.jpg" });
    const html = `<img src="${imageUrl(image, "lg")}">`;
    const out = localizeHtml(html, [entry(image)]);
    expect(out).toBe('<img src="images/001.jpg">');
  });
});

describe("revealOverrideCss", () => {
  it("neutralizes the JS-gated opacity and translate hiding", () => {
    const css = revealOverrideCss();
    expect(css).toContain(".sh-page .opacity-0");
    expect(css).toContain("opacity: 1");
    expect(css).toContain(".sh-page .translate-y-4");
    expect(css).toContain("transform: none");
  });
});
