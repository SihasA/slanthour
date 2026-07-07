import { describe, expect, it } from "vitest";
import {
  DEFAULT_RATIO,
  imageRatio,
  MAX_LAYOUT_RATIO,
  MIN_LAYOUT_RATIO,
  planPhotoRow,
  portraitConstraint,
} from "./photo-layout";
import type { PageImage } from "@/lib/page-document";

function img(width: number | null, height: number | null, id = crypto.randomUUID()): PageImage {
  return {
    id,
    assetId: null,
    path: `demo/${id}.jpg`,
    width,
    height,
    alt: "",
    caption: "",
    blur: null,
  };
}

const landscape = () => img(3000, 2000); // 1.5
const portrait = () => img(2000, 3000); // 0.667
const square = () => img(2000, 2000); // 1.0

describe("imageRatio", () => {
  it("computes width/height", () => {
    expect(imageRatio(landscape())).toBeCloseTo(1.5);
  });

  it("falls back to 3:2 for missing or garbage dimensions", () => {
    expect(imageRatio(img(null, null))).toBe(DEFAULT_RATIO);
    expect(imageRatio(img(0, 100))).toBe(DEFAULT_RATIO);
    expect(imageRatio(img(100, 0))).toBe(DEFAULT_RATIO);
    expect(imageRatio(img(-5, 100))).toBe(DEFAULT_RATIO);
  });
});

describe("planPhotoRow — justified", () => {
  it("weights columns by aspect ratio so heights equalise", () => {
    const plan = planPhotoRow([landscape(), portrait()]);
    if (plan.kind !== "justified") throw new Error("expected justified");
    expect(plan.columns).toBe("1.5fr 0.667fr");
    // Neither image is cropped — both keep natural ratios.
    expect(plan.items.every((i) => !i.cover)).toBe(true);
  });

  it("keeps three landscapes as a plain justified row", () => {
    const plan = planPhotoRow([landscape(), landscape(), landscape()]);
    expect(plan.kind).toBe("justified");
  });

  it("uses justified for two portraits + one landscape", () => {
    const plan = planPhotoRow([portrait(), landscape(), portrait()]);
    expect(plan.kind).toBe("justified");
  });

  it("uses justified when the odd one out is a square (ambiguous)", () => {
    const plan = planPhotoRow([square(), landscape(), landscape()]);
    expect(plan.kind).toBe("justified");
  });

  it("cover-crops extreme panoramas to the clamp bound", () => {
    const pano = img(6000, 1000); // ratio 6 — way past MAX
    const plan = planPhotoRow([pano, landscape()]);
    if (plan.kind !== "justified") throw new Error("expected justified");
    expect(plan.items[0].cover).toBe(true);
    expect(plan.items[0].aspect).toBe(`${MAX_LAYOUT_RATIO} / 1`);
    // The clamped weight is used, so the pano can't crush its neighbour.
    expect(plan.columns).toBe(`${MAX_LAYOUT_RATIO}fr 1.5fr`);
  });

  it("cover-crops extreme tall slivers to the clamp bound", () => {
    const sliver = img(500, 4000); // ratio 0.125
    const plan = planPhotoRow([sliver, landscape()]);
    if (plan.kind !== "justified") throw new Error("expected justified");
    expect(plan.items[0].cover).toBe(true);
    expect(plan.items[0].aspect).toBe(`${MIN_LAYOUT_RATIO} / 1`);
  });
});

describe("planPhotoRow — mosaic", () => {
  it("triggers for exactly one portrait among two landscapes", () => {
    const plan = planPhotoRow([portrait(), landscape(), landscape()]);
    if (plan.kind !== "mosaic") throw new Error("expected mosaic");
    expect(plan.portraitSide).toBe("left");
    expect(plan.portrait.index).toBe(0);
    // Stacked cells crop to a common landscape ratio; bottom cell fills.
    expect(plan.stackedTop.cover).toBe(true);
    expect(plan.stackedTop.aspect).toBe("1.5 / 1");
    expect(plan.stackedBottom.fill).toBe(true);
    // Portrait keeps its natural ratio, uncropped.
    expect(plan.portrait.cover).toBe(false);
  });

  it("puts the portrait on the right when it is the last image", () => {
    const plan = planPhotoRow([landscape(), landscape(), portrait()]);
    if (plan.kind !== "mosaic") throw new Error("expected mosaic");
    expect(plan.portraitSide).toBe("right");
    expect(plan.portrait.index).toBe(2);
    // Stack column first, portrait column second.
    expect(plan.columns).toBe("0.75fr 0.667fr");
  });

  it("preserves original indices for numbering/captions", () => {
    const plan = planPhotoRow([landscape(), portrait(), landscape()]);
    if (plan.kind !== "mosaic") throw new Error("expected mosaic");
    expect(plan.portrait.index).toBe(1);
    expect(plan.stackedTop.index).toBe(0);
    expect(plan.stackedBottom.index).toBe(2);
  });

  it("weights the portrait column so it reads prominently", () => {
    const plan = planPhotoRow([portrait(), landscape(), landscape()]);
    if (plan.kind !== "mosaic") throw new Error("expected mosaic");
    expect(plan.columns).toBe("0.667fr 0.75fr");
  });

  it("does not trigger with unknown dimensions (assumed landscape)", () => {
    const plan = planPhotoRow([img(null, null), landscape(), landscape()]);
    expect(plan.kind).toBe("justified");
  });
});

describe("portraitConstraint", () => {
  it("caps standalone portrait width by viewport height", () => {
    const style = portraitConstraint(portrait());
    expect(style?.maxWidth).toContain("80svh * 0.667");
    expect(style?.marginInline).toBe("auto");
  });

  it("leaves landscapes and squares alone", () => {
    expect(portraitConstraint(landscape())).toBeUndefined();
    expect(portraitConstraint(square())).toBeUndefined();
    expect(portraitConstraint(img(null, null))).toBeUndefined();
  });
});
