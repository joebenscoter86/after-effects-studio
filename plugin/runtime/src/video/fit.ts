// Fitting a measured move (stage 13): After Effects' ease (two keys at zero speed, out and in influence), linear, and a
// damped spring, each with its rms on the move normalised to 0..1, the best of the three and by how much. Each fit also
// gives its values ready to apply: keys in keyframe.apply's form, and for a spring the library's spring (motion-jsx:
// value + v x amp x sin(freq x t x 2 pi) / exp(decay x t) after the last key) with its linear keys, and baked keys.
// Times are the samples' own (a variable-rate file, or a 24 fps piece inside 30 fps, keeps its real timing).

export interface Sample {
  time: number;
  /** The move's progress, 0 at its start value and 1 at its end value (may overshoot). */
  y: number;
}

/** Nelder–Mead on f, from x0 with initial steps; bounded by clamping inside f. */
export function nelderMead(f: (x: number[]) => number, x0: number[], steps: number[], iterations = 600): { x: number[]; value: number } {
  const n = x0.length;
  let simplex = [x0.slice(), ...x0.map((_, i) => x0.map((v, j) => (j === i ? v + steps[i] : v)))].map((x) => ({ x, v: f(x) }));
  for (let it = 0; it < iterations; it++) {
    simplex.sort((a, b) => a.v - b.v);
    const best = simplex[0], worst = simplex[n], second = simplex[n - 1];
    if (Math.abs(worst.v - best.v) < 1e-12) break;
    const c = Array(n).fill(0);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) c[j] += simplex[i].x[j] / n;
    const at = (t: number) => c.map((cj, j) => cj + t * (worst.x[j] - cj));
    const r = at(-1), fr = f(r);
    if (fr < best.v) { const e = at(-2), fe = f(e); simplex[n] = fe < fr ? { x: e, v: fe } : { x: r, v: fr }; continue; }
    if (fr < second.v) { simplex[n] = { x: r, v: fr }; continue; }
    const k = fr < worst.v ? at(-0.5) : at(0.5), fk = f(k);
    if (fk < Math.min(fr, worst.v)) { simplex[n] = { x: k, v: fk }; continue; }
    simplex = simplex.map((s, i) => (i === 0 ? s : { x: s.x.map((v, j) => best.x[j] + 0.5 * (v - best.x[j])), v: f(s.x.map((v, j) => best.x[j] + 0.5 * (v - best.x[j]))) }));
  }
  simplex.sort((a, b) => a.v - b.v);
  return { x: simplex[0].x, value: simplex[0].v };
}

/** After Effects' value between two keys with zero speed: time is a cubic bezier with control points at the influences. */
export function aeEase(t: number, outInfluence: number, inInfluence: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const x1 = outInfluence, x2 = 1 - inInfluence;
  const bx = (u: number) => 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u;
  let lo = 0, hi = 1;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (bx(m) < t) lo = m; else hi = m; }
  const u = (lo + hi) / 2;
  return 3 * (1 - u) * u * u + u * u * u;
}

/** A damped spring from rest at 0 to 1 (damping d per second, ringing frequency f Hz), t seconds after it starts. */
export function springFromRest(t: number, f: number, d: number): number {
  if (t <= 0) return 0;
  const w = 2 * Math.PI * f;
  return 1 - Math.exp(-d * t) * (Math.cos(w * t) + (d / w) * Math.sin(w * t));
}

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
function rmsOf(s: Sample[], model: (t: number) => number): number {
  let e = 0;
  for (const p of s) { const d = model(p.time) - p.y; e += d * d; }
  return Math.sqrt(e / Math.max(1, s.length));
}

export interface EaseFit { model: "ease"; start: number; end: number; outInfluence: number; inInfluence: number; rms: number }
export interface LinearFit { model: "linear"; start: number; end: number; rms: number }
export interface SpringFit {
  model: "spring";
  start: number;
  /** Ringing frequency (Hz) and damping (per second). */
  f: number;
  d: number;
  /** The hand study's form, from the first time the move reaches its end value: y = 1 + A e^(-d t) sin(2 pi f t). */
  A: number;
  reachesEndAt: number;
  overshoot: number;
  /** Seconds from the start until it stays within 2 % of its end. */
  settle: number;
  rms: number;
}
export type Fit = EaseFit | LinearFit | SpringFit;

