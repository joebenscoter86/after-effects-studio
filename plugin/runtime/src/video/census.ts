// A census of movement over a video (stage 13): each short step classed calm, local movement, whole-stage travel or a
// cut, with cadence numbers. Ported from the census study's classifier, its thresholds unchanged: grey frames about 320
// px on the long side, a band of the frame (the stage), 16 px blocks matched within 6 px; a step is travel when at least
// half the textured blocks moved and the band changed, calm when under 0.4 % of it changed, a cut when most of it changed
// and few blocks moved, otherwise local.

export interface CensusRules {
  block: number;
  search: number;
  /** A pixel has changed past this (0..255). */
  pixel: number;
  calmBelow: number;
  travelMoved: number;
  cutChanged: number;
  cutMoved: number;
  /** A block is textured past this standard deviation. */
  texture: number;
}
export const CENSUS_RULES: CensusRules = { block: 16, search: 6, pixel: 8, calmBelow: 0.004, travelMoved: 0.5, cutChanged: 0.55, cutMoved: 0.35, texture: 5 };

export interface Step { changed: number; moved: number; textured: number; shift: number; label: "c" | "l" | "T" | "X" }

/** One step: frame b against frame a (grey, w x h), over rows y0..y1. */
export function censusStep(a: Uint8Array, b: Uint8Array, w: number, h: number, y0: number, y1: number, rules: CensusRules = CENSUS_RULES): Step {
  let changedPx = 0, total = 0;
  for (let y = y0; y < y1; y++) for (let x = 0; x < w; x++) { total++; if (Math.abs(a[y * w + x] - b[y * w + x]) > rules.pixel) changedPx++; }
  const changed = total ? changedPx / total : 0, B = rules.block, S = rules.search;
  let textured = 0, moved = 0;
  const shifts: number[] = [];
  for (let by = y0 + S; by + B + S <= y1; by += B) for (let bx = S; bx + B + S <= w; bx += B) {
    let m = 0, m2 = 0;
    for (let y = 0; y < B; y++) for (let x = 0; x < B; x++) { const v = a[(by + y) * w + bx + x]; m += v; m2 += v * v; }
    const n = B * B, sd = Math.sqrt(Math.max(0, m2 / n - (m / n) ** 2));
    if (sd <= rules.texture) continue;
    textured++;
    const cost = (dx: number, dy: number) => { let s = 0; for (let y = 0; y < B; y++) for (let x = 0; x < B; x++) s += Math.abs(a[(by + y) * w + bx + x] - b[(by + y + dy) * w + bx + x + dx]); return s; };
    const zero = cost(0, 0);
    let best = zero, bdx = 0, bdy = 0;
    for (let dy = -S; dy <= S; dy++) for (let dx = -S; dx <= S; dx++) { if (!dx && !dy) continue; const c = cost(dx, dy); if (c < best) { best = c; bdx = dx; bdy = dy; } }
    if ((bdx || bdy) && best < 0.7 * zero && zero > 3 * n) { moved++; shifts.push(Math.hypot(bdx, bdy)); }
  }
  const mv = textured >= 3 ? moved / textured : 0;
  const label: Step["label"] = changed > rules.cutChanged && mv < rules.cutMoved ? "X" : mv >= rules.travelMoved && changed > rules.calmBelow ? "T" : changed < rules.calmBelow ? "c" : "l";
  const sorted = shifts.sort((x, y) => x - y);
  return { changed, moved: mv, textured, shift: sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0, label };
}

export interface Cadence {
  shares: { calm: number; local: number; travel: number; cut: number };
  travel: { perMinute: number; medianSeconds: number; medianSpeed: number };
  burstsPer10s: number;
  calmRuns: { medianSeconds: number; maxSeconds: number };
}

/** Cadence numbers from a string of labels at `step` seconds a step; speed from each step's median shift (px a step). */
export function cadence(labels: string, shifts: number[], step: number, pxScale: number): Cadence {
  const n = labels.length || 1, count = (c: string) => [...labels].filter((x) => x === c).length / n;
  // travel runs, closing gaps of up to 2 steps, at least 0.2 s
  const runs: Array<[number, number]> = [];
  for (let i = 0; i < labels.length; i++) {
    if (labels[i] !== "T") continue;
    let j = i; while (j + 1 < labels.length && labels[j + 1] === "T") j++;
    const last = runs[runs.length - 1];
    if (last && i - last[1] - 1 <= 2) last[1] = j; else runs.push([i, j]);
    i = j;
  }
  const travelRuns = runs.filter(([a, b]) => (b - a + 1) * step >= 0.2);
  const med = (a: number[]) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  const speeds = travelRuns.map(([a, b]) => med(shifts.slice(a, b + 1)) * pxScale / step);
  // bursts: anything but calm after at least 0.3 s of calm; calm runs
  const calmRuns: number[] = [];
  let bursts = 0, calmLen = 0;
  for (const c of labels) { if (c === "c") calmLen++; else { if (calmLen * step >= 0.3) bursts++; if (calmLen) calmRuns.push(calmLen * step); calmLen = 0; } }
  if (calmLen) calmRuns.push(calmLen * step);
  const seconds = labels.length * step;
  return {
    shares: { calm: r3(count("c")), local: r3(count("l")), travel: r3(count("T")), cut: r3(count("X")) },
    travel: { perMinute: seconds ? r3((travelRuns.length / seconds) * 60) : 0, medianSeconds: r3(med(travelRuns.map(([a, b]) => (b - a + 1) * step))), medianSpeed: Math.round(med(speeds)) },
    burstsPer10s: seconds ? r3((bursts / seconds) * 10) : 0,
    calmRuns: { medianSeconds: r3(med(calmRuns)), maxSeconds: r3(Math.max(0, ...calmRuns)) },
  };
}
const r3 = (x: number) => Math.round(x * 1000) / 1000;
