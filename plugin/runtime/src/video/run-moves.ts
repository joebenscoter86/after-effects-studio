// video.moves (the table of moves and a beat sheet in the brief's form) and motion.compare_moves (a built property, or
// a track of the build's own render, against the measured moves), stage 13.
import { promises as fs } from "node:fs";
import path from "node:path";

import { type CurveSample } from "../color/motion.js";
import { movesOfChannel } from "./measure-move.js";

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

async function readJson(p: unknown, what: string): Promise<Json | { error: string }> {
  if (typeof p !== "string" || !path.isAbsolute(p)) return { error: `${what} must be an absolute path to a JSON file` };
  try { return JSON.parse(await fs.readFile(p, "utf8")); } catch (e) { return { error: `could not read ${what} ${p}: ${(e as Error).message}` }; }
}
const r2 = (x: number) => Math.round(x * 100) / 100;

/** One row of the table from a tracked move. */
function row(label: string, m: Json, atFps: number): Json {
  const best = m.fits[m.best], at = (s: number) => r2(s * atFps);
  const tail = m.fits.springTail;
  return {
    move: label, measure: m.measure ?? "match", channel: m.channel, unit: m.unit,
    start: { seconds: r2(m.from.time * 1000) / 1000, at: at(m.from.time) },
    duration: m.duration.seconds === null ? { seconds: null, at: null, keys: m.duration.keys } : { seconds: m.duration.seconds, at: at(m.duration.seconds), keys: m.duration.keys },
    distance: m.distance, from: m.start, to: m.end,
    ease: m.best === "ease" ? `${best.outInfluence} / ${best.inInfluence}` : m.best,
    spring: tail ? { A: tail.A, f: tail.f, d: tail.d } : null,
    best: m.best, margin: m.margin, rms: r2(best.rms * 1000) / 1000,
    status: m.status ?? "measured", apply: m.apply,
  };
}

