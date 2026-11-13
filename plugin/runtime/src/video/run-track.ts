// video.track: follow one region of a video file across a span and measure its moves (stage 13).
import { promises as fs } from "node:fs";
import path from "node:path";

import { type CurveSample } from "../color/motion.js";
import { cadenceOf, meanDiff, NO_FFMPEG, probeVideo, readFrames, type VideoInfo, type VideoTools, VIDEO_TOOLS } from "./decode.js";
import { INK_CURVES, inkLike, inkOf, inkValue, witnessRuns, type InkCurve, type InkFrame, type InkMask } from "./ink.js";
import { movesOfChannel } from "./measure-move.js";
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

const r2 = (x: number) => Math.round(x * 100) / 100;

function statusCount(moves: Json[]): string {
  const n = (p: string) => moves.filter((m) => String(m.status).startsWith(p)).length;
  return `${n("measured")} measured, ${n("uncertain")} uncertain, ${n("partial")} partial`;
}

export interface TrackOptions { tools?: VideoTools; workLong?: number; minNcc?: number }

export async function runTrack(args: Json, opts: TrackOptions = {}): Promise<Json> {
  const tools = opts.tools ?? VIDEO_TOOLS, minNcc = opts.minNcc ?? 0.8;   // under it a match is no match (a wrong lock read 0.6 to 0.8 on real files)
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
  const sr = Array.isArray(args.scaleRange) && args.scaleRange.length === 2 ? (args.scaleRange as number[]).map(Number) : [0.25, 2.5];
  // the template: the region of the reference frame, at working resolution
  let ref: Float64Array | null = null;
  for await (const fr of readFrames(info, { from: refF, to: refF, width: W, height: H, gray: true }, tools)) ref = Float64Array.from(fr.data);
  if (!ref) return { ok: false, error: `could not read frame ${refF} of ${args.file}` };
  const tx = Math.round(reg[0] * k), ty = Math.round(reg[1] * k), tw = Math.max(4, Math.round(reg[2] * k)), th = Math.max(4, Math.round(reg[3] * k));
  const tmpl = new Float64Array(tw * th);
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) tmpl[y * tw + x] = ref[Math.min(H - 1, ty + y) * W + Math.min(W - 1, tx + x)];
  // match every frame: near the last match first (a crop round it), then the whole frame
  const rows: Array<{ index: number; time: number; m: Match | null; diff: number; cutDiff: number; still?: number }> = [];
  let prev: Match | null = null, last: Uint8Array | null = null, lastSmall: Float64Array | null = null;
  for await (const fr of readFrames(info, { from: f0, to: f1, width: W, height: H, gray: true }, tools)) {
    const img = Float64Array.from(fr.data), diff = last ? meanDiff(fr.data, last) : 0;
    // the change video.shots reads cuts by: on a 64 x 36 picture (at full size a busy move reads as a cut)
    const small = resize(img, W, H, 64, 36);
    let cutDiff = 0; if (lastSmall) { for (let i = 0; i < small.length; i++) cutDiff += Math.abs(small[i] - lastSmall[i]); cutDiff /= small.length; }
    lastSmall = small;
    let m: Match | null = null;
    if (prev) {
      const r = Math.max(6, Math.round(0.08 * Math.max(W, H))), sw = Math.ceil(tw * prev.scale * 1.35), sh = Math.ceil(th * prev.scale * 1.35);
      const cx0 = Math.max(0, Math.floor(prev.x - r - sw / 2)), cy0 = Math.max(0, Math.floor(prev.y - r - sh / 2));
      const cw = Math.min(W - cx0, Math.ceil(2 * r + sw)), ch = Math.min(H - cy0, Math.ceil(2 * r + sh));
      const crop = new Float64Array(cw * ch);
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) crop[y * cw + x] = img[(cy0 + y) * W + cx0 + x];
      // round the last scale; when the best lands on the window's edge, the window moves on (a fast scale changes more
      // than 4 % a frame) until the peak is inside it
      let centre = prev.scale, local = matchTemplate(crop, cw, ch, tmpl, tw, th, scaleSet(centre / 1.04, centre * 1.04, 9));
      for (let k2 = 0; k2 < 6 && local && Math.abs(Math.log(local.scale / centre)) > Math.log(1.04) - 1e-6; k2++) {
        centre = local.scale > centre ? centre * 1.07 : centre / 1.07;
        const next = matchTemplate(crop, cw, ch, tmpl, tw, th, scaleSet(centre / 1.04, centre * 1.04, 9));
        if (!next || next.ncc < local.ncc) break;
        local = next;
      }
      // a weak match (under 0.92) is often a scale the window could not reach: a wider window, then a fine pass
      if (local && local.ncc < 0.92) {
        const wide = matchTemplate(crop, cw, ch, tmpl, tw, th, scaleSet(prev.scale / 1.3, prev.scale * 1.3, 15));
        if (wide && wide.ncc > local.ncc) {
          const fine = matchTemplate(crop, cw, ch, tmpl, tw, th, scaleSet(wide.scale / 1.03, wide.scale * 1.03, 7));
          local = fine && fine.ncc >= wide.ncc ? fine : wide;
        }
      }
      if (local) m = { ...local, x: local.x + cx0, y: local.y + cy0 };
    }
    if (!m || m.ncc < minNcc) {
      let g = matchTemplate(img, W, H, tmpl, tw, th, scaleSet(sr[0], sr[1], 33));
      // the whole-frame search steps about 7 % between scales: a finer pass round its answer
      if (g) { const fine = matchTemplate(img, W, H, tmpl, tw, th, scaleSet(g.scale / 1.05, g.scale * 1.05, 11), { x: g.x, y: g.y, r: 4 }); if (fine && fine.ncc >= g.ncc) g = fine; }
      if (g && (!m || g.ncc > m.ncc)) m = g;
    }
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
    rows.push({ index: fr.index, time: fr.time, m: m && m.ncc >= minNcc ? m : null, diff, cutDiff, still });
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
  // cuts (as video.shots finds them: a change of 12 or more, 4 times the median of the 12 frames each side): no move
  // spans one, and a move already moving on a shot's first frame started with the shot
  const cutAt = new Set<number>();
  for (let i = 1; i < rows.length; i++) {
    const near = rows.slice(Math.max(1, i - 12), Math.min(rows.length, i + 13)).filter((_, j, a) => a[j] !== rows[i]).map((r) => r.cutDiff).sort((a, b) => a - b);
    const med = near.length ? near[Math.floor(near.length / 2)] : 0;
    if (rows[i].cutDiff >= 12 && rows[i].cutDiff >= 4 * Math.max(med, 0.5)) cutAt.add(rows[i].index);
  }
  const cutList = [...cutAt].sort((a, b) => a - b);
  const segments = (s: CurveSample[]): CurveSample[][] => {
    const out: CurveSample[][] = [[]];
    for (const x of s) { if (out[out.length - 1].length && cutList.some((c) => c > out[out.length - 1][out[out.length - 1].length - 1].frame && c <= x.frame)) out.push([]); out[out.length - 1].push(x); }
    return out.filter((x) => x.length >= 4);
  };
  const usable = rows.filter((r) => r.m && !rep.has(r.index) && (!lost || r.index < lost.frame));
  const toSrc = (m: Match) => ({ x: (m.x) / k, y: (m.y) / k, scale: m.scale * 100, opacity: m.opacity * 100 });
  const channels: Array<{ name: string; unit: string; value: (m: Match) => number[]; epsAbs: number }> = [
    { name: "position", unit: "px", value: (m) => { const s = toSrc(m); return [s.x, s.y]; }, epsAbs: 0.25 / k },
    { name: "scale", unit: "%", value: (m) => [toSrc(m).scale], epsAbs: 0.3 },
    { name: "opacity", unit: "%", value: (m) => [toSrc(m).opacity], epsAbs: 1 },
  ];
  const at = (t: number) => Math.round(t * atFps * 100) / 100;
  const out: Json = { ok: true, file: args.file, region: reg, span: { from: f0, to: f1, start: info.times[f0], end: info.times[f1] }, ref: refF, atFps,
    video: { width: info.width, height: info.height, frames: info.frames, nominalFps: info.nominalFps, averageFps: Math.round(info.averageFps * 1000) / 1000, variableRate: info.variableRate, intervals: info.intervals },
    cadence: { repeats: [...rep], period: cad.period, originalFps: cad.originalFps, reading: cad.reading },
    cuts: cutList, lost, notMeasured: NOT_MEASURED, moves: [] as Json[] };
  const fps = cad.originalFps ?? 1 / (info.intervals.median || 1 / 30);
  for (const ch of channels) {
    const samples: CurveSample[] = ch.name === "opacity"
      ? rows.filter((r) => !rep.has(r.index) && (!lost || r.index < lost.frame) && (r.m || r.still !== undefined)).map((r) => ({ frame: r.index, time: r.time, value: r.m ? ch.value(r.m) : [r.still! * 100] }))
      : usable.map((r) => ({ frame: r.index, time: r.time, value: ch.value(r.m!) }));
    if (samples.length < 4) continue;
    const minMove = ch.name === "position" ? Math.max(2, 0.004 * Math.max(info.width, info.height)) : 2;   // px, or % points
    for (const mv of segments(samples).flatMap((seg) => movesOfChannel(seg, { fps, atFps, minMove, epsAbs: ch.epsAbs, beginsAt: (f) => (cutAt.has(f) ? "cut" : null), endsAt: (f) => cutAt.has(f + 1) }))) {
      const n = usable.filter((r) => r.index >= mv.from.frame && r.index <= mv.to.frame).map((r) => r.m!.ncc).sort((a, b) => a - b);
      out.moves.push({ measure: "match", channel: ch.name, unit: ch.unit, ...mv,
        match: n.length ? { median: Math.round(n[Math.floor(n.length / 2)] * 1000) / 1000, min: Math.round(n[0] * 1000) / 1000 } : null });
    }
  }
  // a move matched weakly is not a measurement: under 0.85 at the median it is marked uncertain
  for (const mv of out.moves as Json[]) if (mv.match && mv.match.median < 0.85 && !String(mv.status).startsWith("partial")) mv.status = `uncertain: the region matched weakly (median ${mv.match.median}); look at the frames before using it`;
  // opacity read in place (the region's rest position, where nothing matched) while the region was moving is not a fade:
  // an entrance or an exit reads as one there
  const inPlace = new Set(rows.filter((r) => !r.m && r.still !== undefined).map((r) => r.index));
  for (const mv of (out.moves as Json[]).filter((x) => x.channel === "opacity" && !String(x.status).startsWith("partial"))) {
    const a0 = mv.duration.visible?.fromFrame ?? mv.from.frame, b0 = mv.duration.visible?.toFrame ?? mv.to.frame;
    const placed = [...inPlace].some((f) => f >= a0 && f <= b0);
    const moved = (out.moves as Json[]).some((x) => x.channel === "position" && x.covers.fromFrame <= b0 + 2 && x.to.frame >= a0);
    if (placed && moved) mv.status = "uncertain: the opacity was read where the region rests while it was moving there; an entrance or exit reads as a fade";
  }

  // the ink measure: a mask in a fixed box, measured per frame at the source's own pixels (up to 720 on the long side)
  const inkRows: Array<{ index: number; time: number; f: InkFrame }> = [];
  let inkBox: [number, number, number, number] | null = null;
  if (args.ink && typeof args.ink === "object") {
    const ink = args.ink as Json, mask = (ink.mask ?? {}) as InkMask;
    const raw = regionPx(ink.box ?? args.region, info.width, info.height);
    if (!raw) return { ok: false, error: "`ink.box` must be [x, y, width, height] in pixels or shares of the frame" };
    const bx = Math.max(0, Math.floor(raw[0])), by = Math.max(0, Math.floor(raw[1]));
    const bw = Math.max(2, Math.min(info.width - bx, Math.round(raw[2]))), bh = Math.max(2, Math.min(info.height - by, Math.round(raw[3])));
    inkBox = [bx, by, bw, bh];
    const kb = Math.min(1, 720 / Math.max(bw, bh)), ow = Math.max(2, Math.round(bw * kb)), oh = Math.max(2, Math.round(bh * kb));
    let empty: Uint8Array | undefined;
    if (typeof mask.empty === "number") {
      const ef = frameAt(info, mask.empty);
      for await (const fr of readFrames(info, { from: ef, to: ef, crop: inkBox, width: ow, height: oh }, tools)) empty = Uint8Array.from(fr.data);
      if (!empty) return { ok: false, error: `could not read the empty frame at ${mask.empty} s` };
    }
    for await (const fr of readFrames(info, { from: f0, to: f1, crop: inkBox, width: ow, height: oh }, tools))
      inkRows.push({ index: fr.index, time: fr.time, f: inkOf(fr.data, ow, oh, mask, { k: kb, ox: bx, oy: by, minCount: typeof ink.minCount === "number" ? ink.minCount : 1, empty }) });
    const minPixels = typeof ink.minPixels === "number" ? ink.minPixels : 4;
    for (const r of inkRows) if (r.f.count < minPixels) r.f = { ...r.f, count: 0 };
    const emptyAt = new Set(inkRows.filter((r) => r.f.count === 0).map((r) => r.index));
    // a thing appears (its start is seen) when the frame before was empty and it does not first show at the box's edge;
    // at the edge it is entering from outside, already moving
    const byIndex = new Map(inkRows.map((r) => [r.index, r.f]));
    const atEdge = (f: InkFrame) => f.x0 <= bx + 1 || f.y0 <= by + 1 || f.x1 >= bx + bw - 1 || f.y1 >= by + bh - 1;
    const appearsAt = (frame: number) => emptyAt.has(frame - 1) && !!byIndex.get(frame)?.count && !atEdge(byIndex.get(frame)!);
    const curves = (Array.isArray(ink.curves) && ink.curves.length ? ink.curves : ["centroid", "size", "level"]).filter((c: string) => (INK_CURVES as readonly string[]).includes(c)) as InkCurve[];
    for (const c of curves) {
      const like = inkLike(c);
      const samples: CurveSample[] = inkRows.filter((r) => !rep.has(r.index)).map((r) => ({ frame: r.index, time: r.time, value: inkValue(r.f, c) })).filter((s): s is CurveSample => s.value !== null);
      const minMove = c === "level" ? 3 : like.like === "position" ? Math.max(2, 0.004 * Math.max(info.width, info.height)) : 2;
      for (const mv of segments(samples).flatMap((seg) => movesOfChannel(seg, { fps, atFps, minMove, epsAbs: c === "level" ? 0.5 : c === "centroid" || c === "size" ? 0.3 : 1 / kb, beginsAt: (f) => (cutAt.has(f) ? "cut" : appearsAt(f) ? "appears" : null), endsAt: (f) => cutAt.has(f + 1) })))
        out.moves.push({ measure: "ink", channel: `ink.${c}`, like: like.like, ...(like.axis !== undefined ? { axis: like.axis } : {}), unit: like.unit, ...mv,
          ...(like.like === "scale" ? { asScale: { from: Math.round((mv.start[0] / mv.end[0]) * 10000) / 100, to: 100, as: "% of its settled size" } } : {}) });
    }
    out.ink = { box: inkBox, mask, curves, frames: inkRows.length, empty: emptyAt.size, reading: "The ink measure: a mask in a fixed box; its box, centroid, area and the box's mean level per frame. A moving ground defeats the difference from an empty frame." };
  }

  // two measures of one move: agreement within 2 frames and 5 % is a measurement; disagreement is reported, uncertain
  const visibleOf = (m: Json) => m.duration?.visible?.seconds ?? null;
  for (const m of (out.moves as Json[]).filter((x) => x.measure === "match")) {
    const peers = (out.moves as Json[]).filter((x) => x.measure === "ink" && x.like === m.channel && x.from.time <= m.to.time + 0.1 && x.to.time >= m.from.time - 0.1);
    if (!peers.length) continue;
    // a match that is itself weak or partial is no second measure: it is reported beside the ink, and cannot overrule it
    const matchSure = String(m.status).startsWith("measured") && !(m.match && m.match.median < 0.85);
    const verdicts = peers.map((p) => {
      const dv = visibleOf(m) !== null && visibleOf(p) !== null ? Math.abs(visibleOf(m) - visibleOf(p)) * atFps : null;
      let share: number | null = null;
      if (m.channel === "position" && m.distance !== null && p.distance !== null) { const md = p.axis !== undefined ? Math.abs(m.end[p.axis] - m.start[p.axis]) : m.distance; share = Math.abs(md - p.distance) / Math.max(1e-6, p.distance); }
      if (m.channel === "scale" && m.distance !== null && p.distance !== null) { const mr = m.start[0] / m.end[0], pr = p.start[0] / p.end[0]; share = Math.abs(mr - pr) / Math.max(1e-6, pr); }
      const within = (dv === null || dv <= 2) && (share === null || share <= 0.05) && (dv !== null || share !== null);
      return { with: p.channel, durationFrames: dv === null ? null : Math.round(dv * 100) / 100, distanceShare: share === null ? null : Math.round(share * 1000) / 1000, within };
    });
    const agree = verdicts.find((v) => v.within);
    m.agreement = agree ?? verdicts[0];
    for (const p of peers) p.agreement = { with: "match", within: !!agree, ...(matchSure ? {} : { matchWeak: true }) };
    if (agree) { if (String(m.status).startsWith("uncertain: the region matched weakly")) m.status = `measured: the match was weak but the ink measure (${agree.with}) agrees`; else if (m.status === "measured") m.status = `measured: match and ink (${agree.with}) agree`; }
    else if (!String(m.status).startsWith("partial")) {
      const v = verdicts[0];
      m.status = `uncertain: match and ink disagree (${v.with}: duration ${v.durationFrames ?? "?"} frames apart, distance ${v.distanceShare === null ? "?" : Math.round(v.distanceShare * 100) + " %"} apart); both are reported`;
      if (matchSure) for (const p of peers) if (!String(p.status).startsWith("partial")) p.status = "uncertain: the ink and the match disagree; both are reported";
    }
  }

  // the witness: frame differencing in the swept box (the region where it was matched, the ink box, and half the
  // region again round them); when it changes for materially longer than a move covers, the move is uncertain
  {
    let x0 = reg[0], y0 = reg[1], x1 = reg[0] + reg[2], y1 = reg[1] + reg[3];
    for (const r of usable) { const s = toSrc(r.m!), hw = (reg[2] * r.m!.scale) / 2, hh = (reg[3] * r.m!.scale) / 2; x0 = Math.min(x0, s.x - hw); x1 = Math.max(x1, s.x + hw); y0 = Math.min(y0, s.y - hh); y1 = Math.max(y1, s.y + hh); }
    if (inkBox) { x0 = Math.min(x0, inkBox[0]); y0 = Math.min(y0, inkBox[1]); x1 = Math.max(x1, inkBox[0] + inkBox[2]); y1 = Math.max(y1, inkBox[1] + inkBox[3]); }
    x0 = Math.max(0, Math.floor(x0 - reg[2] / 2)); y0 = Math.max(0, Math.floor(y0 - reg[3] / 2)); x1 = Math.min(info.width, Math.ceil(x1 + reg[2] / 2)); y1 = Math.min(info.height, Math.ceil(y1 + reg[3] / 2));
    const box: [number, number, number, number] = [x0, y0, Math.max(2, x1 - x0), Math.max(2, y1 - y0)], ww = Math.max(8, Math.round(box[2] * k)), wh = Math.max(8, Math.round(box[3] * k));
    const counts: number[] = [], idx: number[] = [];
    let prevW: Uint8Array | null = null;
    for await (const fr of readFrames(info, { from: f0, to: f1, crop: box, width: ww, height: wh, gray: true }, tools)) {
      let c = 0; if (prevW) for (let i = 0; i < fr.data.length; i++) if (Math.abs(fr.data[i] - prevW[i]) > 10) c++;
      counts.push(c); idx.push(fr.index); prevW = Uint8Array.from(fr.data);
    }
    // a cut is a change of everything: the witness runs stop at cuts
    const breaks = new Set(idx.map((f, i) => (cutAt.has(f) ? i : -1)).filter((i) => i >= 0));
    const wr = witnessRuns(counts, ww * wh, breaks), runs = wr.runs.map((r) => ({ from: idx[r.from], to: idx[r.to], at: { from: at(info.times[idx[r.from]]), to: at(info.times[idx[r.to]]) } }));
    out.witness = { box, threshold: wr.threshold, ground: wr.ground, runs,
      reading: wr.ground === "moving" ? "The ground in the box moves: frame differencing cannot see the move past it." : `The box changes in ${runs.length} run${runs.length === 1 ? "" : "s"}.` };
    for (const m of out.moves as Json[]) {
      const vA = m.duration?.visible?.fromFrame ?? m.from.frame, vB = m.duration?.visible?.toFrame ?? m.to.frame, cA = m.covers.fromFrame, cB = m.covers.toFrame;
      const over = runs.filter((r) => r.from <= vB && r.to >= vA);
      if (!over.length) { m.witness = null; continue; }
      const wa = Math.min(...over.map((r) => r.from)), wb = Math.max(...over.map((r) => r.to)), tol = 2;
      const wsec = info.times[wb] - info.times[wa];
      m.witness = { from: wa, to: wb, seconds: Math.round(wsec * 10000) / 10000, at: at(wsec), covers: { from: cA, to: cB } };
      if ((wa < cA - tol || wb > cB + tol) && !String(m.status).startsWith("partial") && !String(m.status).startsWith("uncertain"))
        m.status = `uncertain: the region changes from frame ${wa} to ${wb}; the track covers ${cA} to ${cB}`;
    }
  }
  const nccAll = rows.filter((r) => r.m).map((r) => r.m!.ncc).sort((a, b) => a - b);
  out.match = { matchedFrames: nccAll.length, frames: rows.length, median: nccAll.length ? Math.round(nccAll[Math.floor(nccAll.length / 2)] * 1000) / 1000 : null, threshold: minNcc };
  await fs.mkdir(args.outDir, { recursive: true });
  const jsonPath = path.join(args.outDir, "track.json"), csvPath = path.join(args.outDir, "track.csv");
  const perFrame = rows.map((r) => ({ index: r.index, time: Math.round(r.time * 1e6) / 1e6, at: at(r.time), repeat: rep.has(r.index), ...(r.m ? { ...Object.fromEntries(Object.entries(toSrc(r.m)).map(([a, v]) => [a, Math.round(v * 100) / 100])), ncc: Math.round(r.m.ncc * 1000) / 1000 } : { matched: false }) }));
  const inkFrames = inkRows.map((r) => ({ index: r.index, time: Math.round(r.time * 1e6) / 1e6, count: Math.round(r.f.count), ...(r.f.count ? { x0: r2(r.f.x0), y0: r2(r.f.y0), x1: r2(r.f.x1), y1: r2(r.f.y1), cx: r2(r.f.cx), cy: r2(r.f.cy) } : {}), level: r2(r.f.level) }));
  await fs.writeFile(jsonPath, JSON.stringify({ ...out, frames: perFrame, ...(inkRows.length ? { inkFrames } : {}) }, null, 1));
  await fs.writeFile(csvPath, ["index,time,at,x,y,scale,opacity,ncc,repeat", ...perFrame.map((p: Json) => [p.index, p.time, p.at, p.x ?? "", p.y ?? "", p.scale ?? "", p.opacity ?? "", p.ncc ?? "", p.repeat ? 1 : 0].join(","))].join("\n"));
  const seconds = Math.round(((performance.now() - started) / 1000) * 100) / 100;
  return { ...out, files: { json: jsonPath, csv: csvPath }, timings: { seconds, decodeAndMatchSeconds: Math.round(decodeSeconds * 100) / 100, frames: rows.length },
    reading: `${out.moves.length} move${out.moves.length === 1 ? "" : "s"} over frames ${f0} to ${f1} (${statusCount(out.moves)})${lost ? `; ${lost.reading}` : ""}. ${cad.reading} Not measured: ${NOT_MEASURED.join(", ")}.` };
}
