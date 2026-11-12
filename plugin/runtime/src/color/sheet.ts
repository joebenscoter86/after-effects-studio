// Frame inspection for the render tool: tiling several captures into one
// labelled contact sheet, and measuring a capture (edge bands, content
// bounds, coverage) so a motion check does not need a human — or an image
// model — to spot a black bar or an element that slid off frame.
//
// Pure Node, zero dependencies: pixels come from png16.decodePng, and the
// only text ever drawn is a frame index and a time, which a 5×7 bitmap
// font covers.

import type { DecodedPng } from "./png16.js";

export type Rgb = [number, number, number];

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

export interface EdgeBand {
  /** Rows (top/bottom) or columns (left/right) of one uniform color at that edge. */
  width: number;
  /** transparent = alpha 0 all along the band; color = one opaque color; none = no uniform band. */
  kind: "transparent" | "color" | "none";
  color: Rgb | null;
}

export interface FrameAnalysis {
  width: number;
  height: number;
  /** Mean of the capture's RGB (before any color conversion). */
  meanRgb: Rgb;
  /** True when every pixel is one color (an empty or fully covered frame). */
  uniform: boolean;
  /** What "nothing" looks like in this frame: alpha 0 when there is alpha, else the corner color. */
  background: { kind: "transparent" | "color"; color: Rgb | null };
  /** Bounding box of every pixel that is not background, or null when the frame is all background. */
  contentBounds: { left: number; top: number; width: number; height: number } | null;
  /** Fraction (0..1) of pixels that are not background. */
  coverage: number;
  edges: { top: EdgeBand; bottom: EdgeBand; left: EdgeBand; right: EdgeBand };
}

/** Per-channel tolerance for "same color": two 8-bit steps. */
const TOL = 2 / 255;

function px(img: DecodedPng, x: number, y: number): Rgb {
  const i = (y * img.width + x) * 3;
  return [img.rgb[i], img.rgb[i + 1], img.rgb[i + 2]];
}

function same(a: Rgb, b: Rgb): boolean {
  return (
    Math.abs(a[0] - b[0]) <= TOL && Math.abs(a[1] - b[1]) <= TOL && Math.abs(a[2] - b[2]) <= TOL
  );
}

function isBackground(img: DecodedPng, x: number, y: number, bg: Rgb | null): boolean {
  if (img.alpha) return img.alpha[y * img.width + x] <= TOL;
  return bg !== null && same(px(img, x, y), bg);
}

/** The color most of the four corners share (ties go to the top-left). */
function cornerColor(img: DecodedPng): Rgb {
  const corners: Rgb[] = [
    px(img, 0, 0),
    px(img, img.width - 1, 0),
    px(img, 0, img.height - 1),
    px(img, img.width - 1, img.height - 1),
  ];
  let best = corners[0];
  let bestCount = 0;
  for (const c of corners) {
    const count = corners.filter((o) => same(o, c)).length;
    if (count > bestCount) {
      best = c;
      bestCount = count;
    }
  }
  return best;
}

/** True when every pixel along one row (or column) is background-like or one color. */
function lineUniform(
  img: DecodedPng,
  fixed: number,
  horizontal: boolean,
): { uniform: boolean; transparent: boolean; color: Rgb } {
  const n = horizontal ? img.width : img.height;
  const first = horizontal ? px(img, 0, fixed) : px(img, fixed, 0);
  let transparent = img.alpha !== undefined;
  for (let i = 0; i < n; i++) {
    const x = horizontal ? i : fixed;
    const y = horizontal ? fixed : i;
    if (transparent && (img.alpha as Float64Array)[y * img.width + x] > TOL) transparent = false;
    if (!same(px(img, x, y), first)) return { uniform: false, transparent: false, color: first };
  }
  return { uniform: true, transparent, color: first };
}

function edgeBand(img: DecodedPng, side: "top" | "bottom" | "left" | "right"): EdgeBand {
  const horizontal = side === "top" || side === "bottom";
  const n = horizontal ? img.height : img.width;
  let width = 0;
  let color: Rgb | null = null;
  let transparent = true;
  for (let i = 0; i < n; i++) {
    const fixed = side === "top" || side === "left" ? i : n - 1 - i;
    const line = lineUniform(img, fixed, horizontal);
    if (!line.uniform) break;
    if (color === null) color = line.color;
    else if (!same(color, line.color)) break;
    if (!line.transparent) transparent = false;
    width++;
  }
  if (width === 0) return { width: 0, kind: "none", color: null };
  return { width, kind: transparent && img.alpha ? "transparent" : "color", color };
}

