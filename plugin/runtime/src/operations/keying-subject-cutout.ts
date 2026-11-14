// Subject operations, the cut-out: subject.render_cutout, subject.check_file, subject.use_cutout.
// Moved whole from keying.ts (which still registers them, in their order, and re-exports what it exported).

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { SPECK_DEFAULTS, subjectTop, outlineTracker, speckPieces, SEEN_THROUGH_DEFAULTS, seenThroughInside, type SpeckPiece, type Box } from "../color/matte.js";
import { encodePngSrgb8, type DecodedPng } from "../color/png16.js";
import { composeContactSheet, flattenOver, resample } from "../color/sheet.js";
import { rejectedOutputPath } from "../config.js";
import { registerOp, jsxFail, jsxVal, jsxCompLayerPreamble, jsxCompPreamble } from "../registry.js";
import { PARK_QUEUE_FN, QUEUE_CHANGE_NOTE, RENDER_QUEUE_UNDO_WARNING } from "./render.js";
import { CHECK_FILE_MAX_FRAMES, CUTOUT_HOLE_LIMIT, CUTOUT_OVER, GB, NODE_ONLY, PICTURE_DEFLATE, PICTURE_MARGIN_BYTES, SETTLE_MAX_MS, SOFT_EDGE_DEFAULTS, SUBJECT_WHOLE_PIECE_NOTE, acceptedBy, aeCacheRoot, alikeRegions, cacheBytesFor, captureBytes, compLayerParams, fileCleanupJsx, fileCompJsx, fmt, frozenAccepted, frozenFinding, frozenOpts, gb, liveFileIO, measureFrames, overParam, overPicture, parseHex, pixelTally, plural, regionsOf, renderChunked, renderTally, roundTally, since, spacePlan, spaceRefusal, statfsFree, summarize, writePng, type AcceptEntry, type FileIO, type FrameReading, type Json, type KindRegion, type RegionFinding } from "./keying-shared.js";


/** How two halves of a cut-out are joined, with what the first piece measured across the join (2026-11-12). */
export const HALVES_JOIN_NOTE =
  "Two halves are joined by a stream copy, nothing re-encoded: list them in order in a text file (file 'first.mov' then file 'second.mov', one per line) and run " +
  "ffmpeg -f concat -safe 0 -i halves.txt -c copy whole.mov. Empty After Effects' disk cache between the halves (it holds about a half's worth). " +
  "On the first piece the halves were frames 600 to 1304, then 0 to 599, and the outline's step across the join was 0.002 of the frame, no different from any other pair of neighbouring frames. " +
  "Check the joined file with subject.check_file, and give subject.use_cutout the first half's start.";

/**
 * The span subject.render_cutout renders: the layer's whole span, or
 * `from`..`to` (comp seconds) clipped to it and snapped to frame boundaries.
 */
export function cutoutSpan(
  layerSpan: { start: number; duration: number; frameRate: number },
  from: unknown,
  to: unknown,
): { start: number; duration: number; frames: number; firstFrame: number; lastFrame: number; clipped: boolean; whole: boolean } | { error: string } {
  const rate = layerSpan.frameRate || 30;
  const snap = (t: number) => Math.round(t * rate) / rate;
  const s0 = layerSpan.start;
  const s1 = layerSpan.start + layerSpan.duration;
  for (const [name, v] of [["from", from], ["to", to]] as const)
    if (v !== undefined && (typeof v !== "number" || !Number.isFinite(v))) return { error: `\`${name}\` must be a number of comp seconds` };
  const a = typeof from === "number" ? from : s0;
  const b = typeof to === "number" ? to : s1;
  if (b <= a) return { error: `\`to\` (${b}) must be after \`from\` (${a})` };
  const start = snap(Math.max(s0, a));
  const end = snap(Math.min(s1, b));
  if (end <= start)
    return { error: `the span ${a} to ${b} s is outside the layer, which runs ${Math.round(s0 * 1e4) / 1e4} to ${Math.round(s1 * 1e4) / 1e4} s` };
  const frames = Math.round((end - start) * rate);
  const firstFrame = Math.round(start * rate);
  return {
    start,
    duration: end - start,
    frames,
    firstFrame,
    lastFrame: firstFrame + frames - 1,
    clipped: a < s0 - 1e-9 || b > s1 + 1e-9,
    whole: Math.abs(start - snap(s0)) < 1e-9 && Math.abs(end - snap(s1)) < 1e-9,
  };
}
/** Measured: 243 MB for 320 frames of 1080 x 1920 ProRes 4444 with alpha ('High Quality with Alpha'). */
const RENDER_BYTES_PER_HD_FRAME = 0.76e6;
/**
 * Free space required on top of the movie: After Effects writes its disk cache
 * to the same drive while it renders, by an amount nobody measured for one
 * render (42.1 GB over an evening). 3 GB: the 2 GB asked for, and one more.
 */
export const RENDER_MARGIN_BYTES = 3 * GB;

/** The movie subject.render_cutout will write, estimated from the comp's frame size and frame count. */
export function renderCutoutBytes(frames: number, size: [number, number] | number[]): number {
  return frames * RENDER_BYTES_PER_HD_FRAME * ((size[0] * size[1]) / (1080 * 1920));
}

/** Output templates tried first, in order; then any other movie template whose name says alpha. */
const ALPHA_TEMPLATES = ["High Quality with Alpha", "Lossless with Alpha"];
const isSequence = (name: string) => /sequence/i.test(name);

/** The output template to use: the caller's (when it exists), else one that writes a movie with alpha; or a refusal. */
export function chooseAlphaTemplate(
  available: string[],
  wanted?: string,
): { template: string; why: string } | { error: string } {
  const list = available.join(", ") || "none";
  if (wanted !== undefined) {
    if (!available.includes(wanted))
      return { error: `no output template named '${wanted}' (templates: ${list})` };
    return { template: wanted, why: `the template asked for` };
  }
  for (const t of ALPHA_TEMPLATES)
    if (available.includes(t))
      return { template: t, why: `'${t}' carries alpha in its name and writes a movie` };
  const other = available.find((t) => /alpha/i.test(t) && !isSequence(t));
  if (other)
    return {
      template: other,
      why: `'${other}' is the first template whose name says alpha and that writes a movie`,
    };
  return {
    error:
      `no output template that writes a movie with alpha (templates: ${list}). ` +
      "subject.check_file reads a movie; an image-sequence template is not used. Make a movie template with RGB + Alpha in After Effects' Output Module settings and pass its name as outputTemplate.",
  };
}

/** JSX: what render_cutout will render (the layer, its gap fill, the span) and the output templates on this machine. */
export function renderCutoutPlanJsx(args: { comp: unknown; layer: unknown }): string {
  return `
            ${jsxCompLayerPreamble(args as Record<string, unknown>)}
            var rq = app.project.renderQueue;
            if (AE.safeGet(function () { return rq.rendering; }, false)) return { ok: false, error: "the render queue is already rendering; wait for it to finish" };
            var _fillName = _layer.name + " gap fill";
            var _fill = null;
            var _fillEnabled = null;
            for (var _li = 1; _li <= _comp.numLayers; _li++) if (_comp.layer(_li).name === _fillName) { _fill = _fillName; _fillEnabled = !!_comp.layer(_li).enabled; }
            // After subject.soften_edge the cut-out is its precomp layer (two copies of the matte inside), not the matted layer.
            var _softName = _layer.name + " soft edge";
            var _soft = null;
            var _softComment = null;
            for (var _si = 1; _si <= _comp.numLayers; _si++) {
                var _sl = _comp.layer(_si);
                if (_sl.name === _softName && String(AE.safeGet(function () { return _sl.comment; }, "")).indexOf("soft-edge") >= 0) { _soft = _softName; _softComment = String(_sl.comment); }
            }
            var _keep = [_soft ? _soft : _layer.name];
            if (_fill) _keep.push(_fill);
            var _fd = _comp.frameDuration;
            var _start = Math.max(0, Math.min(_layer.inPoint, _layer.outPoint));
            var _end = Math.min(_comp.duration, Math.max(_layer.inPoint, _layer.outPoint));
            var _tmp = null;
            var _out = [];
            var _rend = [];
            try {
                _tmp = rq.items.add(_comp);
                try { _rend = _tmp.templates; } catch (eR) {}
                try { _out = _tmp.outputModule(1).templates; } catch (eO) {}
            } finally {
                if (_tmp) { try { _tmp.remove(); } catch (eRm) {} }
            }
            var _src = null;
            try { _src = [_layer.source.width, _layer.source.height]; } catch (eSrc) { _src = null; }
            var _cacheFolder = null;
            try {
                var _pts = [PREFType.PREF_Type_MACHINE_SPECIFIC, PREFType.PREF_Type_MACHINE_INDEPENDENT];
                for (var _pi = 0; _pi < _pts.length && !_cacheFolder; _pi++) {
                    if (app.preferences.havePref("Disk Cache Controls", "Folder 7", _pts[_pi])) _cacheFolder = app.preferences.getPrefAsString("Disk Cache Controls", "Folder 7", _pts[_pi]);
                }
            } catch (ePref) {}
            return { ok: true, layer: _layer.name, fillLayer: _fill, fillEnabled: _fillEnabled, softEdge: _soft, softEdgeComment: _softComment, matteCopies: _soft ? 2 : 1, keep: _keep, compSize: [_comp.width, _comp.height], sourceSize: _src,
                aeCache: { folder: _cacheFolder || null, version: AE.safeGet(function () { return app.version; }, null) },
                span: { start: _start, duration: _end - _start, frames: Math.round((_end - _start) / _fd), frameRate: Math.round(1000 / _fd) / 1000 },
                templates: { output: _out, render: _rend } };
        `;
}

