"use client";

export function CopyProtection({ children }: { children: React.ReactNode }) {
  return (
    <div
      onContextMenu={(e) => {
        const t = e.target as HTMLElement;
        if (t.tagName === "IMG") e.preventDefault();
      }}
      style={{ WebkitTouchCallout: "none" } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
