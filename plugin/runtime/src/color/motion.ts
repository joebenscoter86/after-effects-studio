// Watching motion (agent-eyes plan, stage 4): the `diff` report of
// ae_render_frame. For each consecutive pair of rendered frames it measures how
// much the picture changed, where, and by named region; over the series it
// finds the pairs that stand out from their neighbours: a one-frame pop, a
// stutter (a frame repeated while everything around it moves) and a cut.
// Numbers and places only; it never passes or fails a shot.
//
// What is compared is the picture as the written file shows it (stage
// 'output'): display values 0..1. For the default rgb output that is the
// capture as AE laid it over the comp background (or over `over`), so a
// transparent area reads the background in both frames and does not change;
// for an rgba file this call wrote, straight colour weighted by its alpha (as
// over black), so colour under transparent pixels does not count; for the
// alpha output, the matte.
//
// Memory: one previous picture is kept (Float32, 3 values a pixel: ~25 MB at
// 1080×1920); a pair's change is one pass over the two, with the per-region
// sums done on the regions' own rectangles and the thumbnail of the change
// accumulated in the same pass.

import type { Box } from "./matte.js";
import type { DecodedPng } from "./png16.js";
import { clipRegion, type RegionSpec } from "./sheet.js";

export interface DiffThresholds {
  /** A pixel has changed when one of its channels moved by more than this (display values 0..1). */
  changeAbove: number;
  /** A pair is a spike when its change is at least this many times its neighbours' on each side. */
  spikeRatio: number;
  /** A pair is a hold (a repeated frame) when its change is at most this share of its neighbours'. */
  holdRatio: number;
  /** Mean changes below this read as no visible change; also the least reference a spike is measured against. */
  quietBelow: number;
  /** Neighbours count as moving (for a stutter), and a spike counts, only when at least this share of pixels changed. */
  movingShare: number;
  /** How many pairs on each side are a pair's neighbours. */
  window: number;
  /** Gain of the difference images on the diff sheet. */
  amplify: number;
  /**
   * A pair whose change is at most this is a repeated frame (identical
   * pictures read 0). Repeats are never used as a reference for other pairs.
   */
  repeatBelow: number;
}

export type DiffThresholdArgs = Partial<DiffThresholds>;

/**
 * Why these values:
 * - changeAbove 0.04: about ten 8-bit steps. Frame-to-frame grain on real
 *   footage stays far below it (the green screen measured live had a grain
 *   standard deviation of 0.0035, so a difference of two frames' grain is
 *   about 0.005); anything a viewer sees as a change is above it.
 * - spikeRatio 3: a steady move changes about the same amount every frame, and
 *   eases change it by well under 2× from one frame to the next; a pop or a
 *   cut is several times its neighbours.
 * - holdRatio 0.25: a repeated frame reads 0, or render noise, between
 *   neighbours that move; a slow ease is never a quarter of the frames beside it.
 * - quietBelow 0.002: half an 8-bit step on average over the frame; below it
 *   nothing visible changed, so it is the floor a spike is measured against
 *   (otherwise a tiny change after a still stretch would be an infinite ratio).
 * - movingShare 0.0005: 0.05% of the pixels (about 1,000 at 1080×1920, a 32 px
 *   square): grain alone changes none above changeAbove, so a grainy still
 *   shot never counts as moving and a dropped frame in it is not a stutter.
 * - window 3: three pairs each side is enough to tell a pop from a change of
 *   speed, short enough to follow an ease.
 * - amplify 8: a change of 0.03 shows at a quarter of full white on the sheet.
 * - repeatBelow 0.0001: a repeated frame reads exactly 0 (measured live: ten
 *   pairs from rounded times, all 0); 0.0001 is a fortieth of an 8-bit step
 *   on average, far below any grain, so only a repeat (or a frame differing
 *   in a few pixels) is below it. A repeat beside a pair would otherwise be
 *   that pair's reference and make an ordinary change read as a cut.
 */
export const DIFF_DEFAULTS: DiffThresholds = {
  changeAbove: 0.04,
  spikeRatio: 3,
  holdRatio: 0.25,
  quietBelow: 0.002,
  movingShare: 0.0005,
  window: 3,
  amplify: 8,
  repeatBelow: 0.0001,
};

const LIMITS: Record<
  keyof DiffThresholds,
  { min: number; max: number; int?: boolean; above?: boolean }
> = {
  changeAbove: { min: 0, max: 1 },
  spikeRatio: { min: 1, max: 1000, above: true },
  holdRatio: { min: 0, max: 1, above: true },
  quietBelow: { min: 0, max: 1 },
  movingShare: { min: 0, max: 1 },
  window: { min: 1, max: 16, int: true },
  amplify: { min: 1, max: 1000 },
  repeatBelow: { min: 0, max: 1 },
};

export function resolveDiffThresholds(args: DiffThresholdArgs = {}): DiffThresholds {
  const out = { ...DIFF_DEFAULTS };
  for (const key of Object.keys(DIFF_DEFAULTS) as Array<keyof DiffThresholds>) {
    const v = args[key];
    if (typeof v === "number") out[key] = v;
  }
  return out;
}

/** Null when the threshold object is acceptable, else what is wrong with it. */
export function diffArgsError(args: Record<string, unknown>): string | null {
  for (const [key, value] of Object.entries(args)) {
    if (key === "sheet") continue;
    const limit = LIMITS[key as keyof DiffThresholds];
    if (!limit) {
      return `\`diff.${key}\` is not an option (options: ${Object.keys(LIMITS).join(", ")}, sheet)`;
    }
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return `\`diff.${key}\` must be a number`;
    }
    const low = limit.above ? value <= limit.min : value < limit.min;
    if (low || value > limit.max || (limit.int && !Number.isInteger(value))) {
      const range = limit.above
        ? `above ${limit.min} and at most ${limit.max}`
        : `${limit.min} to ${limit.max}`;
      return `\`diff.${key}\` must be ${limit.int ? "a whole number " : ""}${range}, not ${value}`;
    }
  }
  return null;
}

