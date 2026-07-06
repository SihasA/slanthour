"use client";

// ─── Shared layout primitives for theme renderers ────────────────────

import { useEffect, useRef, useState } from "react";

/** Width-constrained container driven by theme tokens. */
export function Container({
  width,
  children,
  className = "",
}: {
  width: "text" | "wide" | "full";
  children: React.ReactNode;
  className?: string;
}) {
  if (width === "full") return <div className={className}>{children}</div>;
  return (
    <div
      className={`mx-auto px-5 sm:px-8 ${className}`}
      style={{ maxWidth: width === "text" ? "var(--sh-text-width)" : "var(--sh-wide-width)" }}
    >
      {children}
    </div>
  );
}

/** Plain-text body copy split into paragraphs (no HTML — XSS-safe). */
export function TextBody({
  text,
  className = "",
  style,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  return (
    <div className={className} style={style}>
      {paragraphs.map((paragraph, i) => (
        <p key={i} className="whitespace-pre-line mb-[1em] last:mb-0">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

/**
 * Reveal-on-scroll wrapper. Fades content in as it enters the viewport;
 * inert under prefers-reduced-motion or when disabled by the theme.
 */
export function Reveal({
  children,
  disabled = false,
  className = "",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(disabled);

  useEffect(() => {
    if (disabled) {
      setVisible(true);
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setVisible(true);
      return;
    }
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [disabled]);

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-700 ease-out motion-reduce:transition-none ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {children}
    </div>
  );
}

/** Spacer + divider shared implementation (identical semantics across themes). */
export function SpacerBlock({
  size,
  divider,
  dividerClassName = "",
}: {
  size: "small" | "medium" | "large";
  divider: boolean;
  dividerClassName?: string;
}) {
  const heights = { small: "2.5rem", medium: "5rem", large: "9rem" };
  return (
    <div
      className="flex items-center"
      style={{ height: heights[size] }}
      aria-hidden={!divider}
      role={divider ? "separator" : undefined}
    >
      {divider && (
        <div
          className={`w-full max-w-[8rem] mx-auto h-px bg-[var(--sh-border)] ${dividerClassName}`}
        />
      )}
    </div>
  );
}

/** Index formatter for numbered frames: 01, 02 … */
export function frameNumber(n: number): string {
  return String(n).padStart(2, "0");
}
