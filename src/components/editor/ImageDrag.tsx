"use client";

// ─── Image drag layer ────────────────────────────────────────────────
// Drag photo thumbnails between the tray, sections (rows in the section
// list) and back. Deliberately not dnd-kit: the section list already owns
// a DndContext for row sorting, and a second nested context cannot host
// drop targets inside the first. A pointer-event layer with attribute
// hit-testing is smaller and conflict-free.
//
// Drop targets declare themselves with `data-img-drop`:
//   "section:<id>"  a section row that can accept the photo
//   "tray"          the tray container (returns a photo to the tray)
//   "tray:<index>"  a tray thumbnail (reorders within the tray)
//
// Mouse and pen only. Touch users get the "Send to" menu instead; hijacking
// touch scroll for drag would make the editor worse on phones, not better.

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { PageImage } from "@/lib/page-document";
import { imageUrl } from "@/lib/media";
import type { EditorAction } from "@/lib/editor/reducer";

export type ImageDragSource = { kind: "tray" } | { kind: "section"; sectionId: string };

interface DragState {
  image: PageImage;
  from: ImageDragSource;
  x: number;
  y: number;
}

interface ImageDragValue {
  /** Begin dragging a photo. Call from a thumbnail's onPointerDown. */
  startDrag: (e: React.PointerEvent, image: PageImage, from: ImageDragSource) => void;
  /** The `data-img-drop` value currently hovered, or null. */
  overTarget: string | null;
  /** True while a drag is in progress (thumbnails can dim themselves). */
  draggingId: string | null;
}

const ImageDragContext = createContext<ImageDragValue>({
  startDrag: () => {},
  overTarget: null,
  draggingId: null,
});

export function useImageDrag() {
  return useContext(ImageDragContext);
}

function hitTest(x: number, y: number): string | null {
  for (const el of document.elementsFromPoint(x, y)) {
    const target = (el as HTMLElement).closest?.("[data-img-drop]");
    if (target) return (target as HTMLElement).dataset.imgDrop ?? null;
  }
  return null;
}

export function ImageDragProvider({
  dispatch,
  children,
}: {
  dispatch: React.Dispatch<EditorAction>;
  children: React.ReactNode;
}) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [overTarget, setOverTarget] = useState<string | null>(null);
  const dragRef = useRef<DragState | null>(null);
  dragRef.current = drag;

  function startDrag(e: React.PointerEvent, image: PageImage, from: ImageDragSource) {
    // Touch scrolls; it never drags. Primary button only.
    if (e.pointerType === "touch" || e.button !== 0) return;
    e.preventDefault();
    setDrag({ image, from, x: e.clientX, y: e.clientY });
  }

  useEffect(() => {
    if (!drag) return;

    const onMove = (e: PointerEvent) => {
      setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
      setOverTarget(hitTest(e.clientX, e.clientY));
    };

    const onUp = (e: PointerEvent) => {
      const current = dragRef.current;
      const target = hitTest(e.clientX, e.clientY);
      setDrag(null);
      setOverTarget(null);
      if (!current || !target) return;
      const { image, from } = current;

      if (target.startsWith("section:")) {
        const sectionId = target.slice("section:".length);
        if (from.kind === "tray") {
          dispatch({ type: "trayToSection", imageId: image.id, sectionId });
        } else if (from.sectionId !== sectionId) {
          dispatch({ type: "moveImageToSection", fromSectionId: from.sectionId, imageId: image.id, toSectionId: sectionId });
        }
      } else if (target.startsWith("tray:")) {
        const index = Number(target.slice("tray:".length));
        if (from.kind === "tray") dispatch({ type: "reorderTray", imageId: image.id, toIndex: index });
        else dispatch({ type: "sectionToTray", sectionId: from.sectionId, imageId: image.id });
      } else if (target === "tray" && from.kind === "section") {
        dispatch({ type: "sectionToTray", sectionId: from.sectionId, imageId: image.id });
      }
    };

    const onCancel = () => {
      setDrag(null);
      setOverTarget(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    // Listeners bind once per drag session, not per pointer move.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag !== null]);

  return (
    <ImageDragContext.Provider value={{ startDrag, overTarget, draggingId: drag?.image.id ?? null }}>
      {children}
      {drag && (
        <div
          className="fixed z-[60] pointer-events-none -translate-x-1/2 -translate-y-1/2 shadow-xl border border-accent"
          style={{ left: drag.x, top: drag.y }}
          aria-hidden
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl(drag.image, "sm")} alt="" className="w-14 h-14 object-cover" draggable={false} />
        </div>
      )}
    </ImageDragContext.Provider>
  );
}
