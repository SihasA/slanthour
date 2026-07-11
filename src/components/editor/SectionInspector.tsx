"use client";

// ─── Section inspector ───────────────────────────────────────────────
// Editing controls for the selected section: type-specific fields plus
// the image manager. Includes duplicate/delete and safe type conversion
// between image-collection section types. Controls a theme ignores are
// hidden with a note rather than shown dead.

import { useState } from "react";
import {
  SECTION_LABELS,
  sectionImageCapacity,
  sectionImages,
  type Section,
  type SectionType,
} from "@/lib/page-document";
import {
  SECTION_DESCRIPTIONS,
  SectionGlyph,
  sectionMobileNote,
  gridColumnsApply,
  gridGapApplies,
  frameNumbersApply,
} from "./section-meta";
import { getTheme } from "@/themes/registry";
import type { EditorAction } from "@/lib/editor/reducer";
import { ImageManager } from "./ImageManager";

const fieldLabel = "text-[9px] uppercase tracking-label text-accent block mb-1.5";
const textInput =
  "w-full bg-transparent border border-rule focus:border-accent px-3 py-2 text-[13px] text-foreground placeholder:text-muted/40 focus:outline-none font-copy";
const themeNote = "text-[10px] leading-snug text-muted/70 font-copy";

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
  allSections = [],
  theme,
  dispatch,
  hiFiUploads = false,
  watermarkLabel,
  pageCapacityLeft = Infinity,
}: {
  section: Section | null;
  /** Full section list, for cross-section photo moves. */
  allSections?: Section[];
  theme: string;
  dispatch: React.Dispatch<EditorAction>;
  hiFiUploads?: boolean;
  watermarkLabel?: string;
  /** Images still addable to the page under the plan cap (Infinity = no cap). */
  pageCapacityLeft?: number;
}) {
  // Conversion refusals surface inline, scoped to the section they refer to.
  const [convertError, setConvertError] = useState<{ id: string; message: string } | null>(null);

  if (!section) {
    return (
      <p className="text-[12px] text-muted font-copy leading-relaxed">
        Nothing selected. A page is a stack of sections (photos, headings, text) added from
        the section list. Select one there to edit it.
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

  const mobileNote = sectionMobileNote(section.type);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted">
            <SectionGlyph type={section.type} className="shrink-0 opacity-70" />
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
              title="Remove section (⌘Z undoes)"
              className="text-muted hover:text-red-400 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
        <p className="mt-1.5 text-[11px] leading-snug text-muted font-copy">
          {SECTION_DESCRIPTIONS[section.type]}
        </p>
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
          {gridColumnsApply(theme) ? (
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
          ) : (
            <p className={themeNote}>
              {getTheme(theme).name} sets grid density in Theme settings.
            </p>
          )}
          {gridGapApplies(theme) && (
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
          )}
        </>
      )}

      {section.type === "contact-sheet" &&
        (frameNumbersApply(theme) ? (
          <Select
            label="Frame numbers"
            value={section.numbered ? "on" : "off"}
            options={[
              { value: "on", label: "Numbered" },
              { value: "off", label: "Plain" },
            ]}
            onChange={(v) => patch({ numbered: v === "on" })}
          />
        ) : (
          <p className={themeNote}>This theme doesn&apos;t print frame numbers.</p>
        ))}

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
        <div>
          <label className={fieldLabel}>Layout</label>
          <div className="flex flex-wrap gap-1">
            {CONVERTIBLE.map((t) => (
              <button
                key={t}
                aria-pressed={t === section.type}
                onClick={() => {
                  if (t === section.type) return;
                  const capacity = sectionImageCapacity(t);
                  const count = sectionImages(section).length;
                  if (capacity !== Infinity && count > capacity) {
                    // Refuse silently-destructive conversions; the note guides the user.
                    setConvertError({
                      id: section.id,
                      message: `${SECTION_LABELS[t]} holds ${capacity} image${capacity === 1 ? "" : "s"}. Remove ${count - capacity} first.`,
                    });
                    return;
                  }
                  setConvertError(null);
                  dispatch({ type: "convertSection", id: section.id, toType: t });
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] border transition-colors ${
                  t === section.type
                    ? "border-accent text-foreground"
                    : "border-rule text-muted hover:text-foreground"
                }`}
              >
                <SectionGlyph type={t} className="shrink-0 opacity-70" />
                {SECTION_LABELS[t]}
              </button>
            ))}
          </div>
          {convertError && convertError.id === section.id && (
            <p className="mt-1.5 text-[11px] text-red-400 font-copy" role="alert">
              {convertError.message}
            </p>
          )}
          {mobileNote && <p className={`mt-1.5 ${themeNote}`}>{mobileNote}</p>}
        </div>
      )}

      {/* ── Images ── */}
      {sectionImageCapacity(section.type) > 0 && (
        <div>
          <label className={fieldLabel}>
            {sectionImageCapacity(section.type) === 1 ? "Image" : "Images"}
          </label>
          <ImageManager
            section={section}
            allSections={allSections}
            dispatch={dispatch}
            hiFiUploads={hiFiUploads}
            watermarkLabel={watermarkLabel}
            pageCapacityLeft={pageCapacityLeft}
          />
        </div>
      )}
    </div>
  );
}
