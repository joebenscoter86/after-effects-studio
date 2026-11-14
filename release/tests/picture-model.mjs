// A Node model of the picture evals' synthetic shots, for the offline tests of
// the grading logic. It draws what a key, a grade or a still of each scene
// would look like when written by ae_render_frame, at full size, from the
// same scene data the setup scripts build in After Effects
// (plugin/evals/picture/scenes.mjs).
//
// A soft edge is modelled as a linear alpha ramp as wide as the mask feather
// (alpha = 0.5 + signed distance / feather). After Effects' feather falloff is
// not linear, so real edges will differ in profile; only a live run shows by
// how much. This model is what the thresholds were calibrated on.
import fs from 'node:fs/promises';
import path from 'node:path';

import { FOOTAGE, GRADE, KEYING, OVER, SEAT } from '../../plugin/evals/picture/scenes.mjs';

/** Signed distance from (px, py) to a polygon, positive inside. */
function sdPoly(px, py, pts) {
  let d = Infinity;
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
    const ex = xi - xj, ey = yi - yj, wx = px - xj, wy = py - yj;
    const t = Math.max(0, Math.min(1, (wx * ex + wy * ey) / (ex * ex + ey * ey)));
    d = Math.min(d, Math.hypot(wx - ex * t, wy - ey * t));
  }
  return inside ? d : -d;
}

/** One part's coverage (union of its polygons) at offset (dx, dy), into `alpha` with max. */
function drawPart(alpha, W, H, part, dx, dy) {
  for (const poly of part.polygons) {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const [x, y] of poly) {
      x0 = Math.min(x0, x + dx); x1 = Math.max(x1, x + dx); y0 = Math.min(y0, y + dy); y1 = Math.max(y1, y + dy);
    }
    const m = part.feather + 2;
    for (let y = Math.max(0, Math.floor(y0 - m)); y < Math.min(H, Math.ceil(y1 + m)); y++) {
      for (let x = Math.max(0, Math.floor(x0 - m)); x < Math.min(W, Math.ceil(x1 + m)); x++) {
        const sd = sdPoly(x + 0.5 - dx, y + 0.5 - dy, poly);
        const v = part.feather > 0 ? Math.min(1, Math.max(0, 0.5 + sd / part.feather)) : sd >= 0 ? 1 : 0;
        const p = y * W + x;
        if (v > alpha[p]) alpha[p] = v;
      }
    }
  }
}

/** Deterministic uniform noise in ±amp (a small LCG). */
export function rng(seed) {
  let s = seed >>> 0;
  return (amp) => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return (s / 4294967296 * 2 - 1) * amp;
  };
}

const q8 = (v) => Math.round(Math.min(1, Math.max(0, v)) * 255) / 255;

export function keyingOffset(frame) {
  const k = Math.min(1, frame / KEYING.motion.untilFrame);
  return [KEYING.motion.to[0] * k, KEYING.motion.to[1] * k];
}

/** The figure at `frame`: per-pixel straight colour and alpha, each part over the previous. */
export function keyingFigure(frame) {
  const W = KEYING.width, H = KEYING.height, n = W * H;
  const [dx, dy] = keyingOffset(frame);
  const alpha = new Float64Array(n);
  const rgb = new Float64Array(n * 3);
  for (const part of KEYING.parts) {
    const a = new Float64Array(n);
    drawPart(a, W, H, part, dx, dy);
    for (let p = 0; p < n; p++) {
      if (a[p] === 0) continue;
      const ao = alpha[p], an = a[p] + ao * (1 - a[p]);
      for (let c = 0; c < 3; c++) rgb[p * 3 + c] = (part.colour[c] * a[p] + rgb[p * 3 + c] * ao * (1 - a[p])) / an;
      alpha[p] = an;
    }
  }
  return { alpha, rgb };
}

/** The un-keyed source render at `frame`: screen ramp, stand, figure, grain; opaque everywhere. */
export function keyingSource(frame) {
  const W = KEYING.width, H = KEYING.height;
  const fig = keyingFigure(frame);
  const noise = rng(1000 + frame);
  const rgb = new Float64Array(W * H * 3);
  const { left, right } = KEYING.screen;
  const s = KEYING.stand.box;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const p = y * W + x, f = x / (W - 1);
      let base = [0, 1, 2].map((c) => left[c] + (right[c] - left[c]) * f);
      if (x >= s.x && x < s.x + s.width && y >= s.y && y < s.y + s.height) base = KEYING.stand.colour;
      const a = fig.alpha[p];
      for (let c = 0; c < 3; c++) rgb[p * 3 + c] = q8(fig.rgb[p * 3 + c] * a + base[c] * (1 - a) + noise(0.02));
    }
  }
  return { width: W, height: H, rgb, alpha: new Float64Array(W * H).fill(1), bitDepth: 8 };
}

