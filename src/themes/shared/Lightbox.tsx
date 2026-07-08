"use client";

// ─── Shared lightbox ─────────────────────────────────────────────────
// One lightbox implementation for every theme: fullscreen viewing with
// keyboard navigation, focus management and reduced-motion support.
// Themes register images through the context; SmartImage opens by id.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PageImage } from "@/lib/page-document";
import { clampVariant, imageUrl } from "@/lib/media";
import { servingCap, usePageDisplay } from "./PageDisplay";

interface LightboxContextValue {
  open: (image: PageImage, group: PageImage[]) => void;
  enabled: boolean;
}

const LightboxContext = createContext<LightboxContextValue>({
  open: () => {},
  enabled: false,
});

export function useLightbox() {
  return useContext(LightboxContext);
}

export function LightboxProvider({
  children,
  enabled = true,
}: {
  children: React.ReactNode;
  enabled?: boolean;
}) {
  const display = usePageDisplay();
  const [group, setGroup] = useState<PageImage[]>([]);
  const [index, setIndex] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const open = useCallback(
    (image: PageImage, images: PageImage[]) => {
      if (!enabled) return;
      const list = images.length > 0 ? images : [image];
      const at = Math.max(0, list.findIndex((i) => i.id === image.id));
      restoreFocusRef.current = document.activeElement as HTMLElement | null;
      setGroup(list);
      setIndex(at);
    },
    [enabled]
  );

  const close = useCallback(() => {
    setIndex(null);
    restoreFocusRef.current?.focus?.();
  }, []);

  const step = useCallback(
    (delta: number) => {
      setIndex((current) =>
        current === null ? null : (current + delta + group.length) % group.length
      );
    },
    [group.length]
  );

  useEffect(() => {
    if (index === null) return;
    closeButtonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "Tab") {
        // Single focusable control — keep focus on the dialog.
        e.preventDefault();
        closeButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, close, step]);

  const value = useMemo(() => ({ open, enabled }), [open, enabled]);
  const current = index !== null ? group[index] : null;

  return (
    <LightboxContext.Provider value={value}>
      {children}
      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.alt || current.caption || "Photograph"}
          className="fixed inset-0 z-50 flex flex-col bg-black/95 motion-safe:animate-[shFade_160ms_ease-out]"
          onClick={close}
        >
          <div className="flex justify-between items-center px-4 py-3 text-white/70">
            <span className="text-xs tracking-wide font-mono">
              {group.length > 1 ? `${(index ?? 0) + 1} / ${group.length}` : ""}
            </span>
            <button
              ref={closeButtonRef}
              onClick={close}
              aria-label="Close"
              className="text-2xl leading-none px-3 py-1 hover:text-white focus:outline focus:outline-2 focus:outline-white/80"
            >
              ×
            </button>
          </div>

          <div
            className="flex-1 flex items-center justify-center px-4 pb-4 min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            {group.length > 1 && (
              <button
                onClick={() => step(-1)}
                aria-label="Previous photograph"
                className="hidden sm:block text-white/50 hover:text-white text-3xl px-4 shrink-0"
              >
                ‹
              </button>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current.id}
              src={imageUrl(current, clampVariant("xl", servingCap(display)))}
              alt={current.alt || current.caption || ""}
              className="max-h-full max-w-full object-contain select-none"
              draggable={false}
              onContextMenu={display.protectPhotos ? (e) => e.preventDefault() : undefined}
            />
            {group.length > 1 && (
              <button
                onClick={() => step(1)}
                aria-label="Next photograph"
                className="hidden sm:block text-white/50 hover:text-white text-3xl px-4 shrink-0"
              >
                ›
              </button>
            )}
          </div>

          {current.caption && (
            <p className="text-center text-white/70 text-sm px-6 pb-6 max-w-2xl mx-auto">
              {current.caption}
            </p>
          )}

          {/* Touch navigation for mobile */}
          {group.length > 1 && (
            <div className="sm:hidden flex justify-center gap-10 pb-6" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => step(-1)} aria-label="Previous photograph" className="text-white/60 text-3xl px-6 py-1">
                ‹
              </button>
              <button onClick={() => step(1)} aria-label="Next photograph" className="text-white/60 text-3xl px-6 py-1">
                ›
              </button>
            </div>
          )}
        </div>
      )}
    </LightboxContext.Provider>
  );
}