export async function runMoves(args: Json): Promise<Json> {
  if (typeof args.outDir !== "string" || !path.isAbsolute(args.outDir)) return { ok: false, error: "`outDir` must be an absolute folder path" };
  const atFps = typeof args.atFps === "number" && args.atFps > 0 ? args.atFps : 30;
  const tracks = Array.isArray(args.tracks) ? args.tracks : [];
  if (!tracks.length && !Array.isArray(args.inferred)) return { ok: false, error: "`tracks` must list track.json files from video.track ([{ path, label }] or paths)" };
  const rows: Json[] = [], notes: string[] = [];
  for (let i = 0; i < tracks.length; i++) {
    const t = typeof tracks[i] === "string" ? { path: tracks[i] } : tracks[i], j = await readJson(t.path, "a track");
    if ("error" in j) return { ok: false, error: j.error };
    if (j.lost) notes.push(`${t.label ?? path.basename(path.dirname(t.path))}: ${j.lost.reading}`);
    (j.moves as Json[]).forEach((m, k) => rows.push(row(`${t.label ?? `track ${i + 1}`}${j.moves.length > 1 ? ` ${k + 1}` : ""}`, m, atFps)));
  }
  // moves carried by hand (the reader names why), and moves named but not tracked
  for (const m of (args.inferred as Json[]) ?? []) rows.push({ move: m.label ?? "inferred", channel: m.channel ?? null, status: "inferred", reason: m.reason ?? "no reason given", ...m });
  for (const m of (args.untested as Json[]) ?? []) rows.push({ move: m.label ?? "untested", status: "untested", reason: m.reason ?? "not tracked" });
  // the words: a transcript as word or segment tokens ({ text, start, end } in seconds, { text, startMs, endMs }, or
  // whisper's { transcription: [{ text, offsets: { from, to } }] })
  let words: Array<{ text: string; start: number; end: number }> = [];
  if (args.transcript !== undefined) {
    const tj = await readJson(args.transcript, "transcript");
    if ("error" in tj) return { ok: false, error: tj.error };
    const list: Json[] = Array.isArray(tj) ? tj : Array.isArray(tj.transcription) ? tj.transcription : Array.isArray(tj.words) ? tj.words : Array.isArray(tj.segments) ? tj.segments : [];
    words = list.map((w) => ({ text: String(w.text ?? w.word ?? ""),
      start: typeof w.start === "number" ? w.start : typeof w.startMs === "number" ? w.startMs / 1000 : w.offsets ? w.offsets.from / 1000 : NaN,
      end: typeof w.end === "number" ? w.end : typeof w.endMs === "number" ? w.endMs / 1000 : w.offsets ? w.offsets.to / 1000 : NaN }))
      .filter((w) => w.text.trim() && Number.isFinite(w.start));
  }
  const spoken = (a: number, b: number) => words.filter((w) => w.start >= a - 1e-6 && w.start < b).map((w) => w.text).join("").replace(/\s+/g, " ").trim();
  const wordAt = (t: number) => { let best: { text: string; start: number } | null = null; for (const w of words) if (w.start <= t + 0.05 && (!best || w.start > best.start)) best = w; return best ? best.text.trim() : null; };
  const shots = args.shots ? await readJson(args.shots, "shots") : null, census = args.census ? await readJson(args.census, "census") : null;
  if (shots && "error" in shots) return { ok: false, error: shots.error };
  if (census && "error" in census) return { ok: false, error: census.error };
  // the beat sheet: a scene per shot (or one), its events from the measured moves inside it
  const scenes: Json[] = shots ? (shots.shots as Json[]) : [{ start: 0, end: Infinity }];
  const lines: string[] = ["# Beat sheet (measured)", "", `Frames at ${atFps} fps. Rows marked inferred or untested were not measured from the picture; see the table.`, ""];
  scenes.forEach((s, i) => {
    const inShot = rows.filter((r) => r.start && r.start.seconds >= s.start - 1e-6 && r.start.seconds <= s.end + 1e-6);
    const travel = census ? (census.steps as Json[] | undefined)?.filter((st) => st.time >= s.start && st.time <= s.end && st.label === "T").length ?? 0 : null;
    lines.push(`## Scene ${i + 1} — ${r2(s.start * atFps)} to ${Number.isFinite(s.end) ? r2(s.end * atFps) : "end"}`, "");
    if (words.length) lines.push(`- Words: "${spoken(s.start, Number.isFinite(s.end) ? s.end : Infinity) || "(none spoken)"}"`);
    lines.push("- One visual argument; operation (before → action → resolution): (not measured: read the picture)");
    lines.push(`- Events: ${inShot.length ? inShot.map((r) => `${r.start.at}${words.length && wordAt(r.start.seconds) ? ` (on "${wordAt(r.start.seconds)}")` : ""}: ${r.move} (${r.channel}${String(r.status).startsWith("measured") ? "" : `, ${String(r.status).split(":")[0]}`}) ${r.distance ?? "?"}${r.unit ?? ""} over ${r.duration?.at ?? "?"} frames, ${r.best === "ease" ? `ease ${r.ease}` : r.best}${r.spring ? `, spring A ${r.spring.A} f ${r.spring.f} d ${r.spring.d}` : ""}`).join("; ") : "none measured"}`);
    lines.push(`- Camera: ${travel === null ? "(no census given)" : travel ? `whole-stage travel in ${travel} census steps` : "no whole-stage travel in the census"}`);
    lines.push(`- Continuity: ${i + 1 < scenes.length ? "a cut to the next shot" : "the last shot"}`);
    lines.push("- Type roles, exact strings, material, depth, data sources: (not measured)", "");
  });
  if (notes.length) lines.push("## Not measured", "", ...notes.map((n) => `- ${n}`), "");
  await fs.mkdir(args.outDir, { recursive: true });
  const jsonPath = path.join(args.outDir, "moves.json"), sheetPath = path.join(args.outDir, "beat-sheet.md");
  await fs.writeFile(jsonPath, JSON.stringify({ atFps, moves: rows, notes }, null, 1));
  await fs.writeFile(sheetPath, lines.join("\n"));
  const counts = { measured: rows.filter((r) => String(r.status).startsWith("measured")).length, inferred: rows.filter((r) => r.status === "inferred").length, untested: rows.filter((r) => r.status === "untested").length };
  return { ok: true, atFps, counts, moves: rows.map(({ apply, ...r }) => r), files: { json: jsonPath, beatSheet: sheetPath },
    reading: `${rows.length} moves: ${counts.measured} measured, ${counts.inferred} inferred, ${counts.untested} untested. Each measured move carries its keys in keyframe.apply's form (moves.json, apply).` };
}

