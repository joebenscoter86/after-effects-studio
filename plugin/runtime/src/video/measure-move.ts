// One measured curve into moves (stage 13): used for the tracker's match, for the ink measure, and for a built
// property, so all three are measured alike. Each move carries its three fits, the keys to apply, and two durations
// named for what they are: the fit's keys (what is set in After Effects) and the visible span (from the last frame at
// rest to the first frame settled, as a hand study counts it). A move whose start or end was not seen is partial: what
// was not seen is not measured.
import { analyzeCurve, type CurveMove, type CurveSample } from "../color/motion.js";
import { fitEaseBetween, fitEaseSeen, fitMove, fitSpringTail, keysFor, type Sample } from "./fit.js";

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface ChannelOptions {
  /** The picture's own rate (the original rate of a piece pulled up into another). */
  fps: number;
  atFps: number;
  /** The smallest travel worth a move, in the channel's unit. */
  minMove: number;
  /** The smallest change the measure can see, in the channel's unit (it sets where the visible span starts and ends). */
  epsAbs: number;
  /** Why the thing begins at this frame though nothing was measured before it: "appears" (the frame before was seen
   * empty) or "cut" (a shot starts here, and a move that is already moving here started with the shot). Else null. */
  beginsAt?: (frame: number) => "appears" | "cut" | null;
  /** True when a cut follows this frame: a move still moving on a shot's last frame ends with the shot (an ease in of 0). */
  endsAt?: (frame: number) => boolean;
  /** Where the visible span ends: the first frame that stays within this share of the travel from the end (0.02). */
  endShare?: number;
  /** A drift: speed under this share of the move's peak, and staying there (0.1, chosen on a drawn slide into a creep). */
  driftShare?: number;
  /** Speed (share of the travel a frame) over which "already moving" means the start was not seen. */
  movingSpeed?: number;
}

const r2 = (x: number) => Math.round(x * 100) / 100;
const r4 = (x: number) => Math.round(x * 10000) / 10000;
const median = (a: number[]) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