/**
 * The picture a pair is compared on: RGB 0..1 per pixel. `straight` is true
 * only for an rgba file this call wrote (straight colour): its colour is
 * weighted by alpha. A raw capture's alpha is ignored: its RGB is already over
 * the comp background.
 */
export function pictureOf(img: DecodedPng, straight: boolean): Float32Array {
  const n = img.width * img.height;
  const out = new Float32Array(n * 3);
  const a = straight ? img.alpha : undefined;
  if (!a) {
    out.set(img.rgb);
    return out;
  }
  for (let p = 0; p < n; p++) {
    const w = a[p];
    const i = p * 3;
    out[i] = img.rgb[i] * w;
    out[i + 1] = img.rgb[i + 1] * w;
    out[i + 2] = img.rgb[i + 2] * w;
  }
  return out;
}

export interface PictureChangeStats {
  pixels: number;
  /** Mean over pixels of the mean over r, g, b of |Δ|: display values 0..1. */
  change: number;
  /** Largest single-channel |Δ|. */
  maxAbsDelta: number;
  /** Pixels where a channel changed by more than changeAbove. */
  changedPixels: number;
  changedShare: number;
  /** The box around the changed pixels, capture pixels; null when none changed. */
  changedBounds: Box | null;
}

export type RegionChange =
  | ({ name: string } & PictureChangeStats)
  | { name: string; error: string };

export interface PictureChangeResult {
  all: PictureChangeStats;
  regions?: RegionChange[];
  /** Grey thumbnail of the change, thumb.width × thumb.height, amplified and clipped to 0..1. */
  thumb?: Float64Array;
}

const r6 = (v: number) => Math.round(v * 1e6) / 1e6;

function rectStats(
  prev: Float32Array,
  cur: Float32Array,
  width: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  above: number,
  perPixel?: (x: number, y: number, mean: number) => void,
): PictureChangeStats {
  let sum = 0;
  let maxAbs = 0;
  let changed = 0;
  let bx0 = Infinity;
  let by0 = Infinity;
  let bx1 = -1;
  let by1 = -1;
  for (let y = y0; y < y1; y++) {
    let i = (y * width + x0) * 3;
    for (let x = x0; x < x1; x++, i += 3) {
      const dr = Math.abs(cur[i] - prev[i]);
      const dg = Math.abs(cur[i + 1] - prev[i + 1]);
      const db = Math.abs(cur[i + 2] - prev[i + 2]);
      const m = dr > dg ? (dr > db ? dr : db) : dg > db ? dg : db;
      const mean = (dr + dg + db) / 3;
      sum += mean;
      if (m > maxAbs) maxAbs = m;
      if (m > above) {
        changed++;
        if (x < bx0) bx0 = x;
        if (x > bx1) bx1 = x;
        if (y < by0) by0 = y;
        if (y > by1) by1 = y;
      }
      if (perPixel) perPixel(x, y, mean);
    }
  }
  const pixels = (x1 - x0) * (y1 - y0);
  return {
    pixels,
    change: r6(pixels > 0 ? sum / pixels : 0),
    maxAbsDelta: r6(maxAbs),
    changedPixels: changed,
    changedShare: r6(pixels > 0 ? changed / pixels : 0),
    changedBounds:
      changed > 0 ? { x: bx0, y: by0, width: bx1 - bx0 + 1, height: by1 - by0 + 1 } : null,
  };
}

/** How one picture changed into the next, whole frame and per region. */
export function pictureChange(
  prev: Float32Array,
  cur: Float32Array,
  width: number,
  height: number,
  t: DiffThresholds,
  opts: { regions?: RegionSpec[]; thumb?: { width: number; height: number } } = {},
): PictureChangeResult {
  let perPixel: ((x: number, y: number, mean: number) => void) | undefined;
  let sums: Float64Array | null = null;
  let counts: Float64Array | null = null;
  const tw = opts.thumb?.width ?? 0;
  if (opts.thumb) {
    const th = opts.thumb.height;
    sums = new Float64Array(tw * th);
    counts = new Float64Array(tw * th);
    const col = new Int32Array(width);
    for (let x = 0; x < width; x++) col[x] = Math.min(tw - 1, Math.floor((x * tw) / width));
    const row = new Int32Array(height);
    for (let y = 0; y < height; y++) row[y] = Math.min(th - 1, Math.floor((y * th) / height)) * tw;
    const s = sums;
    const c = counts;
    perPixel = (x, y, mean) => {
      const k = row[y] + col[x];
      s[k] += mean;
      c[k]++;
    };
  }
  const all = rectStats(prev, cur, width, 0, 0, width, height, t.changeAbove, perPixel);
  const out: PictureChangeResult = { all };
  if (opts.regions) {
    out.regions = opts.regions.map((region) => {
      const clip = clipRegion({ width, height }, region);
      if (!clip)
        return { name: region.name, error: `region is outside the ${width}×${height} frame` };
      const { x, y, width: w, height: h } = clip.rect;
      return {
        name: region.name,
        ...rectStats(prev, cur, width, x, y, x + w, y + h, t.changeAbove),
      };
    });
  }
  if (sums && counts) {
    const thumb = new Float64Array(sums.length);
    for (let k = 0; k < sums.length; k++) {
      thumb[k] = counts[k] > 0 ? Math.min(1, (sums[k] / counts[k]) * t.amplify) : 0;
    }
    out.thumb = thumb;
  }
  return out;
}

