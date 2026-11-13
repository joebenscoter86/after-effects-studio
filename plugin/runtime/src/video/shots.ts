// The shot list of a video file (stage 13): cuts, one-frame swaps inside a shot, and the changes that are neither.
// Cuts follow the rules of a cut detector that worked on real reels (64 x 36 grey, the change against the median of the
// frames round it); swaps are found by region, since a one-frame swap of a small part of the frame, or between two dark
// pictures, moves no global score. Pure functions here; the runner decodes and writes the pictures.

export interface ShotRules {
  /** A cut: change at least `cutMin` and at least `ratio` times the median of `around` frames each side. */
  cutMin: number;
  ratio: number;
  heldRatio: number;
  around: number;
  /** A soft cut: at least `softMin`, `softRatio` times the median, and `softEvery` times every neighbour. */
  softMin: number;
  softRatio: number;
  softEvery: number;
  /** A one-frame swap: the frame differs from both neighbours by `swapMin` or more while they differ by under `swapBack` of that. */
  swapMin: number;
  swapBack: number;
  /** A flash: the change is mostly brightness (a uniform shift), not a different picture. */
  flashShare: number;
  /** Not a cut: the frame registers on the one before under some whole-frame shift with at least this score
   * (normalised cross-correlation over the overlap) and that shift leaves at most sameResidual of the change: the same
   * picture, panned. Chosen on drawn clips: pans scored 0.905 to 1.0 with a residual of 0 to 0.21; cuts 0.19 to 0.795,
   * with a residual of 0.47 to 0.96. */
  sameScore: number;
  sameResidual: number;
}
export const SHOT_RULES: ShotRules = { cutMin: 12, ratio: 4, heldRatio: 3, around: 12, softMin: 10, softRatio: 8, softEvery: 4, swapMin: 10, swapBack: 0.35, flashShare: 0.7, sameScore: 0.85, sameResidual: 0.35 };

export interface Shift {
  /** b(x, y) is a(x - dx, y - dy): the picture moved by (dx, dy) grid pixels from a to b. */
  dx: number;
  dy: number;
  /** Normalised cross-correlation over the overlap (-1..1), and the overlap's share of the frame. */
  score: number;
  overlap: number;
  /** Mean absolute difference over the overlap at this shift, as a share of the difference at no shift. */
  residual: number;
}

/**
 * The whole-frame shift that best takes frame a onto frame b (grey, w x h), every shift up to maxDx and maxDy, scored by
 * normalised cross-correlation over the overlap only (at least minOverlap of the frame). Two frames of one picture panned
 * fast match well at some shift; two different pictures match at none. near: search only round a shift (coarse to fine).
 */
export function registerShift(a: ArrayLike<number>, b: ArrayLike<number>, w: number, h: number,
  o: { maxDx?: number; maxDy?: number; minOverlap?: number; near?: { dx: number; dy: number; r: number } } = {}): Shift | null {
  const maxDx = o.maxDx ?? Math.floor(w / 2), maxDy = o.maxDy ?? Math.floor(h / 2), minOverlap = o.minOverlap ?? 0.25;
  let best: Shift | null = null;
  const x0s = o.near ? o.near.dx - o.near.r : -maxDx, x1s = o.near ? o.near.dx + o.near.r : maxDx;
  const y0s = o.near ? o.near.dy - o.near.r : -maxDy, y1s = o.near ? o.near.dy + o.near.r : maxDy;
  for (let dy = y0s; dy <= y1s; dy++) for (let dx = x0s; dx <= x1s; dx++) {
    const xa = Math.max(0, dx), xb = Math.min(w, w + dx), ya = Math.max(0, dy), yb = Math.min(h, h + dy);
    const n = (xb - xa) * (yb - ya);
    if (n <= 0 || n < minOverlap * w * h) continue;
    let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0;
    for (let y = ya; y < yb; y++) {
      const rb = y * w, ra = (y - dy) * w;
      for (let x = xa; x < xb; x++) { const p = a[ra + x - dx], q = b[rb + x]; sa += p; sb += q; saa += p * p; sbb += q * q; sab += p * q; }
    }
    const va = saa - (sa * sa) / n, vb = sbb - (sb * sb) / n, cov = sab - (sa * sb) / n;
    const score = va > 1e-6 && vb > 1e-6 ? cov / Math.sqrt(va * vb) : 0;
    if (!best || score > best.score) best = { dx, dy, score, overlap: n / (w * h), residual: 0 };
  }
  if (best) {
    const { dx, dy } = best, xa = Math.max(0, dx), xb = Math.min(w, w + dx), ya = Math.max(0, dy), yb = Math.min(h, h + dy);
    let r = 0, z = 0;
    for (let y = ya; y < yb; y++) for (let x = xa; x < xb; x++) { const q = b[y * w + x]; r += Math.abs(q - a[(y - dy) * w + x - dx]); z += Math.abs(q - a[y * w + x]); }
    best.residual = z > 0 ? r / z : 0;
  }
  return best;
}