export interface Tolerance { frames: number; distanceShare: number; easePoints: number }
export const TIGHT: Tolerance = { frames: 1, distanceShare: 0.02, easePoints: 10 };

/** Moves of a sampled property, measured as video.track measures them (so a built curve and a measured move compare like for like). */
export function movesOfSamples(samples: CurveSample[], fps: number, channel: string): Json[] {
  return movesOfChannel(samples, { fps, atFps: fps, minMove: channel === "position" ? 1 : 0.5, epsAbs: 0.01 }).map((m) => ({ channel, ...m }));
}

/** A move of one frame (a pop, a hard replace): its ease, overshoot and kind are not measurable from two samples. */
function oneFrame(m: Json, atFps: number): boolean {
  const v = m.duration?.visible?.at ?? m.duration?.at ?? null;
  return (v !== null && v <= 1 + 1e-6) || (m.to?.time !== undefined && m.from?.time !== undefined && (m.to.time - m.from.time) * atFps <= 1 + 1e-6);
}
/** Scale-like: compared as a ratio (end over start), so 100 -> 91 and 95.3 -> 86.7 agree. */
function scaleLike(m: Json): boolean { return m.channel === "scale" || m.like === "scale"; }

/** One comparison line per quantity. */
function compare(label: string, measured: Json, built: Json, tol: Tolerance, atFps: number): Json {
  const d = (a: number) => r2(a * atFps), checks: Json[] = [];
  const add = (what: string, mv: number, bv: number, unit: string, within: boolean) => checks.push({ what, measured: r2(mv), built: r2(bv), unit, within,
    reading: `${label}: ${what} ${r2(bv)}${unit} against ${r2(mv)}${unit}, ${within ? "within" : "outside"} tolerance` });
  // the visible span on both sides (the last frame at rest to the first frame settled); a partial move has none
  const md = measured.duration.seconds ?? null, bd = built.duration.seconds ?? null;
  if (md === null || bd === null) checks.push({ what: "duration", within: false, reading: `${label}: duration not measured on ${md === null ? "the reference" : "the build"} (${md === null ? measured.status : built.status})` });
  else add("duration", d(md), d(bd), " frames", Math.abs(md - bd) * atFps <= tol.frames + 1e-9);
  if (measured.distance === null || built.distance === null) checks.push({ what: "distance", within: false, reading: `${label}: distance not measured on ${measured.distance === null ? "the reference" : "the build"}` });
  else if (scaleLike(measured) && scaleLike(built) && measured.start?.[0] && built.start?.[0]) {
    const mr = measured.end[0] / measured.start[0], br = built.end[0] / built.start[0];
    add("scale (end over start)", mr, br, "", Math.abs(br - mr) <= tol.distanceShare * Math.abs(mr) + 1e-9);
  } else add("distance", measured.distance, built.distance, "", Math.abs(built.distance - measured.distance) <= tol.distanceShare * Math.abs(measured.distance) + 1e-9);
  // a one-frame move on either side: duration and distance only
  if (oneFrame(measured, atFps) || oneFrame(built, atFps)) return { move: label, within: checks.every((c) => c.within), checks, note: "a one-frame move: compared on duration and distance only" };
  // influences as the technique says: keys held at the visible span's ends (easeVisible) on both sides, else the free fit
  const ev = (m: Json) => m.fits.easeVisible ?? null, both = ev(measured) && ev(built);
  const me = both ? ev(measured) : measured.fits.ease, be = both ? ev(built) : built.fits.ease;
  if (measured.best === "ease" || built.best === "ease") {
    add("ease out", me.outInfluence, be.outInfluence, " %", Math.abs(me.outInfluence - be.outInfluence) <= tol.easePoints);
    add("ease in", me.inInfluence, be.inInfluence, " %", Math.abs(me.inInfluence - be.inInfluence) <= tol.easePoints);
  }
  if (measured.best === "spring" || built.best === "spring") add("overshoot", measured.fits.spring.overshoot * 100, built.fits.spring.overshoot * 100, " %", Math.abs(measured.fits.spring.overshoot - built.fits.spring.overshoot) * 100 <= tol.easePoints);
  if (measured.best !== built.best) checks.push({ what: "kind", measured: measured.best, built: built.best, within: false, reading: `${label}: built as ${built.best} against a measured ${measured.best}` });
  return { move: label, within: checks.every((c) => c.within), checks };
}