/** The three fits of one move, the best (lowest rms) and how much better it is than the next (ratio of their rms). */
export function fitMove(s: Sample[], guess: { start: number; end: number }): { ease: EaseFit; linear: LinearFit; spring: SpringFit; best: Fit["model"]; margin: number } {
  const dur0 = Math.max(1e-3, guess.end - guess.start), tSpan = s.length ? s[s.length - 1].time - s[0].time : dur0;
  // ease: start, end, out, in (influences 1..100 %)
  const fe = (x: number[]) => {
    const a = x[0], b = Math.max(a + 1e-3, x[1]), o = clamp(x[2], 0.01, 1), i = clamp(x[3], 0.01, 1);
    return rmsOf(s, (t) => aeEase((t - a) / (b - a), o, i));
  };
  let bestE = { x: [guess.start, guess.end, 0.33, 0.33], value: Infinity };
  for (const o0 of [0.15, 0.33, 0.6, 0.85]) for (const i0 of [0.15, 0.33, 0.6, 0.85]) {
    const r = nelderMead(fe, [guess.start, guess.end, o0, i0], [dur0 * 0.1, dur0 * 0.1, 0.1, 0.1]);
    if (r.value < bestE.value) bestE = r;
  }
  const ease: EaseFit = { model: "ease", start: bestE.x[0], end: Math.max(bestE.x[0] + 1e-3, bestE.x[1]), outInfluence: Math.round(clamp(bestE.x[2], 0.01, 1) * 1000) / 10, inInfluence: Math.round(clamp(bestE.x[3], 0.01, 1) * 1000) / 10, rms: bestE.value };
  const fl = (x: number[]) => { const a = x[0], b = Math.max(a + 1e-3, x[1]); return rmsOf(s, (t) => clamp((t - a) / (b - a), 0, 1)); };
  const rl = nelderMead(fl, [guess.start, guess.end], [dur0 * 0.1, dur0 * 0.1]);
  const linear: LinearFit = { model: "linear", start: rl.x[0], end: Math.max(rl.x[0] + 1e-3, rl.x[1]), rms: rl.value };
  // spring from rest: start, f (Hz), d (per second)
  const fs = (x: number[]) => { const f = clamp(x[1], 0.2, 20), d = clamp(x[2], 0.1, 60); return rmsOf(s, (t) => springFromRest(t - x[0], f, d)); };
  let bestS = { x: [guess.start, 2, 6], value: Infinity };
  for (const f0 of [0.8, 1.5, 3, 6]) for (const d0 of [2, 5, 10, 20]) {
    const r = nelderMead(fs, [guess.start, f0, d0], [dur0 * 0.1, f0 * 0.3, d0 * 0.3]);
    if (r.value < bestS.value) bestS = r;
  }
  const f = clamp(bestS.x[1], 0.2, 20), d = clamp(bestS.x[2], 0.1, 60), w = 2 * Math.PI * f;
  const tc = (Math.PI / 2 + Math.atan(d / w)) / w;   // the first time it reaches 1
  const peakT = Math.PI / w, overshoot = Math.max(0, springFromRest(peakT, f, d) - 1);
  let settle = tSpan;
  for (let t = 0; t < 30; t += 0.001) { if (Math.exp(-d * t) * Math.sqrt(1 + (d / w) ** 2) < 0.02) { settle = t; break; } }
  const spring: SpringFit = { model: "spring", start: bestS.x[0], f: Math.round(f * 1000) / 1000, d: Math.round(d * 1000) / 1000,
    A: Math.round(Math.sqrt(1 + (d / w) ** 2) * Math.exp(-d * tc) * 1000) / 1000, reachesEndAt: bestS.x[0] + tc, overshoot: Math.round(overshoot * 1000) / 1000, settle, rms: bestS.value };
  const ranked = [ease, linear, spring].sort((a, b) => a.rms - b.rms);
  return { ease, linear, spring, best: ranked[0].model, margin: ranked[0].rms > 0 ? Math.round((ranked[1].rms / ranked[0].rms) * 100) / 100 : Infinity };
}

/**
 * The move as seen: its keys where it crosses `lo` and `1 - lo` of its travel (interpolated between samples, so a
 * 24 fps source is not rounded to its frames), the influences fitted with the keys held there. This is how a hand study
 * times a move, from when it visibly starts to when it visibly stops; tuned on the hand study (1.5 % put six of seven
 * of its timed moves within two frames). The free fit's keys (fitMove) are the ones that rebuild the curve exactly.
 */
export function fitEaseSeen(s: Sample[], lo = 0.015): (EaseFit & { seen: true }) | null {
  const cross = (th: number, from = 1) => { for (let k = Math.max(1, from); k < s.length; k++) if (s[k].y >= th && s[k - 1].y < th) return { k, t: s[k - 1].time + ((th - s[k - 1].y) / (s[k].y - s[k - 1].y)) * (s[k].time - s[k - 1].time) }; return null; };
  const c0 = cross(lo), c1 = c0 ? cross(1 - lo, c0.k) : null;
  if (!c0 || !c1 || c1.t <= c0.t) return null;
  const a = c0.t, b = c1.t;
  const f = (x: number[]) => { const o = clamp(x[0], 0.01, 1), i = clamp(x[1], 0.01, 1); return rmsOf(s, (t) => aeEase((t - a) / (b - a), o, i)); };
  let best = { x: [0.33, 0.33], value: Infinity };
  for (const o0 of [0.1, 0.33, 0.6, 0.9]) for (const i0 of [0.1, 0.33, 0.6, 0.9]) { const r = nelderMead(f, [o0, i0], [0.1, 0.1], 300); if (r.value < best.value) best = r; }
  return { model: "ease", seen: true, start: a, end: b, outInfluence: Math.round(clamp(best.x[0], 0.01, 1) * 1000) / 10, inInfluence: Math.round(clamp(best.x[1], 0.01, 1) * 1000) / 10, rms: best.value };
}