/** Measure a capture. Works on the raw decode so alpha is still there. */
export function analyzeFrame(img: DecodedPng): FrameAnalysis {
  const { width, height } = img;
  const bgColor = img.alpha ? null : cornerColor(img);
  const sum: Rgb = [0, 0, 0];
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let content = 0;
  const first = px(img, 0, 0);
  let uniform = true;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      sum[0] += img.rgb[i];
      sum[1] += img.rgb[i + 1];
      sum[2] += img.rgb[i + 2];
      if (uniform && !same(px(img, x, y), first)) uniform = false;
      if (!isBackground(img, x, y, bgColor)) {
        content++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const total = width * height;
  return {
    width,
    height,
    meanRgb: [sum[0] / total, sum[1] / total, sum[2] / total],
    uniform,
    background: img.alpha
      ? { kind: "transparent", color: null }
      : { kind: "color", color: bgColor },
    contentBounds:
      content === 0
        ? null
        : { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 },
    coverage: content / total,
    edges: {
      top: edgeBand(img, "top"),
      bottom: edgeBand(img, "bottom"),
      left: edgeBand(img, "left"),
      right: edgeBand(img, "right"),
    },
  };
}

// ---------------------------------------------------------------------------
// Transparency: what a transparent pixel is shown against
// ---------------------------------------------------------------------------

/** The checkerboard drawn behind transparency: mid greys, so black and white both read. */
export const CHECKERBOARD: { size: number; light: Rgb; dark: Rgb } = {
  size: 16,
  light: [0.8, 0.8, 0.8],
  dark: [0.6, 0.6, 0.6],
};

export type Backdrop = { kind: "color"; color: Rgb } | { kind: "checkerboard" };

/**
 * The colour under a capture's comp background. saveFrameToPng writes an
 * alpha channel, but its RGB is already laid over the comp background colour
 * (measured live, AE 27.0, 8 and 16 bpc): captured = colour·a + bg·(1 − a).
 * So colour = (captured − bg·(1 − a)) / a, clamped to 0..1, and 0 where
 * a = 0 (nothing covers the pixel, so there is no colour to recover). On a
 * black background this is un-premultiplying. Returns a new RGB buffer; an
 * image without alpha comes back as an unchanged copy.
 */
export function unmatte(img: DecodedPng, bg: Rgb): Float64Array {
  const out = Float64Array.from(img.rgb);
  const alpha = img.alpha;
  if (!alpha) return out;
  for (let p = 0; p < alpha.length; p++) {
    const a = alpha[p];
    if (a >= 1) continue;
    const i = p * 3;
    for (let c = 0; c < 3; c++) {
      out[i + c] = a <= 0 ? 0 : Math.min(1, Math.max(0, (out[i + c] - bg[c] * (1 - a)) / a));
    }
  }
  return out;
}

/**
 * Composite straight (unassociated) colour over a backdrop:
 * out = rgb·a + backdrop·(1 − a). Returns a new RGB buffer; an image without
 * alpha comes back as an unchanged copy. A raw capture is not straight (see
 * unmatte): take its comp background out first.
 */
export function flattenOver(img: DecodedPng, backdrop: Backdrop): Float64Array {
  const out = Float64Array.from(img.rgb);
  const alpha = img.alpha;
  if (!alpha) return out;
  const { width, height } = img;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const a = alpha[p];
      if (a >= 1) continue;
      const bg =
        backdrop.kind === "color"
          ? backdrop.color
          : (Math.floor(x / CHECKERBOARD.size) + Math.floor(y / CHECKERBOARD.size)) % 2 === 0
            ? CHECKERBOARD.light
            : CHECKERBOARD.dark;
      const i = p * 3;
      out[i] = out[i] * a + bg[0] * (1 - a);
      out[i + 1] = out[i + 1] * a + bg[1] * (1 - a);
      out[i + 2] = out[i + 2] * a + bg[2] * (1 - a);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Reading colour: regions, histograms, differences between frames
// ---------------------------------------------------------------------------

/** A named point (no width/height: one pixel) or rectangle, in capture pixels. */
export interface RegionSpec {
  name: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AlphaStats {
  mean: number;
  min: number;
  max: number;
  /** Shares (0..1) of the region's pixels that are fully opaque, partly covered, fully transparent. */
  opaqueShare: number;
  partialShare: number;
  transparentShare: number;
}

export interface RegionStats {
  name: string;
  /** The rectangle actually measured, after clipping to the frame. */
  rect: PixelRect;
  clipped: boolean;
  pixels: number;
  /** Per channel [r, g, b], 0..1, rounded to 4 decimals. */
  mean: Rgb;
  min: Rgb;
  max: Rgb;
  /** Null when the image has no alpha channel. */
  alpha: AlphaStats | null;
}

export interface RegionError {
  name: string;
  error: string;
}

const r4 = (v: number) => Math.round(v * 1e4) / 1e4;
const r4rgb = (v: Rgb): Rgb => [r4(v[0]), r4(v[1]), r4(v[2])];

/** Clip a region to the frame; null when nothing of it is inside. */
export function clipRegion(
  img: { width: number; height: number },
  region: RegionSpec,
): { rect: PixelRect; clipped: boolean } | null {
  const x0 = Math.floor(region.x);
  const y0 = Math.floor(region.y);
  const x1 = x0 + Math.max(1, Math.floor(region.width ?? 1));
  const y1 = y0 + Math.max(1, Math.floor(region.height ?? 1));
  const cx0 = Math.max(0, x0);
  const cy0 = Math.max(0, y0);
  const cx1 = Math.min(img.width, x1);
  const cy1 = Math.min(img.height, y1);
  if (cx1 <= cx0 || cy1 <= cy0) return null;
  return {
    rect: { x: cx0, y: cy0, width: cx1 - cx0, height: cy1 - cy0 },
    clipped: cx0 !== x0 || cy0 !== y0 || cx1 !== x1 || cy1 !== y1,
  };
}

function outside(img: DecodedPng, region: RegionSpec): RegionError {
  return { name: region.name, error: `region is outside the ${img.width}×${img.height} frame` };
}

/** Mean, minimum and maximum per channel, and alpha coverage, for each region. */
export function sampleRegions(
  img: DecodedPng,
  regions: RegionSpec[],
): Array<RegionStats | RegionError> {
  return regions.map((region) => {
    const clip = clipRegion(img, region);
    if (!clip) return outside(img, region);
    const { rect } = clip;
    const sum: Rgb = [0, 0, 0];
    const min: Rgb = [Infinity, Infinity, Infinity];
    const max: Rgb = [-Infinity, -Infinity, -Infinity];
    let aSum = 0;
    let aMin = Infinity;
    let aMax = -Infinity;
    let opaque = 0;
    let transparent = 0;
    for (let y = rect.y; y < rect.y + rect.height; y++) {
      for (let x = rect.x; x < rect.x + rect.width; x++) {
        const p = y * img.width + x;
        for (let c = 0; c < 3; c++) {
          const v = img.rgb[p * 3 + c];
          sum[c] += v;
          if (v < min[c]) min[c] = v;
          if (v > max[c]) max[c] = v;
        }
        if (img.alpha) {
          const a = img.alpha[p];
          aSum += a;
          if (a < aMin) aMin = a;
          if (a > aMax) aMax = a;
          if (a >= 1 - TOL) opaque++;
          else if (a <= TOL) transparent++;
        }
      }
    }
    const n = rect.width * rect.height;
    return {
      name: region.name,
      rect,
      clipped: clip.clipped,
      pixels: n,
      mean: r4rgb([sum[0] / n, sum[1] / n, sum[2] / n]),
      min: r4rgb(min),
      max: r4rgb(max),
      alpha: img.alpha
        ? {
            mean: r4(aSum / n),
            min: r4(aMin),
            max: r4(aMax),
            opaqueShare: r4(opaque / n),
            partialShare: r4((n - opaque - transparent) / n),
            transparentShare: r4(transparent / n),
          }
        : null,
    };
  });
}

export interface FrameHistogram {
  bins: number;
  pixels: number;
  /** Pixel counts per bin, bin i covering [i/bins, (i+1)/bins); 1.0 lands in the last bin. */
  r: number[];
  g: number[];
  b: number[];
  /** Present only when the image has an alpha channel. */
  a?: number[];
}

/** Whole-frame per-channel histogram with `bins` equal-width bins over 0..1. */
export function histogramOf(img: DecodedPng, bins: number): FrameHistogram {
  const n = img.width * img.height;
  const counts = [0, 1, 2].map(() => Array.from({ length: bins }, () => 0));
  const aCounts = img.alpha ? Array.from({ length: bins }, () => 0) : undefined;
  const bin = (v: number) => Math.min(bins - 1, Math.max(0, Math.floor(v * bins)));
  for (let p = 0; p < n; p++) {
    for (let c = 0; c < 3; c++) counts[c][bin(img.rgb[p * 3 + c])]++;
    if (aCounts && img.alpha) aCounts[bin(img.alpha[p])]++;
  }
  return {
    bins,
    pixels: n,
    r: counts[0],
    g: counts[1],
    b: counts[2],
    ...(aCounts ? { a: aCounts } : {}),
  };
}

export interface RegionDiff {
  name: string;
  rect: PixelRect;
  clipped: boolean;
  pixels: number;
  /** Mean of (to − from) per channel: the region's average shift, signed. */
  meanDelta: Rgb;
  /** Mean of |to − from| per channel: how much its pixels changed. */
  meanAbsDelta: Rgb;
  maxAbsDelta: Rgb;
  /** Null unless both frames have an alpha channel. */
  alpha: { meanDelta: number; meanAbsDelta: number; maxAbsDelta: number } | null;
}

/** Per-region differences between two frames of the same size, `to` minus `from`. */
export function compareRegions(
  from: DecodedPng,
  to: DecodedPng,
  regions: RegionSpec[],
): Array<RegionDiff | RegionError> {
  if (from.width !== to.width || from.height !== to.height) {
    throw new Error(
      `cannot compare frames of different size (${from.width}×${from.height} vs ${to.width}×${to.height})`,
    );
  }
  const withAlpha = from.alpha !== undefined && to.alpha !== undefined;
  return regions.map((region) => {
    const clip = clipRegion(from, region);
    if (!clip) return outside(from, region);
    const { rect } = clip;
    const delta: Rgb = [0, 0, 0];
    const absSum: Rgb = [0, 0, 0];
    const absMax: Rgb = [0, 0, 0];
    let aDelta = 0;
    let aAbs = 0;
    let aMax = 0;
    for (let y = rect.y; y < rect.y + rect.height; y++) {
      for (let x = rect.x; x < rect.x + rect.width; x++) {
        const p = y * from.width + x;
        for (let c = 0; c < 3; c++) {
          const d = to.rgb[p * 3 + c] - from.rgb[p * 3 + c];
          delta[c] += d;
          absSum[c] += Math.abs(d);
          if (Math.abs(d) > absMax[c]) absMax[c] = Math.abs(d);
        }
        if (withAlpha) {
          const d = (to.alpha as Float64Array)[p] - (from.alpha as Float64Array)[p];
          aDelta += d;
          aAbs += Math.abs(d);
          if (Math.abs(d) > aMax) aMax = Math.abs(d);
        }
      }
    }
    const n = rect.width * rect.height;
    return {
      name: region.name,
      rect,
      clipped: clip.clipped,
      pixels: n,
      meanDelta: r4rgb([delta[0] / n, delta[1] / n, delta[2] / n]),
      meanAbsDelta: r4rgb([absSum[0] / n, absSum[1] / n, absSum[2] / n]),
      maxAbsDelta: r4rgb(absMax),
      alpha: withAlpha
        ? { meanDelta: r4(aDelta / n), meanAbsDelta: r4(aAbs / n), maxAbsDelta: r4(aMax) }
        : null,
    };
  });
}

/** "#rrggbb" for an RGB triple in 0..1, as an 8-bit file stores it. */
export function rgbHex(rgb: Rgb): string {
  return `#${rgb
    .map((v) =>
      Math.round(Math.min(1, Math.max(0, v)) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

// ---------------------------------------------------------------------------
// Contact sheet
// ---------------------------------------------------------------------------

export interface SheetOptions {
  /** Tiles per row (default: ceil(sqrt(n))). */
  columns?: number;
  /** Width of each tile in px; frames are never upscaled (default 480). */
  thumbWidth?: number;
  /** One label per frame, drawn above its tile. */
  labels?: string[];
  gap?: number;
  background?: Rgb;
}

export interface SheetImage {
  width: number;
  height: number;
  rgb: Float64Array;
  columns: number;
  rows: number;
  thumbWidth: number;
  thumbHeight: number;
}

/** Area-averaging downscale to exactly tw×th. */
export function resample(img: DecodedPng, tw: number, th: number): Float64Array {
  const out = new Float64Array(tw * th * 3);
  const counts = new Float64Array(tw * th);
  for (let y = 0; y < img.height; y++) {
    const ty = Math.min(th - 1, Math.floor((y * th) / img.height));
    for (let x = 0; x < img.width; x++) {
      const tx = Math.min(tw - 1, Math.floor((x * tw) / img.width));
      const si = (y * img.width + x) * 3;
      const di = (ty * tw + tx) * 3;
      out[di] += img.rgb[si];
      out[di + 1] += img.rgb[si + 1];
      out[di + 2] += img.rgb[si + 2];
      counts[ty * tw + tx]++;
    }
  }
  for (let i = 0; i < tw * th; i++) {
    const c = counts[i] || 1;
    out[i * 3] /= c;
    out[i * 3 + 1] /= c;
    out[i * 3 + 2] /= c;
  }
  return out;
}

// 5×7 glyphs for the only text the sheets ever carry: "#<index> <time>s" on the
// contact sheet, "#<from>><to> <change> x<gain> !" on the diff sheet, and
// "<time>s <kind>" (lowercase words such as "pop", "frozen", "off-right") on
// the ae_check_comp sheet.
const GLYPHS: Record<string, string[]> = {
  "0": [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["#####", "...#.", "..#..", "...#.", "....#", "#...#", ".###."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."],
  ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
  "-": [".....", ".....", ".....", "#####", ".....", ".....", "....."],
  ">": [".#...", "..#..", "...#.", "....#", "...#.", "..#..", ".#..."],
  x: [".....", ".....", "#...#", ".#.#.", "..#..", ".#.#.", "#...#"],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  "#": [".#.#.", ".#.#.", "#####", ".#.#.", "#####", ".#.#.", ".#.#."],
  s: [".....", ".....", ".####", "#....", ".###.", "....#", "####."],
  f: ["..##.", ".#...", "###..", ".#...", ".#...", ".#...", ".#..."],
  a: [".....", ".....", ".###.", "....#", ".####", "#...#", ".####"],
  b: ["#....", "#....", "####.", "#...#", "#...#", "#...#", "####."],
  c: [".....", ".....", ".###.", "#....", "#....", "#...#", ".###."],
  d: ["....#", "....#", ".####", "#...#", "#...#", "#...#", ".####"],
  e: [".....", ".....", ".###.", "#...#", "#####", "#....", ".###."],
  g: [".....", ".....", ".####", "#...#", "#...#", "#...#", ".####", "....#", ".###."],
  h: ["#....", "#....", "####.", "#...#", "#...#", "#...#", "#...#"],
  i: ["..#..", ".....", ".##..", "..#..", "..#..", "..#..", ".###."],
  j: ["...#.", ".....", "..##.", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  k: ["#....", "#....", "#..#.", "#.#..", "##...", "#.#..", "#..#."],
  l: [".##..", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
  m: [".....", ".....", "##.#.", "#.#.#", "#.#.#", "#...#", "#...#"],
  n: [".....", ".....", "####.", "#...#", "#...#", "#...#", "#...#"],
  o: [".....", ".....", ".###.", "#...#", "#...#", "#...#", ".###."],
  p: [".....", ".....", "####.", "#...#", "#...#", "#...#", "####.", "#....", "#...."],
  q: [".....", ".....", ".####", "#...#", "#...#", "#...#", ".####", "....#", "....#"],
  r: [".....", ".....", "#.##.", "##..#", "#....", "#....", "#...."],
  t: [".#...", ".#...", "###..", ".#...", ".#...", ".#..#", "..##."],
  u: [".....", ".....", "#...#", "#...#", "#...#", "#..##", ".##.#"],
  v: [".....", ".....", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  w: [".....", ".....", "#...#", "#...#", "#.#.#", "#.#.#", ".#.#."],
  y: [".....", ".....", "#...#", "#...#", "#...#", "#...#", ".####", "....#", ".###."],
  z: [".....", ".....", "#####", "...#.", "..#..", ".#...", "#####"],
  "+": [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
};
const GLYPH_W = 5;
/** Rows from the top of a glyph to its baseline; g, j, p, q and y add two rows below it. */
const GLYPH_H = 7;
const FONT_SCALE = 2;
// Text starts 2 px into the strip: 7 rows to the baseline plus 2 descender rows
// end 18 px down, inside the 20 px strip.
const LABEL_H = GLYPH_H * FONT_SCALE + 6;
/** Width of one label character on a sheet, px: labels longer than a tile is wide run into the next tile. */
export const LABEL_CHAR_PX = (GLYPH_W + 1) * FONT_SCALE;

function drawText(
  rgb: Float64Array,
  width: number,
  x0: number,
  y0: number,
  text: string,
  color: Rgb,
): void {
  let cx = x0;
  for (const ch of text) {
    const glyph = GLYPHS[ch] ?? GLYPHS[" "];
    for (let gy = 0; gy < glyph.length; gy++) {
      for (let gx = 0; gx < GLYPH_W; gx++) {
        if (glyph[gy][gx] !== "#") continue;
        for (let sy = 0; sy < FONT_SCALE; sy++) {
          for (let sx = 0; sx < FONT_SCALE; sx++) {
            const x = cx + gx * FONT_SCALE + sx;
            const y = y0 + gy * FONT_SCALE + sy;
            const i = (y * width + x) * 3;
            rgb[i] = color[0];
            rgb[i + 1] = color[1];
            rgb[i + 2] = color[2];
          }
        }
      }
    }
    cx += (GLYPH_W + 1) * FONT_SCALE;
  }
}

/** Tile frames into one image with a label strip above each tile. */
export function composeContactSheet(frames: DecodedPng[], opts: SheetOptions = {}): SheetImage {
  if (frames.length === 0) throw new Error("contact sheet needs at least one frame");
  const gap = opts.gap ?? 8;
  const bg = opts.background ?? [0.12, 0.12, 0.12];
  const columns = Math.max(
    1,
    Math.min(frames.length, opts.columns ?? Math.ceil(Math.sqrt(frames.length))),
  );
  const rows = Math.ceil(frames.length / columns);
  const srcW = Math.max(...frames.map((f) => f.width));
  const srcH = Math.max(...frames.map((f) => f.height));
  const thumbWidth = Math.max(16, Math.min(opts.thumbWidth ?? 480, srcW));
  const thumbHeight = Math.max(1, Math.round((srcH * thumbWidth) / srcW));
  const cellW = thumbWidth;
  const cellH = LABEL_H + thumbHeight;
  const width = gap + columns * (cellW + gap);
  const height = gap + rows * (cellH + gap);
  const rgb = new Float64Array(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    rgb[i * 3] = bg[0];
    rgb[i * 3 + 1] = bg[1];
    rgb[i * 3 + 2] = bg[2];
  }
  for (const [n, frame] of frames.entries()) {
    const col = n % columns;
    const row = Math.floor(n / columns);
    const x0 = gap + col * (cellW + gap);
    const y0 = gap + row * (cellH + gap);
    // Keep each frame's own aspect; a smaller frame just leaves background.
    const tw = Math.max(1, Math.min(thumbWidth, Math.round((frame.width * thumbWidth) / srcW)));
    const th = Math.max(1, Math.min(thumbHeight, Math.round((frame.height * tw) / frame.width)));
    const thumb = resample(frame, tw, th);
    for (let y = 0; y < th; y++) {
      for (let x = 0; x < tw; x++) {
        const si = (y * tw + x) * 3;
        const di = ((y0 + LABEL_H + y) * width + (x0 + x)) * 3;
        rgb[di] = thumb[si];
        rgb[di + 1] = thumb[si + 1];
        rgb[di + 2] = thumb[si + 2];
      }
    }
    const label = opts.labels?.[n] ?? `#${n}`;
    drawText(rgb, width, x0 + 2, y0 + 2, label, [0.95, 0.95, 0.95]);
  }
  return { width, height, rgb, columns, rows, thumbWidth, thumbHeight };
}

/** Label text for a frame: "#3 1.500s" — only characters the font has. */
export function frameLabel(index: number, time: number | undefined): string {
  return time === undefined ? `#${index}` : `#${index} ${time.toFixed(3)}s`;
}

// ---------------------------------------------------------------------------
// Sitting in the scene: grain, edge sharpness, black and white points and
// colour of named regions (the `look` option of ae_render_frame)
// ---------------------------------------------------------------------------

/** What a region is, for the readings: a neutral surface, skin, the plate, or the element laid over it. */
export type LookRole = "neutral" | "skin" | "plate" | "element";
export const LOOK_ROLES: LookRole[] = ["neutral", "skin", "plate", "element"];

export interface LookRegionSpec extends RegionSpec {
  role?: LookRole;
}

export interface LookArgs {
  regions: LookRegionSpec[];
  /** Element regions measured against plate regions, by name. */
  pairs?: Array<{ element: string; plate: string }>;
  /** Smallest luma step (0..1) counted as an edge. Default 0.1. */
  minContrast?: number;
  /** An element whose grain or edge width is within this share of the plate's matches it. Default 0.25. */
  grainTolerance?: number;
  sharpnessTolerance?: number;
  /** The background the subject was cut from (a wall's mean colour, 0..1): the soft edge's colour is read against it. */
  background?: Rgb | number[];
}

/**
 * Starting points, not measured judgments: a quarter either way for grain and
 * edge width; 0.02 (about five 8-bit steps) for black and white points; a
 * CIELAB a* or b* of 2 as the smallest cast called a cast (a colour
 * difference of about 2 is near the threshold of seeing one side by side).
 */
export const LOOK_DEFAULTS = {
  minContrast: 0.1,
  grainTolerance: 0.25,
  sharpnessTolerance: 0.25,
  levelTolerance: 0.02,
  castAbove: 2,
  /** Pixels at or above this alpha count as the element when the frame has alpha. */
  opaque: 0.98,
  /** Half-length of the profile read across an edge, px: edges up to about 10 px wide (sigma 4). */
  edgeReach: 12,
  /** Profiles are the mean of this many neighbouring lines. */
  edgeLines: 5,
  /** Skin hue angle (CIELAB h, degrees) commonly reported for skin of many tones under neutral light. */
  skinHue: [40, 65] as [number, number],
};

export interface Lab {
  L: number;
  a: number;
  b: number;
  chroma: number;
  /** CIELAB hue angle h, degrees 0..360 (0 red-magenta, 90 yellow, 180 green, 270 blue). */
  hue: number;
}

const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const labF = (t: number) => (t > (6 / 29) ** 3 ? Math.cbrt(t) : t / (3 * (6 / 29) ** 2) + 4 / 29);

/** CIELAB (D65) of an sRGB colour given as display values 0..1. */
export function labOf(rgb: Rgb): Lab {
  const [r, g, b] = rgb.map((v) => srgbToLinear(Math.min(1, Math.max(0, v))));
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const fx = labF(x);
  const fy = labF(y);
  const fz = labF(z);
  const L = 116 * fy - 16;
  const A = 500 * (fx - fy);
  const B = 200 * (fy - fz);
  const hue = ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
  const r2 = (v: number) => Math.round(v * 100) / 100;
  return {
    L: r2(L),
    a: r2(A),
    b: r2(B),
    chroma: r2(Math.hypot(A, B)),
    hue: Math.round(hue * 10) / 10,
  };
}

const luma = (c: Rgb | number[]) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

/**
 * Per-channel gains on the display values that make `rgb` neutral at its
 * own luma: equal values read a* = b* = 0 whatever the encoding.
 */
export function neutralGains(rgb: Rgb): Rgb {
  const k = luma(rgb);
  return rgb.map((v) => (v > 0 ? k / v : 1)) as Rgb;
}

/** The region's pixels, straight colour, element pixels only when the frame has alpha. */
export interface LookCrop {
  rect: PixelRect;
  width: number;
  height: number;
  rgb: Float64Array;
  /** 1 where the pixel counts (opaque enough, or no alpha), else 0. */
  use: Uint8Array;
  /** The region's alpha, when the frame has one. */
  alpha?: Float64Array;
}

function cropOf(img: DecodedPng, rect: PixelRect, opaque: number): LookCrop {
  const { x, y, width, height } = rect;
  const rgb = new Float64Array(width * height * 3);
  const use = new Uint8Array(width * height);
  const alpha = img.alpha ? new Float64Array(width * height) : undefined;
  for (let j = 0; j < height; j++)
    for (let i = 0; i < width; i++) {
      const p = (y + j) * img.width + (x + i);
      const q = j * width + i;
      for (let c = 0; c < 3; c++) rgb[q * 3 + c] = img.rgb[p * 3 + c];
      use[q] = !img.alpha || img.alpha[p] >= opaque ? 1 : 0;
      if (alpha && img.alpha) alpha[q] = img.alpha[p];
    }
  return alpha ? { rect, width, height, rgb, use, alpha } : { rect, width, height, rgb, use };
}

/** Every region's crop, for the frame-to-frame grain (and kept small: regions only). */
export function lookCrops(img: DecodedPng, args: LookArgs): Map<string, LookCrop> {
  const out = new Map<string, LookCrop>();
  for (const r of args.regions) {
    const clip = clipRegion(img, r);
    if (clip) out.set(r.name, cropOf(img, clip.rect, LOOK_DEFAULTS.opaque));
  }
  return out;
}

const MAD_TO_SD = 1.4826;

function median(v: number[]): number {
  if (!v.length) return NaN;
  const s = v.slice().sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function percentile(v: number[], p: number): number {
  if (!v.length) return NaN;
  const s = v.slice().sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.round((p / 100) * (s.length - 1))))];
}

