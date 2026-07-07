"use client";

// ─── Section inspector ───────────────────────────────────────────────
// Editing controls for the selected section: type-specific fields plus
// the image manager. Includes duplicate/delete and safe type conversion
// between image-collection section types.

import {
  SECTION_LABELS,
  sectionImageCapacity,
  sectionImages,
  type Section,
  type SectionType,
} from "@/lib/page-document";
import type { EditorAction } from "@/lib/editor/reducer";
import { ImageManager } from "./ImageManager";

const fieldLabel = "text-[9px] uppercase tracking-label text-accent block mb-1.5";
const textInput =
  "w-full bg-transparent border border-rule focus:border-accent px-3 py-2 text-[13px] text-foreground placeholder:text-muted/40 focus:outline-none font-copy";

/** Collection types a section can convert between without losing images. */
const CONVERTIBLE: SectionType[] = ["grid", "contact-sheet", "sequence", "row", "split"];

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className={fieldLabel}>{label}</label>
      <div className="flex flex-wrap gap-1">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            className={`px-2.5 py-1.5 text-[11px] border transition-colors ${
              value === option.value
                ? "border-accent text-foreground"
                : "border-rule text-muted hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SectionInspector({
  section,
  dispatch,
  hiFiUploads = false,
}: {
  section: Section | null;
  dispatch: React.Dispatch<EditorAction>;
  hiFiUploads?: boolean;
}) {
  if (!section) {
    return (
      <p className="text-[12px] text-muted font-copy">
        Select a section to edit it, or add one from the section list.
      </p>
    );
  }

  const patch = (fields: Record<string, unknown>, coalesceField?: string) =>
    dispatch({
      type: "updateSection",
      id: section.id,
      patch: fields,
      coalesceKey: coalesceField ? `${section.id}:${coalesceField}` : undefined,
    });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] uppercase tracking-wide text-muted">
          {SECTION_LABELS[section.type]}
        </h2>
        <div className="flex gap-3 text-[10px] uppercase tracking-wide">
          <button
            onClick={() => dispatch({ type: "duplicateSection", id: section.id })}
            className="text-muted hover:text-foreground transition-colors"
          >
            Duplicate
          </button>
          <button
            onClick={() => dispatch({ type: "deleteSection", id: section.id })}
            className="text-muted hover:text-red-400 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* ── Type-specific fields ── */}
      {section.type === "hero" && (
        <>
          <div>
            <label className={fieldLabel}>Title</label>
            <input
              value={section.title}
              onChange={(e) => patch({ title: e.target.value }, "title")}
              className={textInput}
              placeholder="Series title"
            />
          </div>
          <div>
            <label className={fieldLabel}>Subtitle</label>
            <input
              value={section.subtitle}
              onChange={(e) => patch({ subtitle: e.target.value }, "subtitle")}
              className={textInput}
              placeholder="Optional subtitle"
            />
          </div>
          <Select
            label="Height"
            value={section.height}
            options={[
              { value: "full", label: "Full screen" },
              { value: "half", label: "Banner" },
            ]}
            onChange={(height) => patch({ height })}
          />
        </>
      )}

      {section.type === "heading" && (
        <>
          <div>
            <label className={fieldLabel}>Title</label>
            <input
              value={section.title}
              onChange={(e) => patch({ title: e.target.value }, "title")}
              className={textInput}
            />
          </div>
          <div>
            <label className={fieldLabel}>Subtitle</label>
            <input
              value={section.subtitle}
              onChange={(e) => patch({ subtitle: e.target.value }, "subtitle")}
              className={textInput}
            />
          </div>
          <Select
            label="Level"
            value={String(section.level)}
            options={[
              { value: "1", label: "Chapter" },
              { value: "2", label: "Sub-heading" },
            ]}
            onChange={(level) => patch({ level: Number(level) })}
          />
        </>
      )}

      {section.type === "text" && (
        <>
          <div>
            <label className={fieldLabel}>Text</label>
            <textarea
              value={section.body}
              onChange={(e) => patch({ body: e.target.value }, "body")}
              rows={8}
              className={`${textInput} resize-y leading-relaxed`}
              placeholder="Write something…"
            />
          </div>
          <Select
            label="Alignment"
            value={section.align}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Centred" },
            ]}
            onChange={(align) => patch({ align })}
          />
        </>
      )}

      {section.type === "quote" && (
        <>
          <div>
            <label className={fieldLabel}>Quote</label>
            <textarea
              value={section.text}
              onChange={(e) => patch({ text: e.target.value }, "text")}
              rows={4}
              className={`${textInput} resize-y`}
            />
          </div>
          <div>
            <label className={fieldLabel}>Attribution</label>
            <input
              value={section.attribution}
              onChange={(e) => patch({ attribution: e.target.value }, "attribution")}
              className={textInput}
              placeholder="Who said it (optional)"
            />
          </div>
        </>
      )}

      {section.type === "image" && (
        <Select
          label="Width"
          value={section.width}
          options={[
            { value: "text", label: "Column" },
            { value: "wide", label: "Wide" },
            { value: "full", label: "Full bleed" },
          ]}
          onChange={(width) => patch({ width })}
        />
      )}

      {section.type === "grid" && (
        <>
          <Select
            label="Columns"
            value={String(section.columns)}
            options={[
              { value: "2", label: "2" },
              { value: "3", label: "3" },
              { value: "4", label: "4" },
            ]}
            onChange={(columns) => patch({ columns: Number(columns) })}
          />
          <Select
            label="Spacing"
            value={section.gap}
            options={[
              { value: "tight", label: "Tight" },
              { value: "regular", label: "Regular" },
              { value: "loose", label: "Loose" },
            ]}
            onChange={(gap) => patch({ gap })}
          />
        </>
      )}

      {section.type === "contact-sheet" && (
        <Select
          label="Frame numbers"
          value={section.numbered ? "on" : "off"}
          options={[
            { value: "on", label: "Numbered" },
            { value: "off", label: "Plain" },
          ]}
          onChange={(v) => patch({ numbered: v === "on" })}
        />
      )}

      {section.type === "spacer" && (
        <>
          <Select
            label="Size"
            value={section.size}
            options={[
              { value: "small", label: "Small" },
              { value: "medium", label: "Medium" },
              { value: "large", label: "Large" },
            ]}
            onChange={(size) => patch({ size })}
          />
          <Select
            label="Divider"
            value={section.divider ? "on" : "off"}
            options={[
              { value: "off", label: "None" },
              { value: "on", label: "Rule" },
            ]}
            onChange={(v) => patch({ divider: v === "on" })}
          />
        </>
      )}

      {/* ── Convert between collection layouts ── */}
      {CONVERTIBLE.includes(section.type) && (
        <Select
          label="Layout"
          value={section.type}
          options={CONVERTIBLE.map((t) => ({ value: t, label: SECTION_LABELS[t] }))}
          onChange={(nextType) => {
            if (nextType === section.type) return;
            const capacity = sectionImageCapacity(nextType as SectionType);
            const count = sectionImages(section).length;
            if (capacity !== Infinity && count > capacity) {
              // Refuse silently-destructive conversions; the message guides the user.
              alert(
                `${SECTION_LABELS[nextType as SectionType]} holds ${capacity} image${capacity === 1 ? "" : "s"} — remove ${count - capacity} first.`
              );
              return;
            }
            dispatch({ type: "convertSection", id: section.id, toType: nextType as SectionType });
          }}
        />
      )}

      {/* ── Images ── */}
      {sectionImageCapacity(section.type) > 0 && (
        <div>
          <label className={fieldLabel}>
            {sectionImageCapacity(section.type) === 1 ? "Image" : "Images"}
          </label>
          <ImageManager section={section} dispatch={dispatch} hiFiUploads={hiFiUploads} />
        </div>
      )}
    </div>
  );
}
