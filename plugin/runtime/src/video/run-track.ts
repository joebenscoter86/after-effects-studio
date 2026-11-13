// video.track: follow one region of a video file across a span and measure its moves (stage 13).
import { promises as fs } from "node:fs";
import path from "node:path";

import { analyzeCurve, type CurveMove, type CurveSample } from "../color/motion.js";
import { cadenceOf, meanDiff, NO_FFMPEG, probeVideo, readFrames, type VideoInfo, type VideoTools, VIDEO_TOOLS } from "./decode.js";
import { fitMove, fitSpringTail, keysFor, type Sample } from "./fit.js";
import { matchTemplate, refineScale, resize, scaleSet, type Match } from "./track.js";

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export const NOT_MEASURED = ["rotation", "skew and perspective", "motion blur and its shutter", "colour and tint change", "depth (3D)", "anything outside the region's own picture (shadows, reflections)"];

/** Region as [x, y, w, h] in source pixels, or as shares of the frame when every value is 1 or under. */
export function regionPx(r: unknown, w: number, h: number): [number, number, number, number] | null {
  const a = Array.isArray(r) ? r.map(Number) : r && typeof r === "object" ? ["x", "y", "w", "h"].map((k) => Number((r as Json)[k])) : null;
  if (!a || a.length !== 4 || a.some((v) => !Number.isFinite(v)) || a[2] <= 0 || a[3] <= 0) return null;
  const share = a.every((v) => v <= 1);
  return share ? [a[0] * w, a[1] * h, a[2] * w, a[3] * h] : (a as [number, number, number, number]);
}

/** The file's frame at a time (seconds from its first frame): the last frame that starts at or before it. */
export function frameAt(info: VideoInfo, t: number): number {
  let lo = 0, hi = info.frames - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (info.times[m] <= t + 1e-6) lo = m; else hi = m - 1; }
  return lo;
}

export interface TrackOptions { tools?: VideoTools; workLong?: number; minNcc?: number }