/**
 * JSX: render the comp with only `keep` switched on (cameras, lights and
 * audio-only layers left as they are; solo cleared), through one temporary
 * render-queue item; other queue items are parked. Every switch is put back
 * and the item removed, even when the render fails.
 */
export function renderCutoutJsx(args: {
  comp: unknown;
  keep: string[];
  outputPath: string;
  outputTemplate: string;
  start: number;
  duration: number;
  overwrite: boolean;
  subject?: string;
}): string {
  return `
            ${jsxCompPreamble(args as Record<string, unknown>)}
            var _subject = ${jsxVal(args.subject ?? "")};
            ${PARK_QUEUE_FN}
            var rq = app.project.renderQueue;
            if (AE.safeGet(function () { return rq.rendering; }, false)) return { ok: false, error: "the render queue is already rendering; wait for it to finish" };
            var _want = ${jsxVal(args.outputPath)};
            function _meta(_path) {
                var _f = new File(_path);
                if (!_f.exists) return { exists: false, bytes: 0, modifiedMs: null };
                var _d = _f.modified;
                return { exists: true, bytes: _f.length, modifiedMs: _d ? _d.getTime() : null };
            }
            if (_meta(_want).exists && !${jsxVal(args.overwrite)}) return { ok: false, error: "a file already exists at " + _want + "; pass overwrite: true to replace it, or choose another outputPath" };
            var _keep = ${jsxVal(args.keep)};
            function _kept(n) { for (var i = 0; i < _keep.length; i++) if (_keep[i] === n) return true; return false; }
            var _saved = [];
            var _switched = [];
            var _w = [];
            var _out = null;
            var _rqi = null;
            var _parked = null;
            try {
                for (var _li = 1; _li <= _comp.numLayers; _li++) {
                    var L = _comp.layer(_li);
                    if (AE.safeGet(function () { return L.hasVideo; }, true) === false) continue;
                    var _mn = AE.safeGet(function () { return L.matchName; }, "");
                    if (_mn === "ADBE Camera Layer" || _mn === "ADBE Light Layer") continue;
                    var _s = { layer: L, enabled: L.enabled, solo: AE.safeGet(function () { return !!L.solo; }, false), locked: AE.safeGet(function () { return !!L.locked; }, false) };
                    // the subject renders even when it is switched off for display (subject.use_cutout leaves it off); the
                    // other kept layers (the gap fill, the soft edge) render as they are switched
                    var _want2 = _kept(L.name) ? (L.name === _subject ? true : _s.enabled) : false;
                    if (_want2 === _s.enabled && !_s.solo) continue;
                    if (_s.locked) L.locked = false;
                    if (_s.solo) L.solo = false;
                    if (L.enabled !== _want2) { L.enabled = _want2; _switched.push(L.name); }
                    _saved.push(_s);
                }
                _parked = _parkQueue(rq);
                _rqi = rq.items.add(_comp);
                var _om = _rqi.outputModule(1);
                var _wo = AE.applyTemplate(_om, ${jsxVal(args.outputTemplate)}, "outputTemplate");
                if (_wo) throw new Error(_wo);
                _rqi.timeSpanStart = ${jsxVal(args.start)};
                _rqi.timeSpanDuration = ${jsxVal(args.duration)};
                _om.file = AE.ensureParentDir(_want);
                var _path = _om.file ? _om.file.fsName.replace(/\\\\/g, "/") : _want;
                var _before = _meta(_path);
                var _audio = {};
                try {
                    var _st = _om.getSettings(GetSettingsFormat.STRING);
                    for (var _k in _st) if (_st.hasOwnProperty(_k) && /audio|channels/i.test(_k)) _audio[_k] = String(_st[_k]);
                } catch (eA) { _w.push("could not read the output module's settings: " + AE.errText(eA)); }
                var _t0 = new Date().getTime();
                rq.render();
                var _t1 = new Date().getTime();
                var _after = _meta(_path);
                var _fresh = _after.exists && _after.bytes > 0 && (!_before.exists || _after.bytes !== _before.bytes || _after.modifiedMs !== _before.modifiedMs);
                var _fd = _comp.frameDuration;
                _out = {
                    ok: _rqi.status === RQItemStatus.DONE && _fresh,
                    outputPath: _path,
                    timeSpanStart: ${jsxVal(args.start)},
                    durationSeconds: ${jsxVal(args.duration)},
                    frameCount: Math.round(${jsxVal(args.duration)} / _fd),
                    frameRate: Math.round(1000 / _fd) / 1000,
                    renderSeconds: Math.round(_t1 - _t0) / 1000,
                    elapsedSeconds: AE.safeGet(function () { return _rqi.elapsedSeconds; }, null),
                    bytes: _after.bytes,
                    audio: _audio
                };
                if (!_out.ok) _out.error = _rqi.status !== RQItemStatus.DONE ? "the render did not finish (status " + String(_rqi.status) + ")" : "the render left no new file at " + _path;
            } catch (eR) {
                _out = { ok: false, error: "the cut-out render failed: " + AE.errText(eR) };
            } finally {
                if (_rqi) { try { _rqi.remove(); } catch (eRm) { _w.push("could not remove the render's queue item: " + AE.errText(eRm)); } }
                if (_parked) _unparkQueue(rq, _parked);
                var _notBack = [];
                for (var _ri = _saved.length - 1; _ri >= 0; _ri--) {
                    var _sv = _saved[_ri];
                    try {
                        if (_sv.layer.enabled !== _sv.enabled) _sv.layer.enabled = _sv.enabled;
                        if (_sv.solo) _sv.layer.solo = true;
                        if (_sv.locked) _sv.layer.locked = true;
                    } catch (eB) { _notBack.push(AE.safeGet(function () { return _sv.layer.name; }, "?") + ": " + AE.errText(eB)); }
                }
            }
            _out.layersSwitched = _switched;
            _out.restored = _notBack.length === 0;
            if (_notBack.length) _out.notRestored = _notBack;
            _out.warnings = _w;
            _out.projectModified = true;
            _out.projectNote = ${jsxVal(QUEUE_CHANGE_NOTE)};
            return _out;
        `;
}

