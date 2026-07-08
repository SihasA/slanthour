"use client";

// ─── Library picker ──────────────────────────────────────────────────
// Reuse any photo already uploaded to the account without re-uploading.
// Egress-conscious by construction: the endpoint returns metadata only,
// thumbnails are the sm variant (~30KB) and lazy-load, and nothing is
// fetched until the picker is opened.

import { useCallback, useEffect, useState } from "react";
import { imageUrl, pageImageFromAsset } from "@/lib/media";
import type { PageImage } from "@/lib/page-document";
import type { MediaAsset } from "@/types";

export function LibraryPicker({
  onPicked,
  capacityLeft = Infinity,
}: {
  onPicked: (images: PageImage[]) => void;
  /** How many photos may still be added (section capacity or page limit). */
  capacityLeft?: number;
}) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<MediaAsset[] | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const loadPage = useCallback(async (cursor: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/media${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not load your library.");
      setAssets((current) => [...(current ?? []), ...body.assets]);
      setNextCursor(body.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your library.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open && assets === null && !loading) void loadPage(null);
  }, [open, assets, loading, loadPage]);

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else if (next.size < capacityLeft) next.add(id);
      return next;
    });
  }

  function confirm() {
    const picked = (assets ?? []).filter((a) => selected.has(a.id)).map(pageImageFromAsset);
    if (picked.length > 0) onPicked(picked);
    setSelected(new Set());
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={capacityLeft <= 0}
        className="text-[10px] uppercase tracking-wide text-muted hover:text-accent transition-colors disabled:opacity-40"
      >
        From your library
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Photo library">
      <button aria-label="Close library" className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg max-h-[80svh] bg-background border border-rule flex flex-col">
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-rule">
          <span className="text-[10px] uppercase tracking-wide text-muted">
            Your library{assets ? ` · ${assets.length}${nextCursor ? "+" : ""} photos` : ""}
          </span>
          <button onClick={() => setOpen(false)} className="text-muted hover:text-foreground text-xl leading-none" aria-label="Close">
            ×
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3">
          {error && (
            <p className="text-[12px] text-red-400 font-copy" role="alert">
              {error}{" "}
              <button onClick={() => void loadPage(null)} className="underline underline-offset-2 text-accent">
                Retry
              </button>
            </p>
          )}
          {assets && assets.length === 0 && !error && (
            <p className="text-[12px] text-muted font-copy p-2">
              Nothing here yet. Every photo you upload stays in your library, ready to reuse on
              any page without uploading again.
            </p>
          )}
          {assets && assets.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
              {assets.map((asset) => {
                const isSelected = selected.has(asset.id);
                return (
                  <button
                    key={asset.id}
                    onClick={() => toggle(asset.id)}
                    aria-pressed={isSelected}
                    aria-label={`Select ${asset.filename}`}
                    className={`relative aspect-square overflow-hidden bg-surface border transition-colors ${
                      isSelected ? "border-accent" : "border-transparent hover:border-rule"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl({ path: asset.storage_path, hasVariants: asset.has_variants, hasXl: asset.has_xl }, "sm")}
                      alt=""
                      loading="lazy"
                      draggable={false}
                      className={`w-full h-full object-cover ${isSelected ? "opacity-70" : ""}`}
                    />
                    {isSelected && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-accent text-background text-[10px] leading-4 text-center">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {loading && <p className="text-[11px] text-muted font-copy p-2">Loading…</p>}
          {nextCursor && !loading && (
            <button
              onClick={() => void loadPage(nextCursor)}
              className="mt-3 w-full py-2 text-[10px] uppercase tracking-wide border border-rule hover:border-accent text-muted hover:text-foreground transition-colors"
            >
              Load more
            </button>
          )}
        </div>

        <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-t border-rule">
          <span className="text-[11px] text-muted font-copy">
            {selected.size > 0
              ? `${selected.size} selected`
              : capacityLeft !== Infinity
                ? `Room for ${capacityLeft} more`
                : ""}
          </span>
          <button
            onClick={confirm}
            disabled={selected.size === 0}
            className="px-4 py-2 text-[10px] uppercase tracking-wide bg-foreground text-background hover:bg-accent transition-colors disabled:opacity-40"
          >
            Add {selected.size > 0 ? selected.size : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
