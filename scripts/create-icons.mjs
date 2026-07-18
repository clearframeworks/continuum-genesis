import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { deflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const OUT_DIR = path.join(ROOT, "apps", "text-cockpit", "icons");

await mkdir(OUT_DIR, { recursive: true });
await writePng(path.join(OUT_DIR, "icon-192.png"), 192);
await writePng(path.join(OUT_DIR, "icon-512.png"), 512);

function pixel(size, x, y) {
  const cx = size / 2;
  const cy = size / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy) / cx;
  const glow = Math.max(0, 1 - dist);
  const ring = Math.abs(dist - 0.58) < 0.045;
  const slash = Math.abs((x - y) / size) < 0.035 && x > size * 0.28 && x < size * 0.72;
  const bg = [
    Math.round(4 + 10 * glow),
    Math.round(9 + 34 * glow),
    Math.round(12 + 42 * glow)
  ];

  if (ring || slash) {
    return [47, 212, 194, 255];
  }

  return [bg[0], bg[1], bg[2], 255];
}

async function writePng(file, size) {
  const rows = [];
  for (let y = 0; y < size; y += 1) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0;
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = pixel(size, x, y);
      const i = 1 + x * 4;
      row[i] = r;
      row[i + 1] = g;
      row[i + 2] = b;
      row[i + 3] = a;
    }
    rows.push(row);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(Buffer.concat(rows))),
    chunk("IEND", Buffer.alloc(0))
  ]);

  await writeFile(file, png);
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