export async function runRenderCutout(args: Record<string, unknown>, io: FileIO): Promise<Json> {
  const started = performance.now();
  const outputPath = args.outputPath;
  if (typeof outputPath !== "string" || !path.isAbsolute(outputPath))
    return { ok: false, error: "`outputPath` must be an absolute path for the movie" };
  const rejected = rejectedOutputPath(outputPath);
  if (rejected) return { ok: false, error: rejected };
  const plan = await io.execute(renderCutoutPlanJsx({ comp: args.comp, layer: args.layer }), {
    label: "subject.render_cutout plan",
    timeoutMs: 60_000,
    undoGroup: true,
  });
  if (!plan?.ok) return { ok: false, error: plan?.error ?? "could not read the comp", plan };
  const planMs = since(started);
  // The render keeps each kept layer switched as it is, so a gap fill switched off leaves the gaps open in the file.
  const fillOff = typeof plan.fillLayer === "string" && plan.fillEnabled === false;
  const fillOffText = fillOff
    ? `The gap fill layer '${plan.fillLayer}' is switched off, so the cut-out would render with its gaps open (the holes subject.fill_gaps filled show the background through), and subject.check_file would stop on them.`
    : "";
  if (fillOff && args.withoutFill !== true)
    return {
      ok: false,
      error: `${fillOffText} Nothing was rendered. Switch the fill layer on and render again, or pass withoutFill: true if the gaps are meant to be open.`,
      fillLayer: plan.fillLayer,
    };
  const choice = chooseAlphaTemplate(
    plan.templates?.output ?? [],
    typeof args.outputTemplate === "string" ? args.outputTemplate : undefined,
  );
  if ("error" in choice) return { ok: false, error: choice.error, templates: plan.templates };
  const ranged = args.from !== undefined || args.to !== undefined;
  const span = ranged && plan.span ? cutoutSpan(plan.span, args.from, args.to) : null;
  if (span && "error" in span) return { ok: false, error: span.error, layerSpan: plan.span };
  const frames = span ? span.frames : (plan.span?.frames ?? 0);
  const where = path.dirname(outputPath);
  const cacheRoot = aeCacheRoot(plan.aeCache?.folder, plan.aeCache?.version);
  const movieBytes = renderCutoutBytes(frames, plan.compSize ?? [1080, 1920]);
  // Each copy of the matte computes and caches its own Object Matte (two after subject.soften_edge).
  const matteCopies =
    typeof plan.matteCopies === "number" && plan.matteCopies > 1 ? plan.matteCopies : 1;
  const cacheBytes = matteCopies * cacheBytesFor(frames, plan.sourceSize ?? plan.compSize);
  const planned = await spacePlan(
    io,
    [
      { where, parts: { movie: movieBytes } },
      // An unknown cache folder is counted on the output's drive.
      { where: cacheRoot ?? where, parts: { cache: cacheBytes } },
    ],
    RENDER_MARGIN_BYTES,
    `rendering ${frames} frames`,
  );
  if (planned.refusal) return planned.refusal;
  const space = {
    parts: { movie: Math.round(movieBytes), cache: cacheBytes },
    volumes: planned.volumes,
    cacheWhere:
      cacheRoot ??
      "unknown (After Effects' Disk Cache folder could not be read); counted on the output's drive",
  };
  const t1 = performance.now();
  const r = await io.execute(
    renderCutoutJsx({
      comp: args.comp,
      keep: plan.keep,
      subject: plan.layer,
      outputPath,
      outputTemplate: choice.template,
      start: span ? span.start : plan.span.start,
      duration: span ? span.duration : plan.span.duration,
      overwrite: args.overwrite === true,
    }),
    // Measured: 390 s for 320 frames of a 2176 x 3840 take; allow 5 s a frame and two minutes over.
    { label: "subject.render_cutout", timeoutMs: 120_000 + frames * 5_000, undoGroup: true },
  );
  const renderMs = since(t1);
  let spaceAtTimeout: Json = null;
  if (r && r.ok === false && /timeout|timed out/i.test(String(r.error ?? ""))) {
    const free = await (io.freeBytes ?? statfsFree)(where);
    spaceAtTimeout = { free, where };
    if (free !== null && free < RENDER_MARGIN_BYTES)
      r.error =
        `the render timed out with only ${gb(free)} free on the drive holding ${where}: a full drive is a likely cause ` +
        "(a render on a nearly full drive stalls instead of failing). Ask the user to free space, for example Edit > Purge > All Memory & Disk Cache in After Effects, then render again. " +
        `After Effects said: ${r.error}`;
  }
  const audio = r?.audio && Object.keys(r.audio).length ? r.audio : null;
  const sound =
    (audio
      ? `The output module's sound settings read ${Object.entries(audio)
          .map(([k, v]) => `${k}: ${v}`)
          .join("; ")}; whether the file carries a sound track depends on them and was not checked.`
      : "The output module's sound settings could not be read; the file may or may not carry a sound track.") +
    " The original layer keeps the sound: subject.use_cutout leaves its audio as it is and switches the movie's audio off, so it plays once.";
  const out = {
    ...r,
    outputTemplate: choice.template,
    templateChoice: choice.why,
    layers: plan.keep,
    sound,
    timing: {
      planMs: Math.round(planMs),
      renderMs: Math.round(renderMs),
      totalMs: Math.round(since(started)),
    },
  };
  if (!r?.ok)
    return {
      ...out,
      ok: false,
      error: r?.error ?? "the render failed",
      ...(spaceAtTimeout ? { spaceAtTimeout } : {}),
    };
  // Beside the movie, what the file alone cannot say: the soft edge's region line, for subject.check_file.
  let soft: Json = null;
  if (typeof plan.softEdgeComment === "string") {
    try {
      const m = JSON.parse(plan.softEdgeComment);
      soft = {
        regionBottom: m.regionBottom,
        regionDepth: SOFT_EDGE_DEFAULTS.regionDepth,
        feather: m.feather,
        radius: m.radius,
        smooth: m.smooth,
        chatterReduction: m.chatterReduction,
        decontaminate: m.decontaminate,
      };
    } catch {
      soft = null;
    }
  }
  const sidecar = `${r.outputPath}.comp-room.json`;
  let sidecarWritten: string | null = null;
  try {
    await fs.writeFile(
      sidecar,
      JSON.stringify(
        { kind: "comp-room cut-out", comp: args.comp, layer: plan.layer, compSize: plan.compSize, fillLayer: plan.fillLayer ?? null, softEdge: soft, ...(span ? { span } : {}), renderedAt: new Date().toISOString() },
        null,
        1,
      ),
    );
    sidecarWritten = sidecar;
  } catch {
    sidecarWritten = null;
  }
  return {
    ...out,
    space,
    sidecar: sidecarWritten,
    ...(fillOff ? { fillWarning: `${fillOffText} Rendered anyway (withoutFill: true).` } : {}),
    cacheNote:
      `This render should have added about ${gb(cacheBytes)} to After Effects' disk cache (one 16-bit frame of the source per frame${matteCopies > 1 ? `, for each of the ${matteCopies === 2 ? "two" : matteCopies} copies of the matte subject.soften_edge built` : ""}). ` +
      "Nothing was deleted and no preference was changed.",
    next:
      (fillOff
        ? "The gap fill was off, so the file has its gaps open; tell the user before building on it. "
        : "") +
      `Check the file before building on it: subject.check_file { path: "${r.outputPath}", outDir }. Then subject.use_cutout puts it in the comp in place of the live matte. ` +
      `Once the file is checked, the cache this work wrote is no longer needed: tell the user to purge it (Edit > Purge > All Memory & Disk Cache in After Effects); it should free about ${gb(cacheBytes)} or more.`,
    wholePiece: SUBJECT_WHOLE_PIECE_NOTE,
    ...(span
      ? {
          span: {
            ...span,
            reading: span.whole
              ? "from and to cover the layer's whole span"
              : `frames ${span.firstFrame} to ${span.lastFrame} (${Math.round(span.start * 1e4) / 1e4} to ${Math.round((span.start + span.duration) * 1e4) / 1e4} s) of the layer's ${plan.span.frames}` +
                (span.clipped ? "; from/to reached past the layer and were clipped to it" : ""),
          },
          halves: HALVES_JOIN_NOTE,
        }
      : {}),
  };
}
/**
 * A change in opaque share between neighbouring frames above this is a
 * jump. On the take of 2026-11-11 the rendered cut-out ran from 0.279 to
 * 0.314 with no step over 0.012 at full frame rate; a dropped microphone is
 * about 0.05. Half way, rounded down.
 */
export const CHECK_FILE_JUMP_LIMIT = 0.025;

/** Which frames of an n-frame file to read: all up to `cap`; beyond it, pairs (k, k + 1) every step, and the first and last three. */
export function checkFileFrames(n: number, cap: number): { frames: number[]; step: number } {
  if (n <= cap) return { frames: Array.from({ length: n }, (_, i) => i), step: 1 };
  const step = Math.ceil(n / Math.max(1, Math.floor(cap / 2)));
  const set = new Set<number>();
  for (let s0 = 0; s0 < n - 1; s0 += step) {
    set.add(s0);
    set.add(s0 + 1);
  }
  for (const f of [0, 1, 2, n - 3, n - 2, n - 1]) if (f >= 0 && f < n) set.add(f);
  return { frames: [...set].sort((a, b) => a - b), step };
}

/** Frames as ranges: [3, 4, 5, 9] -> "3 to 5, 9". */
function frameRanges(frames: number[]): string {
  const out: string[] = [];
  for (let i = 0; i < frames.length;) {
    let j = i;
    while (j + 1 < frames.length && frames[j + 1] === frames[j] + 1) j++;
    out.push(i === j ? String(frames[i]) : `${frames[i]} to ${frames[j]}`);
    i = j + 1;
  }
  return out.join(", ");
}

/** A speck accepted by the user: an accept entry of kind 'speck' whose box holds the piece's centre. */
function speckAccepted(p: SpeckPiece, accept: AcceptEntry[]): boolean {
  const cx = p.x + p.width / 2;
  const cy = p.y + p.height / 2;
  return accept.some((e) => {
    if (!("box" in e) || e.kind !== "speck") return false;
    const b = e.box;
    return cx >= b.x && cx <= b.x + b.width && cy >= b.y && cy <= b.y + b.height;
  });
}

/** Specks grouped across frames by place: a piece within 40 px of a group's box joins it. */
interface SpeckTrack {
  frames: number[];
  box: Box;
  largestArea: number;
  largestFrame: number;
  smallestArea: number;
  pieces: Array<{ frame: number; box: Box }>;
  /** Sums for the mean colour over every frame's piece (Lab, weighted by pixels). */
  colourSum?: { L: number; a: number; b: number; pixels: number };
}

/** A speck's mean colour (L*, a*, b*), from its pieces on every frame. */
function speckColour(t: SpeckTrack): { L: number; a: number; b: number; pixels: number } | null {
  const c = t.colourSum;
  if (!c || c.pixels === 0) return null;
  const r1 = (v: number) => Math.round(v * 10) / 10;
  return { L: r1(c.L / c.pixels), a: r1(c.a / c.pixels), b: r1(c.b / c.pixels), pixels: c.pixels };
}

