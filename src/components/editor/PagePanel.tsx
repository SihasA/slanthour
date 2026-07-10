"use client";

// ─── Page panel ──────────────────────────────────────────────────────
// Publication settings: link name (slug), visibility, page password,
// unpublish and delete. Slug availability is checked live; all rules are
// re-validated server-side.

import { useEffect, useState } from "react";
import {
  checkSlugAvailable,
  deletePage,
  updatePageSettings,
} from "@/lib/actions/pages";
import { validateSlug, validatePagePassword } from "@/lib/validation";
import type { PageDisplaySettings } from "@/lib/page-document";
import type { Visibility } from "@/types";

const fieldLabel = "text-[9px] uppercase tracking-label text-accent block mb-1.5";
const textInput =
  "w-full bg-transparent border border-rule focus:border-accent px-3 py-2 text-[13px] text-foreground placeholder:text-muted/40 focus:outline-none font-copy";

const VISIBILITY_OPTIONS: { value: Visibility; label: string; hint: string }[] = [
  { value: "public", label: "Public", hint: "Anyone can view; shown on your profile." },
  { value: "unlisted", label: "Unlisted", hint: "Only people with the link; hidden from your profile and search engines." },
  { value: "password", label: "Password", hint: "Visitors must enter a password you set." },
];