// ---------------------------------------------------------------------------
// The series
// ---------------------------------------------------------------------------

export interface FrameRef {
  index: number;
  time: number | undefined;
}

export interface SeriesPair {
  from: FrameRef;
  to: FrameRef;
  change: number;
  changedShare: number;
}

export type FlagKind = "pop" | "stutter" | "cut" | "repeat";

export interface SeriesFlag {
  kind: FlagKind;
  /** Indices into `pairs`. */
  pairs: number[];
  /** pop: the frame that differs from both neighbours; stutter: the frame that repeats the one before. */
  frame?: FrameRef;
  /** cut: the frames on either side. */
  between?: [FrameRef, FrameRef];
  change: number;
  /** The neighbours' change it stands out from (the smaller side for a spike). */
  reference: number;
  ratio: number;
  /** The pair is the first or last of the series, so only one side could be compared. */
  atSeriesEdge?: boolean;
  /** cut / pop: a repeated frame is among the neighbours; it was left out of the reference. */
  besideRepeat?: boolean;
  /**
   * stutter / repeat: the pairs next to the repeated frame. Their change is
   * measured across a repeat (the one after spans two frames' motion), so
   * read them with care.
   */
  unreliablePairs?: number[];
  reading: string;
}

export interface SeriesSummary {
  pairs: number;
  median: number;
  mean: number;
  largest: { pair: number; change: number };
  smallest: { pair: number; change: number };
  flags: SeriesFlag[];
  reading: string;
}

/** The lower middle value: with an even count, the smaller of the two middle values. */
function lowerMedian(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor((s.length - 1) / 2)];
}

interface Side {
  change: number;
  share: number;
}

function side(
  pairs: SeriesPair[],
  p: number,
  dir: 1 | -1,
  window: number,
  skip: Set<number>,
): Side | null {
  const changes: number[] = [];
  const shares: number[] = [];
  for (let k = 1; k <= window; k++) {
    const j = p + dir * k;
    if (j < 0 || j >= pairs.length) break;
    if (skip.has(j)) continue;
    changes.push(pairs[j].change);
    shares.push(pairs[j].changedShare);
  }
  if (changes.length === 0) return null;
  return { change: lowerMedian(changes), share: lowerMedian(shares) };
}

const fmt = (v: number) => v.toFixed(4);
const frameText = (f: FrameRef) => `#${f.index}${f.time === undefined ? "" : ` (${r6(f.time)} s)`}`;

/**
 * Median, extremes and the pairs that stand out. A spike stands out from the
 * neighbours on every side it has (so a move starting from rest is not a cut),
 * by spikeRatio over the median of up to `window` pairs on that side; a pair
 * is looked at a second time with the spikes already found left out of its
 * neighbours, so a smaller jump beside a larger one is still reported:
 * two spikes in a row are a one-frame pop of the frame they share, a lone
 * spike is a cut (or a jump). A hold — a pair that barely changes while the
 * neighbours on both sides move — is a stutter: a repeated frame. Spikes are
 * left out of a hold's neighbours, so the pair beside a pop is not a stutter.
 * Repeated frames (change ≤ repeatBelow) are left out of every reference (a 0
 * beside a pair would make an ordinary change read as a cut); a repeat at the
 * start or end of the series beside motion is flagged `repeat`, and stutters
 * and repeats name the pairs beside them as unreliable.
 */
