// Matte quality as numbers (agent-eyes plan, stage 3): the `edge` report of
// ae_render_frame. Everything here is measured in Node on a decoded capture's
// alpha channel (and, for spill, its colour after the comp background is taken
// out with the same formula as unmatte()). It reports numbers and places; it
// never passes or fails a key.
//
// The pieces, all on one frame:
//   - shares of opaque, partly transparent and transparent pixels;
//   - edge width: at every pixel on the 50% alpha contour of a main solid
//     area, how far the alpha takes to go from transparent to opaque across
//     the boundary (distance to the nearest transparent pixel + distance to
//     the nearest opaque pixel − 1, Euclidean, in pixels);
//   - holes: 4-connected regions below `opaque` that do not touch the frame
//     border, so are enclosed by the solid area;
//   - main solid areas and specks: 8-connected islands of covered pixels
//     (alpha above `transparent`); the largest, and any at least
//     `mainAreaShare` of it, are main areas; the rest are specks;
//   - patches: partly transparent regions thicker than a thin edge (their
//     core lies more than maxEdgeWidth / 2 from any transparent or opaque
//     pixel), grown back out by that much to their full extent;
//   - spill: the mean straight colour of the partly transparent pixels and of
//     the solid pixels just inside the edge, and whether the edge leans
//     towards the screen colour more than the subject does.
// And between two frames: the change in alpha, split into edge, inside the
// solid area, and outside it (see alphaChange).
//
// Memory: per frame a few full-size typed arrays live while it is measured
// (two Float32 distance maps, a Float32 scratch map, an Int32 label map and
// queue, a Uint8 mark map: about 34 bytes a pixel, ~70 MB at 1080×1920), and
// only `frame` (Float32 alpha + Uint8 zones, 5 bytes a pixel) is kept for the
// next frame's flicker. No decoded frame is held.

import type { DecodedPng } from "./png16.js";
import type { Rgb } from "./sheet.js";

export type Screen = "green" | "blue";

/** Where the matte is read from: the capture's alpha, or its luminance (Keylight's matte views). */
export type MatteFrom = "alpha" | "luma";

export interface EdgeThresholds {
  /**
   * Read the matte from the capture's alpha (default), or from its Rec. 709
   * luminance: Keylight's Screen Matte and Combined Matte views write the
   * matte in grey RGB with alpha 1 everywhere (measured live), so their
   * alpha says nothing.
   */
  from: MatteFrom;
  /** Alpha at or below this counts as transparent. */
  transparent: number;
  /** Alpha at or above this counts as opaque. */
  opaque: number;
  /** Widest transition still called a thin edge, in px; also the edge band for flicker. */
  maxEdgeWidth: number;
  /** An island at least this share of the largest one's area is a main area, not a speck. */
  mainAreaShare: number;
  /** How many holes, specks, patches and main areas are listed (all are counted). */
  listed: number;
  /** The screen colour spill is read against. */
  screen: Screen;
  /** Partly transparent pixels below this alpha are left out of the spill colour. */
  spillMinAlpha: number;
  /** How far the screen channel must exceed the other two (and the solid area's own lean). */
  spillThreshold: number;
  /** A pixel's alpha change above this counts as changed (flicker shares and bounds). */
  changeAbove: number;
  /** Side of the square window a patch's densest part is reported in, px. */
  patchWindow: number;
}

export type EdgeThresholdArgs = Partial<EdgeThresholds>;

/**
 * The defaults and why:
 * - transparent / opaque: two 8-bit steps from 0 and 1, the same cut `sample`
 *   uses for its alpha shares, so the two reports agree. Anything a key leaves
 *   above that in the screen is real (it will show over a bright plate).
 * - maxEdgeWidth: 1% of the frame's shorter side, at least 4 px (11 px at
 *   1080×1920). A keyed hair or shoulder edge at HD is a few pixels; wider
 *   transitions (heavy motion blur, a half-keyed remnant, an unkeyed screen)
 *   are reported as patches so they are not averaged into "edge".
 * - mainAreaShare 0.25: a second subject a quarter of the first's size is a
 *   subject; smaller islands are specks. Main areas are listed, so nothing is
 *   hidden either way.
 * - listed 5: enough to find the worst places without flooding the response.
 * - spillMinAlpha 0.1: un-matting divides by alpha, so below ~0.1 a pixel's
 *   recovered colour is mostly quantisation noise.
 * - spillThreshold 0.03: about eight 8-bit steps of lean towards the screen
 *   channel; smaller leans are within grading noise.
 * - changeAbove 0.05: alpha changes below this are invisible in practice;
 *   8-bit capture noise alone is 1/255.
 * - from "alpha": the keyed result's coverage. "luma" only for a render
 *   whose RGB is the matte (Keylight View 5 or 8); spill is not read then.
 * - patchWindow: four times maxEdgeWidth (44 px at 1080×1920): large enough
 *   to hold a remnant worth fixing, small enough that a long band's box does
 *   not hide where most of it is.
 */
