"use client";

import { useState, useRef, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from "@/lib/supabase/client";
import { PhotoCard } from "./PhotoCard";
import { PhotoUploader } from "./PhotoUploader";
import type { Photo, Tier } from "@/types";

interface PhotoGridProps {
  initialPhotos: Photo[];
  portfolioId: string;
  userId: string;
  tier: Tier;
}

function SortablePhoto({
  photo,
  publicUrl,
  onCaptionSave,
  onDelete,
}: {
  photo: Photo;
  publicUrl: string;
  onCaptionSave: (id: string, caption: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <PhotoCard
        photo={photo}
        publicUrl={publicUrl}
        onCaptionSave={onCaptionSave}
        onDelete={onDelete}
        isDragging={isDragging}
        dragHandleListeners={listeners}
        dragHandleAttributes={attributes}
      />
    </div>
  );
}

export function PhotoGrid({
  initialPhotos,
  portfolioId,
  userId,
  tier,
}: PhotoGridProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const previousPhotosRef = useRef<Photo[]>(initialPhotos);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    })
  );

  function getPublicUrl(storagePath: string): string {
    const supabase = createClient();
    return supabase.storage
      .from("portfolios")
      .getPublicUrl(storagePath).data.publicUrl;
  }

  const handleCaptionSave = useCallback(
    async (photoId: string, caption: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("photos")
        .update({ caption: caption || null })
        .eq("id", photoId);

      if (!error) {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photoId ? { ...p, caption: caption || null } : p
          )
        );
      }
    },
    []
  );

  const handleDelete = useCallback(
    async (photoId: string) => {
      const photo = photos.find((p) => p.id === photoId);
      if (!photo) return;

      const supabase = createClient();

      // Delete from storage
      await supabase.storage.from("portfolios").remove([photo.storage_path]);

      // Delete from DB
      const { error } = await supabase
        .from("photos")
        .delete()
        .eq("id", photoId);

      if (!error) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      }
    },
    [photos]
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setReorderError(null);

    // Save previous state for rollback
    previousPhotosRef.current = [...photos];

    const oldIndex = photos.findIndex((p) => p.id === active.id);
    const newIndex = photos.findIndex((p) => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistic reorder
    const reordered = [...photos];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    // Assign new sort_order values
    const updated = reordered.map((p, i) => ({ ...p, sort_order: i }));
    setPhotos(updated);

    // Persist to server
    try {
      const res = await fetch("/api/photos/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: updated.map((p) => ({ id: p.id, sort_order: p.sort_order })),
        }),
      });

      if (!res.ok) throw new Error("Reorder failed");
    } catch {
      // Rollback on failure
      setPhotos(previousPhotosRef.current);
      setReorderError("Failed to save new order. Please try again.");
      setTimeout(() => setReorderError(null), 4000);
    }
  }

  function handleUploadComplete(newPhotos: Photo[]) {
    setPhotos((prev) => [...prev, ...newPhotos]);
  }

  return (
    <div className="space-y-8">
      {/* Photo grid */}
      {photos.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={photos.map((p) => p.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <SortablePhoto
                  key={photo.id}
                  photo={photo}
                  publicUrl={getPublicUrl(photo.storage_path)}
                  onCaptionSave={handleCaptionSave}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Reorder error */}
      {reorderError && (
        <p className="text-[12px] font-heading italic text-red-400">
          {reorderError}
        </p>
      )}

      {/* Uploader */}
      <PhotoUploader
        portfolioId={portfolioId}
        userId={userId}
        currentPhotoCount={photos.length}
        tier={tier}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}