export function summarizeSeries(pairs: SeriesPair[], t: DiffThresholds): SeriesSummary {
  const n = pairs.length;
  const changes = pairs.map((p) => p.change);
  let largest = 0;
  let smallest = 0;
  for (let i = 1; i < n; i++) {
    if (changes[i] > changes[largest]) largest = i;
    if (changes[i] < changes[smallest]) smallest = i;
  }
  const summary: SeriesSummary = {
    pairs: n,
    median: n > 0 ? r6(lowerMedian(changes)) : 0,
    mean: n > 0 ? r6(changes.reduce((a, b) => a + b, 0) / n) : 0,
    largest: { pair: largest, change: n > 0 ? changes[largest] : 0 },
    smallest: { pair: smallest, change: n > 0 ? changes[smallest] : 0 },
    flags: [],
    reading: "",
  };
  if (n < 2) {
    summary.reading =
      n === 0
        ? "no pair of consecutive frames to compare"
        : "one pair: nothing to compare it with, so nothing is flagged (render at least three frames)";
    return summary;
  }

  // Repeated frames are never a reference: a 0 beside a pair would make an
  // ordinary change look like a cut.
  const repeats = new Set(pairs.flatMap((p, i) => (p.change <= t.repeatBelow ? [i] : [])));
  const near = (i: number, set: Set<number>) => {
    for (let k = 1; k <= t.window; k++) if (set.has(i - k) || set.has(i + k)) return true;
    return false;
  };
  type Spike = { reference: number; edge: boolean; besideRepeat: boolean };
  const standsOut = (p: SeriesPair, i: number, skip: Set<number>): Spike | null => {
    if (repeats.has(i) || p.changedShare < t.movingShare) return null;
    const sides = [side(pairs, i, -1, t.window, skip), side(pairs, i, 1, t.window, skip)].filter(
      (s): s is Side => s !== null,
    );
    if (sides.length === 0) return null;
    const reference = Math.max(...sides.map((s) => s.change), t.quietBelow);
    if (sides.some((s) => p.change < t.spikeRatio * Math.max(s.change, t.quietBelow))) return null;
    return { reference, edge: i === 0 || i === n - 1, besideRepeat: near(i, repeats) };
  };
  const first: Array<Spike | null> = pairs.map((p, i) => standsOut(p, i, repeats));
  // Second look, with the pairs that already stand out left out of every other
  // pair's neighbours: a jump two frames before a larger cut is measured against
  // the ordinary pairs around it, not against the cut in its window (found on a
  // real comp: stray frames of another take just before the cut). Ordinary
  // motion beside a cut still has to stand spikeRatio clear of its own
  // neighbours, so it does not become a second cut.
  const firstSpikes = new Set(first.flatMap((s, i) => (s ? [i] : [])));
  const skipBoth = new Set([...repeats, ...firstSpikes]);
  const spike: Array<Spike | null> = pairs.map(
    (p, i) => first[i] ?? (firstSpikes.size > 0 ? standsOut(p, i, skipBoth) : null),
  );
  const spikes = new Set(spike.flatMap((s, i) => (s ? [i] : [])));
  const repeatNote = " (a repeated frame is next to it and was left out of the comparison)";

  const flags: SeriesFlag[] = [];
  for (let i = 0; i < n; i++) {
    const s = spike[i];
    if (!s) continue;
    const runStart = i === 0 || !spike[i - 1];
    if (!runStart) continue;
    let end = i;
    while (end + 1 < n && spike[end + 1]) end++;
    if (end === i + 1) {
      const reference = Math.max(s.reference, spike[end]!.reference);
      const change = Math.min(pairs[i].change, pairs[end].change);
      const frame = pairs[i].to;
      const flag: SeriesFlag = {
        kind: "pop",
        pairs: [i, end],
        frame,
        change,
        reference: r6(reference),
        ratio: r6(change / reference),
        reading: `frame ${frameText(frame)} differs from the frames before and after it by ${fmt(change)} or more, while its neighbours change about ${fmt(reference)}: a one-frame pop`,
      };
      if (s.besideRepeat || spike[end]!.besideRepeat) {
        flag.besideRepeat = true;
        flag.reading += repeatNote;
      }
      flags.push(flag);
      continue;
    }
    for (let j = i; j <= end; j++) {
      const sj = spike[j]!;
      const between: [FrameRef, FrameRef] = [pairs[j].from, pairs[j].to];
      const flag: SeriesFlag = {
        kind: "cut",
        pairs: [j],
        between,
        change: pairs[j].change,
        reference: r6(sj.reference),
        ratio: r6(pairs[j].change / sj.reference),
        reading: `${frameText(between[0])} to ${frameText(between[1])} changes ${fmt(pairs[j].change)}, ${(pairs[j].change / sj.reference).toFixed(1)}× its neighbours: a cut or a jump`,
      };
      if (sj.edge) {
        flag.atSeriesEdge = true;
        flag.reading += " (first or last pair: it could also be a pop of the end frame)";
      }
      if (sj.besideRepeat) {
        flag.besideRepeat = true;
        flag.reading += repeatNote;
      }
      flags.push(flag);
    }
  }

  const moving = (s: Side | null) =>
    s !== null && s.change >= t.quietBelow && s.share >= t.movingShare;
  const notSpikes = new Set([...spikes, ...repeats]);
  const neighbours = (i: number) =>
    [i - 1, i + 1].filter((j) => j >= 0 && j < n && !repeats.has(j));
  for (let i = 0; i < n; i++) {
    if (spikes.has(i)) continue;
    const before = side(pairs, i, -1, t.window, notSpikes);
    const after = side(pairs, i, 1, t.window, notSpikes);
    const frame = pairs[i].to;
    const unreliablePairs = neighbours(i);
    const unreliable =
      unreliablePairs.length > 0
        ? `; pair${unreliablePairs.length > 1 ? "s" : ""} ${unreliablePairs.join(" and ")} beside it ${unreliablePairs.length > 1 ? "are" : "is"} measured across the repeat, so ${unreliablePairs.length > 1 ? "their readings are" : "its reading is"} unreliable`
        : "";
    if (before && after && moving(before) && moving(after)) {
      const reference = Math.min(before.change, after.change);
      if (pairs[i].change > t.holdRatio * reference) continue;
      flags.push({
        kind: "stutter",
        pairs: [i],
        frame,
        change: pairs[i].change,
        reference: r6(reference),
        ratio: r6(pairs[i].change / reference),
        unreliablePairs,
        reading: `frame ${frameText(frame)} barely changes from the one before (${fmt(pairs[i].change)}) while the frames around it move about ${fmt(reference)}: a repeated frame, a stutter${unreliable}. Rounded times can do this: a time just below a frame boundary renders the frame before (see frameWarning)`,
      });
      continue;
    }
    if (!repeats.has(i)) continue;
    // A repeat at the start or end of the series, beside motion: a stutter
    // cannot be told from the start or end of a hold, so say what is known.
    const rawBefore = side(pairs, i, -1, t.window, spikes);
    const rawAfter = side(pairs, i, 1, t.window, spikes);
    const atEdge = rawBefore === null || rawAfter === null;
    if (!atEdge || !(moving(rawBefore) || moving(rawAfter))) continue;
    const reference = (moving(rawBefore) ? rawBefore : rawAfter)!.change;
    flags.push({
      kind: "repeat",
      pairs: [i],
      frame,
      change: pairs[i].change,
      reference: r6(reference),
      ratio: r6(pairs[i].change / reference),
      atSeriesEdge: true,
      unreliablePairs,
      reading: `frame ${frameText(frame)} repeats the one before (change ${fmt(pairs[i].change)}) beside motion of about ${fmt(reference)}, at the ${rawBefore === null ? "start" : "end"} of the series, so a stutter cannot be told from a hold${unreliable}`,
    });
  }
  flags.sort((a, b) => a.pairs[0] - b.pairs[0]);
  summary.flags = flags;

  const counts = (["pop", "stutter", "cut", "repeat"] as const)
    .map((k) => [k, flags.filter((f) => f.kind === k).length] as const)
    .filter(([, c]) => c > 0)
    .map(([k, c]) => `${c} ${k}${c > 1 ? "s" : ""}`);
  summary.reading =
    `${n} pairs, median change ${fmt(summary.median)}, largest ${fmt(summary.largest.change)} (pair ${largest}); ` +
    (flags.length === 0
      ? "no pair stands out from its neighbours"
      : `${counts.join(", ")}: ${flags.map((f) => `${f.kind} at pair ${f.pairs.join("+")}`).join("; ")}`);
  return summary;
}

