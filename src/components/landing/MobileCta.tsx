"use client";

// ─── Mobile sticky CTA ───────────────────────────────────────────────
// A slim bottom bar that appears on small screens once the visitor has
// scrolled past the hero, and retires itself when the footer comes into
// view (so it never overlaps it). Dismissable; no dependencies.

import { useEffect, useState } from "react";
import Link from "next/link";

export function MobileCta() {
  const [pastHero, setPastHero] = useState(false);
  const [footerInView, setFooterInView] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero");
    // The theme showcase renders a page document with its own <footer>, so
    // target the site footer by id rather than the first footer in the DOM.
    const footer = document.getElementById("site-footer") ?? document.querySelector("footer");
    if (!hero || !footer) return;

    const heroWatch = new IntersectionObserver(
      ([entry]) => setPastHero(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    const footerWatch = new IntersectionObserver(
      ([entry]) => setFooterInView(entry.isIntersecting),
      { threshold: 0 }
    );
    heroWatch.observe(hero);
    footerWatch.observe(footer);
    return () => {
      heroWatch.disconnect();
      footerWatch.disconnect();
    };
  }, []);

  if (dismissed) return null;
  const visible = pastHero && !footerInView;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-rule bg-background/95 backdrop-blur-md motion-safe:transition-transform motion-safe:duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <div className="flex items-center justify-between gap-4 px-6 py-3">
        <Link
          href="/signup"
          tabIndex={visible ? 0 : -1}
          className="text-[10px] uppercase tracking-wide text-accent hover:text-foreground transition-colors"
        >
          Create a page · free <span className="text-sm">&rarr;</span>
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          tabIndex={visible ? 0 : -1}
          aria-label="Dismiss"
          className="text-muted/60 hover:text-foreground transition-colors text-base leading-none px-1"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