/**
 * Standard deviation of `v` with outliers left out: values further from the
 * median than four robust spreads (1.4826 x the median absolute deviation),
 * or three 8-bit steps when that is wider, do not count. The plain median
 * absolute deviation is too coarse on 8-bit values at one or two steps of
 * grain; trimming keeps an edge through the region from counting as grain.
 */
const robustSd = (v: number[]) => {
  const m = median(v);
  const band = Math.max(4 * MAD_TO_SD * median(v.map((x) => Math.abs(x - m))), 3 / 255);
  let n = 0;
  let sum = 0;
  let sq = 0;
  for (const x of v)
    if (Math.abs(x - m) <= band) {
      n++;
      sum += x;
      sq += x * x;
    }
  if (n < 2) return 0;
  const mean = sum / n;
  return Math.sqrt(Math.max(0, sq / n - mean * mean));
};

const steps = (v: number) => Math.round(v * 255 * 100) / 100;

/**
 * Grain in one frame, per channel, in 8-bit steps: the robust spread of each
 * pixel minus the mean of its 3 x 3 neighbourhood, scaled so white grain of
 * standard deviation s reads s. The median absolute deviation keeps an edge
 * through the region from counting as grain.
 */
function spatialGrain(c: LookCrop): Rgb {
  const out: number[] = [];
  const scale = 1 / Math.sqrt(8 / 9);
  for (let ch = 0; ch < 3; ch++) {
    const res: number[] = [];
    for (let y = 1; y < c.height - 1; y += 1)
      for (let x = 1; x < c.width - 1; x += 1) {
        let ok = true;
        let sum = 0;
        for (let dy = -1; dy <= 1 && ok; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const q = (y + dy) * c.width + (x + dx);
            if (!c.use[q]) {
              ok = false;
              break;
            }
            sum += c.rgb[q * 3 + ch];
          }
        if (!ok) continue;
        res.push(c.rgb[(y * c.width + x) * 3 + ch] - sum / 9);
      }
    out.push(res.length ? steps(robustSd(res) * scale) : NaN);
  }
  return out as Rgb;
}