/**
 * The hand study's spring on a move's tail: from the first sample at or past its end value, y - 1 = A e^(-d t) sin(2 pi f t).
 * null when the move does not overshoot.
 */
export function fitSpringTail(s: Sample[]): { A: number; f: number; d: number; from: number; rms: number } | null {
  const i0 = s.findIndex((p) => p.y >= 1);
  if (i0 < 0 || !s.slice(i0).some((p) => p.y > 1.01)) return null;
  // the crossing itself, between the samples either side (the model's sine is zero there)
  const t0 = i0 > 0 ? s[i0 - 1].time + ((1 - s[i0 - 1].y) / (s[i0].y - s[i0 - 1].y)) * (s[i0].time - s[i0 - 1].time) : s[i0].time;
  const tail = s.slice(i0).map((p) => ({ time: p.time - t0, y: p.y }));
  const fe = (x: number[]) => { const A = x[0], f = clamp(x[1], 0.1, 20), d = clamp(x[2], 0, 60); return rmsOf(tail, (t) => 1 + A * Math.exp(-d * t) * Math.sin(2 * Math.PI * f * t)); };
  // a starting frequency from the tail's own crossings of its end value (half a period apart), plus a spread of others
  const cross: number[] = [];
  for (let i = 1; i < tail.length; i++) if ((tail[i - 1].y - 1) * (tail[i].y - 1) < 0) {
    const a = tail[i - 1], b = tail[i]; cross.push(a.time + ((1 - a.y) / (b.y - a.y)) * (b.time - a.time)); }
  const fGuess = cross.length >= 1 ? 1 / (2 * (cross.length >= 2 ? (cross[cross.length - 1] - cross[0]) / (cross.length - 1) : cross[0])) : 1.5;
  const peak = Math.max(...tail.map((p) => p.y)) - 1;
  let best = { x: [peak, fGuess, 5], value: Infinity };
  for (const f0 of [fGuess, 0.8, 1.5, 3, 6]) for (const d0 of [1, 2, 5, 10]) for (const a0 of [peak, peak * 2]) {
    const r = nelderMead(fe, [a0, f0, d0], [a0 * 0.3, f0 * 0.3, d0 * 0.3]); if (r.value < best.value) best = r; }
  return { A: Math.round(best.x[0] * 1000) / 1000, f: Math.round(clamp(best.x[1], 0.1, 20) * 1000) / 1000, d: Math.round(clamp(best.x[2], 0, 60) * 1000) / 1000, from: t0, rms: best.value };
}

/** keyframe.apply's form for a fit, between value a and value b (numbers or arrays), plus the library spring and baked keys. */
export function keysFor(fit: Fit, a: number[], b: number[], fps: number): Record<string, unknown> {
  const v = (k: number) => a.map((x, i) => Math.round((x + (b[i] - x) * k) * 1000) / 1000);
  const one = (x: number[]) => (x.length === 1 ? x[0] : x);
  if (fit.model === "ease")
    return { keys: [{ time: r4(fit.start), value: one(v(0)), interp: "ease", outInfluence: fit.outInfluence, outSpeed: 0 }, { time: r4(fit.end), value: one(v(1)), interp: "ease", inInfluence: fit.inInfluence, inSpeed: 0 }] };
  if (fit.model === "linear") return { keys: [{ time: r4(fit.start), value: one(v(0)), interp: "linear" }, { time: r4(fit.end), value: one(v(1)), interp: "linear" }] };
  // the library's spring (motion-jsx): linear keys from the start to the moment it first reaches the end, arriving at
  // speed v, then value + v * amp * sin(freq * t * 2 pi) / exp(decay * t). amp maps A: A * distance = v * amp.
  const rise = Math.max(1e-3, fit.reachesEndAt - fit.start), baked: Array<Record<string, unknown>> = [];
  for (let t = fit.start; t <= fit.start + fit.settle + 1 / fps; t += 1 / fps) baked.push({ time: r4(t), value: one(v(springFromRest(t - fit.start, fit.f, fit.d))), interp: "linear" });
  return {
    keys: [{ time: r4(fit.start), value: one(v(0)), interp: "linear" }, { time: r4(fit.reachesEndAt), value: one(v(1)), interp: "linear" }],
    librarySpring: { freq: fit.f, decay: fit.d, amp: Math.round(fit.A * rise * 10000) / 10000, form: "value + v * amp * sin(freq * t * 2 * PI) / exp(decay * t) after the last key (motion-jsx spring)" },
    baked,
  };
}
const r4 = (x: number) => Math.round(x * 10000) / 10000;
