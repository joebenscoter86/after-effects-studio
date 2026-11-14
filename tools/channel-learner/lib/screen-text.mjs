// On-screen text: run the Vision OCR binary over frames, and report what
// changed between two frames' recognised text.
import { spawn } from 'node:child_process';

const ALNUM = /[\p{L}\p{N}]/gu;
// A number with an optional unit ("3", "0 %", "-50", "100.0", "12px"), or
// After Effects' rotation form, revolutions then degrees ("0x+90.0°").
const VALUE = /^(?:[+-]?\d[\d.,]*\s*(?:%|°|x|px|s|f)?|[+-]?\d+\s*x\s*[+-]?\d[\d.,]*\s*°?)$/i;

function keep(b, minConf, ignore) {
  if (!(b.c >= minConf)) return false;
  const t = String(b.t).trim();
  if ((t.match(ALNUM) || []).length < 2 && !VALUE.test(t)) return false;
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  return !ignore.some((r) => cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h);
}

// Nearest box to the left of `b` on the same row, by its left edge.
function labelFor(b, boxes, posTol) {
  let best;
  for (const o of boxes) {
    if (o === b || o.x >= b.x || Math.abs(o.y - b.y) > posTol) continue;
    if (!best || o.x > best.x) best = o;
  }
  return best?.t;
}

function change(kind, b, frame, posTol, was) {
  const c = { kind, text: b.t };
  if (was !== undefined) c.was = was;
  const label = labelFor(b, frame, posTol);
  if (label !== undefined) c.label = label;
  c.x = b.x;
  c.y = b.y;
  return c;
}

/**
 * Differences between two frames' boxes. Boxes match when their top-left
 * corners are within posTol on both axes (the closest unmatched one wins).
 * Output: changed boxes and appeared boxes in the current frame's order, then gone boxes.
 */
export function diffBoxes(prev, cur, opts = {}) {
  const { posTol = 0.006, minConf = 0.6, ignore = [] } = opts;
  const p = prev.filter((b) => keep(b, minConf, ignore));
  const q = cur.filter((b) => keep(b, minConf, ignore));
  const used = new Set();
  const out = [];
  for (const b of q) {
    let best = -1;
    let bestD = Infinity;
    p.forEach((o, i) => {
      if (used.has(i)) return;
      const dx = Math.abs(o.x - b.x);
      const dy = Math.abs(o.y - b.y);
      if (dx > posTol || dy > posTol) return;
      const d = Math.hypot(dx, dy);
      if (d < bestD) [best, bestD] = [i, d];
    });
    if (best < 0) {
      out.push(change('appeared', b, q, posTol));
      continue;
    }
    used.add(best);
    if (p[best].t !== b.t) out.push(change('changed', b, q, posTol, p[best].t));
  }
  p.forEach((o, i) => {
    if (!used.has(i)) out.push(change('gone', o, p, posTol));
  });
  return out;
}

function runOnce(bin, files) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, files, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    child.stdout.setEncoding('utf8').on('data', (d) => (out += d));
    child.stderr.setEncoding('utf8').on('data', (d) => (err += d));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) reject(new Error(`${bin} exited ${code}: ${err.trim()}`));
      else resolve(out);
    });
  });
}

/**
 * Recognise text in many images, `batch` images per process. Returns a Map
 * keyed by the path given, in input order. Images the binary could not read
 * are left out (and named on stderr).
 */
export async function readBoxes(ocrBinary, images, opts = {}) {
  const { batch = 50 } = opts;
  const map = new Map();
  for (let i = 0; i < images.length; i += batch) {
    const out = await runOnce(ocrBinary, images.slice(i, i + batch));
    for (const line of out.split('\n')) {
      if (!line.trim()) continue;
      const rec = JSON.parse(line);
      if (rec.error) process.stderr.write(`ocr: ${rec.file}: ${rec.error}\n`);
      else map.set(rec.file, rec.boxes);
    }
  }
  return map;
}
