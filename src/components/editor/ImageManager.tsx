"use client";

// ─── Image manager ───────────────────────────────────────────────────
// Images of the selected section: reorder, replace/remove, captions,
// alt text and a nine-point focal picker for cropped placements.

import { useState } from "react";
import {
  SECTION_LABELS,
  sectionImageCapacity,
  sectionImages,
  type PageImage,
  type Section,
} from "@/lib/page-document";
import { imageUrl } from "@/lib/media";
import type { EditorAction } from "@/lib/editor/reducer";
import { MediaUploader } from "./MediaUploader";
import { LibraryPicker } from "./LibraryPicker";
import { useImageDrag } from "./ImageDrag";

const FOCAL_POINTS = [0, 50, 100];

function ImageRow({
  image,
  index,
  total,
  sectionId,
  otherSections,
  dispatch,
}: {
  image: PageImage;
  index: number;
  total: number;
  sectionId: string;
  /** Other sections that can receive this photo (for touch "Send to"). */
  otherSections: Section[];
  dispatch: React.Dispatch<EditorAction>;
}) {
  const [showFocal, setShowFocal] = useState(false);
  const { startDrag, draggingId } = useImageDrag();
  const focal = image.focal ?? { x: 50, y: 50 };

  return (
    <li className="border border-rule p-2.5">
      <div className="flex gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl(image, "sm")}
          alt=""
          title="Drag onto a section in the list to move this photo"
          onPointerDown={(e) => startDrag(e, image, { kind: "section", sectionId })}
          className={`w-14 h-14 object-cover shrink-0 bg-surface cursor-grab touch-none select-none ${
            draggingId === image.id ? "opacity-40" : ""
          }`}
          draggable={false}
        />
        <div className="flex-1 min-w-0 space-y-1.5">
          <input
            value={image.caption}
            onChange={(e) =>
              dispatch({
                type: "updateImage",
                sectionId,
                imageId: image.id,
                patch: { caption: e.target.value },
                coalesceKey: `caption:${image.id}`,
              })
            }
            placeholder="Caption"
            aria-label="Caption"
            title="Shown on the page, styled by the theme"
            className="w-full bg-transparent border-b border-rule focus:border-accent text-[12px] py-1 text-foreground placeholder:text-muted/40 focus:outline-none font-copy"
          />
          <input
            value={image.alt}
            onChange={(e) =>
              dispatch({
                type: "updateImage",
                sectionId,
                imageId: image.id,
                patch: { alt: e.target.value },
                coalesceKey: `alt:${image.id}`,
              })
            }
            placeholder="Alt text (describe the photo)"
            aria-label="Alt text"
            title="Not shown on the page, used by screen readers and search engines"
            className="w-full bg-transparent border-b border-rule focus:border-accent text-[12px] py-1 text-foreground placeholder:text-muted/40 focus:outline-none font-copy"
          />
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-wide">
        <button
          onClick={() => dispatch({ type: "moveImage", sectionId, imageId: image.id, direction: -1 })}
          disabled={index === 0}
          aria-label="Move image earlier"
          className="text-muted hover:text-foreground disabled:opacity-25"
        >
          ←
        </button>
        <button
          onClick={() => dispatch({ type: "moveImage", sectionId, imageId: image.id, direction: 1 })}
          disabled={index === total - 1}
          aria-label="Move image later"
          className="text-muted hover:text-foreground disabled:opacity-25"
        >
          →
        </button>
        <button
          onClick={() => setShowFocal((v) => !v)}
          aria-expanded={showFocal}
          className={`ml-1 ${showFocal ? "text-accent" : "text-muted hover:text-foreground"}`}
        >
          Focus
        </button>
        {/* Touch has no drag: an explicit destination menu instead. */}
        {otherSections.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              if (e.target.value)
                dispatch({
                  type: "moveImageToSection",
                  fromSectionId: sectionId,
                  imageId: image.id,
                  toSectionId: e.target.value,
                });
            }}
            aria-label="Send photo to another section"
            className="lg:hidden bg-transparent border border-rule text-[10px] text-muted py-0.5 max-w-[90px]"
          >
            <option value="">Send to…</option>
            {otherSections.map((s, i) => (
              <option key={s.id} value={s.id}>
                {SECTION_LABELS[s.type]} {i + 1}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={() => dispatch({ type: "sectionToTray", sectionId, imageId: image.id })}
          title="Moves the photo to the page tray, ready to place elsewhere"
          className="ml-auto text-muted hover:text-red-400"
        >
          To tray
        </button>
      </div>

      {showFocal && (
        <div className="mt-2">
          <p className="text-[10px] text-muted mb-1.5 font-copy">
            Crop focus: which part stays visible when the photo is cropped.
          </p>
          <div
            className="relative w-24 h-24 bg-center bg-cover"
            style={{ backgroundImage: `url(${imageUrl(image, "sm")})` }}
          >
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
              {FOCAL_POINTS.flatMap((y) =>
                FOCAL_POINTS.map((x) => (
                  <button
                    key={`${x}-${y}`}
                    onClick={() =>
                      dispatch({
                        type: "updateImage",
                        sectionId,
                        imageId: image.id,
                        patch: { focal: { x, y } },
                      })
                    }
                    aria-label={`Focus ${x === 0 ? "left" : x === 50 ? "centre" : "right"} ${y === 0 ? "top" : y === 50 ? "middle" : "bottom"}`}
                    aria-pressed={focal.x === x && focal.y === y}
                    className="flex items-center justify-center"
                  >
                    <span
                      className={`w-2 h-2 rounded-full border ${
                        focal.x === x && focal.y === y
                          ? "bg-accent border-accent"
                          : "border-white/70 bg-black/30"
                      }`}
                    />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

export function ImageManager({
  section,
  allSections = [],
  dispatch,
  hiFiUploads = false,
}: {
  section: Section;
  /** Full section list, for the touch "Send to" menu. */
  allSections?: Section[];
  dispatch: React.Dispatch<EditorAction>;
  hiFiUploads?: boolean;
}) {
  const images = sectionImages(section);
  const capacity = sectionImageCapacity(section.type);
  if (capacity === 0) return null;
  const capacityLeft = capacity === Infinity ? Infinity : capacity - images.length;
  const otherSections = allSections.filter((s) => {
    if (s.id === section.id) return false;
    const cap = sectionImageCapacity(s.type);
    return cap === Infinity || sectionImages(s).length < cap;
  });

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <ul className="space-y-2">
          {images.map((image, index) => (
            <ImageRow
              key={image.id}
              image={image}
              index={index}
              total={images.length}
              sectionId={section.id}
              otherSections={otherSections}
              dispatch={dispatch}
            />
          ))}
        </ul>
      )}
      {capacityLeft > 0 && (
        <>
          <MediaUploader
            compact={images.length > 0}
            capacityLeft={capacityLeft}
            hiFi={hiFiUploads}
            onUploaded={(newImages) =>
              dispatch({ type: "addImages", sectionId: section.id, images: newImages })
            }
          />
          <LibraryPicker
            capacityLeft={capacityLeft}
            onPicked={(picked) =>
              dispatch({ type: "addImages", sectionId: section.id, images: picked })
            }
          />
        </>
      )}
    </div>
  );
}