export async function runCompareMoves(args: Json, readProperty?: (a: Json) => Promise<Json>): Promise<Json> {
  const atFps = typeof args.atFps === "number" && args.atFps > 0 ? args.atFps : 30;
  const tol: Tolerance = { ...TIGHT, ...(args.tolerance && typeof args.tolerance === "object" ? args.tolerance : {}) };
  const mj = typeof args.measured === "string" ? await readJson(args.measured, "measured") : { moves: args.measured };
  if ("error" in mj) return { ok: false, error: mj.error };
  const measured: Json[] = (mj.moves ?? []).filter((m: Json) => m && m.fits);
  if (!measured.length) return { ok: false, error: "`measured` has no tracked moves (give a track.json from video.track, or its moves)" };
  let built: Json[] = [], source = "";
  if (typeof args.buildTrack === "string") {
    const bj = await readJson(args.buildTrack, "buildTrack");
    if ("error" in bj) return { ok: false, error: bj.error };
    built = bj.moves ?? []; source = `the build's render (${path.basename(args.buildTrack)})`;
  } else if (args.comp !== undefined && args.layer !== undefined && args.property !== undefined) {
    if (!readProperty) return { ok: false, error: "reading a property needs After Effects" };
    const r = await readProperty({ comp: args.comp, layer: args.layer, property: args.property, start: args.start, end: args.end, perFrame: true });
    if (!r?.ok) return { ok: false, error: r?.error ?? "could not read the property" };
    const name = String(Array.isArray(args.property) ? args.property[args.property.length - 1] : args.property).toLowerCase();
    const channel = name.includes("scale") ? "scale" : name.includes("opacity") ? "opacity" : "position";
    built = movesOfSamples((r.frames as Json[]).map((f) => ({ frame: f.frame, time: f.time, value: f.value })), r.fps, channel); source = `${r.layer} > ${r.property}`;
  } else return { ok: false, error: "give the build as `comp`, `layer` and `property`, or as `buildTrack` (a track.json of the build's render, which is the one that counts)" };
  const results: Json[] = [];
  // which built move answers each measured one; a move made as two (or two made as one) is said as that
  const span = (m: Json) => [m.duration?.visible?.fromTime ?? m.from.time, m.duration?.visible?.toTime ?? m.to.time] as [number, number];
  const overlaps = (a: Json, b: Json) => { const [a0, a1] = span(a), [b0, b1] = span(b); return Math.min(a1, b1) - Math.max(a0, b0) > -0.05; };
  const picks = measured.map((m) => built.filter((b) => b.channel === m.channel).sort((a, b) => Math.abs(a.from.time - m.from.time) - Math.abs(b.from.time - m.from.time))[0] ?? null);
  measured.forEach((m, i) => {
    const pick = picks[i], label = `move ${i + 1} (${m.channel})`;
    if (!pick) { results.push({ move: label, within: false, checks: [{ what: "missing", within: false, reading: `${label}: no ${m.channel} move in ${source}` }] }); return; }
    const parts = built.filter((b) => b.channel === m.channel && overlaps(m, b)), shared = measured.filter((x, j) => picks[j] === pick && x.channel === m.channel);
    if (parts.length > 1) { results.push({ move: label, within: false, checks: [{ what: "split", within: false, reading: `${label}: the build makes this as ${parts.length} moves where the reference has one` }] }); return; }
    if (shared.length > 1 && shared[0] !== m) return;
    if (shared.length > 1) { results.push({ move: label, within: false, checks: [{ what: "joined", within: false, reading: `${label}: the reference has ${shared.length} moves here where the build has one` }] }); return; }
    results.push(compare(label, m, pick, tol, atFps));
  });
  const out = results.flatMap((r) => r.checks.filter((c: Json) => !c.within).map((c: Json) => c.reading));
  return { ok: true, atFps, tolerance: tol, build: source, results, within: results.every((r) => r.within),
    reading: out.length ? out.join("; ") : `Every measured move is within tolerance in ${source}.`,
    ...(typeof args.buildTrack !== "string" ? { note: "This compared the property. Compare the render too (video.track on the rendered file, then buildTrack): a property can pass while the picture does not, as when the subject leans; the picture is the one that counts." } : {}) };
}
