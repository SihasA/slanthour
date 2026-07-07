# Section Editor — UX Improvement Plan

Systematic review, 7 July 2026. Scope: the **editor UI only** — naming, tooltips,
affordances, first-run guidance. No published-page renderer changes anywhere in this plan.

**Protected, do not touch (founder directive):** Two-image split (`split`) and
three-image row (`row`) rendering and interaction — `src/themes/shared/PhotoRow.tsx`,
`src/themes/shared/photo-layout.ts`, and the `case "split"` / `case "row"` branches in
all five renderers. Labels and tooltips *around* them are fine; behavior is frozen.
Also frozen: the document schema — `SectionType` union strings, `sanitizeSection`,
`parseDocument`. All renames below are display labels only.

---

## Ground truth (verified in code)

11 section types, defined in `src/lib/page-document.ts:31-42`, labels at `:185-197`:
hero, image, split, row, grid, contact-sheet, sequence, text, heading, quote, spacer.

How the three "obscure" photo layouts actually differ:

- **Grid** — even columns of uniformly cropped thumbnails; user picks 2/3/4 columns.
  Crop ratio is per-theme (1:1 Monograph/After Dark, 4:5 Cabinet, photo-cards Keepsake,
  theme crop setting Roll 36).
- **Contact sheet** — a denser, theme-fixed grid of small thumbnails (4 col
  Monograph/After Dark, 3 col Keepsake, theme-scale Cabinet); Roll 36 renders a real
  bordered sheet with 3:2 frames and frame numbers (`roll36/Renderer.tsx:202-227`).
- **Sequence** — one photo after another, each full column width at natural aspect
  ratio (photo-essay scroll); themes vary the chrome.

**Mobile behavior (important for copy accuracy):** split/row/sequence/image/hero all
render photos **large and stacked single-column** on phones (`PhotoRow.tsx:59-72`,
640px breakpoint). Grid and contact sheet do **not** stack — they stay a grid of
smaller thumbnails (2-col; 3-col Roll 36 contact sheet; Keepsake single-col only
<480px). Copy below respects this distinction.

**Defects found during review:**
- Inspector shows controls that silently do nothing in most themes: grid **Columns**
  ignored by Roll 36; grid **Spacing** honored only by Monograph; contact-sheet
  **Frame numbers** honored only by Roll 36.
- `ThemeDefinition.featuredSections` (`themes/types.ts:59-62`) was built "for editor
  hints" and is consumed nowhere.
- Layout-conversion refusal uses a native `alert()` (`SectionInspector.tsx:300-305`).
- Empty-canvas message is `absolute` with no `relative` ancestor, so it centers over
  the whole viewport including the side rails (`Editor.tsx:349-355`).

---

## The plan, ordered by impact-per-effort

### 1. Add-section menu: grouping + one-line descriptions (M)

The add menu is the moment of maximum confusion — 11 undifferentiated text labels in a
2-col grid (`SectionList.tsx:199-212`). Group into **Photos / Words / Structure**, one
column, each item = glyph + name + muted 11px description. Put the metadata in a new
`src/components/editor/section-meta.tsx` (glyph + description per type) so
`page-document.ts` stays editor-agnostic.

Exact copy (each ≤90 chars, all verified true):

**Photos**
| Section | Description |
|---|---|
| Hero image | Full-screen or banner opener with your title over the photo. |
| Photo | One photo — reading-column, wide, or full-bleed. |
| Two-image split | Two photos side by side, matched to equal height. |
| Three-image row | Three photos across, matched to equal height. |
| Grid | Even columns of cropped thumbnails — you pick 2, 3 or 4 across. |
| Contact sheet | A dense sheet of small frames, like a darkroom contact sheet. |
| Photo sequence | Photos one after another, each full width at its natural size. |

**Words**
| Section | Description |
|---|---|
| Heading | A titled break between groups of photos. |
| Text | A paragraph or more of writing. |
| Quote | A pull quote, with optional attribution. |

**Structure**
| Section | Description |
|---|---|
| Spacer | Vertical breathing room, with an optional divider rule. |

### 2. Layout description in the inspector (S)

When a section is selected, the only identification is a 10px muted header. Under the
`<h2>` at `SectionInspector.tsx:87-89`, render the same `SECTION_META` description:
the current layout is then always explained in place.

### 3. Naming review (S)

`SECTION_LABELS` in `page-document.ts:185-197` — grep-verified as display-only
(consumed by `SectionList.tsx` and `SectionInspector.tsx`; never touches published pages).

