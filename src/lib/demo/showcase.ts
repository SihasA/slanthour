// ─── Landing-page demo content ───────────────────────────────────────
// A small, representative page document rendered through the real theme
// engine on the landing page. Images are repo-owned (downscaled from the
// founder's own photographs in public/demo) — no remote URLs, no mocks.

import type { PageDocument, PageImage } from "@/lib/page-document";

function demoImage(n: number, caption = "", portrait = false): PageImage {
  return {
    id: `demo-img-${n}-${caption.length}`,
    assetId: null,
    path: `/demo/photo-${n}.jpg`,
    width: portrait ? 600 : 900,
    height: portrait ? 900 : 600,
    alt: caption || "Demonstration photograph",
    caption,
    blur: null,
  };
}

export const SHOWCASE_TITLE = "Fourteen Days North";

export const SHOWCASE_DOCUMENT: PageDocument = {
  version: 1,
  sections: [
    {
      id: "demo-hero",
      type: "hero",
      image: demoImage(2),
      title: "Fourteen Days North",
      subtitle: "A road trip in photographs",
      height: "half",
    },
    {
      id: "demo-text",
      type: "text",
      body: "We left before sunrise with two cameras, a paper map, and no plan worth the name. What follows is everything worth keeping.",
      align: "left",
    },
    {
      id: "demo-split",
      type: "split",
      images: [demoImage(1, "Day two, first light"), demoImage(6, "The long climb", true)],
    },
    {
      id: "demo-heading",
      type: "heading",
      title: "The coast road",
      subtitle: "Days five to nine",
      level: 1,
    },
    {
      // Mixed orientations on purpose: one portrait among two landscapes
      // exercises the mosaic layout (portrait beside stacked landscapes).
      id: "demo-row",
      type: "row",
      images: [demoImage(3, "Harbour"), demoImage(6, "The long climb", true), demoImage(5, "Low tide")],
    },
    {
      id: "demo-quote",
      type: "quote",
      text: "The best photographs were the ones we almost didn't stop for.",
      attribution: "Trip notes",
    },
    {
      id: "demo-grid",
      type: "grid",
      images: [demoImage(7, "North field"), demoImage(8, "Last evening"), demoImage(1), demoImage(5)],
      columns: 2,
      gap: "regular",
    },
    {
      // Exercises each theme's signature sheet treatment: Roll 36's bordered
      // frames, Riviera's scroll rail, Klaxon's index table.
      id: "demo-sheet",
      type: "contact-sheet",
      images: [
        demoImage(2, "Departure"),
        demoImage(3, "Harbour"),
        demoImage(4, "Roadside"),
        demoImage(5, "Low tide"),
        demoImage(7, "North field"),
        demoImage(8, "Last evening"),
      ],
      numbered: true,
    },
  ],
};