export const EDGE_DEFAULTS: Omit<EdgeThresholds, "maxEdgeWidth" | "patchWindow"> & {
  maxEdgeWidth: "auto";
  patchWindow: "auto";
} = {
  from: "alpha",
  transparent: 2 / 255,
  opaque: 1 - 2 / 255,
  maxEdgeWidth: "auto",
  mainAreaShare: 0.25,
  listed: 5,
  screen: "green",
  spillMinAlpha: 0.1,
  spillThreshold: 0.03,
  changeAbove: 0.05,
  patchWindow: "auto",
};

/** The alpha that marks the boundary itself, where edge width is sampled. */
export const CONTOUR_ALPHA = 0.5;

/** Default maxEdgeWidth for a frame: 1% of the shorter side, at least 4 px. */
export function autoMaxEdgeWidth(width: number, height: number): number {
  return Math.max(4, Math.round(0.01 * Math.min(width, height)));
}

/** Caller overrides on top of the defaults, for a frame of this size. */
export function resolveEdgeThresholds(
  args: EdgeThresholdArgs,
  width: number,
  height: number,
): EdgeThresholds {
  const maxEdgeWidth = args.maxEdgeWidth ?? autoMaxEdgeWidth(width, height);
  return {
    from: args.from ?? EDGE_DEFAULTS.from,
    transparent: args.transparent ?? EDGE_DEFAULTS.transparent,
    opaque: args.opaque ?? EDGE_DEFAULTS.opaque,
    maxEdgeWidth,
    mainAreaShare: args.mainAreaShare ?? EDGE_DEFAULTS.mainAreaShare,
    listed: args.listed ?? EDGE_DEFAULTS.listed,
    screen: args.screen ?? EDGE_DEFAULTS.screen,
    spillMinAlpha: args.spillMinAlpha ?? EDGE_DEFAULTS.spillMinAlpha,
    spillThreshold: args.spillThreshold ?? EDGE_DEFAULTS.spillThreshold,
    changeAbove: args.changeAbove ?? EDGE_DEFAULTS.changeAbove,
    patchWindow: args.patchWindow ?? Math.round(4 * maxEdgeWidth),
  };
}