export function movesOfChannel(samples: CurveSample[], o: ChannelOptions): Json[] {
  if (samples.length < 4) return [];
  const { fps, atFps } = o, moving = o.movingSpeed ?? 0.02, gap = 2.5 / fps, at = (t: number) => r2(t * atFps);
  const report = analyzeCurve(samples, fps, { joinGap: 6 });   // a spring slows to a stop at each turn: one move
  // a slow drift after a move is not the move: where its speed falls under driftShare of its peak and stays there, in one
  // direction and not dying away (a settle decays to rest; a spring's tail turns back), the move ends and the drift is
  // its own move. Split near where the speed comes down to the drift's own.
  const drifts = new Set<CurveMove>(), handover = new Set<CurveMove>();
  const idx = (f: number) => samples.findIndex((s) => s.frame === f);
  const split = (mv: CurveMove): CurveMove[] => {
    const i0 = idx(mv.from), i1 = idx(mv.to);
    if (i0 < 0 || i1 - i0 < 8) return [mv];
    const way = samples[i1].value.map((v, d) => v - samples[i0].value[d]), L = Math.hypot(...way);
    if (L <= 0) return [mv];
    const sp: number[] = [];   // signed speed along the move's way, units a frame
    for (let k = i0; k < i1; k++) sp.push(samples[k + 1].value.reduce((a, v, d) => a + (v - samples[k].value[d]) * way[d], 0) / L / Math.max(1e-6, (samples[k + 1].time - samples[k].time) * fps));
    const pk = sp.reduce((b, v, k) => (Math.abs(v) > Math.abs(sp[b]) ? k : b), 0), peak = Math.abs(sp[pk]), share = o.driftShare ?? 0.1;
    let k = -1;
    for (let j = pk + 1; j < sp.length; j++) if (sp.slice(j).every((v) => Math.abs(v) < share * peak)) { k = j; break; }
    if (k < 0) return [mv];
    const tail = sp.slice(k), med = (a: number[]) => median(a.map(Math.abs));
    // a drift keeps its speed (the mean of its last third at least half its first third's); a settle decays
    const third = Math.max(3, Math.floor(tail.length / 3)), mean = (a: number[]) => a.reduce((x, v) => x + Math.abs(v), 0) / Math.max(1, a.length);
    if (tail.length < 6 || tail.some((v) => v < -0.25 * Math.abs(med(tail)) - 1e-9) || mean(tail.slice(-third)) < 0.5 * mean(tail.slice(0, third))) return [mv];
    // the handover: the first frame after the peak whose speed is down to 1.5 times the drift's own
    let h = k; for (let j = pk + 1; j < sp.length - 3; j++) if (Math.abs(sp[j]) <= 1.5 * med(tail)) { h = j; break; }
    const at = samples[i0 + h].frame, distOf = (f0: number, f1: number) => Math.hypot(...samples[idx(f1)].value.map((v, d) => v - samples[idx(f0)].value[d]));
    const a = { ...mv, to: at, distance: distOf(mv.from, at) }, b = { ...mv, from: at, distance: distOf(at, mv.to) };
    if (b.distance < o.minMove) return [mv];   // a drift too small to be a move of its own is the move's settle
    if (b.distance > 0.5 * a.distance) return [mv];   // and a drift is slower and shorter than the move it follows
    handover.add(a); drifts.add(b);
    return [a, b];
  };
  const moves = (report.moves as CurveMove[]).flatMap(split), out: Json[] = [];
  for (const mv of moves) {
    if (mv.distance < o.minMove) continue;
    const i0 = samples.findIndex((s) => s.frame === mv.from), i1 = samples.findIndex((s) => s.frame === mv.to);
    if (i0 < 0 || i1 <= i0) continue;
    // the moves either side (a drift split off a move starts on the move's last frame)
    const real = (x: CurveMove) => x !== mv && (x.distance >= o.minMove || drifts.has(x));   // a step too small to be a move bounds nothing
    const prevMove = [...moves].reverse().find((x) => real(x) && x.to <= mv.from), nextMove = moves.find((x) => real(x) && x.from >= mv.to);
    const restStart = prevMove ? Math.max(0, samples.findIndex((s) => s.frame === prevMove.to)) : 0;
    const restEnd = nextMove ? samples.findIndex((s) => s.frame === nextMove.from) : samples.length - 1;
    // the move's end value: the median of the rest that follows it (up to 10 samples, or the next move), else its last
    const tailVals = samples.slice(i1, Math.max(i1 + 1, Math.min(restEnd + 1, i1 + 10))).map((s) => s.value);
    const end = tailVals[0].map((_, d) => median(tailVals.map((x) => x[d])));
    const startV = samples[i0].value, way = end.map((e, d) => e - startV[d]), len2 = way.reduce((s, x) => s + x * x, 0);
    if (len2 <= 0) continue;
    const dist = Math.sqrt(len2), prog = (s: CurveSample) => s.value.reduce((acc, v, d) => acc + (v - startV[d]) * way[d], 0) / len2;
    const lo = Math.max(0, i0 - 3), hi = Math.min(samples.length - 1, i1 + 6);
    const fitS: Sample[] = samples.slice(lo, hi + 1).map((s) => ({ time: s.time, y: prog(s) }));
    const fits = fitMove(fitS, { start: samples[i0].time, end: samples[i1].time }), tail = fitSpringTail(fitS), seen = fitEaseSeen(fitS);
    const best = fits[fits.best] as Json;
    // the visible span, on a wider window: the last sample within eps of the start, the first that stays within eps of the end
    const wlo = Math.max(restStart, i0 - 12), whi = Math.min(restEnd, i1 + 15), P = samples.map((s, k) => (k >= wlo && k <= whi ? prog(s) : NaN));
    const mad = (a: number[], c: number) => median(a.map((v) => Math.abs(v - c))) * 1.4826;
    const after = P.slice(i1, whi + 1).filter(Number.isFinite), before = P.slice(wlo, i0 + 1).filter(Number.isFinite);
    const noise = Math.max(after.length >= 3 ? mad(after, 1) : 0, before.length >= 3 ? mad(before, 0) : 0);
    const eps = Math.max(3 * noise, o.epsAbs / dist, 0.0015);
    let mid = i1; for (let k = i0; k <= i1; k++) if (P[k] >= 0.5) { mid = k; break; }
    let a: number | null = null, b: number | null = null;
    for (let k = mid; k >= wlo; k--) if (Math.abs(P[k]) <= eps) { a = k; break; }
    // the end: the first sample that stays within endShare of the end value (a hand study's "visibly stopped"; the last
    // frame of any change at all is the witness's)
    const band = Math.max(eps, o.endShare ?? 0.02);
    for (let k = mid; k <= whi && b === null; k++) { let ok = true; for (let j = k; j <= whi; j++) if (Math.abs(P[j] - 1) > band) { ok = false; break; } if (ok) b = k; }
    const step = (k: number) => k + 1 < samples.length && Number.isFinite(P[k + 1]) ? (P[k + 1] - P[k]) / Math.max(1e-6, (samples[k + 1].time - samples[k].time) * fps) : 0;
    const contigBefore = (k: number) => k > 0 && samples[k].time - samples[k - 1].time <= gap;
    const contigAfter = (k: number) => k + 1 < samples.length && samples[k + 1].time - samples[k].time <= gap;
    const begins = !contigBefore(a ?? i0) ? o.beginsAt?.(samples[a ?? i0].frame) ?? null : null;
    const startSeen = a !== null && (begins !== null || contigBefore(a) || Math.abs(step(a)) <= moving);
    // a move still under way on a shot's last frame ends with the shot: its end is the cut
    const endsAtCut = !contigAfter(i1) && i1 === whi && !!o.endsAt?.(samples[i1].frame);
    if (endsAtCut && (b === null || b >= whi)) b = i1;
    // a move handed over to a drift ends where the drift begins
    const handed = handover.has(mv);
    if (handed && (b === null || b > i1)) b = i1;
    const endSeen = endsAtCut || (handed && b !== null) || (b !== null && b < whi && contigAfter(b));
    const visible = a !== null && b !== null ? samples[b].time - samples[a].time : null;
    // the frames the measure covers round the move: the unbroken run of samples that holds it
    let c0 = i0, c1 = i1;
    while (contigBefore(c0)) c0--;
    while (contigAfter(c1)) c1++;
    const keysSec = best.model === "spring" ? best.reachesEndAt - best.start : best.end - best.start;
    const m: Json = {
      curve: mv,
      from: { frame: mv.from, time: samples[i0].time, at: at(samples[i0].time) }, to: { frame: mv.to, time: samples[i1].time, at: at(samples[i1].time) },
      duration: {
        seconds: visible !== null && startSeen && endSeen ? r4(visible) : null, at: visible !== null && startSeen && endSeen ? at(visible) : null,
        as: "visible: from the last frame at rest to the first frame that stays within 2 % of the end (as the hand studies count it)",
        keys: { seconds: r4(keysSec), at: at(keysSec), as: "the fit's keys (what is set in After Effects)" },
        visible: visible === null ? null : { seconds: r4(visible), at: at(visible), fromFrame: samples[a!].frame, toFrame: samples[b!].frame, fromTime: samples[a!].time, toTime: samples[b!].time },
      },
      start: startV.map(r2), end: end.map(r2), distance: r2(dist),
      fits: { ease: fits.ease, linear: fits.linear, spring: fits.spring, springTail: tail, easeSeen: seen,
        // keys held at the visible span's ends (the last frame at rest, the first settled), the influences fitted
        easeVisible: visible !== null && visible > 0 ? fitEaseBetween(fitS, samples[a!].time, samples[b!].time) : null }, best: fits.best, margin: fits.margin,
      apply: keysFor(best as never, startV, end, atFps),
      seen: { start: startSeen, end: endSeen, begins, ...(endsAtCut ? { ends: "cut" } : handed ? { ends: "drift" } : {}) },
      ...(drifts.has(mv) ? { drift: { speed: r2(dist / Math.max(1e-6, samples[i1].time - samples[i0].time)), unit: "a second", reading: "a slow drift after the move before it, split from it" } } : {}), covers: { fromFrame: samples[c0].frame, toFrame: samples[c1].frame },
      status: "measured",
    };
    if (!startSeen) {
      const first = samples[a ?? i0];
      m.status = `partial: the start was not seen (already moving at frame ${first.frame}, the first frame measured); duration, distance and ease out are not measured, only the settle`;
      m.notMeasured = ["duration", "distance", "ease out"]; m.seenTravel = m.distance; m.distance = null; m.apply = null;
      m.settle = { end: m.end, inInfluence: (seen ?? fits.ease).inInfluence };
    } else if (!endSeen) {
      m.status = "partial: the end was not seen (still moving where the measure stops); duration, distance and ease in are not measured";
      m.notMeasured = ["duration", "distance", "ease in"]; m.seenTravel = m.distance; m.distance = null; m.apply = null;
    } else if (best.rms > 0.05) m.status = "measured, loosely (rms over 0.05)";
    out.push(m);
  }
  return out;
}
