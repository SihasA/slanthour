import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// A gallery print at closing time: the hero photograph, scrimmed into the
// dark ground, with the wordmark and slanted tick sitting quietly in the
// lower-left corner. No live text — the wordmark carries the lettering,
// and Satori only needs a font buffer when there are text nodes.

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Slanthour, a home for photos that deserve more than a post";
export const dynamic = "force-static";

export default async function OpengraphImage() {
  const [photo, wordmark] = await Promise.all([
    readFile(join(process.cwd(), "public/landing/wedding-1200.jpg")),
    readFile(join(process.cwd(), "public/brand/logo-light.svg")),
  ]);
  const photoSrc = `data:image/jpeg;base64,${photo.toString("base64")}`;
  const wordmarkSrc = `data:image/svg+xml;base64,${wordmark.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#0a0908",
        }}
      >
        {/* Photograph, right ~58% of the canvas, full height. */}
        <img
          src={photoSrc}
          alt=""
          width={696}
          height={630}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 696,
            height: 630,
            objectFit: "cover",
          }}
        />

        {/* Scrim: dark ground fading into the photograph's left edge. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 504,
            width: 340,
            height: 630,
            background:
              "linear-gradient(to right, #0a0908 0%, rgba(10,9,8,0.75) 45%, rgba(10,9,8,0) 100%)",
            display: "flex",
          }}
        />

        {/* Hairline frame. */}
        <div
          style={{
            position: "absolute",
            top: 28,
            left: 28,
            right: 28,
            bottom: 28,
            border: "1px solid #1f1e1d",
            display: "flex",
          }}
        />

        {/* Slanted tick, just above the wordmark. */}
        <div
          style={{
            position: "absolute",
            left: 72,
            bottom: 140,
            width: 44,
            height: 2,
            background: "#FF6B00",
            transform: "rotate(-18deg)",
            display: "flex",
          }}
        />

        {/* Wordmark, lower-left quiet zone. */}
        <img
          src={wordmarkSrc}
          alt="Slanthour"
          width={210}
          height={40}
          style={{
            position: "absolute",
            left: 72,
            bottom: 72,
            width: 210,
            height: 40,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