// ---------------------------------------------------------------------------
// Where the picture moves: a map of mean change per cell, and lining two up
// ---------------------------------------------------------------------------

/** Mean absolute change of luma per cell over the pairs counted, row-major. */
export interface MotionMap {
  width: number;
  height: number;
  /** The cell's size in frame pixels. */
  cell: number;
  values: number[];
}

/** Luma averaged over cells of `cell` px: the picture a motion map is built from. */
export function cellLuma(img: DecodedPng, cell: number): Float32Array {
  const w = Math.ceil(img.width / cell);
  const h = Math.ceil(img.height / cell);
  const out = new Float32Array(w * h);
  const n = new Float32Array(w * h);
  for (let y = 0; y < img.height; y++) {
    const row = Math.floor(y / cell) * w;
    for (let x = 0; x < img.width; x++) {
      const p = (y * img.width + x) * 3;
      const k = row + Math.floor(x / cell);
      out[k] += 0.2126 * img.rgb[p] + 0.7152 * img.rgb[p + 1] + 0.0722 * img.rgb[p + 2];
      n[k]++;
    }
  }
  for (let k = 0; k < out.length; k++) out[k] /= n[k] || 1;
  return out;
}

/** The map with its floor (the median cell) taken off: what moves more than the frame at large. */
function aboveFloor(m: MotionMap): Float64Array {
  const s = m.values.slice().sort((a, b) => a - b);
  const floor = s[Math.floor(s.length / 2)] ?? 0;
  return Float64Array.from(m.values, (v) => Math.max(0, v - floor));
}

/** Centre and spread of what moves, as shares of the frame's width and height; null when nothing does. */
export function motionCentre(
  m: MotionMap,
): { x: number; y: number; spreadX: number; spreadY: number } | null {
  const a = aboveFloor(m);
  let s = 0;
  let sx = 0;
  let sy = 0;
  for (let y = 0; y < m.height; y++)
    for (let x = 0; x < m.width; x++) {
      const v = a[y * m.width + x];
      s += v;
      sx += v * (x + 0.5);
      sy += v * (y + 0.5);
    }
  if (s <= 0) return null;
  const cx = sx / s;
  const cy = sy / s;
  let vx = 0;
  let vy = 0;
  for (let y = 0; y < m.height; y++)
    for (let x = 0; x < m.width; x++) {
      const v = a[y * m.width + x];
      vx += v * (x + 0.5 - cx) ** 2;
      vy += v * (y + 0.5 - cy) ** 2;
    }
  const r3 = (v: number) => Math.round(v * 1000) / 1000;
  return {
    x: r3(cx / m.width),
    y: r3(cy / m.height),
    spreadX: r3(Math.sqrt(vx / s) / m.width),
    spreadY: r3(Math.sqrt(vy / s) / m.height),
  };
}

export interface MotionRegistration {
  /** The build's moving parts are this many times their size in the reference. */
  scale: number;
  /** Where the reference's centre of motion lands in the build, as shares of the frame. */
  from: { x: number; y: number };
  to: { x: number; y: number };
  /** Correlation of the two maps once lined up (1 is the same pattern). */
  correlation: number;
}

/**
 * Line the build's motion map up with the reference's: the scale (0.5 to 1.6)
 * and shift that best match the two patterns of change, searched round their
 * centres of motion. Two cuts of the same take move the same way, so the
 * scale is how much bigger or smaller the moving subject is; on different
 * footage the correlation stays low.
 */
export function registerMotionMaps(ref: MotionMap, build: MotionMap): MotionRegistration | null {
  const ra = aboveFloor(ref);
  const ba = aboveFloor(build);
  const rc = motionCentre(ref);
  const bc = motionCentre(build);
  if (!rc || !bc) return null;
  const W = ref.width;
  const H = ref.height;
  // Reference cell (x, y) -> build cell, both in shares of the frame.
  const crx = rc.x * W;
  const cry = rc.y * H;
  const cbx = bc.x * build.width;
  const cby = bc.y * build.height;
  const kx = build.width / W;
  const ky = build.height / H;
  const corr = (s: number, dx: number, dy: number) => {
    let sab = 0;
    let saa = 0;
    let sbb = 0;
    let sa = 0;
    let sb = 0;
    let n = 0;
    for (let y = 0; y < H; y++) {
      const by = Math.floor((s * (y + 0.5 - cry)) * ky + cby + dy);
      if (by < 0 || by >= build.height) continue;
      for (let x = 0; x < W; x++) {
        const bx = Math.floor((s * (x + 0.5 - crx)) * kx + cbx + dx);
        if (bx < 0 || bx >= build.width) continue;
        const va = ra[y * W + x];
        const vb = ba[by * build.width + bx];
        sab += va * vb;
        saa += va * va;
        sbb += vb * vb;
        sa += va;
        sb += vb;
        n++;
      }
    }
    if (n < 4) return -1;
    const d = (saa - (sa * sa) / n) * (sbb - (sb * sb) / n);
    return d > 0 ? (sab - (sa * sb) / n) / Math.sqrt(d) : -1;
  };
  const rx = Math.max(2, Math.ceil(0.12 * build.width));
  const ry = Math.max(2, Math.ceil(0.12 * build.height));
  let best = { c: -2, s: 1, dx: 0, dy: 0 };
  for (let s = 0.5; s <= 1.6001; s += 0.02)
    for (let dy = -ry; dy <= ry; dy++)
      for (let dx = -rx; dx <= rx; dx++) {
        const c = corr(s, dx, dy);
        if (c > best.c) best = { c, s, dx, dy };
      }
  const coarse = best;
  for (let s = coarse.s - 0.02; s <= coarse.s + 0.02001; s += 0.005)
    for (let dy = coarse.dy - 1; dy <= coarse.dy + 1; dy++)
      for (let dx = coarse.dx - 1; dx <= coarse.dx + 1; dx++) {
        const c = corr(s, dx, dy);
        if (c > best.c) best = { c, s, dx, dy };
      }
  const r3 = (v: number) => Math.round(v * 1000) / 1000;
  return {
    scale: r3(best.s),
    from: { x: rc.x, y: rc.y },
    to: { x: r3((cbx + best.dx) / build.width), y: r3((cby + best.dy) / build.height) },
    correlation: r3(best.c),
  };
}

