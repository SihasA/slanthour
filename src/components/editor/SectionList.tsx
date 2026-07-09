"use client";

// ─── Section list ────────────────────────────────────────────────────
// Ordered structure of the page: select, reorder (drag or keyboard
// buttons), add, duplicate, delete. The add menu doubles as the first
// explanation a new user gets of what each section actually is.

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  SECTION_LABELS,
  sectionImageCapacity,
  sectionImages,
  trayImages,
  type PageDocument,
  type PageImage,
  type Section,
} from "@/lib/page-document";
import { imageUrl } from "@/lib/media";
import { PAGE_TEMPLATES, templateStructure } from "@/lib/page-templates";
import { SECTION_GROUPS, SECTION_DESCRIPTIONS, SectionGlyph } from "./section-meta";
import { getTheme } from "@/themes/registry";
import type { EditorAction } from "@/lib/editor/reducer";
import { useImageDrag } from "./ImageDrag";
import { MediaUploader } from "./MediaUploader";
import { LibraryPicker } from "./LibraryPicker";

// Structure lines are static per template; derive once, not per render.
const TEMPLATE_STRUCTURES = new Map(PAGE_TEMPLATES.map((t) => [t.id, templateStructure(t)]));

function sectionFreeCapacity(section: Section): number {
  const capacity = sectionImageCapacity(section.type);
  if (capacity === 0) return 0;
  if (capacity === Infinity) return Infinity;
  return Math.max(0, capacity - sectionImages(section).length);
}

function summarize(section: Section): string {
  const count = sectionImages(section).length;
  switch (section.type) {
    case "text":
      return section.body.slice(0, 40) || "Empty text";
    case "heading":
      return section.title || "Untitled";
    case "quote":
      return section.text.slice(0, 40) || "Empty quote";
    case "hero":
      return section.title || (section.image ? "1 image" : "No image yet");
    case "spacer":
      return section.divider ? "With divider" : section.size;
    default:
      return count === 0 ? "No images yet" : `${count} image${count === 1 ? "" : "s"}`;
  }
}

