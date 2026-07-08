"use client";

import { useEffect, useMemo, useState } from "react";
import type { ArborCollection, ArborFile, ArborTag } from "@/lib/arbor/types";
import MarkdownView from "./MarkdownView";

const ALL = "all";
const UNCAT = "uncat";

async function api(path: string, opts?: RequestInit) {
  const res = await fetch(`/api/arbor/${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

function kindLabel(kind: string) {
  return kind === "markdown" ? "MD" : kind === "pdf" ? "PDF" : "IMG";
}

export default function ArborApp() {
  const [collections, setCollections] = useState<ArborCollection[]>([]);
  const [files, setFiles] = useState<ArborFile[]>([]);
  const [tags, setTags] = useState<ArborTag[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeCollection, setActiveCollection] = useState<string>(ALL);
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [modal, setModal] = useState<null | "collection" | "context" | "upload">(null);

  async function loadAll() {
    setLoading(true);
    try {
      const [c, f, t] = await Promise.all([
        api("collections"),
        api("files"),
        api("tags"),
      ]);
      setCollections(c.collections);
      setFiles(f.files);
      setTags(t.tags);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const tagName = useMemo(() => {
    const m = new Map<string, string>();
    tags.forEach((t) => m.set(t.id, t.name));
    return m;
  }, [tags]);

  const visibleFiles = useMemo(() => {
    return files.filter((f) => {
      if (activeCollection === UNCAT && f.collection_id !== null) return false;
      if (activeCollection !== ALL && activeCollection !== UNCAT && f.collection_id !== activeCollection)
        return false;
      if (activeTags.size > 0 && !f.tag_ids.some((id) => activeTags.has(id))) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${f.title} ${f.content ?? ""} ${f.filename ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [files, activeCollection, activeTags, search]);

  const openFile = openId ? files.find((f) => f.id === openId) ?? null : null;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleTagFilter(id: string) {
    setActiveTags((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function copyBundle() {
    const chosen = files.filter((f) => selected.has(f.id));
    const mdParts = chosen
      .filter((f) => f.kind === "markdown")
      .map((f) => `# ${f.title}\n\n${f.content ?? ""}`);
    const attachments = chosen
      .filter((f) => f.kind !== "markdown")
      .map((f) => `- ${f.title} (${f.filename ?? f.kind})`);
    let out = mdParts.join("\n\n---\n\n");
    if (attachments.length) {
      out += `\n\n---\n\n## Attachments (upload separately)\n${attachments.join("\n")}`;
    }
    await navigator.clipboard.writeText(out.trim());
  }

  async function handleSignOut() {
    await api("logout", { method: "POST" });
    window.location.reload();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-heading italic text-muted text-lg">Loading Arbor…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="flex items-center justify-between gap-4 flex-wrap px-6 py-4 border-b border-rule">
        <div className="flex items-baseline gap-3">
          <span className="font-heading text-2xl font-light italic">Arbor</span>
          <span className="text-[8px] uppercase tracking-label text-accent">
            AI Context Library
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setModal("context")} className="arbor-btn">
            New context
          </button>
          <button onClick={() => setModal("upload")} className="arbor-btn">
            Upload file
          </button>
          <button onClick={() => setModal("collection")} className="arbor-btn">
            New collection
          </button>
          <button
            onClick={handleSignOut}
            className="text-[9px] uppercase tracking-wide text-muted hover:text-foreground transition-colors px-3 py-2"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* ── Sidebar ───────────────────────────────────────────── */}
        <aside className="w-60 shrink-0 border-r border-rule p-5 overflow-y-auto">
          <p className="text-[9px] uppercase tracking-label text-accent mb-3">
            Collections
          </p>
          <nav className="flex flex-col gap-1 mb-8">
            <SidebarItem
              label="All files"
              count={files.length}
              active={activeCollection === ALL}
              onClick={() => setActiveCollection(ALL)}
            />
            <SidebarItem
              label="Uncategorized"
              count={files.filter((f) => f.collection_id === null).length}
              active={activeCollection === UNCAT}
              onClick={() => setActiveCollection(UNCAT)}
            />
            {collections.map((c) => (
              <SidebarItem
                key={c.id}
                label={c.name}
                count={files.filter((f) => f.collection_id === c.id).length}
                active={activeCollection === c.id}
                onClick={() => setActiveCollection(c.id)}
                onDelete={async () => {
                  if (!confirm(`Delete collection "${c.name}"? Files inside move to Uncategorized.`))
                    return;
                  await api(`collections/${c.id}`, { method: "DELETE" });
                  if (activeCollection === c.id) setActiveCollection(ALL);
                  loadAll();
                }}
              />
            ))}
          </nav>

          {tags.length > 0 && (
            <>
              <p className="text-[9px] uppercase tracking-label text-accent mb-3">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => toggleTagFilter(t.id)}
                    className={`text-[10px] px-2 py-1 border transition-colors ${
                      activeTags.has(t.id)
                        ? "border-accent text-accent"
                        : "border-rule text-muted hover:text-foreground"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </aside>

        {/* ── File list ─────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 p-6 overflow-y-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files…"
            className="w-full max-w-md bg-transparent border border-rule px-4 py-2 mb-6 font-heading italic text-sm focus:border-accent transition-colors"
          />

          {visibleFiles.length === 0 ? (
            <p className="font-heading italic text-muted">No files here yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visibleFiles.map((f) => (
                <FileCard
                  key={f.id}
                  file={f}
                  tagName={tagName}
                  selected={selected.has(f.id)}
                  onToggleSelect={() => toggleSelect(f.id)}
                  onOpen={() => setOpenId(f.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ── Bundle bar ──────────────────────────────────────────── */}
      {selected.size > 0 && (
        <div className="sticky bottom-0 flex items-center justify-between px-6 py-3 border-t border-rule bg-surface">
          <span className="text-[11px] uppercase tracking-wide text-muted">
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelected(new Set())} className="arbor-btn">
              Clear
            </button>
            <CopyButton label={`Copy bundle (${selected.size})`} onCopy={copyBundle} primary />
          </div>
        </div>
      )}

      {/* ── Detail drawer ───────────────────────────────────────── */}
      {openFile && (
        <FileDetail
          file={openFile}
          collections={collections}
          tags={tags}
          onClose={() => setOpenId(null)}
          onChanged={loadAll}
          onCreateTag={async (name) => {
            const { tag } = await api("tags", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name }),
            });
            setTags((prev) =>
              prev.some((t) => t.id === tag.id) ? prev : [...prev, tag].sort((a, b) => a.name.localeCompare(b.name))
            );
            return tag as ArborTag;
          }}
        />
      )}

      {/* ── Modals ──────────────────────────────────────────────── */}
      {modal === "collection" && (
        <CollectionModal
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            loadAll();
          }}
        />
      )}
      {modal === "context" && (
        <ContextModal
          collections={collections}
          defaultCollection={activeCollection}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            loadAll();
          }}
        />
      )}
      {modal === "upload" && (
        <UploadModal
          collections={collections}
          defaultCollection={activeCollection}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            loadAll();
          }}
        />
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// Sidebar item
// ───────────────────────────────────────────────────────────────────
function SidebarItem({
  label,
  count,
  active,
  onClick,
  onDelete,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className={`group flex items-center justify-between px-2 py-1.5 cursor-pointer transition-colors ${
        active ? "bg-surface text-foreground" : "text-muted hover:text-foreground"
      }`}
      onClick={onClick}
    >
      <span className="text-[13px] font-heading italic truncate">{label}</span>
      <span className="flex items-center gap-2">
        <span className="text-[10px] text-muted/60">{count}</span>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="opacity-0 group-hover:opacity-100 text-muted/60 hover:text-red-400 text-[12px] leading-none"
            title="Delete collection"
          >
            ×
          </button>
        )}
      </span>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// File card
// ───────────────────────────────────────────────────────────────────
function FileCard({
  file,
  tagName,
  selected,
  onToggleSelect,
  onOpen,
}: {
  file: ArborFile;
  tagName: Map<string, string>;
  selected: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
}) {
  return (
    <div
      className={`border p-4 flex flex-col gap-3 transition-colors cursor-pointer ${
        selected ? "border-accent" : "border-rule hover:border-muted"
      }`}
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[9px] uppercase tracking-wide text-accent border border-accent/40 px-1.5 py-0.5">
          {kindLabel(file.kind)}
        </span>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          className="accent-[#FF6B00] mt-0.5"
          title="Select for bundle"
        />
      </div>

      <h3 className="font-heading text-[17px] italic leading-tight text-foreground line-clamp-2">
        {file.title}
      </h3>

      {file.kind === "markdown" && file.content && (
        <p className="text-[11px] text-muted line-clamp-2 font-copy">
          {file.content.replace(/[#*`>_-]/g, "").slice(0, 120)}
        </p>
      )}

      {file.tag_ids.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-auto">
          {file.tag_ids.map((id) => (
            <span key={id} className="text-[9px] text-muted/70 lowercase">
              #{tagName.get(id)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// Copy button with feedback
// ───────────────────────────────────────────────────────────────────
function CopyButton({
  label,
  onCopy,
  primary,
}: {
  label: string;
  onCopy: () => Promise<void>;
  primary?: boolean;
}) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        await onCopy();
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className={
        primary
          ? "text-[10px] uppercase tracking-wide text-background bg-accent hover:bg-foreground transition-colors px-4 py-2"
          : "arbor-btn"
      }
    >
      {done ? "Copied ✓" : label}
    </button>
  );
}

// ───────────────────────────────────────────────────────────────────
// File detail drawer
// ───────────────────────────────────────────────────────────────────
function FileDetail({
  file,
  collections,
  tags,
  onClose,
  onChanged,
  onCreateTag,
}: {
  file: ArborFile;
  collections: ArborCollection[];
  tags: ArborTag[];
  onClose: () => void;
  onChanged: () => void;
  onCreateTag: (name: string) => Promise<ArborTag>;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(file.title);
  const [content, setContent] = useState(file.content ?? "");
  const [collectionId, setCollectionId] = useState<string>(file.collection_id ?? "");
  const [fileTags, setFileTags] = useState<Set<string>>(new Set(file.tag_ids));
  const [newTag, setNewTag] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/arbor/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: file.kind === "markdown" ? content : undefined,
          collection_id: collectionId || null,
          tag_ids: Array.from(fileTags),
        }),
      });
      setEditing(false);
      onChanged();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete "${file.title}"? This cannot be undone.`)) return;
    await fetch(`/api/arbor/files/${file.id}`, { method: "DELETE" });
    onClose();
    onChanged();
  }

  async function toggleTag(id: string) {
    setFileTags((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function addNewTag() {
    const name = newTag.trim();
    if (!name) return;
    const tag = await onCreateTag(name);
    setFileTags((prev) => new Set(prev).add(tag.id));
    setNewTag("");
  }

  const raw = `/api/arbor/files/${file.id}/raw`;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-background border-l border-rule h-full overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-rule sticky top-0 bg-background z-10">
          <span className="text-[9px] uppercase tracking-label text-accent">
            {kindLabel(file.kind)} · {collections.find((c) => c.id === collectionId)?.name ?? "Uncategorized"}
          </span>
          <button onClick={onClose} className="text-muted hover:text-foreground text-lg leading-none">
            ×
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {editing ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent border border-rule px-3 py-2 font-heading text-xl italic focus:border-accent"
            />
          ) : (
            <h2 className="font-heading text-2xl italic">{file.title}</h2>
          )}

          {/* Collection + tags */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase tracking-label text-muted w-20">Collection</span>
              <select
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                className="bg-surface border border-rule text-[12px] px-2 py-1 focus:border-accent"
              >
                <option value="">Uncategorized</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[9px] uppercase tracking-label text-muted w-20 mt-1.5">Tags</span>
              <div className="flex-1 flex flex-wrap gap-1.5 items-center">
                {tags.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => toggleTag(t.id)}
                    className={`text-[10px] px-2 py-1 border transition-colors ${
                      fileTags.has(t.id)
                        ? "border-accent text-accent"
                        : "border-rule text-muted hover:text-foreground"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addNewTag()}
                  placeholder="+ tag"
                  className="text-[10px] bg-transparent border border-dashed border-rule px-2 py-1 w-20 focus:border-accent"
                />
              </div>
            </div>
          </div>

          {/* Body */}
          {file.kind === "markdown" &&
            (editing ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={20}
                className="w-full bg-surface border border-rule px-4 py-3 font-body text-[13px] leading-relaxed focus:border-accent"
              />
            ) : (
              <div className="border-t border-rule pt-5">
                <MarkdownView content={file.content ?? ""} />
              </div>
            ))}

          {file.kind === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={raw} alt={file.title} className="w-full border border-rule" />
          )}

          {file.kind === "pdf" && (
            <iframe src={raw} className="w-full h-[70vh] border border-rule" title={file.title} />
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap border-t border-rule pt-5">
            {file.kind === "markdown" && (
              <CopyButton
                label="Copy text"
                onCopy={() => navigator.clipboard.writeText(file.content ?? "")}
              />
            )}
            {file.kind !== "markdown" && (
              <a href={`${raw}?download=1`} className="arbor-btn" download>
                Download
              </a>
            )}
            {editing ? (
              <>
                <button onClick={save} disabled={saving} className="arbor-btn-primary">
                  {saving ? "Saving…" : "Save"}
                </button>
                <button onClick={() => setEditing(false)} className="arbor-btn">
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="arbor-btn">
                Edit
              </button>
            )}
            <button
              onClick={remove}
              className="text-[9px] uppercase tracking-wide text-muted hover:text-red-400 transition-colors px-3 py-2 ml-auto"
            >
              Delete
            </button>
          </div>
          {/* Save metadata-only changes when not editing body */}
          {!editing && (
            <button onClick={save} disabled={saving} className="arbor-btn self-start">
              {saving ? "Saving…" : "Save collection & tags"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// Modals
// ───────────────────────────────────────────────────────────────────
function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-background border border-rule p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading text-xl italic">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-foreground text-lg leading-none">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CollectionModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await api("collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <ModalShell title="New collection" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Collection name"
          autoFocus
          className="bg-transparent border border-rule px-4 py-3 font-heading italic focus:border-accent"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="bg-transparent border border-rule px-4 py-3 font-copy text-sm focus:border-accent"
        />
        {error && <p className="text-red-400 text-sm italic font-heading">{error}</p>}
        <button onClick={save} disabled={saving} className="arbor-btn-primary self-start">
          {saving ? "Creating…" : "Create"}
        </button>
      </div>
    </ModalShell>
  );
}

function ContextModal({
  collections,
  defaultCollection,
  onClose,
  onSaved,
}: {
  collections: ArborCollection[];
  defaultCollection: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initial = collections.some((c) => c.id === defaultCollection) ? defaultCollection : "";
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [collectionId, setCollectionId] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api("files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, collection_id: collectionId }),
      });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setContent(String(reader.result ?? ""));
      if (!title) setTitle(f.name.replace(/\.(md|markdown|txt)$/i, ""));
    };
    reader.readAsText(f);
  }

  return (
    <ModalShell title="New context file" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title, e.g. Brand Voice"
          autoFocus
          className="bg-transparent border border-rule px-4 py-3 font-heading italic focus:border-accent"
        />
        <select
          value={collectionId}
          onChange={(e) => setCollectionId(e.target.value)}
          className="bg-surface border border-rule text-sm px-3 py-2 focus:border-accent"
        >
          <option value="">Uncategorized</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write or paste markdown context here…"
          rows={12}
          className="bg-surface border border-rule px-4 py-3 font-body text-[13px] leading-relaxed focus:border-accent"
        />
        <label className="text-[10px] uppercase tracking-wide text-muted cursor-pointer hover:text-foreground">
          or import a .md file
          <input type="file" accept=".md,.markdown,.txt,text/markdown" onChange={onPickFile} className="hidden" />
        </label>
        {error && <p className="text-red-400 text-sm italic font-heading">{error}</p>}
        <button onClick={save} disabled={saving} className="arbor-btn-primary self-start">
          {saving ? "Saving…" : "Save context"}
        </button>
      </div>
    </ModalShell>
  );
}

function UploadModal({
  collections,
  defaultCollection,
  onClose,
  onSaved,
}: {
  collections: ArborCollection[];
  defaultCollection: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initial = collections.some((c) => c.id === defaultCollection) ? defaultCollection : "";
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [collectionId, setCollectionId] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!file) {
      setError("Choose a file first");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", title || file.name);
      form.append("collection_id", collectionId);
      const res = await fetch("/api/arbor/files", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onSaved();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Upload file" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <input
          type="file"
          accept="application/pdf,image/*"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
            if (f && !title) setTitle(f.name);
          }}
          className="text-sm text-muted file:mr-3 file:border file:border-rule file:bg-surface file:px-3 file:py-2 file:text-[10px] file:uppercase file:tracking-wide file:text-foreground"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="bg-transparent border border-rule px-4 py-3 font-heading italic focus:border-accent"
        />
        <select
          value={collectionId}
          onChange={(e) => setCollectionId(e.target.value)}
          className="bg-surface border border-rule text-sm px-3 py-2 focus:border-accent"
        >
          <option value="">Uncategorized</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-muted/70 font-copy">PDF and image files supported.</p>
        {error && <p className="text-red-400 text-sm italic font-heading">{error}</p>}
        <button onClick={save} disabled={saving} className="arbor-btn-primary self-start">
          {saving ? "Uploading…" : "Upload"}
        </button>
      </div>
    </ModalShell>
  );
}