export interface FrameStats {
  index: number;
  time: number;
  /** Mean absolute change against the frame before (0..255), over the whole frame and per region of a 4 x 4 grid. */
  change: number;
  regions: number[];
  /** Change against the frame two before (whole frame and per region): a swap returns to it. */
  back: number;
  regionsBack: number[];
  /** Of the change, the part a single brightness shift explains (0..1): near 1 for a flash. */
  shiftShare: number;
}

const median = (a: number[]) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

export interface ShotList {
  cuts: Array<{ frame: number; time: number; change: number; soft?: boolean }>;
  swaps: Array<{ frame: number; time: number; change: number; region: number | null }>;
  notCuts: Array<{ frame: number; time: number; kind: "flash" | "pan" | "motion"; change: number; shift?: { dx: number; dy: number; score: number } }>;
  shots: Array<{ from: number; to: number; start: number; end: number }>;
}

/**
 * Cuts, swaps and flashes from per-frame statistics (stats[i].change is frame i against frame i - 1). register(i), when
 * given, registers frame i on frame i - 1: a candidate that registers is the same picture, a pan (or a fast move inside
 * it, at no shift), listed under notCuts, not a cut.
 */
export function shotList(stats: FrameStats[], rules: ShotRules = SHOT_RULES, register?: (i: number) => Shift | null): ShotList {
  const n = stats.length, ch = stats.map((s) => s.change), out: ShotList = { cuts: [], swaps: [], notCuts: [], shots: [] };
  const swapAt = new Set<number>();
  // one-frame swaps: frame i differs from i - 1 and from i + 1, while i + 1 is back to i - 1 (whole frame, or one region)
  for (let i = 1; i + 1 < n; i++) {
    const a = stats[i], b = stats[i + 1];
    if (a.change >= rules.swapMin && b.change >= rules.swapMin && b.back < rules.swapBack * Math.min(a.change, b.change)) {
      swapAt.add(i); out.swaps.push({ frame: a.index, time: a.time, change: Math.round(a.change * 10) / 10, region: null }); continue;
    }
    for (let r = 0; r < a.regions.length; r++) {
      const ra = a.regions[r], rb = b.regions[r];
      const loc = median(stats.slice(Math.max(1, i - rules.around), Math.min(n, i + rules.around + 1)).map((s) => s.regions[r]));
      if (ra >= Math.max(rules.swapMin * 2, 4 * loc) && rb >= Math.max(rules.swapMin * 2, 4 * loc) && b.regionsBack[r] < rules.swapBack * Math.min(ra, rb)) {
        swapAt.add(i); out.swaps.push({ frame: a.index, time: a.time, change: Math.round(ra * 10) / 10, region: r }); break;
      }
    }
  }
  // candidates: a change large against the frames round it (hard), or a soft cut; a flash set aside
  const cand: Array<{ i: number; reg: Shift | null; same: boolean; soft: boolean }> = [];
  for (let i = 1; i < n; i++) {
    if (swapAt.has(i) || swapAt.has(i - 1)) continue;
    const nb = [...ch.slice(Math.max(1, i - rules.around), i), ...ch.slice(i + 1, Math.min(n, i + rules.around + 1))];
    const med = median(nb), held = nb.filter((x) => x < 1).length > 0.6 * nb.length;
    const hard = ch[i] >= rules.cutMin && ch[i] >= (held ? rules.heldRatio : rules.ratio) * Math.max(med, 0.5);
    const soft = !hard && ch[i] >= rules.softMin && ch[i] >= rules.softRatio * Math.max(med, 0.5) && ch[i] >= rules.softEvery * Math.max(ch[i - 1], i + 1 < n ? ch[i + 1] : 0);
    if (!hard && !soft) continue;
    if (stats[i].shiftShare >= rules.flashShare) { out.notCuts.push({ frame: stats[i].index, time: stats[i].time, kind: "flash", change: Math.round(ch[i] * 10) / 10 }); continue; }
    const reg = register ? register(i) : null;
    cand.push({ i, reg, soft, same: !!reg && reg.score >= rules.sameScore && reg.residual <= rules.sameResidual });
  }
  // candidates within 3 frames of each other are one change. Its largest frame decides: the same picture, panned, and the
  // whole run is a pan (its start and end register more loosely: blur, and new picture at the edge); a different picture,
  // and the cut is the run's first frame that does not register. The other frames are set aside.
  const r1 = (x: number) => Math.round(x * 10) / 10;
  const aside = (c: (typeof cand)[number], kind: "pan" | "motion") => out.notCuts.push({ frame: stats[c.i].index, time: stats[c.i].time, kind, change: r1(ch[c.i]),
    ...(c.reg ? { shift: { dx: c.reg.dx, dy: c.reg.dy, score: Math.round(c.reg.score * 1000) / 1000 } } : {}) });
  for (let k = 0; k < cand.length;) {
    let e = k; while (e + 1 < cand.length && stats[cand[e + 1].i].index - stats[cand[e].i].index <= 3) e++;
    const run = cand.slice(k, e + 1), top = run.reduce((a, b) => (ch[b.i] > ch[a.i] ? b : a));
    if (top.same) for (const c of run) aside(c, c.reg && Math.hypot(c.reg.dx, c.reg.dy) >= 1 ? "pan" : "motion");
    else {
      const cut = run.find((c) => !c.same) ?? top;
      out.cuts.push({ frame: stats[cut.i].index, time: stats[cut.i].time, change: r1(ch[cut.i]), ...(cut.soft ? { soft: true } : {}) });
      for (const c of run) if (c !== cut) aside(c, c.same && c.reg && Math.hypot(c.reg.dx, c.reg.dy) >= 1 ? "pan" : "motion");
    }
    k = e + 1;
  }
  out.notCuts.sort((a, b) => a.frame - b.frame);
  let from = stats[0]?.index ?? 0, start = stats[0]?.time ?? 0;
  for (const c of out.cuts) { const k = stats.findIndex((s) => s.index === c.frame); out.shots.push({ from, to: c.frame - 1, start, end: stats[k - 1]?.time ?? c.time }); from = c.frame; start = c.time; }
  if (n) out.shots.push({ from, to: stats[n - 1].index, start, end: stats[n - 1].time });
  return out;
}