/** Why a set of caller thresholds cannot be used, or null when it can. */
export function edgeArgsError(args: Record<string, unknown>): string | null {
  const unit = ["transparent", "opaque", "mainAreaShare", "spillMinAlpha", "changeAbove"];
  for (const key of unit) {
    const v = args[key];
    if (v !== undefined && (typeof v !== "number" || !(v >= 0 && v <= 1))) {
      return `\`edge.${key}\` must be a number in 0..1`;
    }
  }
  const t = (args.transparent as number | undefined) ?? EDGE_DEFAULTS.transparent;
  const o = (args.opaque as number | undefined) ?? EDGE_DEFAULTS.opaque;
  if (t >= o) return "`edge.transparent` must be below `edge.opaque`";
  const w = args.maxEdgeWidth;
  if (w !== undefined && (typeof w !== "number" || !Number.isFinite(w) || w < 1)) {
    return "`edge.maxEdgeWidth` must be at least 1 (pixels)";
  }
  const pw = args.patchWindow;
  if (pw !== undefined && (typeof pw !== "number" || !Number.isFinite(pw) || pw < 1)) {
    return "`edge.patchWindow` must be at least 1 (pixels)";
  }
  const listed = args.listed;
  if (listed !== undefined && (!Number.isInteger(listed) || (listed as number) < 0)) {
    return "`edge.listed` must be a whole number, 0 or more";
  }
  const s = args.spillThreshold;
  if (s !== undefined && (typeof s !== "number" || !(s >= 0 && s <= 1))) {
    return "`edge.spillThreshold` must be a number in 0..1";
  }
  if (args.from !== undefined && args.from !== "alpha" && args.from !== "luma") {
    return "`edge.from` must be 'alpha' or 'luma'";
  }
  if (args.screen !== undefined && args.screen !== "green" && args.screen !== "blue") {
    return "`edge.screen` must be 'green' or 'blue'";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Result shapes
// ---------------------------------------------------------------------------

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EdgeReport {
  /** Always "capture": the alpha as saveFrameToPng wrote it (see measurementStages). */
  stage: "capture";
  /** "alpha": the capture's alpha; "luma": its luminance, for a render whose RGB is the matte. */
  matteFrom: MatteFrom;
  pixels: number;
  shares: { opaque: number; partial: number; transparent: number };
  width: {
    /** Median over the main areas' 50% contour, px; null when nothing could be measured. */
    typical: number | null;
    p90: number | null;
    worst: number | null;
    worstAt: { x: number; y: number } | null;
    /** Contour pixels measured. */
    samples: number;
    /** Contour pixels where the alpha never reaches transparent (or opaque) anywhere in the frame. */
    unmeasured: number;
  };
  solidAreas: { count: number; list: Array<Box & { area: number }> };
  holes: {
    count: number;
    area: number;
    /** Hole pixels at or below `transparent` (the rest are partly transparent). */
    transparentArea: number;
    largest: (Box & { area: number; meanAlpha: number }) | null;
    list: Array<Box & { area: number; meanAlpha: number }>;
  };
  specks: {
    count: number;
    area: number;
    list: Array<Box & { area: number; meanAlpha: number; maxAlpha: number }>;
  };
  patches: { count: number; area: number; list: PatchEntry[] };
  spill: {
    screen: Screen;
    /** Partly transparent pixels at or above spillMinAlpha that the colour is read from. */
    pixels: number;
    /** Their mean straight colour, comp background taken out; capture values. */
    mean: Rgb | null;
    /** Mean colour of the opaque pixels within maxEdgeWidth of a transparent pixel. */
    solidMean: Rgb | null;
    /** Screen channel minus the larger of the other two, for `mean` and `solidMean`. */
    excess: number | null;
    solidExcess: number | null;
    leansToScreen: boolean;
    reading: string;
  };
}

/** One listed patch: its box, and what is inside the box. */
export interface PatchEntry extends Box {
  area: number;
  meanAlpha: number;
  /**
   * The patch pixel deepest inside it (farthest from any transparent or
   * opaque pixel), and the patch's thickness there: distance to the nearest
   * transparent + nearest opaque pixel − 1, as edge width is measured, or
   * twice the depth − 1 where one of the two does not exist in the frame.
   */
  thickest: { x: number; y: number; thickness: number };
  /** The patchWindow-square window (clipped to the box) holding the most patch pixels. */
  densest: Box & { pixels: number; share: number; meanAlpha: number };
}

/** What one frame leaves for the next frame's flicker numbers. */
export interface AlphaFrame {
  width: number;
  height: number;
  alpha: Float32Array;
  /** Per pixel: 0 outside, 1 edge, 2 inside (see measureEdge). */
  zones: Uint8Array;
}

export interface ZoneChange {
  pixels: number;
  meanAbsDelta: number;
  maxAbsDelta: number;
  /** Share of the zone's pixels whose alpha changed by more than changeAbove. */
  changedShare: number;
  /** Bounding box of those pixels, or null. */
  changedBounds: Box | null;
}

export interface AlphaChange {
  edge: ZoneChange;
  inside: ZoneChange;
  outside: ZoneChange;
  all: ZoneChange;
}

const OUTSIDE = 0;
const EDGE = 1;
const INSIDE = 2;

const r2 = (v: number) => Math.round(v * 100) / 100;
const r4 = (v: number) => Math.round(v * 1e4) / 1e4;
const r4rgb = (v: Rgb): Rgb => [r4(v[0]), r4(v[1]), r4(v[2])];

// ---------------------------------------------------------------------------
// Euclidean distance transform (Felzenszwalb & Huttenlocher), separable
// ---------------------------------------------------------------------------

const INF = 1e20;

/** 1-D squared distance transform of f[0..n) into d; INF entries are not sources. */
function dt1d(f: Float64Array, n: number, d: Float64Array, v: Int32Array, z: Float64Array): void {
  let k = -1;
  for (let q = 0; q < n; q++) {
    const fq = f[q];
    if (fq >= INF) continue;
    if (k < 0) {
      k = 0;
      v[0] = q;
      z[0] = -Infinity;
      z[1] = Infinity;
      continue;
    }
    let s = 0;
    for (;;) {
      const r = v[k];
      s = (fq + q * q - (f[r] + r * r)) / (2 * q - 2 * r);
      if (s <= z[k]) k--;
      else break;
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = Infinity;
  }
  if (k < 0) {
    d.fill(INF, 0, n);
    return;
  }
  let j = 0;
  for (let q = 0; q < n; q++) {
    while (z[j + 1] < q) j++;
    const r = v[j];
    d[q] = (q - r) * (q - r) + f[r];
  }
}

/**
 * Distance from every pixel to the nearest pixel where `isSource` holds;
 * Infinity if none. Exported for the screen measurement (screen.ts).
 */
export function distanceTo(
  alpha: Float64Array,
  width: number,
  height: number,
  isSource: (a: number) => boolean,
  scratch: Float32Array,
  out: Float32Array,
): void {
  const n = Math.max(width, height);
  const f = new Float64Array(n);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) f[y] = isSource(alpha[y * width + x]) ? 0 : INF;
    dt1d(f, height, d, v, z);
    for (let y = 0; y < height; y++) scratch[y * width + x] = d[y];
  }
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) f[x] = scratch[row + x];
    dt1d(f, width, d, v, z);
    for (let x = 0; x < width; x++) out[row + x] = d[x] >= INF / 2 ? Infinity : Math.sqrt(d[x]);
  }
}

