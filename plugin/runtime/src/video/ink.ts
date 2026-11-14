// The ink measure (stage 13): a mask in a fixed box, by luma, by colour or by difference from a frame the caller
// names as empty, and per frame its bounding box, centroid, area and the box's mean level. It is how the hand studies
// measured: it holds what a template of the settled frame cannot (a thing that grows from nothing, draws on, fades,
// glows or blurs). A moving ground defeats the difference from an empty frame. And the witness: plain frame
// differencing in a box, the span over which anything there changes at all.

export interface InkMask {
  /** Luma (0.299 r + 0.587 g + 0.114 b) within [lo, hi]. */
  luma?: [number, number];
  /** The smallest of r, g, b within [lo, hi] (white ink on colour). */
  minChannel?: [number, number];
  /** Hue in degrees within [from, to] (wrapping when from > to), with saturation and value (0..1) over these. */
  hue?: [number, number];
  minSat?: number;
  minVal?: number;
  /** Within tol (each channel) of this colour. */
  rgb?: [number, number, number];
  tol?: number;
  /** Differs from the empty frame (filled by the caller) by more than tol on some channel. */
  empty?: number;
}

export interface InkFrame { count: number; x0: number; y0: number; x1: number; y1: number; cx: number; cy: number; level: number }

export function luma(r: number, g: number, b: number): number { return 0.299 * r + 0.587 * g + 0.114 * b; }

function hsv(r: number, g: number, b: number): [number, number, number] {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d > 0) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60; if (h < 0) h += 360;
  return [h, mx > 0 ? d / mx : 0, mx / 255];
}

/** Whether a pixel is ink. emptyPx: the empty frame's pixel (for the difference mask). */
export function isInk(m: InkMask, r: number, g: number, b: number, emptyPx?: [number, number, number]): boolean {
  if (m.luma) { const l = luma(r, g, b); if (l < m.luma[0] || l > m.luma[1]) return false; }
  if (m.minChannel) { const c = Math.min(r, g, b); if (c < m.minChannel[0] || c > m.minChannel[1]) return false; }
  if (m.hue) {
    const [h, s, v] = hsv(r, g, b);
    if (s < (m.minSat ?? 0.2) || v < (m.minVal ?? 0.15)) return false;
    const [a, z] = m.hue;
    if (a <= z ? h < a || h > z : h < a && h > z) return false;
  }
  if (m.rgb) { const t = m.tol ?? 8; if (Math.abs(r - m.rgb[0]) > t || Math.abs(g - m.rgb[1]) > t || Math.abs(b - m.rgb[2]) > t) return false; }
  if (m.empty !== undefined) {
    if (!emptyPx) return false;
    const t = m.tol ?? 30;
    if (Math.max(Math.abs(r - emptyPx[0]), Math.abs(g - emptyPx[1]), Math.abs(b - emptyPx[2])) <= t) return false;
  }
  return true;
}

/**
 * One frame's ink (rgb24, w x h, the box at scale k of the source): its bounding box over rows and columns holding at
 * least minCount ink pixels, centroid, area and the box's mean luma, in source pixels (offset ox, oy). count 0: empty.
 */
export function inkOf(rgb: Uint8Array, w: number, h: number, m: InkMask, o: { k: number; ox: number; oy: number; minCount?: number; empty?: Uint8Array }): InkFrame {
  const rows = new Uint32Array(h), cols = new Uint32Array(w), minCount = o.minCount ?? 1;
  let count = 0, sx = 0, sy = 0, lum = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 3, r = rgb[i], g = rgb[i + 1], b = rgb[i + 2];
    lum += luma(r, g, b);
    if (isInk(m, r, g, b, o.empty ? [o.empty[i], o.empty[i + 1], o.empty[i + 2]] : undefined)) { rows[y]++; cols[x]++; count++; sx += x; sy += y; }
  }
  let x0 = -1, x1 = -1, y0 = -1, y1 = -1;
  for (let x = 0; x < w; x++) if (cols[x] >= minCount) { if (x0 < 0) x0 = x; x1 = x; }
  for (let y = 0; y < h; y++) if (rows[y] >= minCount) { if (y0 < 0) y0 = y; y1 = y; }
  const src = (v: number, off: number) => off + v / o.k;
  if (!count || x0 < 0 || y0 < 0) return { count: 0, x0: NaN, y0: NaN, x1: NaN, y1: NaN, cx: NaN, cy: NaN, level: lum / (w * h) };
  // edges at pixel boundaries: x0 is the left edge of the first ink column, x1 the right edge of the last
  return { count: count / (o.k * o.k), x0: src(x0, o.ox), x1: src(x1 + 1, o.ox), y0: src(y0, o.oy), y1: src(y1 + 1, o.oy), cx: src(sx / count + 0.5, o.ox), cy: src(sy / count + 0.5, o.oy), level: lum / (w * h) };
}

/** Curves the ink measure can fit, each one value (or two for the centroid) per frame. */
export const INK_CURVES = ["centroid", "x0", "x1", "y0", "y1", "width", "height", "size", "level"] as const;
export type InkCurve = (typeof INK_CURVES)[number];

export function inkValue(f: InkFrame, c: InkCurve): number[] | null {
  if (c === "level") return [f.level];
  if (!f.count) return null;
  switch (c) {
    case "centroid": return [f.cx, f.cy];
    case "x0": return [f.x0]; case "x1": return [f.x1]; case "y0": return [f.y0]; case "y1": return [f.y1];
    case "width": return [f.x1 - f.x0]; case "height": return [f.y1 - f.y0];
    case "size": return [Math.sqrt(f.count)];
  }
  return null;
}

/** What a curve is like, for pairing with the match's channels and for the units. */
export function inkLike(c: InkCurve): { like: "position" | "scale" | "opacity"; axis?: 0 | 1; unit: string } {
  if (c === "centroid") return { like: "position", unit: "px" };
  if (c === "x0" || c === "x1") return { like: "position", axis: 0, unit: "px" };
  if (c === "y0" || c === "y1") return { like: "position", axis: 1, unit: "px" };
  if (c === "level") return { like: "opacity", unit: "luma" };
  return { like: "scale", unit: "px" };
}

/**
 * The witness: per frame, how many pixels of the box changed by more than 10 levels since the frame before; the runs
 * of frames that change beyond the box's own noise (three times its median, at least 0.05 % of the box), joined
 * across gaps of up to two frames but never across a break (a cut). A run is given as the last frame unchanged and the last frame that changed.
 */
export function witnessRuns(counts: number[], pixels: number, breaks: Set<number> = new Set()): { runs: Array<{ from: number; to: number }>; threshold: number; ground: "still" | "moving" } {
  const med = [...counts].sort((a, b) => a - b)[Math.floor(counts.length / 2)] ?? 0;
  const threshold = Math.max(3, Math.ceil(0.0005 * pixels), 3 * med + 2);
  const runs: Array<{ from: number; to: number }> = [];
  let cur: { from: number; to: number } | null = null;
  for (let i = 1; i < counts.length; i++) {
    if (breaks.has(i)) { if (cur) runs.push(cur); cur = null; continue; }
    if (counts[i] < threshold) continue;
    if (cur && i - cur.to <= 3) cur.to = i;
    else { if (cur) runs.push(cur); cur = { from: i - 1, to: i }; }
  }
  if (cur) runs.push(cur);
  return { runs: runs.filter((r) => r.to - r.from >= 2), threshold, ground: med / Math.max(1, pixels) > 0.05 ? "moving" : "still" };
}