/** a* at or above this reads as skin-like warm colour; at or below SPECK_PALE_A as pale grey or white (the first piece: chair +7, skin +30). */
export const SPECK_SKIN_A = 20;
export const SPECK_PALE_A = 12;

/** One sentence on a speck's colour, or "". */
function speckColourText(t: SpeckTrack): string {
  const c = speckColour(t);
  if (!c) return "";
  const sign = (v: number) => (v > 0 ? `+${v}` : `${v}`);
  const reads =
    c.a <= SPECK_PALE_A
      ? "near neutral, as a pale grey or white remnant reads (the chair on the first piece read about +7)"
      : c.a >= SPECK_SKIN_A
        ? "warm, as skin reads (about +30 on the first piece): it may be the subject"
        : "between a pale remnant (about +7) and skin (about +30)";
  return ` Its colour: L* ${c.L}, a* ${sign(c.a)}, b* ${sign(c.b)} (mean over ${c.pixels} px, CIELAB D65 from sRGB), ${reads}.`;
}

/** The most frames in a row on which the same piece is there (its boxes overlap or touch from one frame to the next). */
function longestSpeckRun(t: SpeckTrack): number {
  const touch = (a: Box, b: Box) =>
    a.x <= b.x + b.width && b.x <= a.x + a.width && a.y <= b.y + b.height && b.y <= a.y + a.height;
  const run = new Map<number, number>();
  let best = 0;
  const sorted = t.pieces.slice().sort((a, b) => a.frame - b.frame);
  sorted.forEach((p, i) => {
    let len = 1;
    sorted.forEach((q, j) => {
      if (q.frame === p.frame - 1 && touch(q.box, p.box))
        len = Math.max(len, (run.get(j) ?? 1) + 1);
    });
    run.set(i, len);
    best = Math.max(best, len);
  });
  return best;
}
const SPECK_JOIN_PX = 40;
function addSpeck(tracks: SpeckTrack[], frame: number, p: SpeckPiece): void {
  const addColour = (t: SpeckTrack) => {
    if (!p.colour) return;
    const c = (t.colourSum ??= { L: 0, a: 0, b: 0, pixels: 0 });
    c.L += p.colour.L * p.colour.pixels;
    c.a += p.colour.a * p.colour.pixels;
    c.b += p.colour.b * p.colour.pixels;
    c.pixels += p.colour.pixels;
  };
  const near = (b: Box) =>
    p.x < b.x + b.width + SPECK_JOIN_PX &&
    b.x < p.x + p.width + SPECK_JOIN_PX &&
    p.y < b.y + b.height + SPECK_JOIN_PX &&
    b.y < p.y + p.height + SPECK_JOIN_PX;
  const t = tracks.find((x) => near(x.box));
  const pb = { x: p.x, y: p.y, width: p.width, height: p.height };
  if (!t) {
    tracks.push({
      frames: [frame],
      box: pb,
      largestArea: p.area,
      largestFrame: frame,
      smallestArea: p.area,
      pieces: [{ frame, box: pb }],
    });
    addColour(tracks[tracks.length - 1]);
    return;
  }
  t.pieces.push({ frame, box: pb });
  addColour(t);
  if (!t.frames.includes(frame)) t.frames.push(frame);
  const x0 = Math.min(t.box.x, pb.x);
  const y0 = Math.min(t.box.y, pb.y);
  t.box = {
    x: x0,
    y: y0,
    width: Math.max(t.box.x + t.box.width, pb.x + pb.width) - x0,
    height: Math.max(t.box.y + t.box.height, pb.y + pb.height) - y0,
  };
  if (p.area > t.largestArea) {
    t.largestArea = p.area;
    t.largestFrame = frame;
  }
  t.smallestArea = Math.min(t.smallestArea, p.area);
}

