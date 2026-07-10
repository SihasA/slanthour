"use client";

// ─── Editor shell ────────────────────────────────────────────────────
// Owns editor state (reducer), autosave, undo/redo shortcuts, and the
// responsive layout: three panes on desktop, sheet-based panels on mobile.

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  canRedo,
  canUndo,
  editorReducer,
  initialEditorState,
  type EditorContent,
} from "@/lib/editor/reducer";
import { countImages, displaySettings } from "@/lib/page-document";
import { savePageDraft, publishPage, unpublishPage } from "@/lib/actions/pages";
import { getProfileEntitlements } from "@/lib/entitlements";
import { resolveWatermarkLabel } from "@/lib/watermark";
import { PageRenderer } from "@/themes/PageRenderer";
import type { Page, Profile } from "@/types";
import type { ThemeSettings } from "@/themes/types";
import { SectionList } from "./SectionList";
import { SectionInspector } from "./SectionInspector";
import { ThemePanel } from "./ThemePanel";
import { PagePanel } from "./PagePanel";
import { ImageDragProvider } from "./ImageDrag";

type SaveState = "saved" | "dirty" | "saving" | "error" | "conflict";
type PanelId = "inspect" | "theme" | "page";
type Device = "desktop" | "mobile";

const AUTOSAVE_DELAY_MS = 1200;

