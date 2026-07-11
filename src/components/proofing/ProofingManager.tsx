"use client";

// ─── Gallery management (owner side) ─────────────────────────────────
// Upload the shoot, share the link, watch picks arrive, export the
// select list. Every mutation goes through the proofing server actions;
// after each one the router refreshes so the screen shows server truth.

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearProofingSelections,
  deleteProofingGallery,
  removeProofingImage,
  renameProofingGallery,
  setProofingPassword,
  setProofingStatus,
} from "@/lib/actions/proofing";
import { uploadProofingBatch } from "@/lib/proofing-upload-client";
import { PROOFING_MAX_IMAGES } from "@/lib/proofing";

export interface ManagedPhoto {
  id: string;
  smUrl: string;
  filename: string;
  selected: boolean;
}

interface ProofingManagerProps {
  gallery: {
    id: string;
    title: string;
    slug: string;
    status: "active" | "archived";
    hasPassword: boolean;
  };
  photos: ManagedPhoto[];
}

const label = "text-[10px] uppercase tracking-wide text-muted";
const btn =
  "px-4 py-2 text-[10px] uppercase tracking-wide border border-rule text-muted hover:text-foreground hover:border-foreground transition-colors disabled:opacity-40";
const btnDanger =
  "px-4 py-2 text-[10px] uppercase tracking-wide border border-rule text-red-400 hover:border-red-400 transition-colors disabled:opacity-40";

