// ─── Photo row layout planner ────────────────────────────────────────
// Pure math for laying out 2–4 photos side by side so mixed orientations
// never produce a ragged row. Two strategies:
//
//   justified — every image keeps its natural aspect ratio and gets a grid
//     column weighted by that ratio (`r₁fr r₂fr …`). Column width ∝ ratio
//     means height = width/ratio is IDENTICAL for every image in the row,
//     with no cropping, for any mix of orientations.
//
//   mosaic — for exactly one portrait among two landscapes in a 3-up row:
//     the portrait sits full-height on one side, the two landscapes stack
//     beside it. The portrait's natural ratio defines the row height; the
//     stacked cells cover-crop slightly to fill.
//
// Oddly-cropped edge cases (extreme panoramas, tall slivers) are clamped:
// the layout treats them as MIN/MAX ratio and cover-crops to that shape,
// so one weird crop can't crush its neighbours to nothing.

import type { PageImage } from "@/lib/page-document";

export const DEFAULT_RATIO = 1.5; // assumed 3:2 when dimensions are unknown
export const MIN_LAYOUT_RATIO = 0.58; // taller than ~9:15.5 → clamp + crop
export const MAX_LAYOUT_RATIO = 2.1; // wider than ~2:1 → clamp + crop
export const PORTRAIT_MAX = 0.9; // ratio below this counts as portrait
const LANDSCAPE_MIN = 1.05; // ratio above this counts as landscape

/** width/height, defensive against missing or garbage dimensions. */
export function imageRatio(image: PageImage): number {
  if (!image.width || !image.height || image.width <= 0 || image.height <= 0) {
    return DEFAULT_RATIO;
  }
  const ratio = image.width / image.height;
  return Number.isFinite(ratio) && ratio > 0 ? ratio : DEFAULT_RATIO;
}

function clampRatio(ratio: number): number {
  return Math.min(MAX_LAYOUT_RATIO, Math.max(MIN_LAYOUT_RATIO, ratio));
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

/** CSS aspect-ratio value for a numeric ratio. */
export function ratioToAspect(ratio: number): string {
  return `${round3(ratio)} / 1`;
}

export interface PlannedImage {
  image: PageImage;
  /** Position in the original section order (for numbering/captions). */
  index: number;
  /** aspect-ratio to render at; undefined = natural intrinsic ratio. */
  aspect?: string;
  /** true → cover-crop into the given aspect (clamped or cell-filling). */
  cover: boolean;
  /** true → stretch to fill the cell height (mosaic bottom cell only). */
  fill?: boolean;
}

export type RowPlan =
  | {
      kind: "justified";
      /** grid-template-columns value, e.g. "1.5fr 0.667fr 1.5fr" */
      columns: string;
      items: PlannedImage[];
    }
  | {
      kind: "mosaic";
      columns: string;
      portraitSide: "left" | "right";
      portrait: PlannedImage;
      stackedTop: PlannedImage;
      stackedBottom: PlannedImage;
    };

/** Natural rendering, cover-cropped to the clamp bound only when extreme. */
function planNatural(image: PageImage, index: number): PlannedImage {
  const natural = imageRatio(image);
  const clamped = clampRatio(natural);
  if (clamped !== natural) {
    return { image, index, aspect: ratioToAspect(clamped), cover: true };
  }
  return { image, index, cover: false };
}

/**
 * Plan a side-by-side photo row (used by `split` and `row` sections).
 * Returns a mosaic when the shape fits (3 images, exactly one portrait),
 * otherwise a justified equal-height row.
 */
export function planPhotoRow(images: PageImage[]): RowPlan {
  const ratios = images.map((img) => clampRatio(imageRatio(img)));

  if (images.length === 3) {
    const portraitIdx = ratios
      .map((r, i) => (r < PORTRAIT_MAX ? i : -1))
      .filter((i) => i >= 0);
    const landscapes = ratios.filter((r) => r >= LANDSCAPE_MIN);
    if (portraitIdx.length === 1 && landscapes.length === 2) {
      const p = portraitIdx[0];
      const stackedIdx = [0, 1, 2].filter((i) => i !== p);
      const stackRatio = clampRatio((ratios[stackedIdx[0]] + ratios[stackedIdx[1]]) / 2);
      const portraitWeight = round3(ratios[p]);
      const stackWeight = round3(stackRatio / 2);
      const portraitSide: "left" | "right" = p === 2 ? "right" : "left";
      const columns =
        portraitSide === "left"
          ? `${portraitWeight}fr ${stackWeight}fr`
          : `${stackWeight}fr ${portraitWeight}fr`;
      return {
        kind: "mosaic",
        columns,
        portraitSide,
        portrait: planNatural(images[p], p),
        stackedTop: {
          image: images[stackedIdx[0]],
          index: stackedIdx[0],
          aspect: ratioToAspect(stackRatio),
          cover: true,
        },
        stackedBottom: {
          image: images[stackedIdx[1]],
          index: stackedIdx[1],
          cover: true,
          fill: true,
        },
      };
    }
  }

  return {
    kind: "justified",
    columns: ratios.map((r) => `${round3(r)}fr`).join(" "),
    items: images.map((img, i) => planNatural(img, i)),
  };
}

/**
 * Width cap for a portrait image standing alone (image/sequence sections),
 * so a vertical photo doesn't render as an enormous full-width tower.
 * Caps rendered height at ~`maxVh` of the viewport by limiting width.
 */
export function portraitConstraint(
  image: PageImage,
  maxVh = 80
): React.CSSProperties | undefined {
  const ratio = imageRatio(image);
  if (ratio >= PORTRAIT_MAX) return undefined;
  return {
    maxWidth: `min(100%, calc(${maxVh}svh * ${round3(ratio)}))`,
    marginInline: "auto",
  };
}