// ---------------------------------------------------------------------------
// A property's curve: value and speed per frame, its moves, and flags
// ---------------------------------------------------------------------------

/**
 * Starting points, not measured judgments:
 * - restBelow 0.02: a frame moving under 2% of the property's top speed is at rest.
 * - noEaseAbove 0.6: a move whose first (or last) moving frame already runs at
 *   60% of its middle speed starts (or stops) with no ease; an ease of any
 *   length starts near 0 (an easy ease's first frame of 30 runs at about 7%).
 * - jumpRatio 2.5 and jumpShare 0.25: inside a move, speed changing 2.5 times
 *   from one frame to the next and by a quarter of the move's top speed.
 * - settleWithin 0.01: within 1% of the move's distance of where it ends is settled.
 * - joinGap 2: moves at rest for 2 frames or fewer are one move (an overshoot
 *   turns back through zero speed).
 */
export const CURVE_DEFAULTS = {
  restBelow: 0.02,
  noEaseAbove: 0.6,
  jumpRatio: 2.5,
  jumpShare: 0.25,
  settleWithin: 0.01,
  joinGap: 2,
};

export interface CurveSample {
  frame: number;
  time: number;
  value: number[];
}

export interface CurveMove {
  /** The last frame at rest before the move, and the first at rest after it. */
  from: number;
  to: number;
  distance: number;
  /** Units a second. */
  peakSpeed: number;
  peakFrame: number;
  startEase: "eased" | "none";
  endEase: "eased" | "none";
  /** Past where it ends, along the way it moved: units and share of the distance. */
  overshoot: { amount: number; share: number; frame: number } | null;
  /** Frames from first reaching the end value to staying within settleWithin of it. */
  settle: { frames: number; from: number; at: number } | null;
}

export interface CurveFlag {
  kind: "no ease" | "speed jump" | "overshoot";
  frames: number[];
  reading: string;
}

export interface CurveReport {
  frames: Array<CurveSample & { speed: number }>;
  moves: CurveMove[];
  flags: CurveFlag[];
  reading: string;
}