// ---------------------------------------------------------------------------
// Connected regions
// ---------------------------------------------------------------------------

export interface Region {
  area: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  alphaSum: number;
  alphaMax: number;
  transparent: number;
  touchesBorder: boolean;
}

export const newRegion = (): Region => ({
  area: 0,
  minX: Infinity,
  minY: Infinity,
  maxX: -1,
  maxY: -1,
  alphaSum: 0,
  alphaMax: 0,
  transparent: 0,
  touchesBorder: false,
});

export function addPixel(r: Region, x: number, y: number, a: number): void {
  r.area++;
  if (x < r.minX) r.minX = x;
  if (x > r.maxX) r.maxX = x;
  if (y < r.minY) r.minY = y;
  if (y > r.maxY) r.maxY = y;
  r.alphaSum += a;
  if (a > r.alphaMax) r.alphaMax = a;
}

export const box = (r: Region): Box => ({
  x: r.minX,
  y: r.minY,
  width: r.maxX - r.minX + 1,
  height: r.maxY - r.minY + 1,
});

const N4X = [1, -1, 0, 0];
const N4Y = [0, 0, 1, -1];
const N8X = [1, -1, 0, 0, 1, 1, -1, -1];
const N8Y = [0, 0, 1, -1, 1, -1, 1, -1];

/**
 * Flood-fill every region of pixels where `inSet` holds (4- or 8-connected),
 * writing 1-based region ids into `labels` and returning one Region each.
 * Exported for the screen measurement (screen.ts).
 */
export function labelRegions(
  alpha: Float64Array,
  width: number,
  height: number,
  inSet: (p: number) => boolean,
  eight: boolean,
  labels: Int32Array,
  queue: Int32Array,
  transparentAt: number,
): Region[] {
  labels.fill(0);
  const regions: Region[] = [];
  const nx = eight ? N8X : N4X;
  const ny = eight ? N8Y : N4Y;
  const total = width * height;
  for (let start = 0; start < total; start++) {
    if (labels[start] !== 0 || !inSet(start)) continue;
    const region = newRegion();
    regions.push(region);
    const id = regions.length;
    labels[start] = id;
    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    while (head < tail) {
      const p = queue[head++];
      const x = p % width;
      const y = (p - x) / width;
      const a = alpha[p];
      addPixel(region, x, y, a);
      if (a <= transparentAt) region.transparent++;
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) region.touchesBorder = true;
      for (let k = 0; k < nx.length; k++) {
        const qx = x + nx[k];
        const qy = y + ny[k];
        if (qx < 0 || qy < 0 || qx >= width || qy >= height) continue;
        const q = qy * width + qx;
        if (labels[q] !== 0 || !inSet(q)) continue;
        labels[q] = id;
        queue[tail++] = q;
      }
    }
  }
  return regions;
}

const byArea = (a: Region, b: Region) => b.area - a.area;

// ---------------------------------------------------------------------------
// One frame
// ---------------------------------------------------------------------------

function screenExcess(c: Rgb, screen: Screen): number {
  return screen === "green" ? c[1] - Math.max(c[0], c[2]) : c[2] - Math.max(c[0], c[1]);
}

/**
 * The matte in a render whose RGB is the matte (Keylight's Screen Matte and
 * Combined Matte views): Rec. 709 luminance of the capture values, clamped to
 * 0..1; a grey pixel (r = g = b) is taken as it is.
 */
export function lumaMatte(img: DecodedPng): Float64Array {
  const n = img.width * img.height;
  const out = new Float64Array(n);
  const rgb = img.rgb;
  for (let p = 0; p < n; p++) {
    const r = rgb[p * 3];
    const g = rgb[p * 3 + 1];
    const b = rgb[p * 3 + 2];
    const y = r === g && g === b ? r : 0.2126 * r + 0.7152 * g + 0.0722 * b;
    out[p] = y < 0 ? 0 : y > 1 ? 1 : y;
  }
  return out;
}

