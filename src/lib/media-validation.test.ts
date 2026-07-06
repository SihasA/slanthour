import { describe, expect, it } from "vitest";
import {
  MAX_UPLOAD_BYTES,
  checkBlurDataUrl,
  checkDimensions,
  checkUploadedImage,
  safeFilename,
  sniffImageType,
} from "./media-validation";

const jpeg = () => new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
const png = () => new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const webp = () =>
  new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);

describe("sniffImageType", () => {
  it("identifies real signatures", () => {
    expect(sniffImageType(jpeg())).toBe("jpeg");
    expect(sniffImageType(png())).toBe("png");
    expect(sniffImageType(webp())).toBe("webp");
  });

  it("rejects spoofed and unknown content", () => {
    // Windows executable (MZ), HTML, GIF, empty, truncated PNG
    expect(sniffImageType(new Uint8Array([0x4d, 0x5a, 0x90, 0x00]))).toBeNull();
    expect(sniffImageType(new TextEncoder().encode("<html><script>"))).toBeNull();
    expect(sniffImageType(new TextEncoder().encode("GIF89a"))).toBeNull();
    expect(sniffImageType(new Uint8Array())).toBeNull();
    expect(sniffImageType(new Uint8Array([0x89, 0x50, 0x4e]))).toBeNull();
    // RIFF but not WEBP (e.g. WAV)
    expect(
      sniffImageType(
        new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45])
      )
    ).toBeNull();
  });
});

describe("checkUploadedImage", () => {
  it("accepts valid images within limits", () => {
    expect(checkUploadedImage(jpeg()).ok).toBe(true);
  });

  it("rejects empty, oversized, and spoofed uploads", () => {
    expect(checkUploadedImage(new Uint8Array()).ok).toBe(false);
    const huge = new Uint8Array(MAX_UPLOAD_BYTES + 1);
    huge.set(jpeg());
    expect(checkUploadedImage(huge).ok).toBe(false);
    expect(checkUploadedImage(new TextEncoder().encode("not an image")).ok).toBe(false);
  });
});

describe("safeFilename", () => {
  it("strips path traversal and dangerous characters", () => {
    expect(safeFilename("../../etc/passwd")).toBe(".._.._etc_passwd");
    expect(safeFilename("my photo (1).jpg")).toBe("my_photo__1_.jpg");
    expect(safeFilename(null)).toBe("photo.jpg");
    expect(safeFilename("x".repeat(300)).length).toBeLessThanOrEqual(120);
  });
});

describe("checkDimensions", () => {
  it("accepts sane dimensions and rejects junk", () => {
    expect(checkDimensions(2000, 1333)).toEqual({ width: 2000, height: 1333 });
    expect(checkDimensions(0, 100)).toBeNull();
    expect(checkDimensions(100000, 100)).toBeNull();
    expect(checkDimensions("abc", 100)).toBeNull();
    expect(checkDimensions(1.5, 100)).toBeNull();
  });
});

describe("checkBlurDataUrl", () => {
  it("accepts small image data URLs only", () => {
    expect(checkBlurDataUrl("data:image/jpeg;base64,/9j/4AAQ")).toBe("data:image/jpeg;base64,/9j/4AAQ");
    expect(checkBlurDataUrl("data:text/html;base64,PHNjcmlwdD4=")).toBeNull();
    expect(checkBlurDataUrl("javascript:alert(1)")).toBeNull();
    expect(checkBlurDataUrl("data:image/jpeg;base64," + "A".repeat(5000))).toBeNull();
    expect(checkBlurDataUrl(42)).toBeNull();
  });
});