export async function runCheckFile(args: Record<string, unknown>, io: FileIO): Promise<Json> {
  const started = performance.now();
  const file = typeof args.path === "string" ? args.path : null;
  const item = typeof args.item === "number" ? args.item : null;
  if ((file === null) === (item === null))
    return {
      ok: false,
      error: "give exactly one of `path` (the movie) or `item` (a footage item's id)",
    };
  if (file !== null) {
    if (!path.isAbsolute(file))
      return { ok: false, error: "`path` must be an absolute path to the movie" };
    const there = io.exists
      ? await io.exists(file)
      : await fs.access(file).then(
          () => true,
          () => false,
        );
    if (!there) return { ok: false, error: `no file at ${file}` };
  }
  const outDir = args.outDir;
  if (typeof outDir !== "string" || !path.isAbsolute(outDir))
    return { ok: false, error: "`outDir` must be an absolute folder for the pictures" };
  const limit = typeof args.holeLimit === "number" ? args.holeLimit : CUTOUT_HOLE_LIMIT;
  const jumpLimit = typeof args.jumpLimit === "number" ? args.jumpLimit : CHECK_FILE_JUMP_LIMIT;
  const cap =
    typeof args.maxFrames === "number" && args.maxFrames >= 8
      ? Math.floor(args.maxFrames)
      : CHECK_FILE_MAX_FRAMES;
  const over = typeof args.over === "string" ? args.over : CUTOUT_OVER;
  const accept = Array.isArray(args.accept) ? (args.accept as AcceptEntry[]) : [];
  const perFrameMs = Math.max(
    1,
    Math.round(
      (typeof args.secondsPerFrame === "number" && args.secondsPerFrame > 0
        ? args.secondsPerFrame
        : 10) * 1000,
    ),
  );
  const speckLimits = {
    minArea: typeof args.speckMinArea === "number" ? args.speckMinArea : SPECK_DEFAULTS.minArea,
    maxArea: typeof args.speckMaxArea === "number" ? args.speckMaxArea : SPECK_DEFAULTS.maxArea,
  };
  const speckMinRun =
    typeof args.speckMinFrames === "number" && args.speckMinFrames >= 1
      ? Math.floor(args.speckMinFrames)
      : SPECK_DEFAULTS.minRun;
  const speckTime = { ms: 0, frames: 0 };
  // Partial transparency deep inside the body (a seam), frame by frame.
  const seenLimits = { ...SEEN_THROUGH_DEFAULTS };
  for (const k of ["deep", "minArea"] as const) {
    const v = args[k === "deep" ? "seenThroughDepth" : "seenThroughMinArea"];
    if (typeof v === "number" && v > 0) seenLimits[k] = v;
  }
  const seenTime = { ms: 0, frames: 0 };
  const seen = new Map<number, { px: number; box: Box }>();
  // The soft edge's region line: given, or from the sidecar subject.render_cutout wrote beside the file.
  let regionLine: number | null = typeof args.regionLine === "number" ? args.regionLine : null;
  let regionDepth = SOFT_EDGE_DEFAULTS.regionDepth;
  let regionSource: string | null = regionLine !== null ? "given" : null;
  if (regionLine === null && file !== null) {
    try {
      const side = JSON.parse(await fs.readFile(`${file}.comp-room.json`, "utf8"));
      if (typeof side?.softEdge?.regionBottom === "number") {
        regionLine = side.softEdge.regionBottom;
        if (typeof side.softEdge.regionDepth === "number") regionDepth = side.softEdge.regionDepth;
        regionSource = "sidecar";
      }
    } catch {
      /* no sidecar: the line is not known */
    }
  }
  const tops = new Map<number, number>();
  let seenLargest = -1;
  const specks: SpeckTrack[] = [];
  const specksAccepted: SpeckTrack[] = [];

  const setup = await io.execute(fileCompJsx({ path: file, item }), {
    label: "subject.check_file setup",
    timeoutMs: 120_000,
    undoGroup: true,
  });
  if (!setup?.ok)
    return { ok: false, error: setup?.error ?? "could not bring the movie into a comp", setup };
  const renders = renderTally();
  const pixels = pixelTally();
  const { frames, step } = checkFileFrames(setup.frames, cap);
  const keepCaptures = args.keepCaptures === true;
  // Up to 24 frames spread over the file go on the sheet, chosen now so their captures can be kept as they are read.
  const sheetPlan = new Set<number>();
  for (let i = 0; i < Math.min(24, frames.length); i++)
    sheetPlan.add(frames[Math.floor((i * frames.length) / Math.min(24, frames.length))]);
  const isAccepted = (x: KindRegion) =>
    acceptedBy(
      { kind: x.kind, box: { x: x.x, y: x.y, width: x.width, height: x.height } } as RegionFinding,
      accept,
    );
  // Regions not accepted, grouped as cutoutFindings groups them (frames in order, alike to a member): each track's
  // largest frame is the one that gets a picture, so only that capture has to be kept.
  const tracks: Array<{
    kind: "hole" | "opening";
    members: KindRegion[];
    bestArea: number;
    bestFrame: number;
  }> = [];
  const jumpFrames = new Set<number>();
  const kept = new Map<number, string>();
  let readings: FrameReading[] = [];
  let prev: FrameReading | null = null;
  let cleanup: Json = null;
  const needed = () => {
    const n = new Set<number>([...jumpFrames, ...sheetPlan]);
    for (const t of tracks) n.add(t.bestFrame);
    for (const t of specks) if (longestSpeckRun(t) >= speckMinRun) n.add(t.largestFrame);
    if (seenLargest >= 0) n.add(seenLargest);
    return n;
  };
  const release = async (frame: number) => {
    const f = kept.get(frame);
    if (!f || keepCaptures) return;
    kept.delete(frame);
    await fs.rm(f, { force: true });
  };
  const outline = outlineTracker(frozenOpts(args));
  let outlineResult: ReturnType<typeof outline.result> | null = null;
  const frozenFindings: Json[] = [];
  const frozenAcceptedRuns: Json[] = [];
  const size = Math.max(1, Math.min(32, Math.floor(SETTLE_MAX_MS / perFrameMs)));
  try {
    const roomless = await spaceRefusal(
      io,
      outDir,
      (size + 30) * captureBytes([setup.width, setup.height]),
      PICTURE_MARGIN_BYTES,
      "this file check",
    );
    if (roomless) return roomless;
    for (let b = 0; b * size < frames.length; b++) {
      const batch = frames.slice(b * size, (b + 1) * size);
      const rendered = await renderChunked(
        io,
        { compNameOrId: setup.compId, channels: "rgba" },
        batch,
        perFrameMs,
        outDir,
        "check-file",
        renders,
        b,
      );
      const got = (
        await measureFrames(
          io,
          rendered,
          limit,
          over,
          path.join(outDir, "check-file_unused.png"),
          pixels,
          false,
          (r, img) => {
            if (!img.alpha) return;
            outline.add(r.frame, img.alpha, img.rgb, img.width, img.height);
            const tSpeck = performance.now();
            for (const p of speckPieces(img.alpha, img.width, img.height, speckLimits, img.rgb))
              addSpeck(speckAccepted(p, accept) ? specksAccepted : specks, r.frame, p);
            speckTime.ms += performance.now() - tSpeck;
            speckTime.frames++;
            if (regionLine !== null) tops.set(r.frame, subjectTop(img.alpha, img.width, img.height));
            const tSeen = performance.now();
            const st = seenThroughInside(img.alpha, img.width, img.height, seenLimits);
            if (st.box && st.px >= seenLimits.minArea) {
              seen.set(r.frame, { px: st.px, box: st.box });
              if (seenLargest < 0 || st.px > (seen.get(seenLargest)?.px ?? 0)) seenLargest = r.frame;
            }
            seenTime.ms += performance.now() - tSeen;
            seenTime.frames++;
          },
        )
      ).readings;
      for (const r of got) {
        readings.push(r);
        if (!r.checked || !r.file) continue;
        kept.set(r.frame, r.file);
        for (const x of regionsOf(r)) {
          if (x.area < limit || isAccepted(x)) continue;
          const t = tracks.find(
            (tr) => tr.kind === x.kind && tr.members.some((m) => alikeRegions(m, x)),
          );
          if (t) {
            t.members.push(x);
            if (x.area > t.bestArea) {
              t.bestArea = x.area;
              t.bestFrame = r.frame;
            }
          } else tracks.push({ kind: x.kind, members: [x], bestArea: x.area, bestFrame: r.frame });
        }
        if (prev && prev.checked && r.frame === prev.frame + 1) {
          const change = Math.abs((r.opaqueShare ?? 0) - (prev.opaqueShare ?? 0));
          if (change > jumpLimit) {
            jumpFrames.add(prev.frame);
            jumpFrames.add(r.frame);
          }
        }
        // Every kept capture except this one (it may still start a jump) is released once nothing needs it.
        const need = needed();
        for (const f of Array.from(kept.keys()))
          if (f !== r.frame && !need.has(f)) await release(f);
        prev = r;
      }
    }
    // Frozen outline: two frames far apart in each run, rendered again for their pictures.
    outlineResult = outline.result();
    for (const run of outlineResult.frozen) {
      if (frozenAccepted(run, accept)) {
        frozenAcceptedRuns.push({ kind: "frozen", ...run });
        continue;
      }
      const ends = [run.from, run.to];
      const again = await renderChunked(
        io,
        { compNameOrId: setup.compId, channels: "rgba" },
        ends,
        perFrameMs,
        outDir,
        `check-file-frozen-${run.from}`,
        renders,
      );
      const pics: Array<string | null> = [];
      for (const e of ends) {
        const r = again.find((x) => x.frame === e);
        pics.push(r?.file ? await overPicture(io, r.file, over) : null);
        if (r?.file && !keepCaptures) await fs.rm(r.file, { force: true });
      }
      frozenFindings.push(frozenFinding(run, pics));
    }
  } finally {
    cleanup = await io.execute(
      fileCleanupJsx({
        compId: setup.compId,
        itemId: setup.itemId,
        removeItem: setup.imported === true && args.keepFootage !== true,
      }),
      { label: "subject.check_file cleanup", timeoutMs: 60_000, undoGroup: true },
    );
  }
  const need = needed();
  for (const f of Array.from(kept.keys())) if (!need.has(f)) await release(f);

  // Opaque share across the file, and jumps between true neighbours only.
  const byFrame = new Map(readings.filter((r) => r.checked).map((r) => [r.frame, r]));
  const jumps: Json[] = [];
  let pairs = 0;
  let largestStep = { from: -1, to: -1, change: 0 };
  for (const r of readings) {
    const next = byFrame.get(r.frame + 1);
    if (!r.checked || !next) continue;
    pairs++;
    const change =
      Math.round(Math.abs((next.opaqueShare ?? 0) - (r.opaqueShare ?? 0)) * 10000) / 10000;
    if (change > largestStep.change || largestStep.from < 0)
      largestStep = { from: r.frame, to: next.frame, change };
    if (change > jumpLimit)
      jumps.push({
        kind: "jump",
        from: r.frame,
        to: next.frame,
        change,
        opaque: [r.opaqueShare, next.opaqueShare],
      });
  }
  const checkedReadings = readings.filter((r) => r.checked && typeof r.opaqueShare === "number");
  const minR = checkedReadings.reduce<FrameReading | null>(
    (m, r) => (!m || (r.opaqueShare ?? 1) < (m.opaqueShare ?? 1) ? r : m),
    null,
  );
  const maxR = checkedReadings.reduce<FrameReading | null>(
    (m, r) => (!m || (r.opaqueShare ?? 0) > (m.opaqueShare ?? 0) ? r : m),
    null,
  );
  const opaque = {
    min: minR?.opaqueShare ?? null,
    minFrame: minR?.frame ?? null,
    max: maxR?.opaqueShare ?? null,
    maxFrame: maxR?.frame ?? null,
    largestStep,
  };

  // Seen through inside: the frames over the limit, and the longest run of them among the frames read in a row.
  const seenFrames = [...seen.keys()].sort((a, b) => a - b);
  let seenRun = 0;
  {
    let run = 0;
    let last = -1;
    for (const f of frames) {
      run = seen.has(f) ? (last >= 0 && seen.has(last) ? run + 1 : 1) : 0;
      seenRun = Math.max(seenRun, run);
      last = f;
    }
  }
  const seenLasting = seenFrames.length > 0 && seenRun >= seenLimits.minRun;
  let seenBox: Box | null = null;
  for (const f of seenFrames) {
    const b = seen.get(f)!.box;
    seenBox = !seenBox
      ? { ...b }
      : {
          x: Math.min(seenBox.x, b.x),
          y: Math.min(seenBox.y, b.y),
          width: Math.max(seenBox.x + seenBox.width, b.x + b.width) - Math.min(seenBox.x, b.x),
          height: Math.max(seenBox.y + seenBox.height, b.y + b.height) - Math.min(seenBox.y, b.y),
        };
  }

  // Full-size pictures: the largest frame of each finding not accepted, and both frames of each jump.
  const tPic = performance.now();
  const pictureFrames = new Set<number>([
    ...tracks.map((t) => t.bestFrame),
    ...jumps.flatMap((j) => [j.from, j.to]),
    ...specks.filter((t) => longestSpeckRun(t) >= speckMinRun).map((t) => t.largestFrame),
    ...(seenLasting ? [seenLargest] : []),
  ]);
  const pictureOf = new Map<number, string | null>();
  let pictureBytes = 0;
  for (const f of [...pictureFrames].sort((a, b) => a - b)) {
    const file = kept.get(f);
    const pic = file ? await overPicture(io, file, over) : null;
    pictureOf.set(f, pic);
    if (pic)
      pictureBytes += await fs.stat(pic).then(
        (st) => st.size,
        () => 0,
      );
  }
  for (const j of jumps) j.pictures = [pictureOf.get(j.from) ?? null, pictureOf.get(j.to) ?? null];
  for (const r of readings)
    if (pictureOf.get(r.frame)) r.picture = pictureOf.get(r.frame) ?? undefined;
  const picMs = since(tPic);
  pixels.picturesMs += picMs;
  pixels.ms += picMs;

  // The sheet: the picture frames first, then the planned frames spread over the file, at most 24.
  const tSheet = performance.now();
  const sheetFrames = [...new Set([...pictureFrames, ...sheetPlan])]
    .filter((f) => kept.has(f))
    .slice(0, 24)
    .sort((a, b) => a - b);
  let picture: string | null = null;
  let sheetBytes = 0;
  const thumbs: DecodedPng[] = [];
  const labels: string[] = [];
  for (const f of sheetFrames) {
    try {
      const img = await io.readImage(kept.get(f) as string);
      const comp = flattenOver(img, { kind: "color", color: parseHex(over) });
      const tw = Math.min(240, img.width);
      const th = Math.max(1, Math.round((img.height * tw) / img.width));
      thumbs.push({
        width: tw,
        height: th,
        rgb: resample({ ...img, rgb: comp }, tw, th),
        bitDepth: 8,
      });
      labels.push(`frame ${f}${pictureFrames.has(f) ? " !" : ""}`);
    } catch {
      /* a frame that cannot be read again is left off the sheet */
    }
  }
  if (thumbs.length) {
    const sheet = composeContactSheet(thumbs, { labels, thumbWidth: 240 });
    picture = path.join(outDir, "check-file_sheet.png");
    const png = encodePngSrgb8(sheet.width, sheet.height, sheet.rgb, PICTURE_DEFLATE);
    await writePng(io, picture, png);
    sheetBytes = png.length;
  }
  const sheetMs = since(tSheet);
  pixels.sheetMs += sheetMs;
  pixels.ms += sheetMs;
  // The rest of the raw captures go now, unless the caller keeps them.
  for (const f of Array.from(kept.keys())) await release(f);
  if (!keepCaptures) for (const r of readings) delete r.file;
  const pictures = {
    written: [...pictureOf.values()].filter(Boolean).length,
    bytes: pictureBytes,
    sheet: picture,
    sheetBytes,
    capturesKept: keepCaptures,
  };

  const compared =
    `${plural(pairs, "pair")} of neighbouring frames` +
    (step > 1
      ? ` (each frame and the next), one pair every ${step} frames, and the first and last three frames`
      : "") +
    ` compared for jumps over ${jumpLimit} in opaque share.`;
  const passText =
    jumps.length ||
    frozenFindings.length ||
    seenLasting ||
    specks.some((t) => longestSpeckRun(t) >= speckMinRun)
      ? `No hole or opening of ${fmt(limit)} px or more on the ${byFrame.size} frames read.`
      : `Nothing over the limit on ${byFrame.size} of ${readings.length} frames read; no jump between neighbouring frames over ${jumpLimit}; the picture is at ${picture ?? "(none)"}.`;
  const sum = summarize(readings, limit, accept, picture, passText);
  const lasting = specks.filter((t) => longestSpeckRun(t) >= speckMinRun);
  const brief = specks.filter((t) => longestSpeckRun(t) < speckMinRun);
  const speckNotes: Json[] = brief.map((t) => ({
    kind: "speck",
    frames: t.frames.slice().sort((a, b) => a - b),
    longestRun: longestSpeckRun(t),
    largestArea: t.largestArea,
    box: t.box,
    colour: speckColour(t),
  }));
  const briefText = brief.length
    ? ` ${plural(brief.length, "small piece")} apart from the cut-out on single frames, never on ${speckMinRun} or more frames in a row (${brief.map((t) => `frame${t.frames.length > 1 ? "s" : ""} ${frameRanges(t.frames.slice().sort((a, b) => a - b))}, ${t.largestArea} px at (${t.box.x}, ${t.box.y})`).join("; ")}): a flash of a thirtieth of a second that nobody sees, or a wisp of hair, so not a stop; listed in notes.`
    : "";
  const speckFindings: Json[] = lasting.map((t) => {
    const frames = t.frames.slice().sort((a, b) => a - b);
    const b = t.box;
    return {
      kind: "speck",
      frames,
      longestRun: longestSpeckRun(t),
      largestArea: t.largestArea,
      largestFrame: t.largestFrame,
      smallestArea: t.smallestArea,
      box: b,
      colour: speckColour(t),
      picture: pictureOf.get(t.largestFrame) ?? null,
      reading:
        `A small opaque piece apart from the cut-out (or joined to it by a neck a pixel or two wide) on ${plural(frames.length, "frame")} (${frameRanges(frames)}): ` +
        `${t.smallestArea} to ${t.largestArea} px, largest on frame ${t.largestFrame}, within (${b.x}, ${b.y}, ${b.width} × ${b.height}).` +
        speckColourText(t) +
        " " +
        "Usually a sliver of the background the matte kept (a chair edge beside an arm); look at the picture. Remove it with a mask on the cut-out movie on those frames (keying.md, removing a speck), or, if it belongs to the subject, accept it: accept: [{ kind: 'speck', box }].",
    };
  });
  const seenSummary =
    seenFrames.length && seenBox
      ? {
          kind: "seen-through",
          frames: seenFrames,
          longestRun: seenRun,
          largestArea: seen.get(seenLargest)!.px,
          largestFrame: seenLargest,
          box: seenBox,
        }
      : null;
  const seenFindings: Json[] =
    seenSummary && seenLasting
      ? [
          {
            ...seenSummary,
            picture: pictureOf.get(seenLargest) ?? null,
            reading:
              `Partly see-through inside the cut-out on ${plural(seenFrames.length, "frame")} (${frameRanges(seenFrames)}): up to ${seenSummary.largestArea} px under ${seenLimits.below} alpha more than ${seenLimits.deep} px inside the body (frame ${seenLargest}), within (${seenBox!.x}, ${seenBox!.y}, ${seenBox!.width} × ${seenBox!.height}). ` +
              "The background shows through the subject there: a seam where two copies of the matte meet (subject.soften_edge) or a matte gone soft inside. Look at the picture.",
          },
        ]
      : [];
  const seenNotes: Json[] = seenSummary && !seenLasting ? [seenSummary] : [];
  // The region line: frames where the top sits lower than the line minus the hair's depth.
  let region: Json = null;
  const regionNotes: Json[] = [];
  if (regionLine !== null && tops.size) {
    const H = setup.height;
    const reach = regionLine - Math.round(regionDepth * H);
    let hi = { top: Infinity, frame: -1 };
    let lo = { top: -Infinity, frame: -1 };
    const lowFrames: number[] = [];
    for (const [f, t] of [...tops.entries()].sort((a, b) => a[0] - b[0])) {
      if (t < 0) continue;
      if (t < hi.top) hi = { top: t, frame: f };
      if (t > lo.top) lo = { top: t, frame: f };
      if (t > reach) lowFrames.push(f);
    }
    const reading =
      `The soft edge's region line at y ${regionLine} (${regionSource}) covers hair down to ${Math.round(regionDepth * 100)}% of the frame's height under the subject's top, so a top lower than y ${reach} puts the lower hair under the line, where it keeps the hard edge. ` +
      `The top ran from y ${hi.top} (frame ${hi.frame}) to y ${lo.top} (frame ${lo.frame}); ` +
      (lowFrames.length
        ? `it sat lower than y ${reach} on ${plural(lowFrames.length, "frame")} (${frameRanges(lowFrames)}): look at the hair there; a lower regionBottom covers it.`
        : "it never sat lower than that.");
    region = { line: regionLine, source: regionSource, reach, regionDepth, highest: hi, lowest: lo, lowFrames, reading };
    if (lowFrames.length) regionNotes.push({ kind: "region line", frames: lowFrames, line: regionLine, reach, lowest: lo });
  }
  const seenText = seenNotes.length
    ? ` Partly see-through inside the cut-out on single frames only (${frameRanges(seenFrames)}, up to ${seenSummary!.largestArea} px), never on ${seenLimits.minRun} or more frames read in a row: not a stop; listed in notes.`
    : "";
  const findings: Json[] = [
    ...sum.findings,
    ...jumps,
    ...frozenFindings,
    ...speckFindings,
    ...seenFindings,
  ];
  const stop = findings.length > 0;
  const frozenText = frozenFindings.map((f) => ` ${f.reading}`).join("");
  const jumpText = jumps.length
    ? ` ${plural(jumps.length, "jump")} in opaque share between neighbouring frames: ${jumps.map((j) => `${j.from} to ${j.to}, ${j.change}`).join("; ")}. A jump of about 0.05 is a dropped object (a microphone); look at both frames.`
    : "";
  const opaqueText =
    opaque.min !== null
      ? ` Opaque share ${opaque.min} (frame ${opaque.minFrame}) to ${opaque.max} (frame ${opaque.maxFrame}); largest step ${largestStep.change} (frames ${largestStep.from} to ${largestStep.to}).`
      : "";
  return {
    ok: true,
    file: file ?? setup.itemName,
    frames: setup.frames,
    frameRate: setup.frameRate,
    size: [setup.width, setup.height],
    step,
    stop,
    findings,
    accepted: [
      ...sum.accepted,
      ...frozenAcceptedRuns,
      ...specksAccepted.map((t) => ({
        kind: "speck",
        frames: t.frames.slice().sort((a, b) => a - b),
        box: t.box,
        largestArea: t.largestArea,
      })),
    ],
    outline: outlineResult,
    checked: sum.checked,
    compared,
    notes: [...speckNotes, ...seenNotes, ...regionNotes],
    speckLimits: {
      ...speckLimits,
      minFrames: speckMinRun,
      opaque: SPECK_DEFAULTS.opaque,
      neckPx: 2 * SPECK_DEFAULTS.neck,
    },
    seenThroughLimits: { ...seenLimits },
    region,
    opaque,
    inOut: `${sum.text}${jumpText}${frozenText}${speckFindings.map((f) => ` ${f.reading}`).join("")}${briefText}${seenFindings.map((f) => ` ${f.reading}`).join("")}${seenText}${region ? ` ${region.reading}` : ""}${opaqueText} ${compared}${stop && picture ? ` Look at the picture (${picture}).` : ""}`,
    picture,
    pictures,
    frameReadings: readings.map((r) => ({
      frame: r.frame,
      checked: r.checked,
      opaqueShare: r.opaqueShare ?? null,
      regions: r.checked ? regionsOf(r).length : null,
      ...(r.picture ? { picture: r.picture } : {}),
      ...(r.error ? { error: r.error } : {}),
    })),
    cleanup,
    timing: {
      render: roundTally(renders),
      pixels: roundTally(pixels),
      speck: { ms: Math.round(speckTime.ms), frames: speckTime.frames },
      seenThrough: { ms: Math.round(seenTime.ms), frames: seenTime.frames },
      totalMs: Math.round(since(started)),
    },
    next: stop
      ? "Stop. In your reply, before the next call, tell the user what is wrong in plain words and give the picture's path, before building on this file. A jump or a hole on one frame means the live matte rendered that frame wrong: render the cut-out again (subject.render_cutout) and check the new file. " +
        "A speck (a small piece apart from the cut-out) does not go away with a new render: mask it out of the cut-out movie on its frames (keying.md), then check again with accept for anything that belongs to the subject." +
        (seenFindings.length
          ? " Seen through inside the cut-out, on a soft edge: undo it (subject.soften_edge { comp, layer, undo: true }), switch Decontaminate Edge Colors on instead (subject.settings { comp, layer, decontaminateEdgeColors: true }), render again and check the new file."
          : "")
      : "The file is checked. Build on it: subject.use_cutout puts it in the comp in place of the live matte.",
  };
}