export function Editor({ page, profile }: { page: Page; profile: Profile }) {
  const router = useRouter();
  // Computed once: the corner-stamp text baked into watermarked variants at
  // upload (all tiers). Never touches ProfileSettingsForm/avatars — only
  // passed to page-photo uploaders below.
  const watermarkLabel = resolveWatermarkLabel(profile.display_name, profile.username);
  const [state, dispatch] = useReducer(
    editorReducer,
    initialEditorState({
      document: page.draft,
      title: page.title,
      theme: page.theme,
      themeSettings: page.theme_settings as ThemeSettings,
    })
  );
  const [panel, setPanel] = useState<PanelId>("inspect");
  const [mobilePanel, setMobilePanel] = useState<"sections" | PanelId | null>(null);
  const [device, setDevice] = useState<Device>("desktop");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [publishState, setPublishState] = useState<{ busy: boolean; message: string | null; url: string | null }>({ busy: false, message: null, url: null });
  const [isPublished, setIsPublished] = useState(page.is_published);

  // Refs so the debounced save always sees the latest content/revision.
  const revRef = useRef(page.draft_rev);
  const contentRef = useRef<EditorContent>(state.content);
  contentRef.current = state.content;
  const inFlightRef = useRef<Promise<boolean> | null>(null);
  const saveStateRef = useRef<SaveState>("saved");
  saveStateRef.current = saveState;

  // Drains the latest content to the server, re-saving on top of the new
  // revision if content changed mid-flight, until the persisted content
  // matches what's in memory.
  const runSave = useCallback(async (): Promise<boolean> => {
    for (;;) {
      const content = contentRef.current;
      setSaveState("saving");
      const result = await savePageDraft(
        page.id,
        {
          document: content.document,
          title: content.title,
          theme: content.theme,
          themeSettings: content.themeSettings,
        },
        revRef.current
      );
      if (!result.ok) {
        setSaveState(result.conflict ? "conflict" : "error");
        return false;
      }
      revRef.current = result.rev;
      if (contentRef.current === content) {
        setSaveState("saved");
        return true;
      }
      // Content changed while this save was in flight — loop and save the
      // latest content on top of the new revision.
    }
  }, [page.id]);

  // Coalesces concurrent callers onto the same in-flight save so a publish
  // racing an autosave awaits a truthful result instead of a spurious
  // "already saving" failure.
  const saveNow = useCallback((): Promise<boolean> => {
    if (inFlightRef.current) return inFlightRef.current;
    const p = runSave().finally(() => {
      inFlightRef.current = null;
    });
    inFlightRef.current = p;
    return p;
  }, [runSave]);

  // Debounced autosave whenever content changes.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (saveStateRef.current === "conflict") return;
    setSaveState("dirty");
    const timer = setTimeout(() => void saveNow(), AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [state.changeCount, saveNow]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (saveStateRef.current === "dirty" || saveStateRef.current === "saving" || saveStateRef.current === "error") {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // Undo/redo keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        dispatch({ type: e.shiftKey ? "redo" : "undo" });
      } else if (e.key.toLowerCase() === "y") {
        e.preventDefault();
        dispatch({ type: "redo" });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  async function handlePublish() {
    setPublishState({ busy: true, message: null, url: null });
    if (saveStateRef.current !== "saved") {
      const saved = await saveNow();
      if (!saved) {
        setPublishState({ busy: false, message: "Save failed. Fix the save error before publishing.", url: null });
        return;
      }
    }
    const result = await publishPage(page.id);
    if (result.ok) {
      setIsPublished(true);
      setPublishState({ busy: false, message: "Published", url: result.url });
    } else {
      setPublishState({ busy: false, message: result.error, url: null });
      setPanel("page");
      setMobilePanel((current) => (current ? "page" : current));
    }
  }

  async function handleUnpublish() {
    const result = await unpublishPage(page.id);
    if (result.ok) {
      setIsPublished(false);
      setPublishState({ busy: false, message: "Unpublished. The page is no longer public.", url: null });
    } else {
      setPublishState({ busy: false, message: result.error, url: null });
    }
  }

  const selectedSection = useMemo(
    () => state.content.document.sections.find((s) => s.id === state.selectedSectionId) ?? null,
    [state.content.document.sections, state.selectedSectionId]
  );

  const saveLabel: Record<SaveState, string> = {
    saved: "Saved",
    dirty: "Unsaved changes",
    saving: "Saving…",
    error: "Save failed",
    conflict: "Edited elsewhere",
  };

  const panelContent = (id: PanelId) =>
    id === "inspect" ? (
      <SectionInspector
        section={selectedSection}
        allSections={state.content.document.sections}
        theme={state.content.theme}
        dispatch={dispatch}
        hiFiUploads={getProfileEntitlements(profile).hiFiUploads}
        watermarkLabel={watermarkLabel}
        pageCapacityLeft={Math.max(
          0,
          getProfileEntitlements(profile).maxImagesPerPage - countImages(state.content.document)
        )}
      />
    ) : id === "theme" ? (
      <ThemePanel content={state.content} dispatch={dispatch} />
    ) : (
      <PagePanel
        pageId={page.id}
        initialSlug={page.slug}
        initialVisibility={page.visibility}
        hasPassword={!!page.password_hash}
        isPublished={isPublished}
        username={profile.username}
        title={state.content.title}
        onTitleChange={(title) =>
          dispatch({ type: "setTitle", title, coalesceKey: "page-title" })
        }
        display={displaySettings(state.content.document)}
        onDisplayChange={(patch) => dispatch({ type: "setDisplaySettings", patch })}
        onUnpublish={handleUnpublish}
        onDeleteNavigate={() => router.push("/dashboard")}
      />
    );

  const tabButton = (id: PanelId, label: string) => (
    <button
      key={id}
      onClick={() => setPanel(id)}
      aria-pressed={panel === id}
      className={`px-3 py-2 text-[10px] uppercase tracking-wide border-b-2 transition-colors ${
        panel === id
          ? "border-accent text-foreground"
          : "border-transparent text-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="h-svh flex flex-col bg-background text-foreground">
      <ImageDragProvider dispatch={dispatch}>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-rule px-3 sm:px-5 h-14 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-[10px] uppercase tracking-wide text-muted hover:text-foreground transition-colors shrink-0"
        >
          ← Pages
        </Link>

        <input
          value={state.content.title}
          onChange={(e) =>
            dispatch({ type: "setTitle", title: e.target.value, coalesceKey: "page-title" })
          }
          aria-label="Page title"
          placeholder="Untitled"
          className="flex-1 min-w-0 bg-transparent font-heading italic text-lg text-foreground placeholder:text-muted/40 focus:outline-none border-b border-transparent focus:border-accent transition-colors"
        />

        <div className="hidden sm:flex items-center gap-1">
          <button
            onClick={() => dispatch({ type: "undo" })}
            disabled={!canUndo(state)}
            aria-label="Undo"
            title="Undo (⌘Z)"
            className="px-2 py-1 text-muted hover:text-foreground disabled:opacity-30 transition-colors"
          >
            ↩
          </button>
          <button
            onClick={() => dispatch({ type: "redo" })}
            disabled={!canRedo(state)}
            aria-label="Redo"
            title="Redo (⇧⌘Z)"
            className="px-2 py-1 text-muted hover:text-foreground disabled:opacity-30 transition-colors"
          >
            ↪
          </button>
        </div>

        {/* Save state */}
        <div className="shrink-0 flex items-center gap-2" role="status" aria-live="polite">
          <span
            className={`text-[10px] uppercase tracking-wide ${
              saveState === "error" || saveState === "conflict"
                ? "text-red-400"
                : saveState === "saved"
                  ? "text-muted"
                  : "text-accent"
            }`}
          >
            {saveLabel[saveState]}
          </span>
          {saveState === "error" && (
            <button
              onClick={() => void saveNow()}
              className="text-[10px] uppercase tracking-wide text-accent underline underline-offset-2"
            >
              Retry
            </button>
          )}
        </div>

        {/* Device toggle */}
        <div className="hidden md:flex border border-rule" role="group" aria-label="Preview device">
          {(["desktop", "mobile"] as Device[]).map((d) => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              aria-pressed={device === d}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-wide transition-colors ${
                device === d ? "bg-foreground text-background" : "text-muted hover:text-foreground"
              }`}
            >
              {d === "desktop" ? "Desktop" : "Mobile"}
            </button>
          ))}
        </div>

        <button
          onClick={() => void handlePublish()}
          disabled={publishState.busy}
          className="shrink-0 px-4 py-2 text-[10px] uppercase tracking-wide bg-accent text-background hover:bg-foreground transition-colors disabled:opacity-40"
        >
          {publishState.busy ? "…" : isPublished ? "Republish" : "Publish"}
        </button>
      </header>

      {/* Publish / conflict banners */}
      {publishState.message && (
        <div className="shrink-0 px-5 py-2 text-[12px] border-b border-rule flex items-center gap-3 bg-surface" role="status">
          <span className={publishState.url ? "text-accent" : "text-red-400"}>{publishState.message}</span>
          {publishState.url && (
            <a href={publishState.url} target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-2">
              View page ↗
            </a>
          )}
          <button onClick={() => setPublishState((s) => ({ ...s, message: null, url: null }))} className="ml-auto text-muted hover:text-foreground" aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
      {saveState === "conflict" && (
        <div className="shrink-0 px-5 py-2 text-[12px] border-b border-rule bg-surface text-red-400 flex items-center gap-3" role="alert">
          This page was changed in another tab or session. Reload to pick up the latest version; unsaved changes here will be lost.
          <button onClick={() => window.location.reload()} className="text-foreground underline underline-offset-2">
            Reload
          </button>
        </div>
      )}

      {/* ── Body ───────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex">
        {/* Left: section list (desktop) */}
        <aside className="hidden lg:flex w-[250px] shrink-0 border-r border-rule flex-col min-h-0">
          <SectionList
            id="sections-desktop"
            document={state.content.document}
            selectedId={state.selectedSectionId}
            theme={state.content.theme}
            dispatch={dispatch}
            hiFiUploads={getProfileEntitlements(profile).hiFiUploads}
            watermarkLabel={watermarkLabel}
            pageCapacityLeft={Math.max(
              0,
              getProfileEntitlements(profile).maxImagesPerPage - countImages(state.content.document)
            )}
          />
        </aside>

        {/* Centre: live preview */}
        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto bg-[#070606]">
          <div
            className={`relative min-h-full mx-auto transition-[max-width] duration-300 ${
              device === "mobile" ? "max-w-[390px] border-x border-rule my-4 shadow-2xl" : ""
            }`}
          >
            <PageRenderer
              document={state.content.document}
              theme={state.content.theme}
              themeSettings={state.content.themeSettings}
              title={state.content.title}
              author={{ displayName: profile.display_name, username: profile.username }}
              mode="preview"
            />
            {state.content.document.sections.length === 0 && (
              <div className="absolute inset-x-0 top-1/3 text-center px-6 pointer-events-none">
                <p className="text-muted text-sm font-copy">
                  This page is empty. Add a section to begin: a hero, a grid of photos, some text.
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Right: inspector (desktop) */}
        <aside className="hidden lg:flex w-[320px] shrink-0 border-l border-rule flex-col min-h-0">
          <div className="shrink-0 flex border-b border-rule px-2">
            {tabButton("inspect", "Section")}
            {tabButton("theme", "Theme")}
            {tabButton("page", "Page")}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-4">{panelContent(panel)}</div>
        </aside>
      </div>

      {/* ── Mobile toolbar + sheets ────────────────────────── */}
      <nav className="lg:hidden shrink-0 border-t border-rule grid grid-cols-4 bg-background" aria-label="Editor panels">
        {(
          [
            ["sections", "Sections"],
            ["inspect", "Edit"],
            ["theme", "Theme"],
            ["page", "Page"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setMobilePanel((current) => (current === id ? null : id))}
            aria-expanded={mobilePanel === id}
            className={`py-3 text-[10px] uppercase tracking-wide transition-colors ${
              mobilePanel === id ? "text-accent" : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {mobilePanel && (
        <div className="lg:hidden fixed inset-0 z-40" role="dialog" aria-modal="true">
          <button
            aria-label="Close panel"
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobilePanel(null)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[75svh] bg-background border-t border-rule flex flex-col">
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-rule">
              <span className="text-[10px] uppercase tracking-wide text-muted">
                {mobilePanel === "sections" ? "Sections" : mobilePanel === "inspect" ? "Edit section" : mobilePanel === "theme" ? "Theme" : "Page settings"}
              </span>
              <button onClick={() => setMobilePanel(null)} className="text-muted hover:text-foreground text-xl leading-none" aria-label="Close">
                ×
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
              {mobilePanel === "sections" ? (
                <SectionList
                  id="sections-mobile"
                  document={state.content.document}
                  selectedId={state.selectedSectionId}
                  theme={state.content.theme}
                  dispatch={dispatch}
                  onSelect={() => setMobilePanel("inspect")}
                  hiFiUploads={getProfileEntitlements(profile).hiFiUploads}
                  watermarkLabel={watermarkLabel}
                  pageCapacityLeft={Math.max(
                    0,
                    getProfileEntitlements(profile).maxImagesPerPage -
                      countImages(state.content.document)
                  )}
                />
              ) : (
                panelContent(mobilePanel)
              )}
            </div>
          </div>
        </div>
      )}
      </ImageDragProvider>
    </div>
  );
}
