"use client";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="px-6 py-16 max-w-3xl">
      <h1 className="font-heading text-2xl italic font-light mb-3">Something went wrong.</h1>
      <p className="text-sm text-muted font-copy mb-6">
        Your pages could not be loaded. This is usually temporary.
      </p>
      <button
        onClick={reset}
        className="px-5 py-2.5 text-[10px] uppercase tracking-wide bg-foreground text-background hover:bg-accent transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