/**
 * Measure one capture's matte. `bg` is the comp background AE laid the
 * capture's RGB over (see unmatte); it is taken out before the spill colour
 * is read. The matte is the capture's alpha, or with `t.from` "luma" its
 * luminance (then spill is not read: there is no subject colour). Throws when
 * the matte comes from alpha and the capture has none.
 */
export function measureEdge(
  img: DecodedPng,
  bg: Rgb,
  t: EdgeThresholds,
): { report: EdgeReport; frame: AlphaFrame } {
  const fromLuma = t.from === "luma";
  const alpha = fromLuma ? lumaMatte(img) : img.alpha;
  if (!alpha) throw new Error("the capture has no alpha channel");
  const { width, height } = img;
  const n = width * height;
  const isT = (a: number) => a <= t.transparent;
  const isO = (a: number) => a >= t.opaque;

  let opaque = 0;
  let transparent = 0;
  for (let p = 0; p < n; p++) {
    if (isO(alpha[p])) opaque++;
    else if (isT(alpha[p])) transparent++;
  }

  // Distance maps: to the nearest transparent and the nearest opaque pixel.
  const scratch = new Float32Array(n);
  const dT = new Float32Array(n);
  const dO = new Float32Array(n);
  distanceTo(alpha, width, height, isT, scratch, dT);
  distanceTo(alpha, width, height, isO, scratch, dO);

  const labels = new Int32Array(n);
  const queue = new Int32Array(n);

  // Islands of covered pixels: main solid areas and specks.
  const islands = labelRegions(
    alpha,
    width,
    height,
    (p) => alpha[p] > t.transparent,
    true,
    labels,
    queue,
    t.transparent,
  );
  const largest = islands.reduce((m, r) => Math.max(m, r.area), 0);
  const isMain = islands.map((r) => r.area > 0 && r.area >= t.mainAreaShare * largest);
  const mains = islands.filter((_, i) => isMain[i]).sort(byArea);
  const specks = islands.filter((_, i) => !isMain[i]).sort(byArea);

  // Edge width on the main areas' 50% contour.
  const widths: number[] = [];
  let unmeasured = 0;
  let worst = -1;
  let worstAt: { x: number; y: number } | null = null;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      if (alpha[p] < CONTOUR_ALPHA || labels[p] === 0 || !isMain[labels[p] - 1]) continue;
      let onContour = false;
      for (let k = 0; k < 4 && !onContour; k++) {
        const qx = x + N4X[k];
        const qy = y + N4Y[k];
        if (qx < 0 || qy < 0 || qx >= width || qy >= height) continue;
        if (alpha[qy * width + qx] < CONTOUR_ALPHA) onContour = true;
      }
      if (!onContour) continue;
      const sum = dT[p] + dO[p];
      if (!Number.isFinite(sum)) {
        unmeasured++;
        continue;
      }
      const w = Math.max(0, sum - 1);
      widths.push(w);
      if (w > worst) {
        worst = w;
        worstAt = { x, y };
      }
    }
  }
  widths.sort((a, b) => a - b);
  const m = widths.length;
  const median =
    m === 0 ? null : m % 2 ? widths[(m - 1) / 2] : (widths[m / 2 - 1] + widths[m / 2]) / 2;

  // Holes: regions below opaque, 4-connected, that do not reach the border.
  const belowOpaque = labelRegions(
    alpha,
    width,
    height,
    (p) => alpha[p] < t.opaque,
    false,
    labels,
    queue,
    t.transparent,
  );
  const holes = belowOpaque.filter((r) => !r.touchesBorder).sort(byArea);

  // Patches: partly transparent cores thicker than a thin edge, grown back
  // out to their full extent through partly transparent pixels.
  const half = t.maxEdgeWidth / 2;
  const isPartial = (p: number) => alpha[p] > t.transparent && alpha[p] < t.opaque;
  const isCore = (p: number) => isPartial(p) && Math.min(dT[p], dO[p]) > half;
  labels.fill(0);
  let tail = 0;
  let ids = 0;
  for (let start = 0; start < n; start++) {
    if (labels[start] !== 0 || !isCore(start)) continue;
    ids++;
    labels[start] = ids;
    let head = tail;
    queue[tail++] = start;
    while (head < tail) {
      const p = queue[head++];
      const x = p % width;
      const y = (p - x) / width;
      for (let k = 0; k < 8; k++) {
        const qx = x + N8X[k];
        const qy = y + N8Y[k];
        if (qx < 0 || qy < 0 || qx >= width || qy >= height) continue;
        const q = qy * width + qx;
        if (labels[q] !== 0 || !isCore(q)) continue;
        labels[q] = ids;
        queue[tail++] = q;
      }
    }
  }
  let levelStart = 0;
  let levelEnd = tail;
  for (let step = 0; step < Math.ceil(half) && levelStart < levelEnd; step++) {
    for (let i = levelStart; i < levelEnd; i++) {
      const p = queue[i];
      const x = p % width;
      const y = (p - x) / width;
      for (let k = 0; k < 8; k++) {
        const qx = x + N8X[k];
        const qy = y + N8Y[k];
        if (qx < 0 || qy < 0 || qx >= width || qy >= height) continue;
        const q = qy * width + qx;
        if (labels[q] !== 0 || !isPartial(q)) continue;
        labels[q] = labels[p];
        queue[tail++] = q;
      }
    }
    levelStart = levelEnd;
    levelEnd = tail;
  }
  const patchRegions = Array.from({ length: ids }, newRegion);
  for (let i = 0; i < tail; i++) {
    const p = queue[i];
    const x = p % width;
    addPixel(patchRegions[labels[p] - 1], x, (p - x) / width, alpha[p]);
  }
  const patchId = new Map(patchRegions.map((r, i) => [r, i + 1]));
  patchRegions.sort(byArea);
  const patchList = patchRegions
    .slice(0, t.listed)
    .map((r) => patchEntry(r, patchId.get(r)!, labels, alpha, dT, dO, width, t.patchWindow));

  // Spill: straight colour of the soft edge and of the solid just inside it.
  const edgeSum: Rgb = [0, 0, 0];
  const solidSum: Rgb = [0, 0, 0];
  let edgeCount = 0;
  let solidCount = 0;
  const zones = new Uint8Array(n);
  const M = t.maxEdgeWidth;
  for (let p = 0; p < n; p++) {
    const a = alpha[p];
    zones[p] = dT[p] <= M && dO[p] <= M ? EDGE : a >= CONTOUR_ALPHA ? INSIDE : OUTSIDE;
    const partial = a > t.transparent && a < t.opaque;
    const solid = a >= t.opaque && dT[p] <= M;
    if (fromLuma || (!(partial && a >= t.spillMinAlpha) && !solid)) continue;
    const sum = solid ? solidSum : edgeSum;
    for (let c = 0; c < 3; c++) {
      const v = img.rgb[p * 3 + c];
      sum[c] += a >= 1 ? v : Math.min(1, Math.max(0, (v - bg[c] * (1 - a)) / a));
    }
    if (solid) solidCount++;
    else edgeCount++;
  }
  const meanOf = (s: Rgb, k: number): Rgb | null =>
    k === 0 ? null : [s[0] / k, s[1] / k, s[2] / k];
  const edgeMean = meanOf(edgeSum, edgeCount);
  const solidMean = meanOf(solidSum, solidCount);
  const excess = edgeMean ? screenExcess(edgeMean, t.screen) : null;
  const solidExcess = solidMean ? screenExcess(solidMean, t.screen) : null;
  const leans =
    excess !== null &&
    excess > t.spillThreshold &&
    (solidExcess === null || excess - solidExcess > t.spillThreshold);

  const report: EdgeReport = {
    stage: "capture",
    matteFrom: t.from,
    pixels: n,
    shares: {
      opaque: r4(opaque / n),
      partial: r4((n - opaque - transparent) / n),
      transparent: r4(transparent / n),
    },
    width: {
      typical: median === null ? null : r2(median),
      p90: m === 0 ? null : r2(widths[Math.floor(0.9 * (m - 1))]),
      worst: m === 0 ? null : r2(worst),
      worstAt,
      samples: m,
      unmeasured,
    },
    solidAreas: {
      count: mains.length,
      list: mains.slice(0, t.listed).map((r) => ({ ...box(r), area: r.area })),
    },
    holes: {
      count: holes.length,
      area: holes.reduce((s, r) => s + r.area, 0),
      transparentArea: holes.reduce((s, r) => s + r.transparent, 0),
      largest: holes.length ? holeEntry(holes[0]) : null,
      list: holes.slice(0, t.listed).map(holeEntry),
    },
    specks: {
      count: specks.length,
      area: specks.reduce((s, r) => s + r.area, 0),
      list: specks.slice(0, t.listed).map((r) => ({
        ...box(r),
        area: r.area,
        meanAlpha: r4(r.alphaSum / r.area),
        maxAlpha: r4(r.alphaMax),
      })),
    },
    patches: {
      count: patchRegions.length,
      area: patchRegions.reduce((s, r) => s + r.area, 0),
      list: patchList,
    },
    spill: {
      screen: t.screen,
      pixels: edgeCount,
      mean: edgeMean ? r4rgb(edgeMean) : null,
      solidMean: solidMean ? r4rgb(solidMean) : null,
      excess: excess === null ? null : r4(excess),
      solidExcess: solidExcess === null ? null : r4(solidExcess),
      leansToScreen: leans,
      reading: fromLuma
        ? "not read: the matte came from luminance (a Keylight matte view), which carries no subject " +
          "colour; read spill on the keyed result with `from: 'alpha'`"
        : spillReading(t, edgeCount, excess, solidExcess, leans),
    },
  };
  return { report, frame: { width, height, alpha: Float32Array.from(alpha), zones } };
}

