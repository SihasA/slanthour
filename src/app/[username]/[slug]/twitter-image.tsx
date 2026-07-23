// X/Twitter reuses the exact same per-page unfurl card as Open Graph.
// Re-exporting keeps a single composition (see opengraph-image.tsx).
export { default, size, contentType, alt } from "./opengraph-image";
