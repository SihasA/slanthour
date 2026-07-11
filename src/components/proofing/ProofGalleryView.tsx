"use client";

// ─── Client proofing gallery ─────────────────────────────────────────
// The anonymous review surface: a quiet contact-sheet grid of sm
// variants, tap-to-favourite, md lightbox. Picks save optimistically
// through /api/proof/[slug]/select and persist per gallery (one shared
// selection set — no client accounts by design).

import { useCallback, useEffect, useRef, useState } from "react";

export interface ProofPhoto {
  id: string;
  smUrl: string;
  mdUrl: string;
  filename: string;
}

interface ProofGalleryViewProps {
  slug: string;
  title: string;
  photographer: string;
  photos: ProofPhoto[];
  initiallySelected: string[];
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="M12 21c-4.8-3.6-8.4-6.8-8.4-10.4C3.6 7.9 5.7 6 8.1 6c1.5 0 3 .7 3.9 2 .9-1.3 2.4-2 3.9-2 2.4 0 4.5 1.9 4.5 4.6 0 3.6-3.6 6.8-8.4 10.4z" />
    </svg>
  );
}

export function ProofGalleryView({
  slug,
  title,
  photographer,
  photos,
  initiallySelected,
}: ProofGalleryViewProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initiallySelected));
  const [showPicksOnly, setShowPicksOnly] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visible = showPicksOnly ? photos.filter((p) => selected.has(p.id)) : photos;

  const flashError = useCallback((message: string) => {
    setError(message);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(null), 4000);
  }, []);

  const toggle = useCallback(
    async (id: string) => {
      const wasSelected = selected.has(id);
      setSelected((prev) => {
        const next = new Set(prev);
        if (wasSelected) next.delete(id);
        else next.add(id);
        return next;
      });
      try {
        const res = await fetch(`/api/proof/${slug}/select`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageId: id, selected: !wasSelected }),
        });
        if (!res.ok) throw new Error();
      } catch {
        // Revert the optimistic change so the screen always shows the truth.
        setSelected((prev) => {
          const next = new Set(prev);
          if (wasSelected) next.add(id);
          else next.delete(id);
          return next;
        });
        flashError("That pick did not save. Check your connection and tap again.");
      }
    },
    [selected, slug, flashError]
  );

  // Lightbox keyboard driving. Index is within the VISIBLE list so
  // prev/next respect the picks filter.
  useEffect(() => {
    if (lightbox === null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setLightbox(null);
      if (event.key === "ArrowRight") setLightbox((i) => (i === null ? i : Math.min(i + 1, visible.length - 1)));
      if (event.key === "ArrowLeft") setLightbox((i) => (i === null ? i : Math.max(i - 1, 0)));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, visible.length]);

  // Keep the lightbox index valid when the filter shrinks the list under it.
  useEffect(() => {
    if (lightbox !== null && lightbox >= visible.length) {
      setLightbox(visible.length === 0 ? null : visible.length - 1);
    }
  }, [lightbox, visible.length]);

  const current = lightbox !== null ? visible[lightbox] : null;

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-rule">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-wide text-muted truncate">{photographer}</p>
            <h1 className="font-heading italic text-base sm:text-lg font-light truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] uppercase tracking-wide text-muted tabular-nums">
              {selected.size} picked
            </span>
            <button
              type="button"
              onClick={() => setShowPicksOnly((v) => !v)}
              aria-pressed={showPicksOnly}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-wide border transition-colors ${
                showPicksOnly
                  ? "border-accent text-accent"
                  : "border-rule text-muted hover:text-foreground"
              }`}
            >
              Picks
            </button>
          </div>
        </div>
        {error && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-2">
            <p className="text-xs font-copy text-red-400">{error}</p>
          </div>
        )}
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {photos.length === 0 ? (
          <p className="font-copy text-sm text-muted py-20 text-center">
            No photos here yet. Check back soon.
          </p>
        ) : visible.length === 0 ? (
          <p className="font-copy text-sm text-muted py-20 text-center">
            No picks yet. Tap the heart on the photos you love.
          </p>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
            {visible.map((photo, index) => {
              const isSelected = selected.has(photo.id);
              return (
                <li key={photo.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => setLightbox(index)}
                    className="block w-full aspect-square focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    aria-label={`View ${photo.filename}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.smUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(photo.id)}
                    aria-pressed={isSelected}
                    aria-label={isSelected ? `Remove ${photo.filename} from picks` : `Pick ${photo.filename}`}
                    className={`absolute top-1.5 right-1.5 p-1.5 rounded-full transition-colors ${
                      isSelected
                        ? "bg-background/80 text-accent"
                        : "bg-background/60 text-foreground/70 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-accent"
                    }`}
                  >
                    <Heart filled={isSelected} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <footer className="py-10 text-center">
          <p className="text-[10px] uppercase tracking-wide text-muted/70">
            Previews only · your photographer delivers the final photographs
          </p>
        </footer>
      </div>

      {current && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label={current.filename}
        >
          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3">
            <span className="text-[10px] uppercase tracking-wide text-white/60 truncate">
              {current.filename}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] uppercase tracking-wide text-white/60 tabular-nums">
                {(lightbox ?? 0) + 1} / {visible.length}
              </span>
              <button
                type="button"
                onClick={() => setLightbox(null)}
                aria-label="Close"
                className="p-2 text-white/70 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLightbox((i) => (i === null ? i : Math.min(i + 1, visible.length - 1)))}
            className="flex-1 flex items-center justify-center px-4 pb-2 cursor-default focus:outline-none"
            aria-label="Next photo"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.mdUrl}
              alt={current.filename}
              className="max-h-full max-w-full object-contain"
            />
          </button>
          <div className="flex items-center justify-center gap-3 px-4 py-4">
            <button
              type="button"
              onClick={() => setLightbox((i) => (i === null ? i : Math.max(i - 1, 0)))}
              disabled={(lightbox ?? 0) === 0}
              className="px-4 py-2 text-[10px] uppercase tracking-wide border border-white/20 text-white/70 hover:text-white transition-colors disabled:opacity-30"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => toggle(current.id)}
              aria-pressed={selected.has(current.id)}
              className={`flex items-center gap-2 px-5 py-2 text-[10px] uppercase tracking-wide border transition-colors ${
                selected.has(current.id)
                  ? "border-accent text-accent"
                  : "border-white/20 text-white/70 hover:text-white"
              }`}
            >
              <Heart filled={selected.has(current.id)} />
              {selected.has(current.id) ? "Picked" : "Pick this one"}
            </button>
            <button
              type="button"
              onClick={() => setLightbox((i) => (i === null ? i : Math.min(i + 1, visible.length - 1)))}
              disabled={(lightbox ?? 0) >= visible.length - 1}
              className="px-4 py-2 text-[10px] uppercase tracking-wide border border-white/20 text-white/70 hover:text-white transition-colors disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