function holeEntry(r: Region): Box & { area: number; meanAlpha: number } {
  return { ...box(r), area: r.area, meanAlpha: r4(r.alphaSum / r.area) };
}

/** A patch's box plus where it is thickest and its densest window (see PatchEntry). */
function patchEntry(
  r: Region,
  id: number,
  labels: Int32Array,
  alpha: Float64Array,
  dT: Float32Array,
  dO: Float32Array,
  width: number,
  window: number,
): PatchEntry {
  const b = box(r);
  // Thickest: the deepest pixel.
  let depth = -1;
  let at = { x: b.x, y: b.y };
  let thickness = 0;
  for (let y = b.y; y < b.y + b.height; y++) {
    for (let x = b.x; x < b.x + b.width; x++) {
      const p = y * width + x;
      if (labels[p] !== id) continue;
      const m = Math.min(dT[p], dO[p]);
      if (m > depth) {
        depth = m;
        at = { x, y };
        thickness =
          Number.isFinite(dT[p]) && Number.isFinite(dO[p]) ? dT[p] + dO[p] - 1 : 2 * m - 1;
      }
    }
  }
  // Densest window: summed-area tables of patch pixels and their alpha over the box.
  const bw = b.width;
  const bh = b.height;
  const ww = Math.max(1, Math.min(Math.round(window), bw));
  const wh = Math.max(1, Math.min(Math.round(window), bh));
  const sc = new Float64Array((bw + 1) * (bh + 1));
  const sa = new Float64Array((bw + 1) * (bh + 1));
  const W = bw + 1;
  for (let j = 0; j < bh; j++) {
    let rowC = 0;
    let rowA = 0;
    for (let i = 0; i < bw; i++) {
      const p = (b.y + j) * width + (b.x + i);
      if (labels[p] === id) {
        rowC++;
        rowA += alpha[p];
      }
      sc[(j + 1) * W + i + 1] = sc[j * W + i + 1] + rowC;
      sa[(j + 1) * W + i + 1] = sa[j * W + i + 1] + rowA;
    }
  }
  const rect = (s: Float64Array, i: number, j: number) =>
    s[(j + wh) * W + i + ww] - s[j * W + i + ww] - s[(j + wh) * W + i] + s[j * W + i];
  let bestC = -1;
  let bestA = 0;
  let bi = 0;
  let bj = 0;
  for (let j = 0; j + wh <= bh; j++) {
    for (let i = 0; i + ww <= bw; i++) {
      const c = rect(sc, i, j);
      if (c > bestC) {
        bestC = c;
        bestA = rect(sa, i, j);
        bi = i;
        bj = j;
      }
    }
  }
  return {
    ...b,
    area: r.area,
    meanAlpha: r4(r.alphaSum / r.area),
    thickest: { ...at, thickness: r2(Math.max(0, thickness)) },
    densest: {
      x: b.x + bi,
      y: b.y + bj,
      width: ww,
      height: wh,
      pixels: bestC,
      share: r4(bestC / (ww * wh)),
      meanAlpha: bestC > 0 ? r4(bestA / bestC) : 0,
    },
  };
}