/**
 * A keyed frame as ae_render_frame writes it with channels 'rgba': straight
 * colour and alpha. kind:
 *   good  - the figure's own coverage, plus a little chatter (±0.02) on the soft edge;
 *   hard  - the same figure cut at alpha 0.5, no soft edge;
 *   half  - the screen left about a third opaque (alpha 0.35) and the stand not removed.
 */
export function keyedFrame(frame, kind = 'good') {
  const W = KEYING.width, H = KEYING.height, n = W * H;
  const fig = keyingFigure(frame);
  const noise = rng(5000 + frame);
  const alpha = new Float64Array(n);
  const rgb = new Float64Array(n * 3);
  const s = KEYING.stand.box;
  for (let p = 0; p < n; p++) {
    let a = fig.alpha[p];
    if (kind === 'good' && a > 0 && a < 1) a += noise(0.02);
    if (kind === 'hard') a = a >= 0.5 ? 1 : 0;
    let col = [fig.rgb[p * 3], fig.rgb[p * 3 + 1], fig.rgb[p * 3 + 2]];
    if (kind === 'half') {
      const x = p % W, y = (p - x) / W;
      if (x >= s.x && x < s.x + s.width && y >= s.y && y < s.y + s.height) { a = 1; col = KEYING.stand.colour; }
      else if (a < 0.35) { a = 0.35; col = [0.25, 0.3, 0.27]; }
    }
    alpha[p] = q8(a);
    for (let c = 0; c < 3; c++) rgb[p * 3 + c] = alpha[p] > 0 ? q8(col[c]) : 0;
  }
  return { width: W, height: H, rgb, alpha, bitDepth: 8 };
}

const inBox = (x, y, b) => x >= b.x && x < b.x + b.width && y >= b.y && y < b.y + b.height;

/**
 * The grade comp rendered over its background: the plate, and the subject
 * with `grade(colour) → colour` applied to every subject pixel (identity
 * leaves the setup's baked error in place).
 */
export function gradeFrame(grade = (c) => c, plateGrade = (c) => c) {
  const W = GRADE.width, H = GRADE.height;
  const rgb = new Float64Array(W * H * 3);
  const { head, strip } = GRADE.subject;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let c = GRADE.plate.wall, subject = false;
      for (const r of GRADE.plate.rects) if (inBox(x, y, r.box)) c = r.colour;
      for (const r of GRADE.subject.rects) if (inBox(x, y, r.box)) { c = r.colour; subject = true; }
      if (inBox(x, y, strip.box)) {
        const f = (y - strip.box.y) / (strip.box.height - 1);
        c = [0, 1, 2].map((i) => strip.top[i] + (strip.bottom[i] - strip.top[i]) * f);
        subject = true;
      }
      const ex = (x + 0.5 - head.centre[0]) / head.radii[0], ey = (y + 0.5 - head.centre[1]) / head.radii[1];
      if (ex * ex + ey * ey <= 1) { c = head.colour; subject = true; }
      const out = subject ? grade(c) : plateGrade(c);
      const p = y * W + x;
      for (let i = 0; i < 3; i++) rgb[p * 3 + i] = q8(out[i]);
    }
  }
  return { width: W, height: H, rgb, bitDepth: 8 };
}

/** The exact inverse of the setup's baked error, per channel. */
export const undoGradeError = (c) => c.map((v, i) => (v - GRADE.error.lift) / GRADE.error.cast[i]);

/** The glow's straight colour and alpha (feather as a linear ramp across the circle's edge). */
function glow() {
  const W = OVER.width, H = OVER.height, { centre, radius, feather, colour } = OVER.glow;
  const alpha = new Float64Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = radius - Math.hypot(x + 0.5 - centre[0], y + 0.5 - centre[1]);
    alpha[y * W + x] = q8(Math.min(1, Math.max(0, 0.5 + d / feather)));
  }
  return { W, H, alpha, colour };
}

/**
 * Still files for the over eval:
 *   rgba      - channels 'rgba': straight colour plus alpha (what a reusable still should be);
 *   raw       - colorManaged 'off': alpha kept but RGB laid over the comp background (the mistake);
 *   rgb       - channels 'rgb': no alpha at all;
 *   reference - isolate glow, over navy (the plugin's own composite).
 */
export function overFile(kind) {
  const { W, H, alpha, colour } = glow();
  const rgb = new Float64Array(W * H * 3);
  const bg = kind === 'reference' ? OVER.navy : OVER.bg;
  for (let p = 0; p < W * H; p++) {
    const a = alpha[p];
    for (let c = 0; c < 3; c++) {
      rgb[p * 3 + c] = kind === 'rgba' ? (a > 0 ? colour[c] : 0) : q8(colour[c] * a + bg[c] * (1 - a));
    }
  }
  const img = { width: W, height: H, rgb, bitDepth: 8 };
  if (kind === 'rgba' || kind === 'raw') img.alpha = alpha;
  return img;
}

