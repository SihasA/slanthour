"use client";

import { useState, useRef, useEffect } from "react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

interface PhotoCardProps {
  photo: {
    id: string;
    caption: string | null;
    filename: string;
  };
  publicUrl: string;
  onCaptionSave: (photoId: string, caption: string) => Promise<void>;
  onDelete: (photoId: string) => Promise<void>;
  isDragging?: boolean;
  dragHandleListeners?: SyntheticListenerMap;
  dragHandleAttributes?: DraggableAttributes;
}

export function PhotoCard({
  photo,
  publicUrl,
  onCaptionSave,
  onDelete,
  isDragging,
  dragHandleListeners,
  dragHandleAttributes,
}: PhotoCardProps) {
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  async function handleCaptionBlur() {
    setEditing(false);
    const trimmed = caption.trim();
    if (trimmed !== (photo.caption ?? "")) {
      await onCaptionSave(photo.id, trimmed);
    }
  }

  function handleCaptionKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setCaption(photo.caption ?? "");
      setEditing(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    await onDelete(photo.id);
  }

  return (
    <div
      className={`group border border-rule bg-surface transition-shadow ${
        isDragging ? "shadow-lg opacity-75 z-50" : ""
      }`}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={publicUrl}
          alt={photo.caption || photo.filename}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Drag handle — top-left */}
        <button
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/70 backdrop-blur-sm p-1.5 cursor-grab active:cursor-grabbing"
          {...(dragHandleListeners ?? {})}
          {...(dragHandleAttributes ?? {})}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="currentColor"
            className="text-foreground"
          >
            <circle cx="3" cy="2" r="1.2" />
            <circle cx="9" cy="2" r="1.2" />
            <circle cx="3" cy="6" r="1.2" />
            <circle cx="9" cy="6" r="1.2" />
            <circle cx="3" cy="10" r="1.2" />
            <circle cx="9" cy="10" r="1.2" />
          </svg>
        </button>

        {/* Delete — top-right */}
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/70 backdrop-blur-sm p-1.5"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-foreground"
            >
              <line x1="1" y1="1" x2="9" y2="9" />
              <line x1="9" y1="1" x2="1" y2="9" />
            </svg>
          </button>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wide text-foreground mb-3">
                Delete photo?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-[10px] uppercase tracking-wide text-red-400 border-b border-red-400 pb-0.5 hover:text-red-300 transition-colors disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-[10px] uppercase tracking-wide text-muted border-b border-muted pb-0.5 hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="px-3 py-2 border-t border-rule min-h-[36px]">
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onBlur={handleCaptionBlur}
            onKeyDown={handleCaptionKeyDown}
            placeholder="Add caption..."
            className="w-full bg-transparent text-[13px] font-heading italic text-foreground placeholder:text-muted/40 focus:outline-none"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="w-full text-left text-[13px] font-heading italic truncate"
          >
            <span className={caption ? "text-muted" : "text-muted/40"}>
              {caption || "Add caption..."}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
