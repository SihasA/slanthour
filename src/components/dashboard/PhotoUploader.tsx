"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { compressImage, generateStoragePath } from "@/lib/image";
import {
  PHOTO_ACCEPTED_TYPES,
  PHOTO_MAX_FILE_SIZE,
  TIER_LIMITS,
} from "@/lib/constants";
import type { Photo, Tier } from "@/types";

interface PhotoUploaderProps {
  portfolioId: string;
  userId: string;
  currentPhotoCount: number;
  tier: Tier;
  onUploadComplete: (newPhotos: Photo[]) => void;
}

interface FileProgress {
  name: string;
  status: "queued" | "compressing" | "uploading" | "done" | "error";
  error?: string;
}

export function PhotoUploader({
  portfolioId,
  userId,
  currentPhotoCount,
  tier,
  onUploadComplete,
}: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<FileProgress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxPhotos = TIER_LIMITS[tier].maxPhotos;
  const remaining = maxPhotos - currentPhotoCount;

  const updateProgress = useCallback(
    (name: string, update: Partial<FileProgress>) => {
      setProgress((prev) =>
        prev.map((p) => (p.name === name ? { ...p, ...update } : p))
      );
    },
    []
  );

  async function uploadSingleFile(
    file: File,
    sortOffset: number
  ): Promise<Photo | null> {
    const supabase = createClient();

    try {
      updateProgress(file.name, { status: "compressing" });
      const { blob, width, height } = await compressImage(file);

      updateProgress(file.name, { status: "uploading" });
      const path = generateStoragePath(userId, file.name);

      const { error: uploadError } = await supabase.storage
        .from("portfolios")
        .upload(path, blob, { contentType: "image/jpeg", upsert: false });

      if (uploadError) throw uploadError;

      const { data, error: insertError } = await supabase
        .from("photos")
        .insert({
          portfolio_id: portfolioId,
          storage_path: path,
          filename: file.name,
          width,
          height,
          sort_order: currentPhotoCount + sortOffset,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      updateProgress(file.name, { status: "done" });
      return data as Photo;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      updateProgress(file.name, { status: "error", error: msg });
      return null;
    }
  }

  async function processFiles(files: File[]) {
    setError(null);

    // Validate file types and sizes
    const invalid = files.filter(
      (f) =>
        !PHOTO_ACCEPTED_TYPES.includes(f.type) ||
        f.size > PHOTO_MAX_FILE_SIZE
    );
    if (invalid.length > 0) {
      setError(
        `Some files were rejected. Accepted: JPG, PNG, WebP up to 20MB.`
      );
      files = files.filter(
        (f) =>
          PHOTO_ACCEPTED_TYPES.includes(f.type) &&
          f.size <= PHOTO_MAX_FILE_SIZE
      );
    }

    if (files.length === 0) return;

    // Check tier limit
    if (files.length > remaining) {
      if (remaining <= 0) {
        setError(
          `You've used ${currentPhotoCount} of ${maxPhotos} photos. ${
            tier === "studio"
              ? "You've reached the maximum."
              : `Upgrade to ${tier === "free" ? "Pro" : "Studio"} for more.`
          }`
        );
        return;
      }
      setError(
        `Only uploading ${remaining} of ${files.length} files — you have ${remaining} slots remaining.`
      );
      files = files.slice(0, remaining);
    }

    setUploading(true);
    setProgress(files.map((f) => ({ name: f.name, status: "queued" })));

    // Upload with concurrency limit of 3
    const results: Photo[] = [];
    const queue = files.map((f, i) => ({ file: f, index: i }));
    const workers = Array.from({ length: Math.min(3, queue.length) }, async () => {
      while (queue.length > 0) {
        const item = queue.shift()!;
        const photo = await uploadSingleFile(item.file, item.index);
        if (photo) results.push(photo);
      }
    });

    await Promise.all(workers);

    if (results.length > 0) {
      onUploadComplete(results);
    }

    setUploading(false);
    // Clear progress after a brief delay so user can see final state
    setTimeout(() => setProgress([]), 2000);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    processFiles(files);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  }

  const atCapacity = remaining <= 0;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center min-h-[180px] border border-dashed transition-colors ${
          atCapacity
            ? "border-rule/50 opacity-50 cursor-not-allowed"
            : isDragging
              ? "border-accent bg-accent/5"
              : "border-rule hover:border-muted"
        }`}
      >
        {uploading ? (
          <div className="w-full max-w-xs space-y-2 px-4">
            {progress.map((p) => (
              <div key={p.name} className="flex items-center gap-3">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    p.status === "done"
                      ? "bg-accent"
                      : p.status === "error"
                        ? "bg-red-400"
                        : "bg-muted animate-pulse"
                  }`}
                />
                <span className="text-[11px] font-heading italic text-muted truncate flex-1">
                  {p.name}
                </span>
                <span className="text-[9px] uppercase tracking-wide text-muted/60 flex-shrink-0">
                  {p.status === "compressing"
                    ? "Resizing"
                    : p.status === "uploading"
                      ? "Uploading"
                      : p.status === "done"
                        ? "Done"
                        : p.status === "error"
                          ? "Failed"
                          : "Queued"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-muted mb-3"
            >
              <path d="M12 19V5M12 5l-5 5M12 5l5 5" />
            </svg>
            <p className="font-heading text-[15px] italic text-muted mb-1">
              {atCapacity ? "Photo limit reached" : "Drag photos here"}
            </p>
            {!atCapacity && (
              <>
                <p className="text-[10px] text-muted/60 mb-3">or</p>
                <button
                  onClick={() => inputRef.current?.click()}
                  className="text-[10px] uppercase tracking-wide text-foreground border-b border-foreground pb-0.5 hover:text-accent hover:border-accent transition-colors"
                >
                  Choose files
                </button>
              </>
            )}
            <p className="text-[9px] text-muted/40 mt-3">
              JPG, PNG, WebP · Max 20MB each
            </p>
          </>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={PHOTO_ACCEPTED_TYPES.join(",")}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Usage indicator */}
      <p className="text-[9px] uppercase tracking-wide text-muted/60">
        {currentPhotoCount} of {maxPhotos} photos used
        <span className="text-muted/40 ml-1">
          ({tier} tier)
        </span>
      </p>

      {/* Error message */}
      {error && (
        <p className="text-[12px] font-heading italic text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
