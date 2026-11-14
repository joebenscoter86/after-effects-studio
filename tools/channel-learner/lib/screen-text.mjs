// On-screen text: run the Vision OCR binary over frames, and report what
// changed between two frames' recognised text.
import { spawn } from 'node:child_process';

const ALNUM = /[\p{L}\p{N}]/gu;
// A number with an optional unit ("3", "0 %", "-50", "100.0", "12px"), or
// After Effects' rotation form, revolutions then degrees ("0x+90.0°"; text
// recognition often reads the revolutions' 0 as a letter O: "Ox +0.0°").
const VALUE = /^(?:[+-]?\d[\d.,]*\s*(?:%|°|x|px|s|f)?|[+-]?[\dOo]+\s*x\s*[+-]?\d[\d.,]*\s*°?)$/i;

/** True for a number, percentage, degrees or rotation ("0x+90.0°"): text worth reporting as a value. */
export function isValueLike(text) {
  return VALUE.test(String(text).trim());
}

// Timecode ("0:00:04:00", "0;00;04;00"), frame count with rate ("00096 (23.976 fps)"),
// ruler ticks ("01:12f", "0:00f", "05:12f 06:00f", "03;00f"), and the viewer's
// resolution menu ("Full", "Half", ...), which sits beside its zoom readout ("43.2 %").
const TIMECODE = /\b\d{1,2}[:;]\d{2}[:;]\d{2}[:;]\d{2}\b/;
const FRAME_RATE = /\(\s*[\d.,]+\s*fps\s*\)/i;
const RULER_TICK = /\d{1,2}[:;]\d{2}\s*f/i;
const VIEWER_RESOLUTION = /^(?:full|half|third|quarter|custom|auto)$/i;

/** True for text that is time or viewer chrome rather than a property value. */
export function isTimeLike(text) {
  const t = String(text).trim();
  return TIMECODE.test(t) || FRAME_RATE.test(t) || RULER_TICK.test(t) || VIEWER_RESOLUTION.test(t);
}

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

// ---------- rows: label and value pairs, matched by label ----------


// Icon marks that text recognition reads into the edge of a box: a token that
// is all punctuation ("•", "*", "=", ">>") at either end, or at the start one
// or two characters with no capital or digit other than O ("v", "Ö", "O", "vO",
// "v•": twirl arrows and stopwatches).
const isPunct = (token) => !/[\p{L}\p{N}]/u.test(token);
const isLeadMark = (token) => isPunct(token) || (token.length <= 2 && !/[A-NP-Z0-9]/.test(token));

