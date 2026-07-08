"use client";

// ─── Media uploader ──────────────────────────────────────────────────
// Drag-and-drop + file picker with per-file progress, clear validation
// errors and retry. Calls back with PageImage objects ready for the
// document once the server has validated and stored each photo.

import { useRef, useState } from "react";
import { uploadPhoto, validateFileLocally } from "@/lib/upload-client";
import type { PageImage } from "@/lib/page-document";
import { pageImageFromAsset } from "@/lib/media";
import { PHOTO_ACCEPTED_TYPES } from "@/lib/constants";

interface QueueItem {
  key: string;
  file: File;
  progress: number;
  status: "uploading" | "error";
  error?: string;
}

export function MediaUploader({
  onUploaded,
  capacityLeft = Infinity,
  compact = false,
  hiFi = false,
}: {
  onUploaded: (images: PageImage[]) => void;
  capacityLeft?: number;
  compact?: boolean;
  /** Also generate the 2560px xl variant (Pro+; server re-checks the tier). */
  hiFi?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  function patchItem(key: string, patch: Partial<QueueItem>) {
    setQueue((q) => q.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  async function startUpload(file: File, key: string) {
    const result = await uploadPhoto(
      file,
      (fraction) => patchItem(key, { progress: fraction }),
      { hiFi }
    );
    if (result.ok && result.asset) {
      setQueue((q) => q.filter((item) => item.key !== key));
      onUploaded([pageImageFromAsset(result.asset)]);
    } else {
      patchItem(key, { status: "error", error: result.error });
    }
  }

  function handleFiles(files: FileList | File[]) {
    setNotice(null);
    let list = Array.from(files);
    if (list.length > capacityLeft) {
      list = list.slice(0, Math.max(0, capacityLeft));
      setNotice(
        capacityLeft <= 0
          ? "This section is full. Remove an image first."
          : `Only ${capacityLeft} more image${capacityLeft === 1 ? "" : "s"} fit in this section.`
      );
    }
    for (const file of list) {
      const localError = validateFileLocally(file);
      const key = `${file.name}-${Date.now()}-${Math.random()}`;
      if (localError) {
        setQueue((q) => [...q, { key, file, progress: 0, status: "error", error: localError }]);
        continue;
      }
      setQueue((q) => [...q, { key, file, progress: 0, status: "uploading" }]);
      void startUpload(file, key);
    }
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`border border-dashed transition-colors ${
          dragOver ? "border-accent bg-surface" : "border-rule"
        } ${compact ? "p-3" : "p-6"} text-center`}
      >
        <button
          onClick={() => inputRef.current?.click()}
          className="text-[10px] uppercase tracking-wide text-foreground border border-rule hover:border-accent px-4 py-2 transition-colors"
        >
          {compact ? "+ Add photos" : "Choose photos"}
        </button>
        {!compact && (
          <p className="mt-2 text-[11px] text-muted font-copy">
            or drag and drop · JPEG, PNG or WebP · up to 20 MB each
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={PHOTO_ACCEPTED_TYPES.join(",")}
          multiple
          className="sr-only"
          aria-label="Upload photographs"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {notice && (
        <p className="mt-2 text-[11px] text-accent font-copy" role="status">
          {notice}
        </p>
      )}

      {queue.length > 0 && (
        <ul className="mt-3 space-y-2" aria-live="polite">
          {queue.map((item) => (
            <li key={item.key} className="text-[11px] font-copy">
              <div className="flex items-center gap-2">
                <span className="truncate flex-1 text-foreground/80">{item.file.name}</span>
                {item.status === "uploading" ? (
                  <span className="text-muted">{Math.round(item.progress * 100)}%</span>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        patchItem(item.key, { status: "uploading", error: undefined, progress: 0 });
                        void startUpload(item.file, item.key);
                      }}
                      className="text-accent underline underline-offset-2"
                    >
                      Retry
                    </button>
                    <button
                      onClick={() => setQueue((q) => q.filter((i) => i.key !== item.key))}
                      className="text-muted hover:text-foreground"
                      aria-label={`Dismiss ${item.file.name}`}
                    >
                      ×
                    </button>
                  </>
                )}
              </div>
              {item.status === "uploading" ? (
                <div className="mt-1 h-0.5 bg-rule">
                  <div className="h-full bg-accent transition-all" style={{ width: `${item.progress * 100}%` }} />
                </div>
              ) : (
                <p className="mt-0.5 text-red-400">{item.error}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