| type | current | recommendation | rationale |
|---|---|---|---|
| hero | Hero image | keep | Universally understood. |
| image | Image | **rename → "Photo"** | Product voice is photo-first; "Image" is sterile. |
| split | Two-image split | keep | Name literally describes arrangement + count — that's why it works. |
| row | Three-image row | keep | Same. |
| grid | Grid | keep | Clear; the confusion is grid *vs.* others — solved by descriptions/glyphs. |
| contact-sheet | Contact sheet | keep | Real darkroom vocabulary matching the product aesthetic — helps *with* a tooltip. |
| sequence | Image sequence | **rename → "Photo sequence"** | "Image sequence" reads like an animation/slideshow. |
| text | Text | keep | Self-explanatory. |
| heading | Title | **rename → "Heading"** | "Title" collides with the page Title field; its own options are already "Chapter / Sub-heading". |
| quote | Quote | keep | Self-explanatory. |
| spacer | Spacer | keep | Description mentions the divider. |

(Optional consistency pass: "Two-photo split" / "Three-photo row" if unifying on
"photo" vocabulary — labels only, behavior untouched.)

### 4. The mobile note (S)

Two placements, truthful per layout:

1. **Inspector, under the Layout picker** (`SectionInspector.tsx:291-310`), conditional:
   - split / row / sequence: *"On phones these photos stack vertically, full width —
     see the Mobile preview."*
   - grid / contact-sheet: *"On phones this stays a grid of smaller thumbnails."*
2. **Add-menu footer** (static muted line, `SectionList.tsx:212`): *"Large photos
   always stack vertically on phones, whatever the layout."*

Both point at the existing Desktop/Mobile preview toggle (`Editor.tsx:276-289`) — the
strongest communication is already built; copy just needs to route people to it.

### 5. Mini layout glyphs (M)

~16×12 `currentColor` SVG schematics per type in `section-meta.tsx`:
hero = large rect + text line · photo = single rect · split = 2 tall rects ·
row = 3 rects · grid = 2×3 squares · contact sheet = bordered dense 4×3 ·
sequence = 3 stacked wide bars · heading = thick+thin line · text = 4 thin lines ·
quote = quotation mark · spacer = two lines with a gap.

Insertion points:
- Section list rows (`SectionList.tsx:101-107`)
- Add-menu items (`SectionList.tsx:200-211`)
- Inspector **Layout** picker — replace plain text chips at `SectionInspector.tsx:295`
  with glyph+label chips (keep `aria-pressed`), and echo the selected layout's
  description under the picker. This is the core "communicate the chosen layout"
  fix, since the Layout control is exactly where grid/contact-sheet/sequence/split/row
  are interchangeable.

### 6. Theme-aware control honesty (M)

Controls that do nothing erode trust more than obscure names. Pass
`theme={state.content.theme}` into `SectionInspector` (from `Editor.tsx:169-175`) and
show/hide accordingly (`SectionInspector.tsx:229-264`):

- grid + Roll 36: hide **Columns**/**Spacing**; note *"Roll 36 sets grid density in
  Theme settings."*
- grid + Keepsake/After Dark/Cabinet: hide **Spacing** (only Monograph honors `gap`).
- contact-sheet + any theme except Roll 36: hide **Frame numbers**; note *"Frame
  numbers appear in the Roll 36 theme."*

No renderer changes — purely which inspector controls display.

### 7. First-run guidance (S)

- Auto-open the add menu when the document is empty (`SectionList.tsx:143`).
- Inspector null state (`SectionInspector.tsx:68-74`): *"Nothing selected. A page is a
  stack of sections — photos, headings, text — added from the list on the left.
  Select one to edit it."* (mobile: "…from the Sections tab.")
- Empty canvas (`Editor.tsx:349-355`): add `relative` to the preview wrapper
  (`Editor.tsx:336`) to fix centering; copy: *"This page is empty. Add a section — a
  hero, a grid of photos, some text — to begin."*

### 8. "Suits this theme" badges in the add menu (S, after #1)

`featuredSections` already exists per theme and is unused. Pass `theme` into
`SectionList` (`Editor.tsx:326-332`, `:410-416`) and render a small accent dot /
"suits this theme" tag on matching items. Zero new data required.

### 9. Small fixes (S each)

- Replace the native `alert()` on refused layout conversion
  (`SectionInspector.tsx:300-305`) with an inline note below the Layout picker, same
  copy: "Two-image split holds 2 images — remove 3 first."
- Delete in the inspector header (`SectionInspector.tsx:90-103`): confirm-on-second-
  click (like PagePanel's delete) or `title="Remove section (⌘Z undoes)"`.
- Caption vs. alt in `ImageManager.tsx:42-71` rely on placeholders that vanish once
  filled. Add `title` tooltips: Caption — "Shown on the page, styled by the theme." /
  Alt — "Not shown — read by screen readers and search engines."

---

## Files touched (implementation)

- `src/components/editor/section-meta.tsx` — **new**: glyphs, descriptions, per-theme
  control visibility
- `src/components/editor/SectionList.tsx`
- `src/components/editor/SectionInspector.tsx`
- `src/components/editor/Editor.tsx`
- `src/lib/page-document.ts` — label strings only