/** Write a decoded-style image as an 8-bit PNG with the runtime's encoder. */
export async function writePng(runtime, file, img) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const buf = img.alpha
    ? runtime.png16.encodePngSrgbRgba8(img.width, img.height, img.rgb, img.alpha)
    : runtime.png16.encodePngSrgb8(img.width, img.height, img.rgb);
  await fs.writeFile(file, buf);
}

// ---------------------------------------------------------------------------
// Sit an element in its plate
// ---------------------------------------------------------------------------

const erf = (x) => {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
};
/** Coverage of a box at pixel (x, y), its edges blurred by a Gaussian of sigma (0: hard). */
function boxCover(x, y, b, sigma) {
  const axis = (p, lo, hi) => {
    if (!(sigma > 0)) return p >= lo && p < hi ? 1 : 0;
    const s = sigma * Math.SQRT2;
    return 0.5 * (erf((p + 0.5 - lo) / s) - erf((p + 0.5 - hi) / s));
  };
  return axis(x, b.x, b.x + b.width) * axis(y, b.y, b.y + b.height);
}
const gauss = (r) => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());

/**
 * One frame of the seat comp as ae_render_frame writes it (rgb, 8-bit): the
 * plate (wall and panel) blurred by sigma `plate.sigma` px with grain of
 * `plate.grain` 8-bit steps, and the element (card and stripe) with its own
 * `element.sigma` and `element.grain`. Grain is new on every frame (seeded by
 * the frame). The plate's numbers default to what After Effects measured
 * (edge 4.7 px = 2.56 sigma; grain 4.19 steps).
 */
export function seatFrame(frame, { element = {}, plate = {} } = {}) {
  const W = SEAT.width, H = SEAT.height;
  const ps = plate.sigma ?? SEAT.expected.plate.edgeWidth / 2.56;
  const pg = plate.grain ?? SEAT.expected.plate.temporalGrain;
  const es = element.sigma ?? 0;
  const eg = element.grain ?? 0;
  const unit = (seed) => { const r = rng(seed); return () => (r(1) + 1) / 2; };
  const rp = unit(1000 + frame), re = unit(2000 + frame);
  const rgb = new Float64Array(W * H * 3);
  const { wall, panel } = SEAT.plate;
  const { card, stripe } = SEAT.element;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const pc = boxCover(x, y, panel.box, ps);
      const ca = boxCover(x, y, card.box, es);
      const sc = boxCover(x, y, stripe.box, es);
      const p = y * W + x;
      for (let i = 0; i < 3; i++) {
        const pv = wall[i] + (panel.colour[i] - wall[i]) * pc + (pg / 255) * gauss(rp);
        const ev = card.colour[i] + (stripe.colour[i] - card.colour[i]) * Math.min(1, sc / Math.max(ca, 1e-9));
        const eNoise = (eg / 255) * gauss(re);
        rgb[p * 3 + i] = q8(pv * (1 - ca) + (ev + eNoise) * ca);
      }
    }
  }
  return { width: W, height: H, rgb, bitDepth: 8 };
}

// ---------------------------------------------------------------------------
// Sit an element in real footage
// ---------------------------------------------------------------------------

/**
 * One frame of the footage eval's seat comp as ae_render_frame writes it: a decoded plate frame (the clip itself),
 * with the element (FOOTAGE's card and stripe at `layout`, in pixels) laid over it, its edges blurred by `sigma` px
 * and grain of `grain` 8-bit steps that is new on every frame (`frame` seeds it). `plateGrain` adds that much grain
 * to the plate as well, as a task that changed the plate would.
 */
export function footageFrame(plate, layout, frame, { sigma = 0, grain = 0, plateGrain = 0 } = {}) {
  const { width: W, height: H } = plate;
  const unit = (seed) => { const r = rng(seed); return () => (r(1) + 1) / 2; };
  const re = unit(3000 + frame), rp = unit(5000 + frame);
  const { card, stripe } = FOOTAGE.element;
  const rgb = new Float64Array(W * H * 3);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const p = y * W + x;
      const ca = boxCover(x, y, layout.card, sigma);
      const sc = boxCover(x, y, layout.stripe, sigma);
      for (let i = 0; i < 3; i++) {
        let pv = plate.rgb[p * 3 + i];
        if (plateGrain) pv += (plateGrain / 255) * gauss(rp);
        if (ca <= 1e-6) { rgb[p * 3 + i] = q8(pv); continue; }
        const ev = card.colour[i] + (stripe.colour[i] - card.colour[i]) * Math.min(1, sc / Math.max(ca, 1e-9)) + (grain / 255) * gauss(re);
        rgb[p * 3 + i] = q8(pv * (1 - ca) + ev * ca);
      }
    }
  }
  return { width: W, height: H, rgb, bitDepth: 8 };
}