/** Statistics of frame c against b (the frame before) and a (two before); grey images w x h, split into a 4 x 4 grid. */
export function frameStats(index: number, time: number, a: Uint8Array | null, b: Uint8Array | null, c: Uint8Array, w: number, h: number): FrameStats {
  const grid = 4, regions = Array(grid * grid).fill(0), regionsBack = Array(grid * grid).fill(0), counts = Array(grid * grid).fill(0);
  let change = 0, back = 0, mean = 0;
  if (b) for (let i = 0; i < c.length; i++) mean += c[i] - b[i];
  mean = b ? mean / c.length : 0;
  let resid = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, r = Math.min(grid - 1, Math.floor((y * grid) / h)) * grid + Math.min(grid - 1, Math.floor((x * grid) / w));
    const d = b ? Math.abs(c[i] - b[i]) : 0, e = a ? Math.abs(c[i] - a[i]) : 0;
    change += d; back += e; regions[r] += d; regionsBack[r] += e; counts[r]++;
    if (b) resid += Math.abs(c[i] - b[i] - mean);
  }
  const N = w * h;
  return { index, time, change: change / N, back: a ? back / N : Infinity, regions: regions.map((v, r) => v / counts[r]), regionsBack: regionsBack.map((v, r) => (a ? v / counts[r] : Infinity)),
    shiftShare: change > 0 ? Math.max(0, 1 - resid / change) : 0 };
}
