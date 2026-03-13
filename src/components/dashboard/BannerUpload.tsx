"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { compressImage, generateBannerPath } from "@/lib/image";
import {
  PHOTO_ACCEPTED_TYPES,
  BANNER_MAX_DIMENSION,
  BANNER_QUALITY,
} from "@/lib/constants";

interface BannerUploadProps {
  portfolioId: string;
  userId: string;
  currentBannerUrl: string | null;
}

export function BannerUpload({
  portfolioId,
  userId,
  currentBannerUrl,
}: BannerUploadProps) {
  const [bannerUrl, setBannerUrl] = useState<string | null>(currentBannerUrl);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!PHOTO_ACCEPTED_TYPES.includes(file.type)) {
      setError("Please upload a JPG, PNG, or WebP image.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const supabase = createClient();

      // Compress
      const { blob } = await compressImage(file, {
        maxDimension: BANNER_MAX_DIMENSION,
        quality: BANNER_QUALITY,
      });

      // Upload (upsert to overwrite previous banner)
      const path = generateBannerPath(userId);
      const { error: uploadError } = await supabase.storage
        .from("portfolios")
        .upload(path, blob, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL with cache-busting param
      const { data: urlData } = supabase.storage
        .from("portfolios")
        .getPublicUrl(path);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update portfolio record
      const { error: updateError } = await supabase
        .from("portfolios")
        .update({
          banner_url: urlData.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", portfolioId);

      if (updateError) throw updateError;

      setBannerUrl(publicUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to upload banner."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    setRemoving(true);
    setError(null);

    try {
      const supabase = createClient();
      const path = generateBannerPath(userId);

      // Remove from storage
      await supabase.storage.from("portfolios").remove([path]);

      // Clear from portfolio
      const { error: updateError } = await supabase
        .from("portfolios")
        .update({
          banner_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", portfolioId);

      if (updateError) throw updateError;

      setBannerUrl(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove banner."
      );
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="aspect-[3/1] border border-rule overflow-hidden bg-surface">
        {bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bannerUrl}
            alt="Portfolio banner"
            className="w-full h-full object-cover"
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
          disabled={uploading}
          className="text-[10px] uppercase tracking-wide text-foreground border-b border-foreground pb-0.5 hover:text-accent hover:border-accent transition-colors disabled:opacity-50"
        >
          {uploading
            ? "Uploading..."
            : bannerUrl
              ? "Change banner"
              : "Upload banner"}
        </button>

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

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept={PHOTO_ACCEPTED_TYPES.join(",")}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error */}
      {error && (
        <p className="text-[12px] font-heading italic text-red-400">{error}</p>
      )}
    </div>
  );
}