/**
 * JSX: put the rendered cut-out in the comp in place of the live matte. The
 * movie is in comp space (render_cutout renders the comp with only the
 * cut-out and its fill on), so it goes in untransformed at the comp's centre,
 * directly above the cut-out layer, over the cut-out's span. The cut-out's
 * and the fill's pictures are switched off; they stay in the project, with
 * the selections, for a later re-click. The original keeps its audio; the
 * movie's audio is switched off.
 */
export function useCutoutJsx(args: {
  comp: unknown;
  layer: unknown;
  path?: string;
  item?: number;
  startTime?: number;
}): string {
  return `
            ${jsxCompLayerPreamble(args as Record<string, unknown>)}
            var _movieName = _layer.name + " cut-out";
            var _fillName = _layer.name + " gap fill";
            var _softName = _layer.name + " soft edge";
            var _fill = null;
            var _soft = null;
            for (var _li = 1; _li <= _comp.numLayers; _li++) {
                var _l = _comp.layer(_li);
                if (_l.name === _movieName) return { ok: false, error: "comp " + _comp.name + " already has a layer '" + _movieName + "'; delete it first to use another file" };
                if (_l.name === _fillName) _fill = _l;
                if (_l.name === _softName && String(AE.safeGet(function () { return _l.comment; }, "")).indexOf("soft-edge") >= 0) _soft = _l;
            }
            var _item = null;
            if (${jsxVal(args.item ?? null)} !== null) {
                _item = AE.safeGet(function () { return app.project.itemByID(${jsxVal(args.item ?? null)}); }, null);
                if (!_item) return { ok: false, error: "no project item with id " + ${jsxVal(args.item ?? null)} };
            } else {
                var _f = new File(${jsxVal(args.path ?? null)});
                if (!_f.exists) return { ok: false, error: "no file at " + ${jsxVal(args.path ?? null)} };
                _item = app.project.importFile(new ImportOptions(_f));
            }
            var _in = Math.min(_layer.inPoint, _layer.outPoint);
            var _out = Math.max(_layer.inPoint, _layer.outPoint);
            var _movie = _comp.layers.add(_item);
            _movie.name = _movieName;
            _movie.moveBefore(_soft ? _soft : _layer);
            var _start = ${jsxVal(args.startTime ?? null)};
            _movie.startTime = _start === null ? Math.max(0, _in) : _start;
            var _spanError = null;
            try { _movie.inPoint = Math.max(0, _in); _movie.outPoint = _out; } catch (eSp) { _spanError = AE.errText(eSp); }
            var _movieAudio = "none";
            if (AE.safeGet(function () { return _movie.hasAudio; }, false)) { try { _movie.audioEnabled = false; _movieAudio = "off"; } catch (eAu) { _movieAudio = "could not be switched off: " + AE.errText(eAu); } }
            var _off = [];
            if (_layer.enabled) { _layer.enabled = false; _off.push(_layer.name); }
            if (_fill && _fill.enabled) { _fill.enabled = false; _off.push(_fill.name); }
            if (_soft && _soft.enabled) { _soft.enabled = false; _off.push(_soft.name); }
            var _res = { ok: true, movieLayer: _movie.name, movieIndex: _movie.index, startTime: _movie.startTime, inPoint: _movie.inPoint, outPoint: _movie.outPoint,
                switchedOff: _off, audio: { original: AE.safeGet(function () { return _layer.audioEnabled; }, null), movie: _movieAudio },
                note: "The movie is in comp space: it already has the cut-out's transform, so it has none of its own and no parent. The cut-out layer and its selections stay in the project with the picture off, for a later re-click; switch its picture back on and remove the movie to go back to the live matte." };
            if (_spanError !== null) _res.spanError = _spanError;
            return _res;
        `;
}

