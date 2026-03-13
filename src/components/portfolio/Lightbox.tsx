"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface LightboxPhoto {
  src: string;
  caption: string | null;
}

interface LightboxProps {
  photos: LightboxPhoto[];
  initialIndex: number;
  onClose: () => void;
  accentColor: string;
}

export function Lightbox({
  photos,
  initialIndex,
  onClose,
  accentColor,
}: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [active, setActive] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const uiTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const photo = photos[index];

  // Fade in on mount
  useEffect(() => {
    requestAnimationFrame(() => setActive(true));
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Preload adjacent images
  useEffect(() => {
    const preload = (i: number) => {
      if (i >= 0 && i < photos.length) {
        const img = new Image();
        img.src = photos[i].src;
      }
    };
    preload(index - 1);
    preload(index + 1);
  }, [index, photos]);

  // Auto-hide UI on mobile
  const showUi = useCallback(() => {
    setUiVisible(true);
    if (uiTimerRef.current) clearTimeout(uiTimerRef.current);
    uiTimerRef.current = setTimeout(() => setUiVisible(false), 2500);
  }, []);

  const navigate = useCallback(
    (dir: -1 | 1) => {
      setIndex((prev) => {
        const next = prev + dir;
        if (next < 0 || next >= photos.length) return prev;
        return next;
      });
      showUi();
    },
    [photos.length, showUi]
  );

  const handleClose = useCallback(() => {
    setActive(false);
    setTimeout(onClose, 250);
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowLeft") navigate(-1);
      if (e.key === "ArrowRight") navigate(1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleClose, navigate]);

  // Touch/swipe
  function handleTouchStart(e: React.TouchEvent) {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    showUi();
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    if (Math.abs(dx) > 50) {
      navigate(dx > 0 ? -1 : 1);
    }
    touchStartRef.current = null;
  }

  return (
    <div
      className={`fixed inset-0 z-[999] bg-black flex items-center justify-center transition-opacity duration-250 ${
        active ? "opacity-100" : "opacity-0"
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={showUi}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Image */}
      <div
        className={`w-full h-full flex items-center justify-center p-4 md:p-12 transition-transform duration-300 ${
          active ? "scale-100" : "scale-[0.98]"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photo.src}
          src={photo.src}
          alt={photo.caption || ""}
          className="max-w-full max-h-full object-contain select-none pointer-events-none"
          style={{ userSelect: "none", WebkitUserDrag: "none" } as React.CSSProperties}
          draggable={false}
        />
      </div>

      {/* UI overlay */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
          uiVisible ? "opacity-100" : "opacity-0 md:hover:opacity-100"
        }`}
        onMouseMove={showUi}
      >
        {/* Top bar: counter + close */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-5 pointer-events-auto">
          <span
            className="text-[11px] tracking-wide"
            style={{ color: accentColor }}
          >
            {index + 1} / {photos.length}
          </span>
          <button
            onClick={handleClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" stroke="currentColor" strokeWidth="1.5">
              <line x1="2" y1="2" x2="16" y2="16" />
              <line x1="16" y1="2" x2="2" y2="16" />
            </svg>
          </button>
        </div>

        {/* Prev arrow */}
        {index > 0 && (
          <button
            onClick={() => navigate(-1)}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors pointer-events-auto p-2"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15 4L7 12L15 20" />
            </svg>
          </button>
        )}

        {/* Next arrow */}
        {index < photos.length - 1 && (
          <button
            onClick={() => navigate(1)}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors pointer-events-auto p-2"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 4L17 12L9 20" />
            </svg>
          </button>
        )}

        {/* Caption */}
        {photo.caption && (
          <div className="absolute bottom-0 left-0 right-0 text-center px-6 py-5 pointer-events-auto">
            <p className="text-[13px] italic text-white/50">{photo.caption}</p>
          </div>
        )}
      </div>
    </div>
  );
}