/**
 * Grain between two frames of the same region, per channel, in 8-bit steps:
 * the robust spread of the frame difference over the square root of two. A
 * still element reads 0; grain that changes every frame reads its size.
 */
export function temporalGrain(a: LookCrop, b: LookCrop): Rgb | null {
  if (a.width !== b.width || a.height !== b.height) return null;
  const out: number[] = [];
  for (let ch = 0; ch < 3; ch++) {
    const d: number[] = [];
    for (let q = 0; q < a.use.length; q++)
      if (a.use[q] && b.use[q]) d.push(b.rgb[q * 3 + ch] - a.rgb[q * 3 + ch]);
    if (!d.length) return null;
    out.push(steps(robustSd(d) / Math.SQRT2));
  }
  return out as Rgb;
}

/**
 * Edge width: across each edge with a luma step of at least `minContrast`,
 * the distance from 10% to 90% of the step, read on the mean of `edgeLines`
 * neighbouring lines, horizontally and vertically. A hard step reads about
 * 0.8 px; a Gaussian blur of sigma s about 2.56 s. Median over the edges.
 */
function edgeWidths(
  c: LookCrop,
  minContrast: number,
): { edgeWidth: number | null; p90: number | null; edges: number } {
  const R = LOOK_DEFAULTS.edgeReach;
  const half = LOOK_DEFAULTS.edgeLines >> 1;
  const Y = new Float64Array(c.width * c.height);
  for (let q = 0; q < Y.length; q++)
    Y[q] = c.use[q] ? luma([c.rgb[q * 3], c.rgb[q * 3 + 1], c.rgb[q * 3 + 2]]) : NaN;
  const widths: number[] = [];
  const scan = (along: number, across: number, at: (u: number, v: number) => number) => {
    // `u` runs along the profile, `v` across the lines averaged.
    for (let v = half; v < across - half; v += 2) {
      const prof = (u: number) => {
        let s = 0;
        for (let k = -half; k <= half; k++) s += at(u, v + k);
        return s / (2 * half + 1);
      };
      let u = R;
      while (u < along - R - 1) {
        const d = Math.abs(prof(u + 1) - prof(u));
        const span = prof(u + R + 1) - prof(u - R);
        if (!Number.isFinite(d) || !Number.isFinite(span) || Math.abs(span) < minContrast) {
          u++;
          continue;
        }
        // The steepest step within reach is the edge's centre.
        let best = u;
        let bestD = d;
        for (let w = Math.max(R, u - R); w <= Math.min(along - R - 2, u + R); w++) {
          const dw = Math.abs(prof(w + 1) - prof(w));
          if (dw > bestD) {
            best = w;
            bestD = dw;
          }
        }
        if (best !== u) {
          u = best > u ? best : u + 1;
          continue;
        }
        const p: number[] = [];
        for (let k = -R; k <= R + 1; k++) p.push(prof(u + k));
        const lo = (p[0] + p[1]) / 2;
        const hi = (p[p.length - 1] + p[p.length - 2]) / 2;
        if (Math.abs(hi - lo) >= minContrast * 0.8) {
          const q = p.map((x) => (x - lo) / (hi - lo));
          const cross = (t: number) => {
            for (let k = 1; k < q.length; k++)
              if (q[k] >= t) return k - 1 + (t - q[k - 1]) / (q[k] - q[k - 1] || 1);
            return NaN;
          };
          const wdt = cross(0.9) - cross(0.1);
          if (Number.isFinite(wdt) && wdt > 0) widths.push(wdt);
        }
        u += R;
      }
    }
  };
  scan(c.width, c.height, (u, v) => Y[v * c.width + u]);
  scan(c.height, c.width, (u, v) => Y[u * c.width + v]);
  if (widths.length < 3) return { edgeWidth: null, p90: null, edges: widths.length };
  return {
    edgeWidth: Math.round(median(widths) * 100) / 100,
    p90: Math.round(percentile(widths, 90) * 100) / 100,
    edges: widths.length,
  };
}