registerOp({
  name: "subject.render_cutout",
  category: "subject",
  description:
    "Render the cut-out once to a movie with alpha, so the piece is built on a file that cannot change: the layer with its gap fill when there is one, alone (every other layer's picture switched off for the render and put back afterwards, even when it fails; cameras and lights left as they are), over the layer's span, through one temporary render-queue item (other queue items are parked). " +
    "Picks an output template that writes a movie with alpha ('High Quality with Alpha', 'Lossless with Alpha', or another whose name says alpha; image sequences are not used) and refuses, naming the templates, when none does. " +
    "Returns outputPath, frameCount, renderSeconds, outputTemplate, templateChoice, layersSwitched, restored, sound and timing. Measured: 390 s for 320 frames of a 2176 x 3840 take, about one pass through the clip; tell the user before it runs. " +
    SUBJECT_WHOLE_PIECE_NOTE +
    " With from and to it renders only that span (clipped to the layer) and returns span (frames, times) and halves: " +
    HALVES_JOIN_NOTE +
    " It renders the matte the user clicked; it cannot make the click (" +
    "subject.prepare): get that before an unattended render. " +
    "The movie is in comp space. The original layer keeps the sound; whether the movie carries a sound track is not promised. " +
    "The subject layer is switched on for the render even when it is off for display (subject.use_cutout leaves it off), and back afterwards. The other kept layers render switched as they are: when the gap fill layer exists and is switched off, it refuses before rendering and says so (the file would come out with the gaps open), unless withoutFill: true, and then the result's fillWarning says the gaps are open (not checked live). " +
    "Before rendering it checks that each drive has room for its share, the movie and After Effects' disk cache (about one 16-bit frame of the source per frame: 19 GB measured for 320 frames of a 2176 x 3840 take), plus 3 GB; `space` and `cacheNote` give the numbers, and `next` says to purge the cache once the file is checked." +
    RENDER_QUEUE_UNDO_WARNING,
  params: [
    ...compLayerParams,
    {
      name: "outputPath",
      type: "string",
      description:
        "Absolute path for the movie (the template may change the extension; the path written is returned).",
      required: true,
    },
    {
      name: "outputTemplate",
      type: "string",
      description:
        "An output-module template that carries alpha (default: the first found, see above).",
      required: false,
    },
    {
      name: "overwrite",
      type: "boolean",
      description: "Replace an existing file at outputPath (default false: refuse).",
      required: false,
    },
    {
      name: "withoutFill",
      type: "boolean",
      description:
        "Render even though the gap fill layer is switched off, leaving its gaps open in the file (default false: refuse).",
      required: false,
    },
    {
      name: "from",
      type: "number",
      description:
        "Start of the span to render, comp seconds (default: the layer's in point). Clipped to the layer and snapped to a frame; with `to`, one half of a whole piece.",
      required: false,
    },
    {
      name: "to",
      type: "number",
      description:
        "End of the span (exclusive), comp seconds (default: the layer's out point). Clipped to the layer and snapped to a frame.",
      required: false,
    },
  ],
  toJsx: () => NODE_ONLY("subject.render_cutout"),
  run: (args, transport) => runRenderCutout(args, liveFileIO(transport)),
});