function spillReading(
  t: EdgeThresholds,
  pixels: number,
  excess: number | null,
  solidExcess: number | null,
  leans: boolean,
): string {
  const other = t.screen === "green" ? "red and blue" : "red and green";
  if (pixels === 0 || excess === null) {
    return `no partly transparent pixels at or above alpha ${t.spillMinAlpha} to read a colour from`;
  }
  const lean = `its ${t.screen} exceeds the larger of ${other} by ${excess.toFixed(3)}`;
  const versus =
    solidExcess === null ? "" : `; the solid area just inside the edge: ${solidExcess.toFixed(3)}`;
  return leans
    ? `the soft edge leans ${t.screen} (likely spill): ${lean}${versus}`
    : `the soft edge does not lean ${t.screen} beyond the subject's own colour: ${lean}${versus}`;
}

// ---------------------------------------------------------------------------
// Between frames
// ---------------------------------------------------------------------------

interface ZoneAcc {
  pixels: number;
  sum: number;
  max: number;
  changed: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const zoneAcc = (): ZoneAcc => ({
  pixels: 0,
  sum: 0,
  max: 0,
  changed: 0,
  minX: Infinity,
  minY: Infinity,
  maxX: -1,
  maxY: -1,
});

function finishZone(z: ZoneAcc): ZoneChange {
  return {
    pixels: z.pixels,
    meanAbsDelta: z.pixels ? r4(z.sum / z.pixels) : 0,
    maxAbsDelta: r4(z.max),
    changedShare: z.pixels ? r4(z.changed / z.pixels) : 0,
    changedBounds:
      z.changed === 0
        ? null
        : { x: z.minX, y: z.minY, width: z.maxX - z.minX + 1, height: z.maxY - z.minY + 1 },
  };
}

/**
 * The change in alpha from `prev` to `cur`, split by where it happened. Each
 * frame marks its pixels as edge (within maxEdgeWidth of both a transparent
 * and an opaque pixel), inside (otherwise, alpha ≥ 0.5) or outside. A pixel
 * inside the solid area in either frame counts as inside — so a hole opening
 * or closing is inside, not edge; otherwise outside in either frame counts
 * as outside (specks appearing); the rest is edge. Real motion is change
 * too: read these on a held shot, or against how much the subject moves.
 */
export function alphaChange(prev: AlphaFrame, cur: AlphaFrame, t: EdgeThresholds): AlphaChange {
  if (prev.width !== cur.width || prev.height !== cur.height) {
    throw new Error(
      `cannot compare frames of different size (${prev.width}×${prev.height} vs ${cur.width}×${cur.height})`,
    );
  }
  const { width } = cur;
  const acc = [zoneAcc(), zoneAcc(), zoneAcc()];
  const all = zoneAcc();
  const n = width * cur.height;
  for (let p = 0; p < n; p++) {
    const zp = prev.zones[p];
    const zc = cur.zones[p];
    const zone =
      zp === INSIDE || zc === INSIDE ? INSIDE : zp === OUTSIDE || zc === OUTSIDE ? OUTSIDE : EDGE;
    const d = Math.abs(cur.alpha[p] - prev.alpha[p]);
    for (const z of [acc[zone], all]) {
      z.pixels++;
      z.sum += d;
      if (d > z.max) z.max = d;
      if (d > t.changeAbove) {
        z.changed++;
        const x = p % width;
        const y = (p - x) / width;
        if (x < z.minX) z.minX = x;
        if (x > z.maxX) z.maxX = x;
        if (y < z.minY) z.minY = y;
        if (y > z.maxY) z.maxY = y;
      }
    }
  }
  return {
    edge: finishZone(acc[EDGE]),
    inside: finishZone(acc[INSIDE]),
    outside: finishZone(acc[OUTSIDE]),
    all: finishZone(all),
  };
}

export interface FlickerPair extends AlphaChange {
  from: { index: number; time: number | undefined };
  to: { index: number; time: number | undefined };
}

export interface FlickerSummary {
  meanAbsDelta: number;
  maxAbsDelta: number;
  changedShare: number;
  /** The pair with the largest meanAbsDelta in this zone, or null when nothing changed. */
  worstPair: { from: number; to: number } | null;
}

/** Over every pair: mean of the per-pair means, the largest single change, the worst pair. */
export function summarizeFlicker(
  pairs: FlickerPair[],
): Record<"edge" | "inside" | "outside" | "all", FlickerSummary> {
  const zone = (key: "edge" | "inside" | "outside" | "all"): FlickerSummary => {
    let mean = 0;
    let max = 0;
    let share = 0;
    let worst: FlickerPair | null = null;
    for (const pair of pairs) {
      const z = pair[key];
      mean += z.meanAbsDelta;
      share += z.changedShare;
      if (z.maxAbsDelta > max) max = z.maxAbsDelta;
      if (z.meanAbsDelta > 0 && (worst === null || z.meanAbsDelta > worst[key].meanAbsDelta)) {
        worst = pair;
      }
    }
    const k = Math.max(1, pairs.length);
    return {
      meanAbsDelta: r4(mean / k),
      maxAbsDelta: r4(max),
      changedShare: r4(share / k),
      worstPair: worst ? { from: worst.from.index, to: worst.to.index } : null,
    };
  };
  return { edge: zone("edge"), inside: zone("inside"), outside: zone("outside"), all: zone("all") };
}