export function PagePanel({
  pageId,
  initialSlug,
  initialVisibility,
  hasPassword,
  isPublished,
  username,
  title,
  onTitleChange,
  display,
  onDisplayChange,
  onUnpublish,
  onDeleteNavigate,
}: {
  pageId: string;
  initialSlug: string;
  initialVisibility: Visibility;
  hasPassword: boolean;
  isPublished: boolean;
  username: string;
  title: string;
  onTitleChange: (title: string) => void;
  display: PageDisplaySettings;
  onDisplayChange: (patch: Partial<PageDisplaySettings>) => void;
  onUnpublish: () => void;
  onDeleteNavigate: () => void;
}) {
  const [slug, setSlug] = useState(initialSlug);
  const [savedSlug, setSavedSlug] = useState(initialSlug);
  const [slugStatus, setSlugStatus] = useState<string | null>(null);
  const [slugOk, setSlugOk] = useState(true);
  const [visibility, setVisibility] = useState<Visibility>(initialVisibility);
  const [password, setPassword] = useState("");
  const [passwordSet, setPasswordSet] = useState(hasPassword);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Live slug validation + availability.
  useEffect(() => {
    if (slug === savedSlug) {
      setSlugStatus(null);
      setSlugOk(true);
      return;
    }
    const check = validateSlug(slug);
    if (!check.ok) {
      setSlugStatus(check.error ?? "Invalid link name.");
      setSlugOk(false);
      return;
    }
    setSlugStatus("Checking…");
    const timer = setTimeout(async () => {
      const result = await checkSlugAvailable(pageId, slug);
      if (result.ok) {
        setSlugOk(result.available);
        setSlugStatus(result.available ? "Available" : "You already use this link name.");
      } else {
        setSlugOk(false);
        setSlugStatus(result.error);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [slug, savedSlug, pageId]);

  async function handleSave() {
    setStatus(null);
    if (!slugOk) return;
    if (visibility === "password" && !passwordSet && !password) {
      setStatus({ kind: "error", text: "Set a password for this page." });
      return;
    }
    if (password) {
      const check = validatePagePassword(password);
      if (!check.ok) {
        setStatus({ kind: "error", text: check.error ?? "Invalid password." });
        return;
      }
    }
    setBusy(true);
    const result = await updatePageSettings(pageId, {
      slug: slug !== savedSlug ? slug : undefined,
      visibility,
      password: password || undefined,
    });
    setBusy(false);
    if (result.ok) {
      setSavedSlug(result.slug);
      setSlug(result.slug);
      if (password) setPasswordSet(true);
      setPassword("");
      setStatus({
        kind: "ok",
        text: isPublished
          ? "Settings saved. Republish to apply the new snapshot if content changed."
          : "Settings saved.",
      });
    } else {
      setStatus({ kind: "error", text: result.error });
    }
  }

  async function handleDelete() {
    setBusy(true);
    const result = await deletePage(pageId);
    setBusy(false);
    if (result.ok) onDeleteNavigate();
    else setStatus({ kind: "error", text: result.error });
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="page-title" className={fieldLabel}>
          Title
        </label>
        <input
          id="page-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className={textInput}
        />
      </div>

      <div>
        <label htmlFor="page-slug" className={fieldLabel}>
          Link
        </label>
        <div className="flex items-center gap-1 text-[12px] font-copy text-muted">
          <span className="shrink-0">/{username}/</span>
          <input
            id="page-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            className={`${textInput} !py-1.5`}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        {slugStatus && (
          <p className={`mt-1 text-[11px] font-copy ${slugOk ? "text-accent" : "text-red-400"}`} role="status">
            {slugStatus}
          </p>
        )}
        {isPublished && slug !== savedSlug && (
          <p className="mt-1 text-[11px] text-muted font-copy">
            Changing the link means the old address stops working.
          </p>
        )}
      </div>

      <div>
        <span className={fieldLabel}>Visibility</span>
        <div className="space-y-1.5" role="radiogroup" aria-label="Visibility">
          {VISIBILITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              role="radio"
              aria-checked={visibility === option.value}
              onClick={() => setVisibility(option.value)}
              className={`w-full text-left border p-3 transition-colors ${
                visibility === option.value ? "border-accent" : "border-rule hover:border-muted"
              }`}
            >
              <span className={`block text-[12px] ${visibility === option.value ? "text-accent" : "text-foreground"}`}>
                {option.label}
              </span>
              <span className="block text-[11px] text-muted font-copy">{option.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {visibility === "password" && (
        <div>
          <label htmlFor="page-password" className={fieldLabel}>
            Page password
          </label>
          <input
            id="page-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={passwordSet ? "Password is set. Type to replace" : "Choose a password"}
            autoComplete="new-password"
            className={textInput}
          />
        </div>
      )}

      <div className="border-t border-rule pt-5">
        <span className={fieldLabel}>Photos</span>
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={display.protectPhotos}
            onChange={(e) => onDisplayChange({ protectPhotos: e.target.checked })}
            className="mt-0.5 accent-current"
          />
          <span>
            <span className="block text-[12px] text-foreground">Deter casual copying</span>
            <span className="block text-[11px] text-muted font-copy">
              Blocks right-click and drag on photos. It stops casual grabs, not screenshots;
              watermarks protect better.
            </span>
          </span>
        </label>

        <label className="mt-3 flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={display.watermark}
            onChange={(e) => onDisplayChange({ watermark: e.target.checked })}
            className="mt-0.5 accent-current"
          />
          <span>
            <span className="block text-[12px] text-foreground">Watermark published photos</span>
            <span className="block text-[11px] text-muted font-copy">
              Stamps your name on photos on the published page. Your editor and library stay
              clean, and you can turn it off any time without re-uploading. Photos added before
              this feature show unmarked until re-uploaded.
            </span>
          </span>
        </label>

        <div className="mt-4" role="radiogroup" aria-label="Photo resolution served">
          <span className="block text-[11px] text-muted font-copy mb-1.5">Resolution served to visitors</span>
          <div className="space-y-1.5">
            {(
              [
                { value: "full", label: "Full quality", hint: "Up to the largest size your plan generates." },
                { value: "md", label: "Capped at 1000px", hint: "Visitors never receive larger files. Your library keeps full quality." },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                role="radio"
                aria-checked={display.maxPhotoRes === option.value}
                onClick={() => onDisplayChange({ maxPhotoRes: option.value })}
                className={`w-full text-left border p-3 transition-colors ${
                  display.maxPhotoRes === option.value ? "border-accent" : "border-rule hover:border-muted"
                }`}
              >
                <span className={`block text-[12px] ${display.maxPhotoRes === option.value ? "text-accent" : "text-foreground"}`}>
                  {option.label}
                </span>
                <span className="block text-[11px] text-muted font-copy">{option.hint}</span>
              </button>
            ))}
          </div>
        </div>
        <p className="mt-2 text-[11px] text-muted/80 font-copy">
          Saved with the page{isPublished ? "; republish to apply to the live page" : ""}.
        </p>
      </div>

      {status && (
        <p
          className={`text-[12px] font-copy ${status.kind === "ok" ? "text-accent" : "text-red-400"}`}
          role={status.kind === "error" ? "alert" : "status"}
        >
          {status.text}
        </p>
      )}

      <button
        onClick={() => void handleSave()}
        disabled={busy || !slugOk}
        className="w-full py-2.5 text-[10px] uppercase tracking-wide bg-foreground text-background hover:bg-accent transition-colors disabled:opacity-40"
      >
        {busy ? "…" : "Save settings"}
      </button>

      <div className="border-t border-rule pt-5 space-y-3">
        {isPublished && (
          <button
            onClick={onUnpublish}
            className="w-full py-2.5 text-[10px] uppercase tracking-wide border border-rule text-foreground hover:border-accent transition-colors"
          >
            Unpublish
          </button>
        )}
        {confirmingDelete ? (
          <div className="border border-red-400/40 p-3 space-y-2">
            <p className="text-[12px] text-red-400 font-copy">
              Delete this page permanently? The draft and its published version are removed. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => void handleDelete()}
                disabled={busy}
                className="flex-1 py-2 text-[10px] uppercase tracking-wide bg-red-500/80 text-white hover:bg-red-500 transition-colors disabled:opacity-40"
              >
                Delete page
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="flex-1 py-2 text-[10px] uppercase tracking-wide border border-rule text-muted hover:text-foreground transition-colors"
              >
                Keep it
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="w-full py-2.5 text-[10px] uppercase tracking-wide border border-rule text-muted hover:text-red-400 hover:border-red-400/50 transition-colors"
          >
            Delete page
          </button>
        )}
      </div>
    </div>
  );
}
