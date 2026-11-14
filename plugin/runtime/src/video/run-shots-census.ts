// video.shots and video.census: the runners (decode, then the pure rules in shots.ts and census.ts), writing their files
// to the caller's folder and replying with the summary and the paths.
import { promises as fs } from "node:fs";
import path from "node:path";

import { encodePngSrgb8 } from "../color/png16.js";
import { runTool } from "../operations/delivery-sound.js";
import { censusStep, cadence, CENSUS_RULES } from "./census.js";
import { NO_FFMPEG, probeVideo, readFrames, type VideoInfo, type VideoTools, VIDEO_TOOLS } from "./decode.js";
import { frameAt } from "./run-track.js";
import { frameStats, registerShift, SHOT_RULES, shotList, type FrameStats } from "./shots.js";

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

async function open(args: Json, tools: VideoTools): Promise<{ info: VideoInfo; f0: number; f1: number } | { error: string }> {
  if (typeof args.file !== "string" || !path.isAbsolute(args.file)) return { error: "`file` must be an absolute path to a video file" };
  if (typeof args.outDir !== "string" || !path.isAbsolute(args.outDir)) return { error: "`outDir` must be an absolute folder path" };
  const info = await probeVideo(args.file, tools);
  if (info === null) return { error: NO_FFMPEG };
  if ("error" in info) return { error: info.error };
  const f0 = typeof args.start === "number" ? frameAt(info, args.start) : 0, f1 = typeof args.end === "number" ? frameAt(info, args.end) : info.frames - 1;
  if (f1 <= f0) return { error: "`end` must be after `start`" };
  return { info, f0, f1 };
}
const size = (info: VideoInfo, long: number) => { const k = long / Math.max(info.width, info.height); return { w: Math.max(4, Math.round((info.width * k) / 2) * 2), h: Math.max(4, Math.round((info.height * k) / 2) * 2) }; };
const timing = (t0: number) => Math.round(((performance.now() - t0) / 1000) * 100) / 100;

/** ffmpeg: frames (indices) tiled into one picture, each `tile` px wide. */
async function tilePng(info: VideoInfo, frames: number[], out: string, tile: number, tools: VideoTools): Promise<boolean> {
  if (!frames.length) return false;
  const sel = frames.map((f) => `eq(n\\,${f})`).join("+");
  const r = await runTool(tools.ffmpeg, ["-v", "error", "-y", "-i", info.file, "-vf", `select='${sel}',scale=${tile}:-2,tile=${frames.length}x1`, "-fps_mode", "passthrough", "-frames:v", "1", out], 120_000);
  return !!r && !r.failed;
}

export async function runShots(args: Json, tools: VideoTools = VIDEO_TOOLS): Promise<Json> {
  const t0 = performance.now(), o = await open(args, tools);
  if ("error" in o) return { ok: false, error: o.error };
  const { info, f0, f1 } = o, { w, h } = size(info, 64), stats: FrameStats[] = [];
  let a: Uint8Array | null = null, b: Uint8Array | null = null;
  const small: Uint8Array[] = [];
  for await (const fr of readFrames(info, { from: f0, to: f1, width: w, height: h, gray: true }, tools)) { stats.push(frameStats(fr.index, fr.time, a, b, fr.data, w, h)); small.push(Uint8Array.from(fr.data)); a = b; b = fr.data; }
  // a cut candidate that registers on the frame before under a whole-frame shift is the same picture: a pan, not a cut
  const list = shotList(stats, SHOT_RULES, (i) => (i > 0 ? registerShift(small[i - 1], small[i], w, h) : null));
  const kx = info.width / w, ky = info.height / h;
  await fs.mkdir(args.outDir, { recursive: true });
  const atFps = typeof args.atFps === "number" && args.atFps > 0 ? args.atFps : 30, at = (t: number) => Math.round(t * atFps * 100) / 100;
  const sheets: string[] = [], strips: string[] = [];
  if (args.pictures !== false) {
    for (let s = 0; s < list.shots.length && s < 60; s++) {
      const sh = list.shots[s], n = Math.min(8, sh.to - sh.from + 1), fr = Array.from({ length: n }, (_, i) => Math.round(sh.from + (i * (sh.to - sh.from)) / Math.max(1, n - 1)));
      const p = path.join(args.outDir, `shot-${String(s + 1).padStart(3, "0")}.png`); if (await tilePng(info, [...new Set(fr)], p, 160, tools)) sheets.push(p);
    }
    const changes = [...list.cuts.map((c) => c.frame), ...list.swaps.map((c) => c.frame)].sort((x, y) => x - y);
    for (const c of changes.slice(0, 40)) {
      const fr = [c - 2, c - 1, c, c + 1, c + 2].filter((f) => f >= 0 && f < info.frames), p = path.join(args.outDir, `change-${c}.png`);
      if (await tilePng(info, fr, p, 160, tools)) strips.push(p);
    }
  }
  const jsonPath = path.join(args.outDir, "shots.json");
  const result = { ok: true, file: args.file, atFps, span: { from: f0, to: f1 },
    video: { width: info.width, height: info.height, frames: info.frames, nominalFps: info.nominalFps, variableRate: info.variableRate },
    cuts: list.cuts.map((c) => ({ ...c, at: at(c.time) })), swaps: list.swaps.map((c) => ({ ...c, at: at(c.time) })), notCuts: list.notCuts.map((c) => ({ ...c, at: at(c.time), ...(c.shift ? { shift: { ...c.shift, dx: Math.round(c.shift.dx * kx), dy: Math.round(c.shift.dy * ky), unit: "source px a frame" } } : {}) })),
    shots: list.shots.map((s) => ({ ...s, at: [at(s.start), at(s.end)] })) };
  await fs.writeFile(jsonPath, JSON.stringify(result, null, 1));
  return { ...result, shots: result.shots.length > 40 ? `${result.shots.length} shots: see shots.json` : result.shots, files: { json: jsonPath, sheets, strips }, timings: { seconds: timing(t0), frames: stats.length },
    reading: `${list.cuts.length} cut${list.cuts.length === 1 ? "" : "s"}, ${list.swaps.length} one-frame swap${list.swaps.length === 1 ? "" : "s"}, ${list.notCuts.filter((c) => c.kind === "flash").length} flash${list.notCuts.filter((c) => c.kind === "flash").length === 1 ? "" : "es"} and ${list.notCuts.filter((c) => c.kind !== "flash").length} pan${list.notCuts.filter((c) => c.kind !== "flash").length === 1 ? "" : "s"} or move${list.notCuts.filter((c) => c.kind !== "flash").length === 1 ? "" : "s"} set aside (notCuts), ${list.shots.length} shot${list.shots.length === 1 ? "" : "s"}.${info.variableRate ? " The file's frame rate varies; frames are timed by their own timestamps." : ""}` };
}