registerOp({
  name: "subject.check_file",
  category: "subject",
  description:
    "Check a rendered cut-out movie (from subject.render_cutout) frame by frame: brings it into a throwaway comp, reads frames in batches of at most 32 (every frame up to maxFrames, default " +
    `${CHECK_FILE_MAX_FRAMES}; beyond it pairs of neighbouring frames in steps, always the first and last three), and reports holes and openings (as subject.check: holeLimit, accept), the opaque share of every frame, and a 'jump' finding when neighbouring frames differ by more than jumpLimit (default ${CHECK_FILE_JUMP_LIMIT}: on the take of 2026-11-11 the rendered cut-out ran 0.279 to 0.314 with no step over 0.012, and a dropped microphone is about 0.05). ` +
    "A speck is a small opaque piece apart from the cut-out, or joined to it by a neck a pixel or two wide, not touching the frame edge: speckMinArea to speckMaxArea px (default 20 to 2,000, chosen on the 4K fresh-session file, where a sliver of chair 1 to 5 px off the right arm read 20 to 240 px on about 40 frames and nothing else in 320 frames was caught); findings of kind 'speck' give the frames, the longest run of frames in a row, the largest area and frame, the box, the piece's mean colour (`colour`: L*, a*, b*, CIELAB D65 from sRGB, over its opaque pixels on every frame; a pale grey remnant such as the first piece's chair read a* about +7, skin about +30) and a picture; a speck on at least speckMinFrames frames in a row (default 2) stops, since a new render keeps it, and a shorter one (a single-frame flash, a wisp of hair) goes to notes and one sentence of inOut. accept: [{ kind: 'speck', box }] takes one off. Checked through a real subject.check_file run on two files of one take (2026-11-12); the limits come from those two files. timing.speck is the pass's own cost (about 5.5 ms a 1080 x 1920 frame). " +
    "Seen through: pixels partly see-through (alpha 0.5 to 0.95) more than seenThroughDepth px (default 30) inside the cut-out's body and from the frame's edge, as where two copies of a matte meet in a seam; seenThroughMinArea px or more on a frame (default 400) on at least 2 frames read in a row is a finding of kind 'seen-through' that stops, with the frames, the largest area and frame, the box and a picture; single frames go to notes. Limits chosen on two files of the half-size take, as clicked and with subject.soften_edge (at most 82 and 41 px on every fourth frame), and a band of the soft-edge file's alpha multiplied by 0.75 (about 3,900 px a frame); not checked live: it has not run in After Effects on a file with a real seam. timing.seenThrough is its cost. " +
    "Region line: for a file from a soft-edge build, `region` gives the subject's highest and lowest top across the file against the soft edge's region line (from <movie>.comp-room.json, which subject.render_cutout writes, or `regionLine`), and a note, not a stop, names the frames where the top sits lower than the line less 12% of the height, so the lower hair crosses the line and keeps the hard edge. " +
    "Only true neighbours are compared, and `compared` says which. A frame that could not be read is 'not-checked' and stops. Pictures: the largest frame of each finding not accepted and both frames of each jump, full size, and a sheet of up to 24 frames; `pictures` counts them and their bytes. Each raw capture is removed once read unless keepCaptures (one run on the take had left 630 MB). The throwaway comp is removed afterwards, and the imported footage too unless keepFootage. " +
    "`outline` says how much the outline changed between neighbouring frames and over frozenGap frames (share of the frame whose alpha changed by more than 0.1, at full size); a run where it did not move is a 'frozen' finding (the selection is probably not tracking, as after replacing the layer's footage; accept: [{ kind: \"frozen\" }] for a subject that really is still). The frozen limits are not yet calibrated live. " +
    "Measured: about 0.55 s a frame reading the file. Returns stop, findings, accepted, checked, compared, opaque, outline, inOut, picture, frameReadings, timing.",
  params: [
    {
      name: "path",
      type: "string",
      description: "Absolute path of the movie. Or `item`.",
      required: false,
    },
    {
      name: "item",
      type: "number",
      description: "Id of a footage item already in the project (it is never removed). Or `path`.",
      required: false,
    },
    {
      name: "outDir",
      type: "string",
      description: "Absolute folder for the frames and pictures.",
      required: true,
    },
    {
      name: "holeLimit",
      type: "number",
      description: `Smallest hole or opening that is a finding, px (default ${CUTOUT_HOLE_LIMIT}).`,
      required: false,
    },
    {
      name: "accept",
      type: "array",
      description: "As subject.check's accept: boxes (openings) or { box, kind }.",
      required: false,
    },
    {
      name: "speckMinArea",
      type: "number",
      description: `Smallest piece apart from the cut-out reported as a speck, px (default ${SPECK_DEFAULTS.minArea}).`,
      required: false,
    },
    {
      name: "speckMinFrames",
      type: "number",
      description: `A speck stops the check only when the same piece is there on at least this many frames in a row (default ${SPECK_DEFAULTS.minRun}); shorter ones go to notes.`,
      required: false,
    },
    {
      name: "regionLine",
      type: "number",
      description:
        "The soft edge's region line (comp pixels), for a file rendered before subject.render_cutout wrote it beside the file (<movie>.comp-room.json). With it, `region` gives the subject's highest and lowest top across the file and the frames where the top sits low enough for the hair to cross the line (a note, not a stop).",
      required: false,
    },
    {
      name: "seenThroughDepth",
      type: "number",
      description: `How far inside the cut-out's body (and from the frame's edge) partial transparency counts as seen through, px (default ${SEEN_THROUGH_DEFAULTS.deep}).`,
      required: false,
    },
    {
      name: "seenThroughMinArea",
      type: "number",
      description: `Seen-through pixels on one frame that count (default ${SEEN_THROUGH_DEFAULTS.minArea}).`,
      required: false,
    },
    {
      name: "speckMaxArea",
      type: "number",
      description: `Largest, px (default ${SPECK_DEFAULTS.maxArea}; bigger is another object, not a speck).`,
      required: false,
    },
    {
      name: "jumpLimit",
      type: "number",
      description: `Largest change in opaque share between neighbouring frames that is not a finding (default ${CHECK_FILE_JUMP_LIMIT}).`,
      required: false,
    },
    {
      name: "maxFrames",
      type: "number",
      description: `Most frames read one by one (default ${CHECK_FILE_MAX_FRAMES}).`,
      required: false,
    },
    {
      name: "keepFootage",
      type: "boolean",
      description:
        "Keep the imported footage item in the project (default false; subject.use_cutout imports it again).",
      required: false,
    },
    {
      name: "secondsPerFrame",
      type: "number",
      description: "Settle time allowed per frame, s (default 10).",
      required: false,
    },
    {
      name: "frozenLimit",
      type: "number",
      description:
        "A drift over frozenGap frames (share of the frame whose alpha changed by more than 0.1) under this counts as an unmoved outline (default 0.002; not yet calibrated live).",
      required: false,
    },
    {
      name: "frozenFrames",
      type: "number",
      description:
        "Shortest run of unmoved outline that is a 'frozen' finding, frames (default 60).",
      required: false,
    },
    {
      name: "frozenGap",
      type: "number",
      description: "Frames between the two frames compared for drift (default 30).",
      required: false,
    },
    {
      name: "keepCaptures",
      type: "boolean",
      description:
        "Keep the raw captures ae_render_frame wrote (default false: each is removed once read; the pictures stay).",
      required: false,
    },
    overParam,
  ],
  toJsx: () => NODE_ONLY("subject.check_file"),
  run: (args, transport) => runCheckFile(args, liveFileIO(transport)),
});

registerOp({
  name: "subject.use_cutout",
  category: "subject",
  description:
    "Build on the checked file: add the rendered cut-out movie (path, or a footage item id) to the comp directly above the cut-out layer, named '<layer> cut-out', over the cut-out's span. " +
    "The movie is in comp space (subject.render_cutout renders the comp), so it has no transform or parent of its own. Switches the cut-out layer's and its gap fill's pictures off; they and the selections stay in the project for a later re-click. " +
    "The original keeps its audio; the movie's audio is switched off. Returns movieLayer, switchedOff, audio and note. Refuses when the comp already has the movie.",
  params: [
    ...compLayerParams,
    {
      name: "path",
      type: "string",
      description: "Absolute path of the movie. Or `item`.",
      required: false,
    },
    {
      name: "item",
      type: "number",
      description: "Id of the movie's footage item. Or `path`.",
      required: false,
    },
    {
      name: "startTime",
      type: "number",
      description:
        "Where the movie starts in the comp, s (default: the cut-out's in point, where subject.render_cutout's render starts; pass its timeSpanStart).",
      required: false,
    },
  ],
  toJsx(args) {
    if ((typeof args.path === "string") === (typeof args.item === "number"))
      return jsxFail("give exactly one of `path` (the movie) or `item` (its footage item's id)");
    return useCutoutJsx(
      args as { comp: unknown; layer: unknown; path?: string; item?: number; startTime?: number },
    );
  },
});
