"use client";

// ─── Shared photo row ────────────────────────────────────────────────
// Renders `split` and `row` sections through the layout planner so mixed
// orientations line up (see photo-layout.ts). Themes keep full control of
// each figure's chrome via `renderItem`; this component only decides the
// grid geometry.
//
// Mobile (< sm) always stacks single-column with natural ratios. The two
// breakpoint variants are separate DOM: images are lazy, and a display:none
// subtree never intersects the viewport, so the hidden copy is not fetched.

import type { PageImage } from "@/lib/page-document";
import { planPhotoRow, type PlannedImage } from "./photo-layout";

export interface PhotoRowItemOpts {
  /** Spread-ready props for SmartImage (aspect / fit / fill). */
  img: { aspect?: string; fit: "cover" | "natural"; fill?: boolean };
  /** Class for the <figure> (fill cells must stretch). */
  figureClass: string;
  /** Class for the element that wraps SmartImage inside the figure. */
  mediaClass: string;
  /** sizes hint for the slot this image occupies. */
  sizes: string;
}

function itemOpts(planned: PlannedImage, sizes: string): PhotoRowItemOpts {
  return {
    img: {
      aspect: planned.aspect,
      fit: planned.cover ? "cover" : "natural",
      fill: planned.fill,
    },
    figureClass: planned.fill ? "h-full min-h-0 flex flex-col" : "",
    mediaClass: planned.fill ? "flex-1 min-h-0 flex flex-col" : "",
    sizes,
  };
}

export function PhotoRow({
  images,
  gapClass,
  renderItem,
  justifiedItemClass,
}: {
  images: PageImage[];
  /** Gap classes for the desktop grid AND the mobile stack, e.g. "gap-4 sm:gap-6". */
  gapClass: string;
  /** Theme figure chrome. `planned.index` is the image's original position. */
  renderItem: (planned: PlannedImage, opts: PhotoRowItemOpts) => React.ReactNode;
  /** Optional per-item wrapper class in justified rows (index-based, for staggering). */
  justifiedItemClass?: (index: number) => string;
}) {
  if (images.length === 0) return null;
  const plan = planPhotoRow(images);
  const stackedSizes = "(max-width: 640px) 100vw, 50vw";

  // Mobile stack: everything natural (clamped crops still apply), full width.
  const mobile = (
    <div className={`grid grid-cols-1 sm:hidden ${gapClass}`}>
      {images.map((image, i) => {
        const planned =
          plan.kind === "justified"
            ? plan.items[i]
            : [plan.portrait, plan.stackedTop, plan.stackedBottom].find((p) => p.index === i)!;
        // Never use fill on mobile — there is no sized cell to fill.
        const natural: PlannedImage = { ...planned, fill: undefined, index: i };
        const opts = itemOpts(natural, "100vw");
        return <div key={image.id}>{renderItem(natural, opts)}</div>;
      })}
    </div>
  );

  if (plan.kind === "mosaic") {
    const portraitCol = plan.portraitSide === "left" ? "1" : "2";
    const stackCol = plan.portraitSide === "left" ? "2" : "1";
    return (
      <>
        {mobile}
        <div
          className={`hidden sm:grid ${gapClass}`}
          style={{ gridTemplateColumns: plan.columns, gridTemplateRows: "auto 1fr" }}
        >
          <div style={{ gridColumn: portraitCol, gridRow: "1 / 3" }}>
            {renderItem(plan.portrait, itemOpts(plan.portrait, "(max-width: 1100px) 60vw, 640px"))}
          </div>
          <div style={{ gridColumn: stackCol, gridRow: "1" }}>
            {renderItem(plan.stackedTop, itemOpts(plan.stackedTop, stackedSizes))}
          </div>
          <div className="min-h-0" style={{ gridColumn: stackCol, gridRow: "2" }}>
            {renderItem(plan.stackedBottom, itemOpts(plan.stackedBottom, stackedSizes))}
          </div>
        </div>
      </>
    );
  }

  const per = Math.round(100 / images.length);
  return (
    <>
      {mobile}
      <div
        className={`hidden sm:grid items-start ${gapClass}`}
        style={{ gridTemplateColumns: plan.columns }}
      >
        {plan.items.map((planned) => (
          <div key={planned.image.id} className={justifiedItemClass?.(planned.index) ?? ""}>
            {renderItem(planned, itemOpts(planned, `(max-width: 640px) 100vw, ${per}vw`))}
          </div>
        ))}
      </div>
    </>
  );
}
