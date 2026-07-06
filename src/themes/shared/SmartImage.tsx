"use client";

// ─── Shared responsive image ─────────────────────────────────────────
// Aspect-ratio reserved (no layout shift), blur-up placeholder, srcset
// variants, focal-point object-position, lazy below the fold, opens the
// shared lightbox on click when interactive.

import { useEffect, useRef, useState } from "react";
import type { PageImage } from "@/lib/page-document";
import { imageSrcSet, imageUrl } from "@/lib/media";
import { useLightbox } from "./Lightbox";

export interface SmartImageProps {
  image: PageImage;
  /** Sibling images for lightbox navigation (defaults to just this one). */
  group?: PageImage[];
  /** sizes attribute hint, e.g. "(max-width: 640px) 100vw, 800px" */
  sizes?: string;
  priority?: boolean;
  /** Cover mode crops to the container; contain preserves the frame. */
  fit?: "cover" | "natural";
  /** Fixed aspect ratio for cover mode (e.g. "3 / 2"); natural uses intrinsic. */
  aspect?: string;
  className?: string;
  rounded?: string;
}

export function SmartImage({
  image,
  group,
  sizes = "100vw",
  priority = false,
  fit = "natural",
  aspect,
  className = "",
  rounded,
}: SmartImageProps) {
  const { open, enabled } = useLightbox();
  const [loaded, setLoaded] = useState(false);
  const imgEl = useRef<HTMLImageElement | null>(null);

  // React's synthetic `onLoad` is unreliable for server-rendered images: the
  // browser starts (and often finishes) the download from the SSR HTML before
  // hydration wires the handler, so the load event is missed and the image
  // stays stuck at opacity 0. After mount we check `complete` directly and, if
  // still loading, attach a real native `load` listener that can't be missed.
  useEffect(() => {
    const node = imgEl.current;
    if (!node) return;
    if (node.complete && node.naturalWidth > 0) {
      setLoaded(true);
      return;
    }
    const onLoad = () => setLoaded(true);
    node.addEventListener("load", onLoad);
    node.addEventListener("error", onLoad); // reveal on error too — better than a permanent blank
    return () => {
      node.removeEventListener("load", onLoad);
      node.removeEventListener("error", onLoad);
    };
  }, [image.path]);

  const ratio =
    aspect ??
    (image.width && image.height ? `${image.width} / ${image.height}` : undefined);

  const objectPosition = image.focal ? `${image.focal.x}% ${image.focal.y}%` : undefined;

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgEl}
      src={imageUrl(image, "lg")}
      srcSet={imageSrcSet(image)}
      sizes={sizes}
      alt={image.alt || image.caption || ""}
      width={image.width ?? undefined}
      height={image.height ?? undefined}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      draggable={false}
      onLoad={() => setLoaded(true)}
      className={`block w-full h-full transition-opacity duration-300 motion-reduce:transition-none ${
        loaded ? "opacity-100" : "opacity-0"
      } ${fit === "cover" ? "object-cover" : "object-contain"}`}
      style={{ objectPosition }}
    />
  );

  const wrapperStyle: React.CSSProperties = {
    aspectRatio: fit === "cover" ? (aspect ?? ratio) : ratio,
    backgroundImage: !loaded && image.blur ? `url(${image.blur})` : undefined,
    backgroundSize: "cover",
    backgroundPosition: objectPosition ?? "center",
  };

  if (!enabled) {
    return (
      <div className={`relative overflow-hidden ${rounded ?? ""} ${className}`} style={wrapperStyle}>
        {img}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => open(image, group ?? [image])}
      aria-label={`View photograph${image.caption ? `: ${image.caption}` : ""}`}
      className={`relative block w-full overflow-hidden cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sh-accent)] ${rounded ?? ""} ${className}`}
      style={wrapperStyle}
    >
      {img}
    </button>
  );
}