function clean(text) {
  const trimmed = String(text).trim();
  if (isValueLike(fixValue(trimmed))) return trimmed;
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  while (tokens.length > 1 && isLeadMark(tokens[0])) tokens.shift();
  while (tokens.length > 1 && isPunct(tokens.at(-1))) tokens.pop();
  // punctuation stuck to the front of the first word ("•None"), but not a sign ("-75.0", "+0.0")
  return tokens.join(' ').replace(/^[^\p{L}\p{N}+\-[(]+(?=[\p{L}\p{N}])/u, '').replace(/\s*:$/, '');
}

// The end of a box that is a value with a unit or decimals ("72 px", "100 %", "0.0"):
// a box like "IT 100 %" is an icon read together with its value, not a label.
const VALUE_TAIL = /(?:^|\s)[+-]?\d[\d.,]*\s*(?:%|°|px)$|(?:^|\s)[+-]?\d+[.,]\d+$/i;

// Text recognition's readings of switch-column and twirl glyphs: letters outside
// plain Latin ("Ф#/fx", "Zfх", "tẦ") or marks no property shows ("#", "*", "×", "º").
const GLYPH_JUNK = /[^\P{L}A-Za-z]|[#*×º]/u;

// A label has a run of three letters, is not a value, does not start with a
// number ("8 bpc", "12-13 Comp") and does not end in a value with a unit.
const isLabelText = (raw, t) => /[A-Za-z]{3}/.test(t) && !isValueLike(t) && !GLYPH_JUNK.test(t)
  && !/^[+-]?\d/.test(t) && !VALUE_TAIL.test(raw);

// A value has two or more letters or digits, or is value-like ("3").
const isValueText = (t) => ((t.match(ALNUM) || []).length >= 2 || isValueLike(t)) && !GLYPH_JUNK.test(t);

// The menu bar: neighbouring menu names pair up as label and value ("Effect: Animation").
const MENUS = new Set(['file', 'edit', 'composition', 'layer', 'effect', 'animation', 'view', 'window', 'help']);
const isMenuPair = (a, b) => MENUS.has(a.toLowerCase()) && b.toLowerCase().split(/\s+/).every((w) => MENUS.has(w));

// "Ox +90.0°" is how text recognition often reads "0x +90.0°".
const fixValue = (t) => t.replace(/^([+-]?)[Oo](?=\s*x\s*[+-]?\d)/, '$10');

/**
 * Pair label boxes with their value boxes. Boxes whose vertical centres are
 * within rowTol of the smaller box height share a row; within a row, left to
 * right, a label (two or more letters, not a value) takes the nearest box to
 * its right as its value when that box starts within maxGap of the label's
 * right edge (0.13 of the frame: measured label-to-value gaps on a zoomed
 * recording stay under 0.12; wider ones reach across into the next panel). A box ending in a colon is a label of its own and never a value.
 * A box used as a value is not also a label. Rows with time-like text are dropped.
 */
export function toRows(boxes, opts = {}) {
  const { minConf = 0.6, rowTol = 0.5, maxGap = 0.13, ignore = [] } = opts;
  const items = boxes.filter((b) => keep(b, minConf, ignore))
    .map((b) => ({ b, raw: String(b.t).trim(), text: clean(b.t), cy: b.y + b.h / 2 }))
    .sort((p, q) => p.b.x - q.b.x || p.b.y - q.b.y);
  const sameRow = (p, q) => Math.abs(p.cy - q.cy) <= rowTol * Math.min(p.b.h, q.b.h);
  const used = new Set();
  const out = [];
  for (const lab of items) {
    if (used.has(lab) || !isLabelText(lab.raw, lab.text)) continue;
    const right = lab.b.x + lab.b.w;
    let val;
    for (const o of items) {
      if (o === lab || used.has(o) || o.b.x <= lab.b.x || !sameRow(lab, o)) continue;
      if (o.b.x - right > maxGap) continue;
      if (!val || o.b.x < val.b.x) val = o;
    }
    if (!val || val.raw.endsWith(':')) continue;
    used.add(lab);
    used.add(val);
    if (!isValueText(val.text) || isTimeLike(lab.text) || isTimeLike(val.text) || isMenuPair(lab.text, val.text)) continue;
    out.push({ label: lab.text, value: fixValue(val.text), x: val.b.x, y: val.b.y });
  }
  return out.sort((p, q) => p.y - q.y || p.x - q.x);
}

/**
 * Changes in one frame's rows against what each label showed the last time it
 * was on screen. `seen` (label -> sorted values) is updated in place. A label
 * not in this frame is left as it was and reports nothing (the view moved).
 */
export function diffRows(seen, rows) {
  const byLabel = new Map();
  for (const r of rows) {
    const label = String(r.label).trim();
    if (!byLabel.has(label)) byLabel.set(label, []);
    byLabel.get(label).push(r);
  }
  const out = [];
  for (const [label, rs] of byLabel) {
    const values = rs.map((r) => r.value).sort();
    const old = seen.get(label);
    seen.set(label, values);
    const at = (v) => rs.find((r) => r.value === v) ?? rs[0];
    if (!old) {
      for (const r of rs) out.push({ kind: 'appeared', label, text: r.value, x: r.x, y: r.y });
      continue;
    }
    if (old.length === values.length && old.every((v, i) => v === values[i])) continue;
    if (old.length === values.length) {
      // multiset difference: what left and what came
      const left = [...old];
      const came = [];
      for (const v of values) {
        const i = left.indexOf(v);
        if (i >= 0) left.splice(i, 1); else came.push(v);
      }
      if (came.length === 1) {
        const r = at(came[0]);
        out.push({ kind: 'changed', label, was: left[0], text: came[0], x: r.x, y: r.y });
        continue;
      }
    }
    const before = new Set(old);
    for (const r of rs) {
      if (before.has(r.value)) continue;
      before.add(r.value);
      out.push({ kind: 'appeared', label, text: r.value, x: r.x, y: r.y });
    }
  }
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