export async function runTrack(args: Json, opts: TrackOptions = {}): Promise<Json> {
  const tools = opts.tools ?? VIDEO_TOOLS, minNcc = opts.minNcc ?? 0.5;
  if (typeof args.file !== "string" || !path.isAbsolute(args.file)) return { ok: false, error: "`file` must be an absolute path to a video file" };
  if (typeof args.outDir !== "string" || !path.isAbsolute(args.outDir)) return { ok: false, error: "`outDir` must be an absolute folder path" };
  const started = performance.now();
  const info = await probeVideo(args.file, tools);
  if (info === null) return { ok: false, error: NO_FFMPEG };
  if ("error" in info) return { ok: false, error: info.error };
  const reg = regionPx(args.region, info.width, info.height);
  if (!reg) return { ok: false, error: "`region` must be [x, y, width, height] in pixels, or as shares of the frame (all 1 or under), round the thing in the reference frame" };
  const atFps = typeof args.atFps === "number" && args.atFps > 0 ? args.atFps : 30;
  const f0 = typeof args.start === "number" ? frameAt(info, args.start) : 0, f1 = typeof args.end === "number" ? frameAt(info, args.end) : info.frames - 1;
  if (f1 <= f0) return { ok: false, error: "`end` must be after `start`" };
  const refF = typeof args.ref === "number" ? frameAt(info, args.ref) : f1;
  const k = Math.min(1, (opts.workLong ?? 480) / Math.max(info.width, info.height)), W = Math.max(8, Math.round(info.width * k)), H = Math.max(8, Math.round(info.height * k));
  const sr = Array.isArray(args.scaleRange) && args.scaleRange.length === 2 ? (args.scaleRange as number[]).map(Number) : [0.5, 2];
  // the template: the region of the reference frame, at working resolution
  let ref: Float64Array | null = null;
  for await (const fr of readFrames(info, { from: refF, to: refF, width: W, height: H, gray: true }, tools)) ref = Float64Array.from(fr.data);
  if (!ref) return { ok: false, error: `could not read frame ${refF} of ${args.file}` };
  const tx = Math.round(reg[0] * k), ty = Math.round(reg[1] * k), tw = Math.max(4, Math.round(reg[2] * k)), th = Math.max(4, Math.round(reg[3] * k));
  const tmpl = new Float64Array(tw * th);
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) tmpl[y * tw + x] = ref[Math.min(H - 1, ty + y) * W + Math.min(W - 1, tx + x)];
  // match every frame: near the last match first (a crop round it), then the whole frame
  const rows: Array<{ index: number; time: number; m: Match | null; diff: number; still?: number }> = [];
  let prev: Match | null = null, last: Uint8Array | null = null;
  for await (const fr of readFrames(info, { from: f0, to: f1, width: W, height: H, gray: true }, tools)) {
    const img = Float64Array.from(fr.data), diff = last ? meanDiff(fr.data, last) : 0;
    let m: Match | null = null;
    if (prev) {
      const r = Math.max(6, Math.round(0.08 * Math.max(W, H))), sw = Math.ceil(tw * prev.scale * 1.15), sh = Math.ceil(th * prev.scale * 1.15);
      const cx0 = Math.max(0, Math.floor(prev.x - r - sw / 2)), cy0 = Math.max(0, Math.floor(prev.y - r - sh / 2));
      const cw = Math.min(W - cx0, Math.ceil(2 * r + sw)), ch = Math.min(H - cy0, Math.ceil(2 * r + sh));
      const crop = new Float64Array(cw * ch);
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) crop[y * cw + x] = img[(cy0 + y) * W + cx0 + x];
      const local = matchTemplate(crop, cw, ch, tmpl, tw, th, scaleSet(prev.scale / 1.04, prev.scale * 1.04, 9));
      if (local) m = { ...local, x: local.x + cx0, y: local.y + cy0 };
    }
    if (!m || m.ncc < minNcc) { const g = matchTemplate(img, W, H, tmpl, tw, th, scaleSet(sr[0], sr[1], 25)); if (g && (!m || g.ncc > m.ncc)) m = g; }
    if (m && m.ncc >= minNcc) m = refineScale(img, W, H, tmpl, tw, th, m, 1.01);
    // not matched (at 0 % opacity nothing can be): its opacity is still read in place, the window at the reference
    // position regressed on the template, so a fade has its frames at rest before it
    let still: number | undefined;
    if (!m || m.ncc < minNcc) {
      let mean = 0; for (let i = 0; i < tmpl.length; i++) mean += tmpl[i]; mean /= tmpl.length;
      let cov = 0, tv = 0, wm = 0; for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) wm += img[Math.min(H - 1, ty + y) * W + Math.min(W - 1, tx + x)]; wm /= tw * th;
      for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) { const t = tmpl[y * tw + x] - mean, v = img[Math.min(H - 1, ty + y) * W + Math.min(W - 1, tx + x)] - wm; cov += t * v; tv += t * t; }
      still = tv > 1e-6 ? Math.max(0, Math.min(1.5, cov / tv)) : 0;
    }
    rows.push({ index: fr.index, time: fr.time, m: m && m.ncc >= minNcc ? m : null, diff, still });
    if (m && m.ncc >= minNcc) prev = m;
    last = fr.data;
  }
  const decodeSeconds = (performance.now() - started) / 1000;
  // repeats and cadence (on the frame-to-frame differences)
  const cad = cadenceOf(rows.map((r) => r.diff), 1 / (info.intervals.median || 1 / 30));
  const rep = new Set(cad.repeats.map((i) => rows[i].index));
  // lost: matched, then three frames in a row not matched while the last matches were still clearly visible
  let lost: { frame: number; time: number; reading: string } | null = null;
  for (let i = 1; i + 2 < rows.length; i++) if (rows[i - 1].m && !rows[i].m && !rows[i + 1].m && !rows[i + 2].m && (rows[i - 1].m!.opacity ?? 1) > 0.35) {
    lost = { frame: rows[i].index, time: rows[i].time, reading: `Lost the region at frame ${rows[i].index} (${(rows[i].time).toFixed(3)} s): the match fell under ${minNcc} while it was still visible; nothing past it is measured.` };
    break;
  }
  const usable = rows.filter((r) => r.m && !rep.has(r.index) && (!lost || r.index < lost.frame));
  const toSrc = (m: Match) => ({ x: (m.x) / k, y: (m.y) / k, scale: m.scale * 100, opacity: m.opacity * 100 });
  const channels: Array<{ name: string; unit: string; value: (m: Match) => number[] }> = [
    { name: "position", unit: "px", value: (m) => { const s = toSrc(m); return [s.x, s.y]; } },
    { name: "scale", unit: "%", value: (m) => [toSrc(m).scale] },
    { name: "opacity", unit: "%", value: (m) => [toSrc(m).opacity] },
  ];
  const at = (t: number) => Math.round(t * atFps * 100) / 100;
  const out: Json = { ok: true, file: args.file, region: reg, span: { from: f0, to: f1, start: info.times[f0], end: info.times[f1] }, ref: refF, atFps,
    video: { width: info.width, height: info.height, frames: info.frames, nominalFps: info.nominalFps, averageFps: Math.round(info.averageFps * 1000) / 1000, variableRate: info.variableRate, intervals: info.intervals },
    cadence: { repeats: [...rep], period: cad.period, originalFps: cad.originalFps, reading: cad.reading },
    lost, notMeasured: NOT_MEASURED, moves: [] as Json[] };
  const fps = cad.originalFps ?? 1 / (info.intervals.median || 1 / 30);
  for (const ch of channels) {
    const samples: CurveSample[] = ch.name === "opacity"
      ? rows.filter((r) => !rep.has(r.index) && (!lost || r.index < lost.frame) && (r.m || r.still !== undefined)).map((r) => ({ frame: r.index, time: r.time, value: r.m ? ch.value(r.m) : [r.still! * 100] }))
      : usable.map((r) => ({ frame: r.index, time: r.time, value: ch.value(r.m!) }));
    if (samples.length < 4) continue;
    const span = Math.max(...samples.map((s) => s.value[0])) - Math.min(...samples.map((s) => s.value[0]));
    const span2 = samples[0].value.length > 1 ? Math.max(...samples.map((s) => s.value[1])) - Math.min(...samples.map((s) => s.value[1])) : 0;
    const minMove = ch.name === "position" ? Math.max(2, 0.004 * Math.max(info.width, info.height)) : 2;   // px, or % points
    if (Math.max(span, span2) < minMove) continue;
    const report = analyzeCurve(samples, fps, { joinGap: 6 });   // a spring slows to a stop at each turn: one move
    for (const mv of report.moves as CurveMove[]) {
      if (mv.distance < minMove) continue;
      const i0 = samples.findIndex((s) => s.frame === mv.from), i1 = samples.findIndex((s) => s.frame === mv.to);
      if (i0 < 0 || i1 <= i0) continue;
      // the move's end value: the median of the rest that follows it (up to 10 frames, or the next move), else its last frame
      const nextMove = (report.moves as CurveMove[]).find((x) => x.from > mv.to), restEnd = nextMove ? samples.findIndex((s) => s.frame === nextMove.from) : samples.length - 1;
      const tailVals = samples.slice(i1, Math.max(i1 + 1, Math.min(restEnd + 1, i1 + 10))).map((s) => s.value);
      const end = tailVals[0].map((_, d) => { const v = tailVals.map((x) => x[d]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; });
      const startV = samples[i0].value, way = end.map((e, d) => e - startV[d]), len2 = way.reduce((s, x) => s + x * x, 0);
      if (len2 <= 0) continue;
      const lo = Math.max(0, i0 - 3), hi = Math.min(samples.length - 1, i1 + 6);
      const prog: Sample[] = samples.slice(lo, hi + 1).map((s) => ({ time: s.time, y: s.value.reduce((acc, v, d) => acc + (v - startV[d]) * way[d], 0) / len2 }));
      const fits = fitMove(prog, { start: samples[i0].time, end: samples[i1].time }), tail = fitSpringTail(prog);
      const best = fits[fits.best];
      out.moves.push({
        channel: ch.name, unit: ch.unit,
        curve: mv,
        from: { frame: mv.from, time: samples[i0].time, at: at(samples[i0].time) }, to: { frame: mv.to, time: samples[i1].time, at: at(samples[i1].time) },
        duration: { seconds: Math.round((best.model === "spring" ? (best as Json).settle : (best as Json).end - best.start) * 10000) / 10000, at: at(best.model === "spring" ? (best as Json).settle : (best as Json).end - best.start) },
        start: startV.map((v) => Math.round(v * 100) / 100), end: end.map((v) => Math.round(v * 100) / 100),
        distance: Math.round(Math.sqrt(len2) * 100) / 100,
        fits: { ease: fits.ease, linear: fits.linear, spring: fits.spring, springTail: tail }, best: fits.best, margin: fits.margin,
        apply: keysFor(best, startV, end, atFps),
        status: best.rms <= 0.05 ? "measured" : "measured, loosely (rms over 0.05)",
      });
    }
  }
  await fs.mkdir(args.outDir, { recursive: true });
  const jsonPath = path.join(args.outDir, "track.json"), csvPath = path.join(args.outDir, "track.csv");
  const perFrame = rows.map((r) => ({ index: r.index, time: Math.round(r.time * 1e6) / 1e6, at: at(r.time), repeat: rep.has(r.index), ...(r.m ? { ...Object.fromEntries(Object.entries(toSrc(r.m)).map(([a, v]) => [a, Math.round(v * 100) / 100])), ncc: Math.round(r.m.ncc * 1000) / 1000 } : { matched: false }) }));
  await fs.writeFile(jsonPath, JSON.stringify({ ...out, frames: perFrame }, null, 1));
  await fs.writeFile(csvPath, ["index,time,at,x,y,scale,opacity,ncc,repeat", ...perFrame.map((p: Json) => [p.index, p.time, p.at, p.x ?? "", p.y ?? "", p.scale ?? "", p.opacity ?? "", p.ncc ?? "", p.repeat ? 1 : 0].join(","))].join("\n"));
  const seconds = Math.round(((performance.now() - started) / 1000) * 100) / 100;
  return { ...out, files: { json: jsonPath, csv: csvPath }, timings: { seconds, decodeAndMatchSeconds: Math.round(decodeSeconds * 100) / 100, frames: rows.length },
    reading: `${out.moves.length} move${out.moves.length === 1 ? "" : "s"} measured over frames ${f0} to ${f1}${lost ? `; ${lost.reading}` : ""}. ${cad.reading} Not measured: ${NOT_MEASURED.join(", ")}.` };
}