export interface LookLevels {
  /** 0.5th and 99.5th percentiles per channel, 0..1. */
  black: Rgb;
  white: Rgb;
  mean: Rgb;
  lumaBlack: number;
  lumaWhite: number;
  lumaMean: number;
}

function levelsOf(c: LookCrop): LookLevels {
  const ch: number[][] = [[], [], []];
  const Ys: number[] = [];
  for (let q = 0; q < c.use.length; q++) {
    if (!c.use[q]) continue;
    const px: Rgb = [c.rgb[q * 3], c.rgb[q * 3 + 1], c.rgb[q * 3 + 2]];
    for (let k = 0; k < 3; k++) ch[k].push(px[k]);
    Ys.push(luma(px));
  }
  const mean = ch.map((v) => v.reduce((s, x) => s + x, 0) / (v.length || 1)) as Rgb;
  return {
    black: r4rgb(ch.map((v) => percentile(v, 0.5)) as Rgb),
    white: r4rgb(ch.map((v) => percentile(v, 99.5)) as Rgb),
    mean: r4rgb(mean),
    lumaBlack: r4(percentile(Ys, 0.5)),
    lumaWhite: r4(percentile(Ys, 99.5)),
    lumaMean: r4(luma(mean)),
  };
}

export interface LookRegionReport {
  name: string;
  role: LookRole | null;
  rect: PixelRect;
  clipped: boolean;
  /** Pixels measured: opaque ones only when the frame has alpha. */
  pixels: number;
  levels: LookLevels;
  /** Per channel, in 8-bit steps (one step is 1/255). */
  grain: { spatial: Rgb };
  /** Median and widest tenth (90th percentile) of the 10 to 90% widths, px. */
  sharpness: { edgeWidth: number | null; p90: number | null; edges: number };
  /** CIELAB of the region's mean colour. */
  colour: Lab;
  /**
   * With alpha: the matte's own edge, read on the alpha (10 to 90% widths, median and widest
   * tenth, px) and the soft band, soft pixels (alpha 0.02 to 0.98) per pixel of outline.
   */
  matte?: {
    edgeWidth: number | null;
    p90: number | null;
    edges: number;
    softBand: number | null;
    /** Share of the region's pixels at alpha 0.99 or more, and the lowest alpha: a region inside the subject reads 1 and 1. */
    opaqueShare: number;
    minAlpha: number;
  };
  /** With alpha: the soft band's colour (straight) against the colour well inside, and against `background`. */
  edgeColour?: {
    band: Lab | null;
    inside: Lab | null;
    difference: number | null;
    towardBackground: number | null;
    reading: string;
  };
  cast?: {
    a: number;
    b: number;
    amount: number;
    toward: string | null;
    gains: Rgb;
    channelMixer: { "Red-Red": number; "Green-Green": number; "Blue-Blue": number };
  };
  reading?: string;
}

