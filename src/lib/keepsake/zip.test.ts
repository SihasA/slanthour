import { describe, expect, it } from "vitest";
import { buildZip, crc32, ZipWriter } from "./zip";

function readU16(buf: Uint8Array, offset: number): number {
  return new DataView(buf.buffer, buf.byteOffset, buf.byteLength).getUint16(offset, true);
}
function readU32(buf: Uint8Array, offset: number): number {
  return new DataView(buf.buffer, buf.byteOffset, buf.byteLength).getUint32(offset, true);
}

/** Minimal EOCD parser (not exported from zip.ts — this is verification-only
 * code, mirroring what any real unzip tool would read from the trailer). */
function parseEocd(zip: Uint8Array): {
  entryCount: number;
  centralDirSize: number;
  centralDirOffset: number;
} {
  // Fixed-size EOCD (no zip comment in our writer), so it's always the last 22 bytes.
  const eocdStart = zip.length - 22;
  expect(readU32(zip, eocdStart)).toBe(0x06054b50);
  return {
    entryCount: readU16(zip, eocdStart + 10),
    centralDirSize: readU32(zip, eocdStart + 12),
    centralDirOffset: readU32(zip, eocdStart + 16),
  };
}

describe("crc32", () => {
  it("matches the known CRC-32 check values", () => {
    expect(crc32(new TextEncoder().encode(""))).toBe(0);
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });
});

describe("ZipWriter / buildZip byte layout", () => {
  it("writes a valid local file header + data for a single entry", () => {
    const data = new TextEncoder().encode("hello world");
    const zip = buildZip([{ name: "index.html", data }]);

    expect(readU32(zip, 0)).toBe(0x04034b50); // local file header signature
    const method = readU16(zip, 8);
    expect(method).toBe(0); // store
    const crc = readU32(zip, 14);
    expect(crc).toBe(crc32(data));
    const compressedSize = readU32(zip, 18);
    const uncompressedSize = readU32(zip, 22);
    expect(compressedSize).toBe(data.length);
    expect(uncompressedSize).toBe(data.length);
    const nameLen = readU16(zip, 26);
    expect(nameLen).toBe("index.html".length);
    const name = new TextDecoder().decode(zip.slice(30, 30 + nameLen));
    expect(name).toBe("index.html");
    const fileData = zip.slice(30 + nameLen, 30 + nameLen + data.length);
    expect(new TextDecoder().decode(fileData)).toBe("hello world");
  });

  it("reports the right entry count and offsets for multiple entries", () => {
    const entries = [
      { name: "index.html", data: new TextEncoder().encode("<html></html>") },
      { name: "assets/style.css", data: new TextEncoder().encode("body{color:red}") },
      { name: "images/001.jpg", data: new Uint8Array([1, 2, 3, 4, 5]) },
    ];
    const zip = buildZip(entries);
    const eocd = parseEocd(zip);
    expect(eocd.entryCount).toBe(3);

    // Central directory sits right after all local entries, right before EOCD.
    expect(zip.length).toBe(eocd.centralDirOffset + eocd.centralDirSize + 22);

    // Each central directory record's local-header offset points at that
    // entry's real local file header signature.
    let pos = eocd.centralDirOffset;
    for (const entry of entries) {
      expect(readU32(zip, pos)).toBe(0x02014b50); // central directory signature
      const nameLen = readU16(zip, pos + 28);
      const localOffset = readU32(zip, pos + 42);
      expect(readU32(zip, localOffset)).toBe(0x04034b50);
      const localNameLen = readU16(zip, localOffset + 26);
      const name = new TextDecoder().decode(zip.slice(localOffset + 30, localOffset + 30 + localNameLen));
      expect(name).toBe(entry.name);
      pos += 46 + nameLen; // fixed central-record size + variable name
    }
  });

  it("streams entries incrementally via ZipWriter and matches buildZip's output", () => {
    const entries = [
      { name: "a.txt", data: new TextEncoder().encode("aaa") },
      { name: "b.txt", data: new TextEncoder().encode("bb") },
    ];
    const date = new Date(2026, 0, 1, 12, 30, 0);
    const writer = new ZipWriter();
    const streamed = entries.map((e) => writer.addFile(e.name, e.data, date));
    const trailer = writer.finish();
    const streamedFull = new Uint8Array(
      [...streamed, trailer].reduce((n, p) => n + p.length, 0)
    );
    let off = 0;
    for (const part of [...streamed, trailer]) {
      streamedFull.set(part, off);
      off += part.length;
    }

    const oneShot = buildZip(entries, date);
    expect(streamedFull).toEqual(oneShot);
  });

  it("produces an empty-but-valid zip for zero entries", () => {
    const zip = buildZip([]);
    const eocd = parseEocd(zip);
    expect(eocd.entryCount).toBe(0);
    expect(eocd.centralDirSize).toBe(0);
    expect(eocd.centralDirOffset).toBe(0);
  });
});
