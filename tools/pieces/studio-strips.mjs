// Makes the environment light map the stage piece uses: plugin/library/pieces/assets/studio-strips.hdr.
// Soft strip lights on black, as a latitude-longitude Radiance HDR (RGBE, run-length encoded).
//
//   node tools/pieces/studio-strips.mjs [--width 512] [--out <file.hdr>]
//
// The map was first made by script for the 2026-11-24 pieces experiment at 2048 x 1024. The shapes below are that map
// written as data: each light is a rectangle with a flat core and linear soft edges, in that map's pixel units
// (2048 x 1024), with its colour in linear light. Any width renders the same lights; 512 is plenty for lighting.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DEFAULT_OUT = path.join(ROOT, 'plugin', 'library', 'pieces', 'assets', 'studio-strips.hdr');
export const UNIT = { w: 2048, h: 1024 };
export const BACKGROUND = [0.004, 0.004, 0.004];

// x/y: [outer start, core start, core end, outer end]. x may run past 0 or 2048: the map wraps around.
export const LIGHTS = [
  { name: 'top panel', x: [1128, 1209, 1495, 1575], y: [52, 93, 112, 152], rgb: [5, 5, 5.375] },
  { name: 'key strip (warm, bright)', x: [994, 1018, 1030, 1054], y: [175, 187, 673, 685], rgb: [18, 15.375, 12.125] },
  { name: 'cool strip', x: [1658, 1679, 1679, 1701], y: [195, 207, 653, 665], rgb: [12.625, 12.625, 13.5] },
  { name: 'warm strip', x: [349, 369, 369, 388], y: [206, 218, 602, 614], rgb: [7.25, 6.25, 4.9375] },
  { name: 'side panel', x: [-58, 42, 162, 262], y: [401, 451, 573, 623], rgb: [1.203, 1.148, 1.102] },
  { name: 'bar', x: [419, 430, 994, 1000], y: [476, 481, 481, 487], rgb: [1.43, 1.32, 1.148] },
];

/** 0..1: how far inside a soft-edged span [a, b, c, d] the point t is (1 in the core, ramps on the edges). */
export function ramp(t, [a, b, c, d]) {
  if (t <= a || t >= d) return 0;
  if (t < b) return (t - a) / (b - a);
  if (t > c) return (d - t) / (d - c);
  return 1;
}
const wrapRamp = (x, span) => Math.max(ramp(x, span), ramp(x + UNIT.w, span), ramp(x - UNIT.w, span));

/** Linear RGB at a point in map units (2048 x 1024): the brightest light there, or the background. */
export function radianceAt(x, y) {
  let out = BACKGROUND;
  let best = 0;
  for (const l of LIGHTS) {
    const k = wrapRamp(x, l.x) * ramp(y, l.y);
    if (!k) continue;
    const c = l.rgb.map((v, i) => Math.max(BACKGROUND[i], v * k));
    const lum = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    if (lum > best) { best = lum; out = c; }
  }
  return out;
}

/** The map at a width (height is half), each pixel the mean of a 4 x 4 grid of samples over its footprint. */
export function renderMap(width = 512) {
  const w = width; const h = width / 2; const sx = UNIT.w / w; const sy = UNIT.h / h; const n = 4;
  const px = new Float32Array(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const acc = [0, 0, 0];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const c = radianceAt((x + (i + 0.5) / n) * sx, (y + (j + 0.5) / n) * sy);
      acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2];
    }
    px.set(acc.map((v) => v / (n * n)), (y * w + x) * 3);
  }
  return { w, h, px };
}

/** One float RGB to RGBE bytes. */
export function toRGBE(r, g, b) {
  const m = Math.max(r, g, b);
  if (m < 1e-32) return [0, 0, 0, 0];
  const e = Math.ceil(Math.log2(m) + 1e-9);
  const f = 256 / Math.pow(2, e);
  return [Math.min(255, Math.floor(r * f)), Math.min(255, Math.floor(g * f)), Math.min(255, Math.floor(b * f)), e + 128];
}

/** Run-length encodes one component of a scanline (the new-style Radiance scheme). */
function rleComponent(bytes) {
  const out = [];
  let i = 0;
  while (i < bytes.length) {
    let run = 1;
    while (i + run < bytes.length && run < 127 && bytes[i + run] === bytes[i]) run++;
    if (run >= 3) { out.push(128 + run, bytes[i]); i += run; continue; }
    const start = i;
    let lit = 0;
    while (i < bytes.length && lit < 128) {
      if (i + 2 < bytes.length && bytes[i] === bytes[i + 1] && bytes[i] === bytes[i + 2]) break;
      i++; lit++;
    }
    out.push(lit, ...bytes.slice(start, start + lit));
  }
  return out;
}