const signed = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}`;

/** The direction of a cast from CIELAB a* and b*, larger first; null under `castAbove`. */
function castWords(a: number, b: number): string | null {
  const parts: Array<[number, string]> = [];
  if (Math.abs(a) >= LOOK_DEFAULTS.castAbove)
    parts.push([Math.abs(a), a > 0 ? "magenta" : "green"]);
  if (Math.abs(b) >= LOOK_DEFAULTS.castAbove) parts.push([Math.abs(b), b > 0 ? "yellow" : "blue"]);
  if (!parts.length) return null;
  return parts
    .sort((x, y) => y[0] - x[0])
    .map((p) => p[1])
    .join(" and ");
}

function roleReading(
  name: string,
  role: LookRole | null,
  lab: Lab,
  levels: LookLevels,
  rep: LookRegionReport,
) {
  if (role === "neutral") {
    const toward = castWords(lab.a, lab.b);
    const gains = neutralGains(levels.mean);
    const mix = (g: number) => Math.round(g * 100);
    rep.cast = {
      a: lab.a,
      b: lab.b,
      amount: lab.chroma,
      toward,
      gains: [r4(gains[0]), r4(gains[1]), r4(gains[2])],
      channelMixer: {
        "Red-Red": mix(gains[0]),
        "Green-Green": mix(gains[1]),
        "Blue-Blue": mix(gains[2]),
      },
    };
    rep.reading = toward
      ? `${name} reads a* ${signed(lab.a)}, b* ${signed(lab.b)} (CIELAB): a cast toward ${toward} of ${lab.chroma.toFixed(1)}, if the surface is really neutral; a neutral reads 0, 0, and under about 2 is hard to see. ` +
        `Gains on the display values that make it neutral at its own brightness: red ${rep.cast.gains[0]}, green ${rep.cast.gains[1]}, blue ${rep.cast.gains[2]} (Channel Mixer Red-Red ${rep.cast.channelMixer["Red-Red"]}, Green-Green ${rep.cast.channelMixer["Green-Green"]}, Blue-Blue ${rep.cast.channelMixer["Blue-Blue"]}).`
      : `${name} reads neutral: a* ${signed(lab.a)}, b* ${signed(lab.b)} (CIELAB; under about 2 is hard to see).`;
  } else if (role === "skin") {
    const [lo, hi] = LOOK_DEFAULTS.skinHue;
    const h = lab.hue > 270 ? lab.hue - 360 : lab.hue;
    const where =
      h < lo
        ? `below the usual range, so it leans to magenta (pink); ${(lo - h).toFixed(0)}° short of ${lo}°`
        : h > hi
          ? `above the usual range, so it leans to yellow; ${(h - hi).toFixed(0)}° past ${hi}°`
          : "inside the usual range";
    rep.reading = `${name} (skin) has a hue angle of ${h.toFixed(0)}° and chroma ${lab.chroma.toFixed(1)} (CIELAB): ${where}. Skin of many tones commonly reads about ${lo} to ${hi}° under neutral light; that range is a general reference, not measured on this footage, so judge it against a neutral in the same light as well.`;
  }
}

export interface LookPairReport {
  element: string;
  plate: string;
  grain: { element: number; plate: number; ratio: number | null; matches: boolean | null };
  sharpness: {
    element: number | null;
    plate: number | null;
    ratio: number | null;
    matches: boolean | null;
  };
  levels: { blackDifference: number; whiteDifference: number };
  readings: string[];
}

const meanOf = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;

/** An element region against its plate: grain, edge width, black and white points, with what to do. */
export function compareLook(
  element: Pick<LookRegionReport, "name" | "grain" | "sharpness" | "levels">,
  plate: Pick<LookRegionReport, "name" | "grain" | "sharpness" | "levels">,
  tol: { grain?: number; sharpness?: number } = {},
): LookPairReport {
  const gt = tol.grain ?? LOOK_DEFAULTS.grainTolerance;
  const st = tol.sharpness ?? LOOK_DEFAULTS.sharpnessTolerance;
  const eg = meanOf(element.grain.spatial);
  const pg = meanOf(plate.grain.spatial);
  const gRatio = pg > 0 ? Math.round((eg / pg) * 100) / 100 : null;
  const gMatch = gRatio === null ? null : Math.abs(gRatio - 1) <= gt;
  const ew = element.sharpness.edgeWidth;
  const pw = plate.sharpness.edgeWidth;
  const sRatio = ew !== null && pw !== null && pw > 0 ? Math.round((ew / pw) * 100) / 100 : null;
  const sMatch = sRatio === null ? null : Math.abs(sRatio - 1) <= st;
  const bd = r4(element.levels.lumaBlack - plate.levels.lumaBlack);
  const wd = r4(element.levels.lumaWhite - plate.levels.lumaWhite);
  const readings: string[] = [];
  const e = element.name;
  if (gRatio !== null && !gMatch)
    readings.push(
      gRatio < 1
        ? `${e} is cleaner than the plate: add grain (grain ${eg.toFixed(2)} against ${pg.toFixed(2)} 8-bit steps).`
        : `${e} is grainier than the plate: take grain out or add less (${eg.toFixed(2)} against ${pg.toFixed(2)} 8-bit steps).`,
    );
  if (sRatio !== null && !sMatch)
    readings.push(
      sRatio < 1
        ? `${e} is sharper than the plate: soften it (edges ${ew} px against ${pw} px wide, 10 to 90%).`
        : `${e} is softer than the plate: sharpen it, or soften the plate's match less (edges ${ew} px against ${pw} px).`,
    );
  // Black and white points compare only when both regions hold the darkest (or brightest) part of their picture.
  const deepest = "if both regions hold the deepest shadow of their picture";
  const brightest = "if both regions hold the brightest highlight of their picture";
  if (Math.abs(bd) > LOOK_DEFAULTS.levelTolerance)
    readings.push(
      bd > 0
        ? `${e}'s blacks are lifted against the plate's (${element.levels.lumaBlack} against ${plate.levels.lumaBlack}): ${deepest}, seat them lower.`
        : `${e}'s blacks are deeper than the plate's (${element.levels.lumaBlack} against ${plate.levels.lumaBlack}): ${deepest}, lift them.`,
    );
  if (Math.abs(wd) > LOOK_DEFAULTS.levelTolerance)
    readings.push(
      wd > 0
        ? `${e}'s whites are brighter than the plate's (${element.levels.lumaWhite} against ${plate.levels.lumaWhite}): ${brightest}, bring them down.`
        : `${e}'s whites are duller than the plate's (${element.levels.lumaWhite} against ${plate.levels.lumaWhite}): ${brightest}, bring them up.`,
    );
  if (pw === null || ew === null)
    readings.push(
      "Edge width was not compared: one side has no edge strong enough to read; pick regions that each hold an edge.",
    );
  if (!readings.length)
    readings.push(
      `${e} matches the plate in grain, edge width and black and white points, within the tolerances.`,
    );
  return {
    element: element.name,
    plate: plate.name,
    grain: {
      element: Math.round(eg * 100) / 100,
      plate: Math.round(pg * 100) / 100,
      ratio: gRatio,
      matches: gMatch,
    },
    sharpness: { element: ew, plate: pw, ratio: sRatio, matches: sMatch },
    levels: { blackDifference: bd, whiteDifference: wd },
    readings,
  };
}