export async function runCensus(args: Json, tools: VideoTools = VIDEO_TOOLS): Promise<Json> {
  const t0 = performance.now(), o = await open(args, tools);
  if ("error" in o) return { ok: false, error: o.error };
  const { info, f0, f1 } = o, step = typeof args.window === "number" && args.window > 0 ? args.window : 0.1, { w, h } = size(info, 320);
  const band = Array.isArray(args.band) && args.band.length === 2 ? (args.band as number[]).map(Number) : [0.15, 0.6];
  const y0 = Math.max(0, Math.round(band[0] * h)), y1 = Math.min(h, Math.round(band[1] * h)), pageTest = args.pageTest === true;
  const blur = (src: Uint8Array) => { const out = new Uint8Array(src.length); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0, c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < h && xx >= 0 && xx < w) { s += src[yy * w + xx] * (dx || dy ? 1 : 4); c += dx || dy ? 1 : 4; } } out[y * w + x] = Math.round(s / c); } return out; };
  // a flat page above the title: the grey of rows 3 to 16 and columns 5 to 174 (of a 180-wide frame) varies under 9, as a whole
  const isPage = (f: Uint8Array) => { const x0 = Math.round((5 * w) / 180), x1 = Math.round((174 * w) / 180); let m = 0, m2 = 0, n = 0;
    for (let y = 3; y <= 16 && y < h; y++) for (let x = x0; x <= x1 && x < w; x++) { const v = f[y * w + x]; m += v; m2 += v * v; n++; }
    return n > 0 && Math.sqrt(Math.max(0, m2 / n - (m / n) ** 2)) < 9; };
  let prev: Uint8Array | null = null;
  const labels: string[] = [], shifts: number[] = [], steps: Json[] = [];
  for await (const fr of readFrames(info, { from: f0, to: f1, width: w, height: h, gray: true, fps: 1 / step }, tools)) {
    const cur = blur(fr.data);
    if (prev) {
      if (pageTest && (!isPage(prev) || !isPage(cur))) { labels.push("."); shifts.push(0); steps.push({ time: fr.time, label: "." }); }
      else { const s = censusStep(prev, cur, w, h, y0, y1); labels.push(s.label); shifts.push(s.shift); steps.push({ time: Math.round(fr.time * 1000) / 1000, label: s.label, changed: Math.round(s.changed * 10000) / 10000, moved: Math.round(s.moved * 1000) / 1000 }); }
    }
    prev = cur;
  }
  const lab = labels.join(""), cad = cadence(lab.replace(/\./g, ""), shifts.filter((_, i) => labels[i] !== "."), step, Math.max(info.width, info.height) / Math.max(w, h));
  await fs.mkdir(args.outDir, { recursive: true });
  // the strip: one column per step, calm grey, local yellow, travel orange, cut red, off-page black
  const col: Record<string, number[]> = { c: [90, 90, 90], l: [230, 200, 60], T: [240, 120, 30], X: [220, 40, 40], ".": [0, 0, 0] }, sw = Math.max(1, labels.length), sh = 24, rgb = new Float64Array(sw * sh * 3);   // 0..1
  for (let x = 0; x < sw; x++) for (let y = 0; y < sh; y++) rgb.set(col[labels[x] ?? "."].map((v) => v / 255), (y * sw + x) * 3);
  const strip = path.join(args.outDir, "census.png"), jsonPath = path.join(args.outDir, "census.json");
  await fs.writeFile(strip, encodePngSrgb8(sw, sh, rgb));
  const result = { ok: true, file: args.file, window: step, band, pageTest, rules: CENSUS_RULES, labels: lab, cadence: cad };
  await fs.writeFile(jsonPath, JSON.stringify({ ...result, steps }, null, 1));
  return { ...result, labels: lab.length > 600 ? `${lab.slice(0, 600)}… (${lab.length} steps: see census.json)` : lab, files: { json: jsonPath, strip }, timings: { seconds: timing(t0), steps: labels.length },
    reading: `${labels.length} steps of ${step} s: calm ${Math.round(cad.shares.calm * 100)} %, local ${Math.round(cad.shares.local * 100)} %, travel ${Math.round(cad.shares.travel * 100)} %, cut ${Math.round(cad.shares.cut * 100)} %; ${cad.travel.perMinute} travel moves a minute (median ${cad.travel.medianSeconds} s); ${cad.burstsPer10s} bursts every 10 s; calm runs median ${cad.calmRuns.medianSeconds} s. A stage with little texture reads calmer than it looks (the census study's own caveat). Its cut class is the census study's own rule: a fast pan can read as one; video.shots is the authority on cuts.` };
}