const median = (v: number[]) => {
  if (!v.length) return 0;
  const s = v.slice().sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const norm = (v: number[]) => Math.sqrt(v.reduce((s, x) => s + x * x, 0));
const sub = (a: number[], b: number[]) => a.map((x, i) => x - (b[i] ?? 0));
const rnd = (v: number, k = 1000) => Math.round(v * k) / k;

/** Speed per frame, the moves, and flags for a move with no ease, a jump in speed, and overshoot with its settle. */
export function analyzeCurve(
  samples: CurveSample[],
  fps: number,
  opts: Partial<typeof CURVE_DEFAULTS> = {},
): CurveReport {
  const o = { ...CURVE_DEFAULTS };
  for (const [k, v] of Object.entries(opts)) if (typeof v === "number") o[k as keyof typeof o] = v;
  const frames = samples.map((s, i) => ({
    ...s,
    speed: i === 0 ? 0 : rnd(norm(sub(s.value, samples[i - 1].value)) * fps),
  }));
  const peak = Math.max(0, ...frames.map((f) => f.speed));
  const flags: CurveFlag[] = [];
  if (peak <= 1e-9)
    return { frames, moves: [], flags, reading: "The property does not move over the frames read." };
  const moving = frames.map((f) => f.speed > o.restBelow * peak);
  // Runs of moving frames, joined across short rests.
  const runs: Array<[number, number]> = [];
  for (let i = 0; i < frames.length; i++) {
    if (!moving[i]) continue;
    let j = i;
    while (j + 1 < frames.length && moving[j + 1]) j++;
    const last = runs[runs.length - 1];
    if (last && i - last[1] - 1 <= o.joinGap) last[1] = j;
    else runs.push([i, j]);
    i = j;
  }
  const moves: CurveMove[] = runs.map(([i0, i1]) => {
    const from = Math.max(0, i0 - 1);
    const to = i1;
    const sp = frames.slice(i0, i1 + 1).map((f) => f.speed);
    const mid = median(sp);
    let pk = i0;
    for (let i = i0; i <= i1; i++) if (frames[i].speed > frames[pk].speed) pk = i;
    const start = frames[from].value;
    const end = frames[to].value;
    const way = sub(end, start);
    const distance = norm(way);
    const unit = distance > 0 ? way.map((x) => x / distance) : way;
    let over = 0;
    let overFrame = -1;
    let crossed = -1;
    for (let i = i0; i <= to; i++) {
      const p = sub(frames[i].value, end).reduce((s, x, k) => s + x * unit[k], 0);
      if (p > over) {
        over = p;
        overFrame = frames[i].frame;
      }
      if (crossed < 0 && p >= -o.settleWithin * distance) crossed = i;
    }
    const overshoot =
      distance > 0 && over / distance >= o.settleWithin
        ? { amount: rnd(over), share: rnd(over / distance), frame: overFrame }
        : null;
    let settle: CurveMove["settle"] = null;
    if (overshoot && crossed >= 0) {
      let at = to;
      while (at - 1 > crossed && norm(sub(frames[at - 1].value, end)) <= o.settleWithin * distance) at--;
      settle = { frames: frames[at].frame - frames[crossed].frame, from: frames[crossed].frame, at: frames[at].frame };
    }
    return {
      from: frames[from].frame,
      to: frames[to].frame,
      distance: rnd(distance),
      peakSpeed: rnd(frames[pk].speed),
      peakFrame: frames[pk].frame,
      startEase: mid > 0 && frames[i0].speed >= o.noEaseAbove * mid ? "none" : "eased",
      endEase: mid > 0 && frames[i1].speed >= o.noEaseAbove * mid ? "none" : "eased",
      overshoot,
      settle,
    };
  });
  for (const [k, m] of moves.entries()) {
    const [i0, i1] = runs[k];
    const span = `The move from frame ${m.from} to ${m.to}`;
    const mid = median(frames.slice(i0, i1 + 1).map((f) => f.speed));
    const pc = (v: number) => `${Math.round((v / (mid || 1)) * 100)}%`;
    if (m.startEase === "none" || m.endEase === "none") {
      const both = m.startEase === "none" && m.endEase === "none";
      flags.push({
        kind: "no ease",
        frames: both ? [m.from, m.to] : m.startEase === "none" ? [m.from] : [m.to],
        reading: `${span} ${both ? "starts and stops at full speed" : m.startEase === "none" ? "starts at full speed" : "stops at full speed"} (no ease): its ${both ? `first and last moving frames run at ${pc(frames[i0].speed)} and ${pc(frames[i1].speed)}` : m.startEase === "none" ? `first moving frame runs at ${pc(frames[i0].speed)}` : `last moving frame runs at ${pc(frames[i1].speed)}`} of its middle speed. Ease it, unless a mechanical, constant move is meant.`,
      });
    }
    const movePeak = m.peakSpeed;
    for (let j = i0 + 2; j <= i1 - 1; j++) {
      const a = frames[j - 1].speed;
      const b = frames[j].speed;
      const lo = Math.min(a, b);
      if (Math.abs(b - a) >= o.jumpShare * movePeak && (lo <= 0 || Math.max(a, b) / lo >= o.jumpRatio))
        flags.push({
          kind: "speed jump",
          frames: [frames[j - 1].frame, frames[j].frame],
          reading: `${span} jumps in speed between frames ${frames[j - 1].frame} and ${frames[j].frame}: ${rnd(a, 10)} to ${rnd(b, 10)} units a second (top ${rnd(movePeak, 10)}). Look at the keys there.`,
        });
    }
    if (m.overshoot)
      flags.push({
        kind: "overshoot",
        frames: [m.overshoot.frame],
        reading: `${span} overshoots by ${Math.round(m.overshoot.share * 100)}% of its distance (${rnd(m.overshoot.amount, 10)} units, at frame ${m.overshoot.frame})${m.settle ? ` and takes ${m.settle.frames} frames to settle within ${o.settleWithin * 100}% (frames ${m.settle.from} to ${m.settle.at})` : ""}. Whether that is the bounce you want is a judgment.`,
      });
  }
  const problems = flags.filter((f) => f.kind !== "overshoot");
  return {
    frames,
    moves,
    flags,
    reading:
      `${moves.length} move${moves.length === 1 ? "" : "s"} over frames ${frames[0].frame} to ${frames[frames.length - 1].frame}; ` +
      (problems.length ? problems.map((f) => f.reading).join(" ") : "every move eases in and out, with no jump in speed.") +
      flags
        .filter((f) => f.kind === "overshoot")
        .map((f) => ` ${f.reading}`)
        .join(""),
  };
}

/** A small graph of the curve: each value channel scaled to its range (light), speed (orange), moves shaded, flags in red. */
export function curveGraph(
  r: CurveReport,
  size: { width: number; height: number } = { width: 480, height: 160 },
): { width: number; height: number; rgb: Float64Array } {
  const { width: W, height: H } = size;
  const rgb = new Float64Array(W * H * 3);
  const put = (x: number, y: number, c: number[]) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const p = (Math.round(y) * W + Math.round(x)) * 3;
    rgb[p] = c[0];
    rgb[p + 1] = c[1];
    rgb[p + 2] = c[2];
  };
  for (let i = 0; i < W * H; i++) rgb.set([0.08, 0.08, 0.1], i * 3);
  const n = r.frames.length;
  if (!n) return { width: W, height: H, rgb };
  const pad = 6;
  const X = (i: number) => pad + ((W - 2 * pad) * i) / Math.max(1, n - 1);
  const Y = (u: number) => H - pad - (H - 2 * pad) * u;
  const first = r.frames[0].frame;
  for (const m of r.moves)
    for (let x = Math.floor(X(m.from - first)); x <= Math.ceil(X(m.to - first)); x++)
      for (let y = pad; y < H - pad; y++) put(x, y, [0.14, 0.14, 0.18]);
  const line = (vals: number[], c: number[]) => {
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const s = hi - lo > 1e-12 ? hi - lo : 1;
    for (let i = 1; i < n; i++) {
      const x0 = X(i - 1);
      const x1 = X(i);
      const y0 = Y((vals[i - 1] - lo) / s);
      const y1 = Y((vals[i] - lo) / s);
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
      for (let k = 0; k <= steps; k++) put(x0 + ((x1 - x0) * k) / steps, y0 + ((y1 - y0) * k) / steps, c);
    }
  };
  const dims = r.frames[0].value.length;
  for (let d = 0; d < dims; d++) line(r.frames.map((f) => f.value[d] ?? 0), [0.85 - 0.2 * d, 0.85, 0.9]);
  line(r.frames.map((f) => f.speed), [1, 0.55, 0.15]);
  for (const f of r.flags.filter((x) => x.kind !== "overshoot"))
    for (const fr of f.frames) for (let y = pad; y < pad + 10; y++) put(X(fr - first), y, [0.95, 0.2, 0.2]);
  return { width: W, height: H, rgb };
}

