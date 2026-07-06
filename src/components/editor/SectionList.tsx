"use client";

// ─── Section list ────────────────────────────────────────────────────
// Ordered structure of the page: select, reorder (drag or keyboard
// buttons), add, duplicate, delete.

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
  type SectionType,
} from "@/lib/page-document";
import type { EditorAction } from "@/lib/editor/reducer";

const ADDABLE: SectionType[] = [
  "hero",
  "image",
  "split",
  "row",
  "grid",
  "contact-sheet",
  "sequence",
  "text",
  "heading",
  "quote",
  "spacer",
];

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
          <span className={`block text-[10px] uppercase tracking-wide ${selected ? "text-accent" : "text-muted"}`}>
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
  document,
  selectedId,
  dispatch,
  onSelect,
}: {
  document: PageDocument;
  selectedId: string | null;
  dispatch: React.Dispatch<EditorAction>;
  onSelect?: () => void;
}) {
  const [adding, setAdding] = useState(false);
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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

      <div className="shrink-0 border-t border-rule p-3">
        {adding ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wide text-muted">Add section</span>
              <button onClick={() => setAdding(false)} className="text-muted hover:text-foreground" aria-label="Close add menu">
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {ADDABLE.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    dispatch({ type: "addSection", sectionType: type, afterId: selectedId });
                    setAdding(false);
                  }}
                  className="px-2 py-2 text-left text-[11px] border border-rule hover:border-accent text-foreground/80 hover:text-foreground transition-colors"
                >
                  {SECTION_LABELS[type]}
                </button>
              ))}
            </div>
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