export function ProofingManager({ gallery, photos }: ProofingManagerProps) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [title, setTitle] = useState(gallery.title);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const picked = useMemo(() => photos.filter((p) => p.selected), [photos]);
  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/proof/${gallery.slug}` : "";

  async function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await action();
    if (!result.ok) setError(result.error ?? "Something went wrong.");
    setBusy(false);
    router.refresh();
  }

  async function onFiles(list: FileList | null) {
    if (!list || list.length === 0 || uploading) return;
    const room = PROOFING_MAX_IMAGES - photos.length;
    const files = Array.from(list).slice(0, Math.max(0, room));
    if (files.length === 0) {
      setError(`A gallery holds up to ${PROOFING_MAX_IMAGES} photos.`);
      return;
    }
    setError(null);
    setUploading({ done: 0, total: files.length });
    const results = await uploadProofingBatch(gallery.id, files, photos.length, (done, total) =>
      setUploading({ done, total })
    );
    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      setError(
        failed.length === 1
          ? failed[0].error ?? "One photo failed to upload."
          : `${failed.length} photos failed to upload. Try them again.`
      );
    }
    setUploading(null);
    if (fileInput.current) fileInput.current.value = "";
    router.refresh();
  }

  async function copy(text: string, which: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Could not copy. Select the text and copy it manually.");
    }
  }

  const pickedNames = picked.map((p) => p.filename);

  return (
    <div className="flex flex-col gap-10">
      {error && <p className="text-xs font-copy text-red-400">{error}</p>}

      {/* ── Share ─────────────────────────────────────────────── */}
      <section>
        <h2 className={`${label} mb-3`}>Client link</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            onFocus={(event) => event.currentTarget.select()}
            className="flex-1 bg-transparent border border-rule px-3 py-2 text-xs font-copy text-muted focus:outline-none focus:border-accent"
          />
          <button type="button" onClick={() => copy(shareUrl, "link")} className={btn}>
            {copied === "link" ? "Copied" : "Copy link"}
          </button>
        </div>
        <p className="mt-2 text-xs font-copy text-muted/70">
          {gallery.hasPassword
            ? "The link asks for the password you set below."
            : "Anyone with this link can open the gallery. Add a password below if it needs one."}
        </p>
      </section>

      {/* ── Upload ────────────────────────────────────────────── */}
      <section>
        <h2 className={`${label} mb-3`}>Photos · {photos.length}</h2>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(event) => onFiles(event.target.files)}
        />
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading !== null}
            className="px-5 py-2.5 text-[10px] uppercase tracking-wide bg-foreground text-background hover:bg-accent transition-colors disabled:opacity-50"
          >
            {uploading ? `Uploading ${uploading.done} of ${uploading.total}` : "+ Add photos"}
          </button>
          <span className="text-xs font-copy text-muted/70">
            Previews only (no full-size files live here). Filenames are kept as your
            select list.
          </span>
        </div>

        {photos.length > 0 && (
          <ul className="mt-5 grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-1.5">
            {photos.map((photo) => (
              <li key={photo.id} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.smUrl}
                  alt={photo.filename}
                  title={photo.filename}
                  loading="lazy"
                  decoding="async"
                  className={`w-full aspect-square object-cover ${photo.selected ? "" : "opacity-90"}`}
                />
                {photo.selected && (
                  <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[8px] uppercase tracking-wide bg-background/80 text-accent">
                    Picked
                  </span>
                )}
                {removingId === photo.id ? (
                  <button
                    type="button"
                    onClick={() => {
                      setRemovingId(null);
                      run(() => removeProofingImage(photo.id));
                    }}
                    className="absolute top-1 right-1 px-1.5 py-0.5 text-[8px] uppercase tracking-wide bg-red-500/90 text-white"
                  >
                    Sure?
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRemovingId(photo.id)}
                    onBlur={() => setRemovingId(null)}
                    aria-label={`Remove ${photo.filename}`}
                    className="absolute top-1 right-1 px-1.5 py-0.5 text-[10px] bg-background/70 text-foreground/70 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-red-400 transition-opacity"
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Picks / export ────────────────────────────────────── */}
      <section>
        <h2 className={`${label} mb-3`}>Picks · {picked.length}</h2>
        {picked.length === 0 ? (
          <p className="text-sm font-copy text-muted">
            Nothing picked yet. Picks appear here the moment your client taps a heart.
          </p>
        ) : (
          <>
            <textarea
              readOnly
              value={pickedNames.join("\n")}
              rows={Math.min(10, pickedNames.length)}
              onFocus={(event) => event.currentTarget.select()}
              className="w-full max-w-xl bg-transparent border border-rule px-3 py-2 text-xs font-copy text-muted focus:outline-none focus:border-accent"
            />
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => copy(pickedNames.join("\n"), "lines")}
                className={btn}
              >
                {copied === "lines" ? "Copied" : "Copy list"}
              </button>
              <button
                type="button"
                onClick={() => copy(pickedNames.join(", "), "commas")}
                className={btn}
              >
                {copied === "commas" ? "Copied" : "Copy comma-separated"}
              </button>
              {confirmingClear ? (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmingClear(false);
                    run(() => clearProofingSelections(gallery.id));
                  }}
                  onBlur={() => setConfirmingClear(false)}
                  className={btnDanger}
                >
                  Clear all picks?
                </button>
              ) : (
                <button type="button" onClick={() => setConfirmingClear(true)} className={btn}>
                  Clear picks
                </button>
              )}
            </div>
          </>
        )}
      </section>

      {/* ── Settings ──────────────────────────────────────────── */}
      <section className="border-t border-rule pt-8 flex flex-col gap-6 max-w-xl">
        <div>
          <h2 className={`${label} mb-3`}>Name</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={title}
              maxLength={120}
              onChange={(event) => setTitle(event.target.value)}
              className="flex-1 bg-transparent border border-rule px-3 py-2 text-sm font-copy focus:outline-none focus:border-accent"
            />
            <button
              type="button"
              disabled={busy || title.trim() === gallery.title || title.trim().length === 0}
              onClick={() => run(() => renameProofingGallery(gallery.id, title))}
              className={btn}
            >
              Rename
            </button>
          </div>
        </div>

        <div>
          <h2 className={`${label} mb-3`}>
            Password {gallery.hasPassword ? "· set" : "· none"}
          </h2>
          <div className="flex gap-2">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={gallery.hasPassword ? "New password" : "Set a password"}
              className="flex-1 bg-transparent border border-rule px-3 py-2 text-sm font-copy focus:outline-none focus:border-accent"
            />
            <button
              type="button"
              disabled={busy || password.length === 0}
              onClick={() =>
                run(async () => {
                  const result = await setProofingPassword(gallery.id, password);
                  if (result.ok) setPassword("");
                  return result;
                })
              }
              className={btn}
            >
              {gallery.hasPassword ? "Change" : "Set"}
            </button>
            {gallery.hasPassword && (
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => setProofingPassword(gallery.id, null))}
                className={btn}
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(() =>
                setProofingStatus(gallery.id, gallery.status === "active" ? "archived" : "active")
              )
            }
            className={btn}
          >
            {gallery.status === "active" ? "Archive (closes the link)" : "Re-activate"}
          </button>
          {confirmingDelete ? (
            <button
              type="button"
              onClick={() => {
                setConfirmingDelete(false);
                run(async () => {
                  const result = await deleteProofingGallery(gallery.id);
                  if (result.ok) router.push("/proofing");
                  return result;
                });
              }}
              onBlur={() => setConfirmingDelete(false)}
              className={btnDanger}
            >
              Delete gallery and its photos?
            </button>
          ) : (
            <button type="button" onClick={() => setConfirmingDelete(true)} className={btnDanger}>
              Delete gallery
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