// ---------------------------------------------------------------------------
// Sound: onsets from loudness, timing files, and how far events sit from markers
// ---------------------------------------------------------------------------

/**
 * Frames where loudness (Convert Audio to Keyframes' amplitude per frame)
 * rises past `share` of the way from its median to its top, at least `gap`
 * frames after the last. On three tone bursts at 0.5, 1.2 and 2.0 s it read
 * frames 15, 36 and 60.
 */
export function soundOnsets(
  values: number[],
  fps: number,
  opts: { share?: number; gap?: number } = {},
): Array<{ frame: number; time: number; level: number }> {
  const share = opts.share ?? 0.3;
  const gap = opts.gap ?? 3;
  const top = Math.max(0, ...values);
  if (top <= 1e-6) return [];
  const floor = median(values);
  const thr = floor + share * (top - floor);
  const out: Array<{ frame: number; time: number; level: number }> = [];
  let last = -Infinity;
  for (let f = 0; f < values.length; f++) {
    if (values[f] >= thr && (f === 0 || values[f - 1] < thr) && f - last >= gap) {
      out.push({ frame: f, time: f / fps, level: rnd(values[f]) });
      last = f;
    }
  }
  return out;
}

/** Word or beat times from a timing file: a JSON list ({ word|w|text|label, start|time|t seconds, or frame }) or CSV (time,label). */
export function parseTiming(text: string, fps: number): Array<{ time: number; label: string }> {
  const t = text.trim();
  if (t.startsWith("[") || t.startsWith("{")) {
    const j = JSON.parse(t);
    const list: unknown[] = Array.isArray(j) ? j : (j.words ?? j.markers ?? j.beats ?? []);
    return list.map((e, i) => {
      const x = (typeof e === "number" ? { time: e } : e) as Record<string, unknown>;
      const label = String(x.word ?? x.w ?? x.text ?? x.label ?? x.name ?? "");
      const sec = [x.start, x.time, x.t].find((v) => typeof v === "number") as number | undefined;
      const time = sec ?? (typeof x.frame === "number" ? x.frame / fps : undefined);
      if (time === undefined) throw new Error(`entry ${i + 1} of the timing file has no time (start, time or t in seconds, or frame)`);
      return { time, label };
    });
  }
  const out: Array<{ time: number; label: string }> = [];
  for (const line of t.split(/\r?\n/)) {
    const [a, ...rest] = line.split(",");
    const time = Number(a);
    if (!line.trim() || !Number.isFinite(time)) continue;
    out.push({ time, label: rest.join(",").trim() });
  }
  if (!out.length) throw new Error("no time,label lines in the timing file");
  return out;
}

/**
 * Where picture meets sound: the detectability thresholds in ITU-R BT.1359
 * are sound 45 ms early and 125 ms late against the picture; at 30 fps, a
 * picture event 2 frames after its sound, or 4 frames before it, is flagged.
 */
export const SYNC_DEFAULTS = { lateFrames: 2, earlyFrames: 4 };

export interface SyncEvent {
  name: string;
  time: number;
  frames: number;
  marker: { time: number; label: string } | null;
}

/** Each event's distance in frames to the nearest marker; late (after the marker) and early (before) beyond the limits are flagged. */
export function syncReport(
  events: Array<{ name: string; time: number }>,
  markers: Array<{ time: number; label: string }>,
  fps: number,
  opts: Partial<typeof SYNC_DEFAULTS> = {},
): { events: SyncEvent[]; flags: Array<SyncEvent & { reading: string }>; reading: string } {
  const o = {
    lateFrames: opts.lateFrames ?? SYNC_DEFAULTS.lateFrames,
    earlyFrames: opts.earlyFrames ?? SYNC_DEFAULTS.earlyFrames,
  };
  if (!markers.length)
    return { events: [], flags: [], reading: "No markers to compare with: add word or beat markers first (sound.markers)." };
  const out: SyncEvent[] = events.map((e) => {
    let best = markers[0];
    for (const m of markers) if (Math.abs(m.time - e.time) < Math.abs(best.time - e.time)) best = m;
    return { name: e.name, time: rnd(e.time, 1e4), frames: Math.round((e.time - best.time) * fps), marker: best };
  });
  const flags = out
    .filter((e) => e.frames >= o.lateFrames || e.frames <= -o.earlyFrames)
    .map((e) => {
      const n = Math.abs(e.frames);
      return {
        ...e,
        reading: `${e.name} is ${n} frame${n === 1 ? "" : "s"} ${e.frames > 0 ? "after" : "before"} the nearest marker (${e.marker?.label ? `'${e.marker.label}' ` : ""}at ${rnd(e.marker!.time, 1000)} s): ${e.frames > 0 ? "late" : "early"} (flagged from ${e.frames > 0 ? o.lateFrames : o.earlyFrames} frames ${e.frames > 0 ? "after" : "before"}).`,
      };
    });
  return {
    events: out,
    flags,
    reading: flags.length
      ? flags.map((f) => f.reading).join(" ")
      : `All ${out.length} events are within ${o.lateFrames - 1} frame${o.lateFrames - 1 === 1 ? "" : "s"} after and ${o.earlyFrames - 1} before their nearest marker.`,
  };
}
