// ─── Dependency-free ZIP writer (store method only) ───────────────────
// JPEGs and the compiled CSS/HTML are small text/already-compressed
// content, so "store" (no re-compression) is correct and keeps this file
// free of any compression-library dependency (no fflate, no zlib deps).
// Local file header + data is returned by addFile() as soon as it's built,
// so a caller can stream each entry to a response the moment its bytes are
// ready — memory stays bounded to one entry at a time regardless of how
// many images an archive has. finish() returns the trailing central
// directory + end-of-central-directory record, written once, last.

const CRC_TABLE = buildCrcTable();

function buildCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}

/** CRC-32 (ISO 3309 / the checksum ZIP uses) of a byte buffer. */
export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date: Date): { time: number; date: number } {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
  const dosDate =
    ((Math.max(0, date.getFullYear() - 1980)) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, date: dosDate };
}

function u16(n: number): Uint8Array {
  const b = new Uint8Array(2);
  new DataView(b.buffer).setUint16(0, n, true);
  return b;
}

function u32(n: number): Uint8Array {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n, true);
  return b;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

interface CentralRecord {
  name: Uint8Array;
  crc: number;
  size: number;
  offset: number;
  time: number;
  date: number;
}

const VERSION_NEEDED = 20; // 2.0 — store method + basic headers only
const METHOD_STORE = 0;

/** Incremental store-only ZIP writer. Call addFile() once per entry, in
 * order, and write its returned bytes immediately; call finish() exactly
 * once at the end and write its returned bytes last. */
export class ZipWriter {
  private offset = 0;
  private records: CentralRecord[] = [];

  addFile(name: string, data: Uint8Array, date: Date = new Date()): Uint8Array {
    const nameBytes = new TextEncoder().encode(name);
    const crc = crc32(data);
    const { time, date: dosDate } = dosDateTime(date);

    const header = concat([
      u32(0x04034b50), // local file header signature
      u16(VERSION_NEEDED),
      u16(0), // general purpose flags
      u16(METHOD_STORE),
      u16(time),
      u16(dosDate),
      u32(crc),
      u32(data.length), // compressed size == uncompressed for "store"
      u32(data.length),
      u16(nameBytes.length),
      u16(0), // extra field length
      nameBytes,
    ]);

    this.records.push({ name: nameBytes, crc, size: data.length, offset: this.offset, time, date: dosDate });
    this.offset += header.length + data.length;

    return concat([header, data]);
  }

  /** Central directory + end-of-central-directory record. Call once, after
   * every addFile(); the returned bytes are the last thing written. */
  finish(): Uint8Array {
    const centralParts: Uint8Array[] = this.records.map((r) =>
      concat([
        u32(0x02014b50), // central directory file header signature
        u16(VERSION_NEEDED), // version made by
        u16(VERSION_NEEDED), // version needed to extract
        u16(0), // flags
        u16(METHOD_STORE),
        u16(r.time),
        u16(r.date),
        u32(r.crc),
        u32(r.size),
        u32(r.size),
        u16(r.name.length),
        u16(0), // extra field length
        u16(0), // file comment length
        u16(0), // disk number start
        u16(0), // internal file attributes
        u32(0), // external file attributes
        u32(r.offset),
        r.name,
      ])
    );

    const central = concat(centralParts);
    const eocd = concat([
      u32(0x06054b50), // end of central directory signature
      u16(0), // this disk
      u16(0), // disk with the start of the central directory
      u16(this.records.length), // entries on this disk
      u16(this.records.length), // total entries
      u32(central.length),
      u32(this.offset), // offset of the start of the central directory
      u16(0), // comment length
    ]);

    return concat([central, eocd]);
  }
}

/** Build one complete in-memory ZIP (every entry + the trailer). Used by
 * tests and any caller that doesn't need to stream. */
export function buildZip(entries: { name: string; data: Uint8Array }[], date?: Date): Uint8Array {
  const writer = new ZipWriter();
  const parts = entries.map((entry) => writer.addFile(entry.name, entry.data, date));
  parts.push(writer.finish());
  return concat(parts);
}
