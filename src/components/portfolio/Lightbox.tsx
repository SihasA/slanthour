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
}

export function Lightbox({ photos, initialIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [active, setActive] = useState(false);
  const [uiVisible, setUiVisible] = useState(false);
  const uiTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const touchStartRef = useRef<number>(0);
  const scrollYRef = useRef(0);

  const photo = photos[index];

  // Lock body scroll and fade in
  useEffect(() => {
    scrollYRef.current = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollYRef.current}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => setActive(true));

    return () => {
      document.body.style.position = "";
      document.body.style.overflow = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollYRef.current);
    };
  }, []);

  // Preload adjacent images
  useEffect(() => {
    [-1, 1].forEach((d) => {
      const i = (index + d + photos.length) % photos.length;
      const img = new Image();
      img.src = photos[i].src;
    });
  }, [index, photos]);

  // Touch: show UI briefly
  const showUiTouch = useCallback(() => {
    setUiVisible(true);
    if (uiTimerRef.current) clearTimeout(uiTimerRef.current);
    uiTimerRef.current = setTimeout(() => setUiVisible(false), 2500);
  }, []);

  const navigate = useCallback(
    (dir: -1 | 1) => {
      setIndex(
        (prev) => (prev + dir + photos.length) % photos.length
      );
    },
    [photos.length]
  );

  const handleClose = useCallback(() => {
    setActive(false);
    setTimeout(onClose, 250);
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowRight") navigate(1);
      if (e.key === "ArrowLeft") navigate(-1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleClose, navigate]);

  // Touch swipe
  function handleTouchStart(e: React.TouchEvent) {
    touchStartRef.current = e.touches[0].clientX;
    showUiTouch();
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) navigate(diff > 0 ? 1 : -1);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: active ? 1 : 0,
        pointerEvents: active ? "all" : "none",
        transition: "opacity 0.25s ease",
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Image — full viewport, exact legacy */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={photo.src}
        src={photo.src}
        alt={photo.caption || ""}
        style={{
          width: "100vw",
          height: "100vh",
          objectFit: "contain",
          display: "block",
          transform: active ? "scale(1)" : "scale(0.98)",
          transition:
            "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.1s ease",
          pointerEvents: "none",
          userSelect: "none",
          WebkitUserDrag: "none",
          WebkitTouchCallout: "none",
        } as React.CSSProperties}
        draggable={false}
      />

      {/* UI overlay — hidden by default, visible on hover / touch */}
      <div
        className="lightbox-ui"
        style={{
          position: "absolute",
          inset: 0,
          opacity: uiVisible ? 1 : 0,
          transition: "opacity 0.2s ease",
          pointerEvents: "none",
        }}
      >
        {/* Top bar: counter + close */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 28px",
            pointerEvents: "auto",
          }}
        >
          <span
            style={{
              fontSize: 10,
              letterSpacing: "0.2em",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            {index + 1} / {photos.length}
          </span>
          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase" as const,
              color: "rgba(255,255,255,0.45)",
              padding: 8,
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "#fff")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "rgba(255,255,255,0.45)")
            }
          >
            Close &times;
          </button>
        </div>

        {/* Prev arrow */}
        <button
          onClick={() => navigate(-1)}
          style={{
            position: "absolute",
            top: "50%",
            transform: "translateY(-50%)",
            left: 0,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "24px 20px",
            color: "rgba(255,255,255,0.3)",
            fontSize: 18,
            transition: "color 0.2s ease",
            pointerEvents: "auto",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "rgba(255,255,255,0.9)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "rgba(255,255,255,0.3)")
          }
        >
          &#8592;
        </button>

        {/* Next arrow */}
        <button
          onClick={() => navigate(1)}
          style={{
            position: "absolute",
            top: "50%",
            transform: "translateY(-50%)",
            right: 0,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "24px 20px",
            color: "rgba(255,255,255,0.3)",
            fontSize: 18,
            transition: "color 0.2s ease",
            pointerEvents: "auto",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "rgba(255,255,255,0.9)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "rgba(255,255,255,0.3)")
          }
        >
          &#8594;
        </button>

        {/* Bottom caption */}
        {photo.caption && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "24px 28px",
              display: "flex",
              justifyContent: "center",
              pointerEvents: "auto",
            }}
          >
            <span
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: 14,
                color: "rgba(255,255,255,0.4)",
              }}
            >
              {photo.caption}
            </span>
          </div>
        )}
      </div>

      {/* Hover to reveal UI on desktop */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .lightbox-ui { pointer-events: none; }
            div:hover > .lightbox-ui { opacity: 1 !important; pointer-events: all; }
          `,
        }}
      />
    </div>
  );
}