export interface LookFrame {
  regions: Array<LookRegionReport | RegionError>;
  pairs?: Array<LookPairReport | { element: string; plate: string; error: string }>;
}

/** The matte's edge in a crop with alpha: widths on the alpha, and soft pixels per pixel of outline. */
function matteEdge(c: LookCrop, minContrast: number): NonNullable<LookRegionReport["matte"]> {
  const a = c.alpha as Float64Array;
  const grey = new Float64Array(a.length * 3);
  for (let q = 0; q < a.length; q++) grey[q * 3] = grey[q * 3 + 1] = grey[q * 3 + 2] = a[q];
  const widths = edgeWidths(
    { ...c, rgb: grey, use: new Uint8Array(a.length).fill(1) },
    minContrast,
  );
  let soft = 0;
  let outline = 0;
  let opaque = 0;
  let minAlpha = 1;
  const w = c.width;
  for (let y = 0; y < c.height; y++)
    for (let x = 0; x < w; x++) {
      const v = a[y * w + x];
      if (v > 0.02 && v < 0.98) soft++;
      if (v >= 0.99) opaque++;
      if (v < minAlpha) minAlpha = v;
      if (v < 0.5) continue;
      const p = y * w + x;
      if (
        (x > 0 && a[p - 1] < 0.5) ||
        (x < w - 1 && a[p + 1] < 0.5) ||
        (y > 0 && a[p - w] < 0.5) ||
        (y < c.height - 1 && a[p + w] < 0.5)
      )
        outline++;
    }
  return {
    ...widths,
    softBand: outline ? Math.round((soft / outline) * 100) / 100 : null,
    opaqueShare: Math.round((opaque / a.length) * 10000) / 10000,
    minAlpha: Math.round(minAlpha * 10000) / 10000,
  };
}

/**
 * The soft band's colour (pixels at alpha 0.2 to 0.98, straight colour) against the colour well
 * inside (opaque, with nothing under 0.98 within 6 px), and how far it leans toward `background`:
 * 0 is the inside's colour, 1 the background's. Wall colour left in the soft pixels rings the
 * subject; a share under about 0.15 did not show on the take measured (keying.md).
 */
function edgeColourOf(
  c: LookCrop,
  background: Rgb | undefined,
): NonNullable<LookRegionReport["edgeColour"]> {
  const a = c.alpha as Float64Array;
  const w = c.width;
  const band = [0, 0, 0];
  const inside = [0, 0, 0];
  let nb = 0;
  let ni = 0;
  for (let y = 0; y < c.height; y++)
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      const v = a[p];
      if (v > 0.2 && v < 0.98) {
        for (let k = 0; k < 3; k++) band[k] += c.rgb[p * 3 + k];
        nb++;
      } else if (v >= 0.98) {
        let deep = true;
        for (let dy = -6; dy <= 6 && deep; dy += 2)
          for (let dx = -6; dx <= 6; dx += 2) {
            const yy = y + dy;
            const xx = x + dx;
            if (yy < 0 || xx < 0 || yy >= c.height || xx >= w || a[yy * w + xx] < 0.98) {
              deep = false;
              break;
            }
          }
        if (deep) {
          for (let k = 0; k < 3; k++) inside[k] += c.rgb[p * 3 + k];
          ni++;
        }
      }
    }
  if (!nb || !ni)
    return {
      band: nb ? labOf(band.map((v) => v / nb) as Rgb) : null,
      inside: ni ? labOf(inside.map((v) => v / ni) as Rgb) : null,
      difference: null,
      towardBackground: null,
      reading: !nb
        ? "no soft edge in the region"
        : "nothing far enough inside the edge to compare with",
    };
  const lb = labOf(band.map((v) => v / nb) as Rgb);
  const li = labOf(inside.map((v) => v / ni) as Rgb);
  const difference = Math.round(Math.hypot(lb.L - li.L, lb.a - li.a, lb.b - li.b) * 10) / 10;
  let toward: number | null = null;
  if (background) {
    const lw = labOf(background);
    const dir = [lw.L - li.L, lw.a - li.a, lw.b - li.b];
    const d = [lb.L - li.L, lb.a - li.a, lb.b - li.b];
    const n2 = dir[0] ** 2 + dir[1] ** 2 + dir[2] ** 2;
    toward =
      n2 > 0
        ? Math.round(((d[0] * dir[0] + d[1] * dir[1] + d[2] * dir[2]) / n2) * 100) / 100
        : null;
  }
  const reading =
    toward === null
      ? `The soft edge differs from the colour well inside by ${difference} (CIELAB); give \`background\` (the wall's colour) to read how much of it is the background.`
      : `The soft edge's colour sits ${Math.round(toward * 100)}% of the way from the colour well inside toward the background (${difference} apart, CIELAB)` +
        (toward > 0.25
          ? ": background colour left in the edge, which rings the subject over a new background; Decontaminate Edge Colors takes it out."
          : ".");
  return { band: lb, inside: li, difference, towardBackground: toward, reading };
}

