// png.mjs: a minimal PNG writer (8 bit, grey or RGB), no npm packages. Shared by screen.mjs and print.mjs.
import zlib from 'node:zlib';
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc = b => { let c = -1; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function chunk(type, data) { const t = Buffer.from(type), len = Buffer.alloc(4), c = Buffer.alloc(4); len.writeUInt32BE(data.length); c.writeUInt32BE(crc(Buffer.concat([t, data]))); return Buffer.concat([len, t, data, c]); }
// px: Buffer of w * h * ch bytes; ch 1 (grey) or 3 (RGB)
export function png(px, w, h, ch) { const row = w * ch + 1, raw = Buffer.alloc(row * h);
  for (let y = 0; y < h; y++) { raw[y * row] = 0; px.copy(raw, y * row + 1, y * w * ch, (y + 1) * w * ch); }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = ch === 1 ? 0 : 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]); }
export const hex = h => [0, 2, 4].map(i => parseInt(String(h).replace('#', '').slice(i, i + 2), 16));
export function args(argv) { return (k, d) => { const i = argv.indexOf('--' + k); return i < 0 ? d : argv[i + 1]; }; }
