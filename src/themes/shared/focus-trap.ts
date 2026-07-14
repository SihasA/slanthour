// ─── Focus trap helpers ──────────────────────────────────────────────
// Pure index math for cycling Tab/Shift+Tab through a dialog's currently
// focusable controls. Kept out of Lightbox.tsx (which is a "use client"
// component with JSX) so it can be unit tested directly.

// Selector for elements a focus trap should consider stops. Mirrors the
// common "focusable" list; visibility (offsetParent) still needs to be
// checked separately by the caller since a dialog may render more than
// one set of controls for different viewports and only one is visible.
export const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Given the number of focusable controls in a trap and the index of the
 * currently focused one, returns the index Tab (direction 1) or Shift+Tab
 * (direction -1) should move to, wrapping at the ends. Returns -1 when
 * there is nothing to focus. If the active element isn't one of the
 * tracked controls (currentIndex === -1), Tab starts at the first control
 * and Shift+Tab starts at the last.
 */
export function nextTrapIndex(count: number, currentIndex: number, direction: 1 | -1): number {
  if (count <= 0) return -1;
  if (currentIndex === -1) return direction === 1 ? 0 : count - 1;
  return (currentIndex + direction + count) % count;
}
