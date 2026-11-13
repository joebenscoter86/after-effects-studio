// video.moves (the table of moves and a beat sheet in the brief's form) and motion.compare_moves (a built property, or
// a track of the build's own render, against the measured moves), stage 13.
import { promises as fs } from "node:fs";
import path from "node:path";

import { analyzeCurve, type CurveMove, type CurveSample } from "../color/motion.js";
import { fitMove, type Sample } from "./fit.js";

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
    move: label, channel: m.channel, unit: m.unit,
    start: { seconds: r2(m.from.time * 1000) / 1000, at: at(m.from.time) }, duration: { seconds: m.duration.seconds, at: at(m.duration.seconds) },
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
    lines.push("- One visual argument; operation (before → action → resolution): (not measured: read the picture)");
    lines.push(`- Events: ${inShot.length ? inShot.map((r) => `${r.start.at}: ${r.move} (${r.channel}) ${r.distance}${r.unit ?? ""} over ${r.duration.at} frames, ${r.best === "ease" ? `ease ${r.ease}` : r.best}${r.spring ? `, spring A ${r.spring.A} f ${r.spring.f} d ${r.spring.d}` : ""}`).join("; ") : "none measured"}`);
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

/** Moves of a sampled property, fitted as video.track fits them (so a built curve and a measured move compare like for like). */
export function movesOfSamples(samples: CurveSample[], fps: number, channel: string): Json[] {
  const report = analyzeCurve(samples, fps, { joinGap: 6 }), out: Json[] = [];
  for (const mv of report.moves as CurveMove[]) {
    const i0 = samples.findIndex((s) => s.frame === mv.from), i1 = samples.findIndex((s) => s.frame === mv.to);
    if (i0 < 0 || i1 <= i0) continue;
    const startV = samples[i0].value, endV = samples[Math.min(samples.length - 1, i1)].value, way = endV.map((e, d) => e - startV[d]), len2 = way.reduce((s, x) => s + x * x, 0);
    if (len2 <= 0) continue;
    const prog: Sample[] = samples.slice(Math.max(0, i0 - 3), Math.min(samples.length, i1 + 7)).map((s) => ({ time: s.time, y: s.value.reduce((a, v, d) => a + (v - startV[d]) * way[d], 0) / len2 }));
    const fits = fitMove(prog, { start: samples[i0].time, end: samples[i1].time }), best: Json = fits[fits.best];
    out.push({ channel, from: { frame: mv.from, time: samples[i0].time }, distance: Math.sqrt(len2), best: fits.best, fits, curve: mv,
      duration: { seconds: fits.best === "spring" ? best.settle : best.end - best.start } });
  }
  return out;
}

/** One comparison line per quantity. */
function compare(label: string, measured: Json, built: Json, tol: Tolerance, atFps: number): Json {
  const d = (a: number) => r2(a * atFps), checks: Json[] = [];
  const add = (what: string, mv: number, bv: number, unit: string, within: boolean) => checks.push({ what, measured: r2(mv), built: r2(bv), unit, within,
    reading: `${label}: ${what} ${r2(bv)}${unit} against ${r2(mv)}${unit}, ${within ? "within" : "outside"} tolerance` });
  add("duration", d(measured.duration.seconds), d(built.duration.seconds), " frames", Math.abs(measured.duration.seconds - built.duration.seconds) * atFps <= tol.frames + 1e-9);
  add("distance", measured.distance, built.distance, "", Math.abs(built.distance - measured.distance) <= tol.distanceShare * Math.abs(measured.distance) + 1e-9);
  const me = measured.fits.ease, be = built.fits.ease;
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
  measured.forEach((m, i) => {
    const same = built.filter((b) => b.channel === m.channel);
    const pick = same.sort((a, b) => Math.abs(a.from.time - m.from.time) - Math.abs(b.from.time - m.from.time))[0];
    const label = `move ${i + 1} (${m.channel})`;
    results.push(pick ? compare(label, m, pick, tol, atFps) : { move: label, within: false, checks: [{ what: "missing", within: false, reading: `${label}: no ${m.channel} move in ${source}` }] });
  });
  const out = results.flatMap((r) => r.checks.filter((c: Json) => !c.within).map((c: Json) => c.reading));
  return { ok: true, atFps, tolerance: tol, build: source, results, within: results.every((r) => r.within),
    reading: out.length ? out.join("; ") : `Every measured move is within tolerance in ${source}.`,
    ...(typeof args.buildTrack !== "string" ? { note: "This compared the property. Compare the render too (video.track on the rendered file, then buildTrack): a property can pass while the picture does not, as when the subject leans; the picture is the one that counts." } : {}) };
}