function SortableRow({
  section,
  index,
  total,
  selected,
  onSelect,
  dispatch,
}: {
  section: Section;
  index: number;
  total: number;
  selected: boolean;
  onSelect: () => void;
  dispatch: React.Dispatch<EditorAction>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });
  const { overTarget, draggingId } = useImageDrag();
  const droppable = draggingId !== null && sectionFreeCapacity(section) > 0;
  const isDropOver = droppable && overTarget === `section:${section.id}`;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group border-b border-rule ${isDragging ? "opacity-60 z-10" : ""}`}
      {...(droppable ? { "data-img-drop": `section:${section.id}` } : {})}
    >
      <div
        className={`flex items-stretch transition-colors ${
          isDropOver
            ? "bg-surface outline outline-1 -outline-offset-1 outline-accent"
            : droppable
              ? "bg-surface/40"
              : selected
                ? "bg-surface"
                : "hover:bg-surface/60"
        }`}
      >
        <button
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${SECTION_LABELS[section.type]}`}
          className="px-2 text-muted/50 hover:text-muted cursor-grab touch-none"
        >
          ⋮⋮
        </button>
        <button onClick={onSelect} className="flex-1 min-w-0 text-left py-2.5 pr-1">
          <span
            className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wide ${selected ? "text-accent" : "text-muted"}`}
          >
            <SectionGlyph type={section.type} className="shrink-0 opacity-70" />
            {SECTION_LABELS[section.type]}
          </span>
          <span className="block text-[12px] text-foreground/70 truncate font-copy">
            {summarize(section)}
          </span>
        </button>
        <div className="flex flex-col justify-center pr-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            onClick={() => dispatch({ type: "moveSection", id: section.id, toIndex: index - 1 })}
            disabled={index === 0}
            aria-label="Move up"
            className="text-muted hover:text-foreground disabled:opacity-20 text-[10px] px-1"
          >
            ▲
          </button>
          <button
            onClick={() => dispatch({ type: "moveSection", id: section.id, toIndex: index + 1 })}
            disabled={index === total - 1}
            aria-label="Move down"
            className="text-muted hover:text-foreground disabled:opacity-20 text-[10px] px-1"
          >
            ▼
          </button>
        </div>
      </div>
    </li>
  );
}

function TrayThumb({
  image,
  index,
  sections,
  dispatch,
}: {
  image: PageImage;
  index: number;
  sections: Section[];
  dispatch: React.Dispatch<EditorAction>;
}) {
  const { startDrag, overTarget, draggingId } = useImageDrag();
  const placeTargets = sections.filter((s) => sectionFreeCapacity(s) > 0);

  return (
    <div className="relative" data-img-drop={`tray:${index}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl(image, "sm")}
        alt={image.alt || image.caption || "Tray photo"}
        loading="lazy"
        draggable={false}
        onPointerDown={(e) => startDrag(e, image, { kind: "tray" })}
        className={`w-12 h-12 object-cover bg-surface cursor-grab touch-none select-none ${
          draggingId === image.id ? "opacity-40" : ""
        } ${overTarget === `tray:${index}` ? "outline outline-1 outline-accent" : ""}`}
      />
      <button
        onClick={() => dispatch({ type: "removeFromTray", imageId: image.id })}
        aria-label="Discard from page"
        title="Removes the photo from this page. It stays in your library."
        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-background border border-rule text-muted hover:text-red-400 hover:border-red-400 text-[10px] leading-none flex items-center justify-center"
      >
        ×
      </button>
      {/* Touch has no drag: a tiny placement menu instead (desktop drags). */}
      {placeTargets.length > 0 && (
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) dispatch({ type: "trayToSection", imageId: image.id, sectionId: e.target.value });
          }}
          aria-label="Place photo in a section"
          className="lg:hidden mt-0.5 w-12 bg-transparent border border-rule text-[9px] text-muted py-0.5"
        >
          <option value="">Place…</option>
          {placeTargets.map((s) => (
            <option key={s.id} value={s.id}>
              {SECTION_LABELS[s.type]} {sections.indexOf(s) + 1}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export function SectionList({
  id,
  document,
  selectedId,
  theme,
  dispatch,
  onSelect,
  hiFiUploads = false,
  pageCapacityLeft = Infinity,
}: {
  // Stable DndContext id — without it dnd-kit's global counter diverges
  // between server and client (the list mounts twice: aside + sheet) and
  // hydration logs an aria-describedby mismatch.
  id: string;
  document: PageDocument;
  selectedId: string | null;
  theme: string;
  dispatch: React.Dispatch<EditorAction>;
  onSelect?: () => void;
  hiFiUploads?: boolean;
  /** Photos still allowed on this page (plan limit minus everything placed + tray). */
  pageCapacityLeft?: number;
}) {
  // An empty page opens straight onto the add menu — the first decision
  // a new user has to make is the one the menu explains.
  const [adding, setAdding] = useState(document.sections.length === 0);
  const [trayOpen, setTrayOpen] = useState(trayImages(document).length > 0);
  const tray = trayImages(document);
  const { overTarget, draggingId } = useImageDrag();
  const featured = getTheme(theme).featuredSections;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const toIndex = document.sections.findIndex((s) => s.id === over.id);
    dispatch({ type: "moveSection", id: String(active.id), toIndex });
  }

  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="flex-1 min-h-0 overflow-y-auto">
        {document.sections.length === 0 ? (
          <div className="p-4">
            <p className="text-[10px] uppercase tracking-wide text-muted mb-3">
              Start from a template
            </p>
            <ul className="flex flex-col gap-2" aria-label="Page templates">
              {PAGE_TEMPLATES.map((template) => (
                <li key={template.id}>
                  <button
                    onClick={() => dispatch({ type: "applyTemplate", templateId: template.id })}
                    className="w-full text-left border border-rule hover:border-accent transition-colors px-3 py-2.5"
                  >
                    <span className="block font-heading text-[14px] italic text-foreground">
                      {template.name}
                    </span>
                    <span className="block mt-1 text-[11px] leading-snug text-muted font-copy">
                      {template.description}
                    </span>
                    <span className="block mt-1.5 text-[10px] leading-snug text-muted/70 font-copy">
                      {TEMPLATE_STRUCTURES.get(template.id)}
                    </span>
                    <span className="block mt-0.5 text-[10px] text-muted/70 font-copy">
                      Pairs well with {template.pairsWith}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] leading-snug text-muted font-copy">
              A template only sets up sections; you can reorder, convert or delete them, and
              undo puts things back. Or skip it and build your own below.
            </p>
          </div>
        ) : (
          <DndContext id={id} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={document.sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul>
                {document.sections.map((section, index) => (
                  <SortableRow
                    key={section.id}
                    section={section}
                    index={index}
                    total={document.sections.length}
                    selected={section.id === selectedId}
                    onSelect={() => {
                      dispatch({ type: "selectSection", id: section.id });
                      onSelect?.();
                    }}
                    dispatch={dispatch}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* ── Tray: photos on the page, not yet placed ────────── */}
      <div
        className={`shrink-0 border-t border-rule ${
          draggingId !== null && overTarget === "tray" ? "bg-surface" : ""
        }`}
        data-img-drop="tray"
      >
        <button
          onClick={() => setTrayOpen((v) => !v)}
          aria-expanded={trayOpen}
          className="w-full flex items-center justify-between px-3 py-2 text-[10px] uppercase tracking-wide text-muted hover:text-foreground transition-colors"
        >
          <span>Tray{tray.length > 0 ? ` · ${tray.length}` : ""}</span>
          <span aria-hidden>{trayOpen ? "▾" : "▸"}</span>
        </button>
        {trayOpen && (
          <div className="px-3 pb-3">
            {tray.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-2.5">
                {tray.map((image, index) => (
                  <TrayThumb
                    key={image.id}
                    image={image}
                    index={index}
                    sections={document.sections}
                    dispatch={dispatch}
                  />
                ))}
              </div>
            ) : (
              <p className="text-[11px] leading-snug text-muted font-copy mb-2">
                Photos you upload here wait on the page until you place them. Drag one onto a
                section, or use Fill to place them all in order.
              </p>
            )}
            {tray.length > 0 && (
              <button
                onClick={() => dispatch({ type: "fillFromTray" })}
                className="w-full mb-2 py-2 text-[10px] uppercase tracking-wide border border-rule hover:border-accent text-foreground transition-colors"
                title="Places tray photos into your sections, top to bottom. Undo brings them back."
              >
                Fill sections in order
              </button>
            )}
            <MediaUploader
              compact
              capacityLeft={pageCapacityLeft}
              hiFi={hiFiUploads}
              onUploaded={(images) => dispatch({ type: "addToTray", images })}
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <LibraryPicker
                onPicked={(images) => dispatch({ type: "addToTray", images })}
                capacityLeft={pageCapacityLeft}
              />
              {pageCapacityLeft !== Infinity && (
                <span className="text-[10px] text-muted/70 font-copy">
                  {pageCapacityLeft} left on this page
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-rule p-3 max-h-[60%] overflow-y-auto">
        {adding ? (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wide text-muted">Add section</span>
              <button onClick={() => setAdding(false)} className="text-muted hover:text-foreground" aria-label="Close add menu">
                ×
              </button>
            </div>
            {SECTION_GROUPS.map(({ group, types }) => (
              <div key={group} className="mt-2.5">
                <p className="text-[9px] uppercase tracking-label text-muted/60 mb-1">{group}</p>
                <div className="space-y-1">
                  {types.map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        dispatch({ type: "addSection", sectionType: type, afterId: selectedId });
                        setAdding(false);
                      }}
                      className="w-full px-2 py-1.5 text-left border border-rule hover:border-accent transition-colors group/add"
                    >
                      <span className="flex items-center gap-1.5 text-[11px] text-foreground/85 group-hover/add:text-foreground">
                        <SectionGlyph type={type} className="shrink-0 opacity-70" />
                        {SECTION_LABELS[type]}
                        {featured.includes(type) && (
                          <span
                            className="ml-auto w-1 h-1 rounded-full bg-accent shrink-0"
                            title={`Suits the ${getTheme(theme).name} theme`}
                            aria-label={`Suits the ${getTheme(theme).name} theme`}
                          />
                        )}
                      </span>
                      <span className="block text-[10.5px] leading-snug text-muted font-copy mt-0.5">
                        {SECTION_DESCRIPTIONS[type]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <p className="mt-3 text-[10px] leading-snug text-muted/70 font-copy">
              Large photos always stack vertically on phones, whatever the layout.
            </p>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full py-2.5 text-[10px] uppercase tracking-wide border border-rule hover:border-accent text-foreground transition-colors"
          >
            + Add section
          </button>
        )}
      </div>
    </div>
  );
}