/** Grain, edge width, black and white points and colour of each region, and each element against its plate. */
export function measureLook(img: DecodedPng, args: LookArgs): LookFrame {
  const minContrast = args.minContrast ?? LOOK_DEFAULTS.minContrast;
  const regions = args.regions.map((r): LookRegionReport | RegionError => {
    const clip = clipRegion(img, r);
    if (!clip) return outside(img, r);
    const c = cropOf(img, clip.rect, LOOK_DEFAULTS.opaque);
    let pixels = 0;
    for (const u of c.use) pixels += u;
    if (!pixels) return { name: r.name, error: "no opaque pixels in the region" };
    const levels = levelsOf(c);
    const colour = labOf(levels.mean);
    const rep: LookRegionReport = {
      name: r.name,
      role: r.role ?? null,
      rect: clip.rect,
      clipped: clip.clipped,
      pixels,
      levels,
      grain: { spatial: spatialGrain(c) },
      sharpness: edgeWidths(c, minContrast),
      colour,
    };
    if (c.alpha) {
      rep.matte = matteEdge(c, minContrast);
      rep.edgeColour = edgeColourOf(c, args.background as Rgb | undefined);
    }
    roleReading(r.name, r.role ?? null, colour, levels, rep);
    return rep;
  });
  const out: LookFrame = { regions };
  if (args.pairs?.length) {
    const byName = new Map(regions.map((r) => [r.name, r]));
    out.pairs = args.pairs.map((p) => {
      const e = byName.get(p.element);
      const pl = byName.get(p.plate);
      if (!e || "error" in e || !pl || "error" in pl)
        return {
          element: p.element,
          plate: p.plate,
          error: "one side of the pair could not be measured",
        };
      return compareLook(e, pl, { grain: args.grainTolerance, sharpness: args.sharpnessTolerance });
    });
  }
  return out;
}

export interface LookSeries {
  regions: Array<{ name: string; temporal: Rgb | null; pairs: number; matteChange: number | null }>;
  pairs?: Array<{
    element: string;
    plate: string;
    element_temporal: number | null;
    plate_temporal: number | null;
    readings: string[];
  }>;
}

/** Frame-to-frame grain of each region over consecutive frames (crops from lookCrops, in order). */
export function summarizeLookSeries(
  frames: Array<Map<string, LookCrop>>,
  args: LookArgs,
): LookSeries {
  const regions = args.regions.map((r) => {
    const per: Rgb[] = [];
    for (let i = 1; i < frames.length; i++) {
      const a = frames[i - 1].get(r.name);
      const b = frames[i].get(r.name);
      const t = a && b ? temporalGrain(a, b) : null;
      if (t) per.push(t);
    }
    const temporal = per.length
      ? ([0, 1, 2].map((k) => Math.round(median(per.map((p) => p[k])) * 100) / 100) as Rgb)
      : null;
    // The matte's change from frame to frame: mean |change in alpha| over the region, median over the pairs.
    const changes: number[] = [];
    for (let i = 1; i < frames.length; i++) {
      const a = frames[i - 1].get(r.name)?.alpha;
      const b = frames[i].get(r.name)?.alpha;
      if (!a || !b || a.length !== b.length) continue;
      let sum = 0;
      for (let q = 0; q < a.length; q++) sum += Math.abs(b[q] - a[q]);
      changes.push(sum / a.length);
    }
    const matteChange = changes.length ? Math.round(median(changes) * 10000) / 10000 : null;
    return { name: r.name, temporal, pairs: per.length, matteChange };
  });
  const out: LookSeries = { regions };
  if (args.pairs?.length) {
    const by = new Map(regions.map((r) => [r.name, r]));
    out.pairs = args.pairs.map((p) => {
      const et = by.get(p.element)?.temporal;
      const pt = by.get(p.plate)?.temporal;
      const e = et ? Math.round(meanOf(et) * 100) / 100 : null;
      const pl = pt ? Math.round(meanOf(pt) * 100) / 100 : null;
      const readings: string[] = [];
      if (e !== null && pl !== null && pl > 0.3) {
        if (e < pl * 0.25)
          readings.push(
            `${p.element}'s grain does not change from frame to frame and the plate's does (${e} against ${pl} 8-bit steps): animate the grain.`,
          );
        else if (Math.abs(e / pl - 1) > (args.grainTolerance ?? LOOK_DEFAULTS.grainTolerance))
          readings.push(
            `${p.element}'s frame-to-frame grain is ${e} against the plate's ${pl} 8-bit steps.`,
          );
      }
      return {
        element: p.element,
        plate: p.plate,
        element_temporal: e,
        plate_temporal: pl,
        readings,
      };
    });
  }
  return out;
}

/** A message naming the field, or null when `look` is usable. */
export function lookArgsError(args: Record<string, unknown>): string | null {
  const regions = args.regions;
  if (!Array.isArray(regions) || regions.length === 0 || regions.length > 64)
    return "`look.regions` must list 1 to 64 regions";
  const names = new Set<string>();
  for (const r of regions as Array<Record<string, unknown>>) {
    if (typeof r?.name !== "string" || !r.name) return "every `look.regions` entry needs a name";
    if (names.has(r.name)) return `\`look.regions\` names '${r.name}' twice`;
    names.add(r.name);
    if (typeof r.x !== "number" || typeof r.y !== "number")
      return `\`look.regions\` '${r.name}' needs x and y`;
    if (r.role !== undefined && !LOOK_ROLES.includes(r.role as LookRole))
      return `\`look.regions\` '${r.name}' has role '${String(r.role)}'; use ${LOOK_ROLES.join(", ")}`;
  }
  if (args.pairs !== undefined) {
    if (!Array.isArray(args.pairs)) return "`look.pairs` must be a list of { element, plate }";
    for (const p of args.pairs as Array<Record<string, unknown>>) {
      if (!names.has(String(p?.element)))
        return `\`look.pairs\` names element '${String(p?.element)}', which is not a region`;
      if (!names.has(String(p?.plate)))
        return `\`look.pairs\` names plate '${String(p?.plate)}', which is not a region`;
    }
  }
  if (
    args.background !== undefined &&
    (!Array.isArray(args.background) ||
      args.background.length !== 3 ||
      !args.background.every((v) => typeof v === "number" && v >= 0 && v <= 1))
  )
    return "`look.background` must be [r, g, b], each 0..1";
  for (const k of ["minContrast", "grainTolerance", "sharpnessTolerance"]) {
    const v = args[k];
    if (v !== undefined && (typeof v !== "number" || !(v > 0) || v > 1))
      return `\`look.${k}\` must be a number above 0 and at most 1`;
  }
  return null;
}
