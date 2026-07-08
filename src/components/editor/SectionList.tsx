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
  sectionImages,
  type PageDocument,
  type Section,
} from "@/lib/page-document";
import { SECTION_GROUPS, SECTION_DESCRIPTIONS, SectionGlyph } from "./section-meta";
import { getTheme } from "@/themes/registry";
import type { EditorAction } from "@/lib/editor/reducer";

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

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group border-b border-rule ${isDragging ? "opacity-60 z-10" : ""}`}
    >
      <div
        className={`flex items-stretch ${selected ? "bg-surface" : "hover:bg-surface/60"} transition-colors`}
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

export function SectionList({
  id,
  document,
  selectedId,
  theme,
  dispatch,
  onSelect,
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
}) {
  // An empty page opens straight onto the add menu — the first decision
  // a new user has to make is the one the menu explains.
  const [adding, setAdding] = useState(document.sections.length === 0);
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
          <p className="p-4 text-[12px] text-muted font-copy">
            No sections yet — add your first one below.
          </p>
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
