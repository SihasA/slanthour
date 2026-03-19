"use client";

import { useState, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { createClient } from "@/lib/supabase/client";
import { compressImage, generateBannerPath } from "@/lib/image";
import {
  PHOTO_ACCEPTED_TYPES,
  BANNER_MAX_DIMENSION,
  BANNER_QUALITY,
} from "@/lib/constants";
import type { BannerCrop } from "@/types";

interface BannerUploadProps {
  portfolioId: string;
  userId: string;
  currentBannerUrl: string | null;
  currentBannerCrop: BannerCrop | null;
}

export function BannerUpload({
  portfolioId,
  userId,
  currentBannerUrl,
  currentBannerCrop,
}: BannerUploadProps) {
  const [bannerUrl, setBannerUrl] = useState<string | null>(currentBannerUrl);
  const [bannerCrop, setBannerCrop] = useState<BannerCrop | null>(currentBannerCrop);

  // Crop editor state
  const [cropMode, setCropMode] = useState<"idle" | "editing">("idle");
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [latestCroppedArea, setLatestCroppedArea] = useState<Area | null>(null);

  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((croppedArea: Area) => {
    setLatestCroppedArea(croppedArea);
  }, []);

  function openCropEditor(imageSrc: string, file: File | null) {
    setCropImageSrc(imageSrc);
    setCropFile(file);
    setCrop({ x: 0, y: 0 });
    setZoom(bannerCrop?.zoom ?? 1);
    setLatestCroppedArea(null);
    setCropMode("editing");
    setError(null);
  }

  function cancelCrop() {
    if (cropImageSrc && cropFile) {
      URL.revokeObjectURL(cropImageSrc);
    }
    setCropImageSrc(null);
    setCropFile(null);
    setCropMode("idle");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setLatestCroppedArea(null);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!PHOTO_ACCEPTED_TYPES.includes(file.type)) {
      setError("Please upload a JPG, PNG, or WebP image.");
      return;
    }

    setError(null);
    openCropEditor(URL.createObjectURL(file), file);
  }

  async function handleSave() {
    if (!latestCroppedArea) return;
    setSaving(true);
    setError(null);

    // Convert croppedArea (percentage of full image) to focal point for object-position
    const newCropData: BannerCrop = {
      zoom,
      x: latestCroppedArea.x + latestCroppedArea.width / 2,
      y: latestCroppedArea.y + latestCroppedArea.height / 2,
    };

    try {
      const supabase = createClient();

      if (cropFile) {
        // New file: compress and upload
        const { blob } = await compressImage(cropFile, {
          maxDimension: BANNER_MAX_DIMENSION,
          quality: BANNER_QUALITY,
        });

        const path = generateBannerPath(userId);
        const { error: uploadError } = await supabase.storage
          .from("portfolios")
          .upload(path, blob, { contentType: "image/jpeg", upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("portfolios")
          .getPublicUrl(path);

        const { error: updateError } = await supabase
          .from("portfolios")
          .update({
            banner_url: urlData.publicUrl,
            banner_crop: newCropData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", portfolioId);

        if (updateError) throw updateError;

        setBannerUrl(`${urlData.publicUrl}?t=${Date.now()}`);
      } else {
        // Repositioning only — no new upload
        const { error: updateError } = await supabase
          .from("portfolios")
          .update({
            banner_crop: newCropData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", portfolioId);

        if (updateError) throw updateError;
      }

      setBannerCrop(newCropData);
      cancelCrop();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save banner.");
      setSaving(false);
    }
  }

  async function handleRemove() {
    setRemoving(true);
    setError(null);

    try {
      const supabase = createClient();
      const path = generateBannerPath(userId);

      await supabase.storage.from("portfolios").remove([path]);

      const { error: updateError } = await supabase
        .from("portfolios")
        .update({
          banner_url: null,
          banner_crop: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", portfolioId);

      if (updateError) throw updateError;

      setBannerUrl(null);
      setBannerCrop(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove banner.");
    } finally {
      setRemoving(false);
    }
  }

  const previewObjectPosition = bannerCrop
    ? `${bannerCrop.x}% ${bannerCrop.y}%`
    : "center 40%";

  return (
    <div className="space-y-4">
      {/* Crop editor modal */}
      {cropMode === "editing" && cropImageSrc && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 p-6">
          <div className="w-full max-w-2xl space-y-4">
            <p className="text-[9px] uppercase tracking-label text-accent text-center mb-2">
              Position banner — drag to reposition, scroll to zoom
            </p>

            {/* Cropper container — 16:9 aspect ratio */}
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                style={{
                  containerStyle: {
                    position: "absolute",
                    inset: 0,
                    background: "#111",
                  },
                  cropAreaStyle: {
                    border: "2px solid rgba(156,142,122,0.8)",
                  },
                }}
              />
            </div>

            {/* Zoom slider */}
            <div className="flex items-center gap-4 pt-1">
              <span className="text-[9px] uppercase tracking-label text-muted whitespace-nowrap">
                Zoom
              </span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-accent"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-6 justify-center pt-2">
              <button
                onClick={handleSave}
                disabled={saving || !latestCroppedArea}
                className="text-[10px] uppercase tracking-wide text-foreground border-b border-foreground pb-0.5 hover:text-accent hover:border-accent transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : cropFile ? "Upload & save position" : "Save position"}
              </button>
              <button
                onClick={cancelCrop}
                disabled={saving}
                className="text-[10px] uppercase tracking-wide text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>

            {error && (
              <p className="text-[12px] font-heading italic text-red-400 text-center">
                {error}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Preview */}
      <div className="aspect-[3/1] border border-rule overflow-hidden bg-surface">
        {bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bannerUrl}
            alt="Portfolio banner"
            className="w-full h-full object-cover"
            style={{ objectPosition: previewObjectPosition }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="font-heading text-[13px] italic text-muted/40">
              No banner image
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={removing}
          className="text-[10px] uppercase tracking-wide text-foreground border-b border-foreground pb-0.5 hover:text-accent hover:border-accent transition-colors disabled:opacity-50"
        >
          {bannerUrl ? "Change banner" : "Upload banner"}
        </button>

        {bannerUrl && (
          <button
            onClick={() => openCropEditor(bannerUrl, null)}
            disabled={removing}
            className="text-[10px] uppercase tracking-wide text-foreground border-b border-foreground pb-0.5 hover:text-accent hover:border-accent transition-colors disabled:opacity-50"
          >
            Reposition
          </button>
        )}

        {bannerUrl && (
          <button
            onClick={handleRemove}
            disabled={removing}
            className="text-[10px] uppercase tracking-wide text-muted border-b border-muted pb-0.5 hover:text-foreground hover:border-foreground transition-colors disabled:opacity-50"
          >
            {removing ? "Removing..." : "Remove"}
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={PHOTO_ACCEPTED_TYPES.join(",")}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error (outside crop mode) */}
      {error && cropMode === "idle" && (
        <p className="text-[12px] font-heading italic text-red-400">{error}</p>
      )}
    </div>
  );
}
