"use client";

// ─── Create a new page ───────────────────────────────────────────────
// Minimal step: name the page, optionally pick a starting template, then
// straight into the editor. Blank stays the default; a template is just
// a section skeleton (never a theme) the editor can also apply later.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPage } from "@/lib/actions/pages";
import { PAGE_TEMPLATES, type TemplateId } from "@/lib/page-templates";

export default function NewPagePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState<TemplateId | "">("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await createPage(title, templateId || undefined);
    if (result.ok) {
      router.push(`/editor/${result.pageId}`);
    } else {
      setError(result.error);
      setBusy(false);
    }
  }

  const optionClass = (selected: boolean) =>
    `text-left border px-3 py-2 transition-colors ${
      selected ? "border-accent" : "border-rule hover:border-accent/60"
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/dashboard" className="block mb-12 text-[10px] uppercase tracking-wide text-muted hover:text-foreground transition-colors">
          ← Back to pages
        </Link>

        <h1 className="font-heading text-3xl font-light italic text-foreground mb-2">
          Name your page.
        </h1>
        <p className="font-copy text-sm text-muted mb-8">
          A photo series, a trip, a person, a project. You can rename it any time.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Lisbon, November"
            autoFocus
            maxLength={120}
            aria-label="Page title"
            className="w-full bg-transparent border border-rule rounded-none px-4 py-3 font-heading text-[15px] italic text-foreground placeholder:text-muted/40 focus:border-accent transition-colors focus:outline-none"
          />

          <fieldset>
            <legend className="text-[10px] uppercase tracking-wide text-muted mb-2">
              Start with
            </legend>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTemplateId("")}
                aria-pressed={templateId === ""}
                className={optionClass(templateId === "")}
              >
                <span className="block font-heading text-[13px] italic text-foreground">Blank</span>
                <span className="block mt-0.5 text-[10px] leading-snug text-muted font-copy">
                  An empty page. Build it section by section.
                </span>
              </button>
              {PAGE_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setTemplateId(template.id)}
                  aria-pressed={templateId === template.id}
                  className={optionClass(templateId === template.id)}
                >
                  <span className="block font-heading text-[13px] italic text-foreground">
                    {template.name}
                  </span>
                  <span className="block mt-0.5 text-[10px] leading-snug text-muted font-copy">
                    {template.description}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] leading-snug text-muted/70 font-copy">
              A template sets up sections you pour photos into. It never changes how the page
              looks; pick any theme in the editor.
            </p>
          </fieldset>

          {error && (
            <p className="text-[13px] font-heading italic text-red-400" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 text-[10px] uppercase tracking-wide text-background bg-foreground hover:bg-accent transition-colors duration-200 disabled:opacity-40"
          >
            {busy ? "…" : "Create page"}
          </button>
        </form>
      </div>
    </div>
  );
}