/** A Radiance .hdr file (RGBE, run-length encoded scanlines) for w x h linear RGB. */
export function encodeHDR({ w, h, px }) {
  if (w < 8 || w > 0x7fff) throw new Error('scanline run-length encoding needs a width from 8 to 32767');
  const head = Buffer.from(`#?RADIANCE\n# studio-strips: soft strip lights on black (tools/pieces/studio-strips.mjs)\nFORMAT=32-bit_rle_rgbe\n\n-Y ${h} +X ${w}\n`, 'latin1');
  const chunks = [head];
  for (let y = 0; y < h; y++) {
    const comps = [[], [], [], []];
    for (let x = 0; x < w; x++) {
      const k = (y * w + x) * 3;
      const e = toRGBE(px[k], px[k + 1], px[k + 2]);
      for (let c = 0; c < 4; c++) comps[c].push(e[c]);
    }
    chunks.push(Buffer.from([2, 2, w >> 8, w & 255, ...comps.flatMap(rleComponent)]));
  }
  return Buffer.concat(chunks);
}

/** Reads a Radiance .hdr (flat or run-length encoded) to { w, h, px } linear RGB. */
export function decodeHDR(buf) {
  let i = 0; let head = '';
  while (!/\n-Y \d+ \+X \d+\n$/.test(head)) { if (i >= buf.length) throw new Error('no -Y h +X w line'); head += String.fromCharCode(buf[i++]); }
  const [, h, w] = head.match(/-Y (\d+) \+X (\d+)\n$/).map(Number);
  const px = new Float32Array(w * h * 3);
  const put = (x, y, r, g, b, e) => { const f = e ? Math.pow(2, e - 136) : 0; px.set([r * f, g * f, b * f], (y * w + x) * 3); };
  for (let y = 0; y < h; y++) {
    if (buf[i] === 2 && buf[i + 1] === 2 && ((buf[i + 2] << 8) | buf[i + 3]) === w) {
      i += 4;
      const comps = [new Uint8Array(w), new Uint8Array(w), new Uint8Array(w), new Uint8Array(w)];
      for (let c = 0; c < 4; c++) {
        let x = 0;
        while (x < w) {
          const n = buf[i++];
          if (n > 128) { comps[c].fill(buf[i++], x, x + n - 128); x += n - 128; } else { for (let k = 0; k < n; k++) comps[c][x++] = buf[i++]; }
        }
      }
      for (let x = 0; x < w; x++) put(x, y, comps[0][x], comps[1][x], comps[2][x], comps[3][x]);
    } else {
      for (let x = 0; x < w; x++, i += 4) put(x, y, buf[i], buf[i + 1], buf[i + 2], buf[i + 3]);
    }
  }
  return { w, h, px };
}

/** Box-averages a map down to a width (a whole divisor of its own). */
export function downsample({ w, h, px }, width) {
  const f = w / width; const h2 = h / f; const out = new Float32Array(width * h2 * 3);
  for (let y = 0; y < h2; y++) for (let x = 0; x < width; x++) {
    const acc = [0, 0, 0];
    for (let j = 0; j < f; j++) for (let i = 0; i < f; i++) { const k = ((y * f + j) * w + x * f + i) * 3; acc[0] += px[k]; acc[1] += px[k + 1]; acc[2] += px[k + 2]; }
    out.set(acc.map((v) => v / (f * f)), (y * width + x) * 3);
  }
  return { w: width, h: h2, px: out };
}

/** Mean linear RGB of a map, weighted by solid angle (rows near the poles cover less of the sphere). */
export function meanRadiance({ w, h, px }) {
  const acc = [0, 0, 0]; let wsum = 0;
  for (let y = 0; y < h; y++) {
    const wt = Math.sin(Math.PI * (y + 0.5) / h);
    for (let x = 0; x < w; x++) { const k = (y * w + x) * 3; acc[0] += px[k] * wt; acc[1] += px[k + 1] * wt; acc[2] += px[k + 2] * wt; wsum += wt; }
  }
  return acc.map((v) => v / wsum);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
  const width = Number(arg('--width', 512));
  const out = arg('--out', DEFAULT_OUT);
  const map = renderMap(width);
  const bytes = encodeHDR(map);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, bytes);
  console.log(JSON.stringify({ out, width: map.w, height: map.h, bytes: bytes.length, mean: meanRadiance(map).map((v) => +v.toFixed(4)) }));
}
