// Sampling — one read that answers "what is where, when": per-time values of
// chosen properties across the layers of one or more comps, with each
// layer's active state. Covers value probes, visible-layer listings, and
// match-cut checks (sample both comps, compare the rows).

import { promises as fs } from "node:fs";
import * as path from "node:path";

import {
  analyzeCurve,
  curveGraph,
  parseTiming,
  soundOnsets,
  syncReport,
  type CurveSample,
} from "../color/motion.js";
import { encodePngSrgb8 } from "../color/png16.js";
import { registerOp, jsxFail, jsxVal, jsxCompPreamble, jsxCompLayerPreamble } from "../registry.js";
import type { AeTransport } from "../transport/AeTransport.js";

const DEFAULT_PROPERTIES = [
  ["Transform", "Anchor Point"],
  ["Transform", "Position"],
  ["Transform", "Scale"],
  ["Transform", "Rotation"],
  ["Transform", "Opacity"],
];

registerOp({
  name: "comp.sample",
  category: "comp",
  readOnly: true,
  description:
    "Sample property values at several times across layers of one or more comps in ONE call. Each row says whether the layer is active at that time (enabled and inside its in/out span) and gives the post-expression value of every requested property (default: the five transform properties). Use it to verify motion, list what is visible when, or compare two comps for a match cut.",
  params: [
    {
      name: "comp",
      type: "any",
      description: "Comp name/id, pattern ('shot_*'), or array of those",
      required: true,
    },
    { name: "times", type: "array", description: "Times in seconds to sample", required: true },
    {
      name: "layer",
      type: "any",
      description:
        "Layer filter: index | name | { id } | 'selected' | 'all' | array (default 'all')",
      required: false,
      default: "all",
    },
    {
      name: "properties",
      type: "array",
      description:
        'Property paths to read, e.g. [["Transform","Position"], ["Effects","Slider Control","Slider"]] (default: the five transform properties)',
      required: false,
    },
    {
      name: "activeOnly",
      type: "boolean",
      description: "Omit layers that are not active at the sampled time (default false)",
      required: false,
      default: false,
    },
  ],
  toJsx(args) {
    const times = Array.isArray(args.times) ? (args.times as unknown[]) : [];
    if (times.length === 0 || !times.every((t) => typeof t === "number")) {
      return jsxFail("times must be a non-empty array of numbers");
    }
    const props = (args.properties ?? DEFAULT_PROPERTIES) as unknown[];
    if (!Array.isArray(props) || !props.every((p) => Array.isArray(p) && p.length > 0)) {
      return jsxFail("properties must be an array of property paths (arrays)");
    }
    return `
            var _comps = AE.findComps(${jsxVal(args.comp)});
            if (_comps.length === 0) return { ok: false, error: "no comps matched" };
            var _times = ${jsxVal(times)};
            var _paths = ${jsxVal(props)};
            var _activeOnly = ${jsxVal(args.activeOnly === true)};
            var _out = [];
            for (var _ci = 0; _ci < _comps.length; _ci++) {
                var _c = _comps[_ci];
                var _layers = AE.resolveLayers(_c, ${jsxVal(args.layer ?? "all")});
                var _samples = [];
                for (var _ti = 0; _ti < _times.length; _ti++) {
                    var _t = _times[_ti];
                    var _rows = [];
                    for (var _li = 0; _li < _layers.length; _li++) {
                        var _l = _layers[_li];
                        var _active = _l.enabled && _t >= _l.inPoint && _t < _l.outPoint;
                        if (_activeOnly && !_active) continue;
                        var _row = { index: _l.index, name: _l.name, active: _active, values: {} };
                        for (var _pi = 0; _pi < _paths.length; _pi++) {
                            var _p = AE.propertyAtPath(_l, _paths[_pi]);
                            var _key = _paths[_pi].join("/");
                            if (!_p || _p.propertyType !== PropertyType.PROPERTY) { _row.values[_key] = null; continue; }
                            try { _row.values[_key] = AE.valueToJson(AE.readValue(_p, _t)); }
                            catch (eV) { _row.values[_key] = null; }
                        }
                        _rows.push(_row);
                    }
                    _samples.push({ time: _t, layers: _rows });
                }
                _out.push({ comp: _c.name, id: _c.id, samples: _samples });
            }
            return { ok: true, comps: _out };
        `;
  },
});

// ---------------------------------------------------------------------------
// Reading motion and sound (professional-finish plan, stage 6)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

export interface MotionSoundIO {
  execute(code: string, opts: { label: string; timeoutMs: number; undoGroup?: boolean }): Promise<Json>;
}

function liveIO(transport: AeTransport): MotionSoundIO {
  return {
    async execute(code, opts) {
      const r = await transport.execute({
        code,
        label: opts.label,
        timeoutMs: opts.timeoutMs,
        undoGroup: opts.undoGroup ?? false,
        suppressDialogs: true,
      });
      return r.ok ? r.result : { ok: false, error: r.error ?? `${opts.label} failed` };
    },
  };
}

const TRANSFORM = ["Anchor Point", "Position", "Scale", "Rotation", "Opacity", "X Position", "Y Position", "Z Position", "Orientation"];
/** A property path: an array as given, or a transform property's name. */
function propertyPath(p: unknown): string[] | null {
  if (Array.isArray(p) && p.length && p.every((x) => typeof x === "string")) return p as string[];
  if (typeof p === "string") return TRANSFORM.includes(p) ? ["Transform", p] : [p];
  return null;
}

/** JSX: a property's value at every frame over a span (default the layer's span in the comp), and its keys. */
function curveReadJsx(args: { comp: unknown; layer: unknown; path: string[]; start?: number; end?: number }): string {
  return `
            ${jsxCompLayerPreamble(args as Record<string, unknown>)}
            var _p = AE.propertyAtPath(_layer, ${jsxVal(args.path)});
            if (!_p || _p.propertyType !== PropertyType.PROPERTY) return { ok: false, error: "no property " + ${jsxVal(args.path.join(" > "))} + " on " + _layer.name };
            var _fd = _comp.frameDuration;
            var _s = ${jsxVal(args.start ?? null)};
            var _e = ${jsxVal(args.end ?? null)};
            if (_s === null) _s = Math.max(0, _layer.inPoint);
            if (_e === null) _e = Math.min(_comp.duration, _layer.outPoint);
            var _f0 = Math.round(_s / _fd);
            var _f1 = Math.round(_e / _fd);
            if (_f1 - _f0 > 3000) return { ok: false, error: "over 3000 frames; give start and end" };
            var _vals = [];
            for (var _f = _f0; _f <= _f1; _f++) {
                var _v = AE.valueToJson(AE.readValue(_p, _f * _fd));
                _vals.push(_v);
            }
            var _interp = function (v) { return v === KeyframeInterpolationType.LINEAR ? "linear" : v === KeyframeInterpolationType.BEZIER ? "bezier" : v === KeyframeInterpolationType.HOLD ? "hold" : String(v); };
            var _keys = [];
            for (var _k = 1; _k <= _p.numKeys; _k++) {
                var _kt = _p.keyTime(_k);
                _keys.push({ time: _kt, frame: Math.round(_kt / _fd), inInterpolation: _interp(_p.keyInInterpolationType(_k)), outInterpolation: _interp(_p.keyOutInterpolationType(_k)) });
            }
            return { ok: true, layer: _layer.name, property: _p.name, fps: 1 / _fd, startFrame: _f0, values: _vals, keys: _keys };
        `;
}

export async function runCurve(args: Record<string, unknown>, io: MotionSoundIO): Promise<Json> {
  const p = propertyPath(args.property);
  if (!p) return { ok: false, error: "`property` must be a transform property's name or a path of names" };
  const num = (k: string) => (typeof args[k] === "number" ? (args[k] as number) : undefined);
  const r = await io.execute(curveReadJsx({ comp: args.comp, layer: args.layer, path: p, start: num("start"), end: num("end") }), {
    label: "motion.curve read",
    timeoutMs: 120_000,
  });
  if (!r?.ok) return { ok: false, error: r?.error ?? "could not read the property" };
  const samples: CurveSample[] = (r.values as unknown[]).map((v, i) => ({
    frame: r.startFrame + i,
    time: (r.startFrame + i) / r.fps,
    value: Array.isArray(v) ? (v as number[]).map(Number) : [Number(v)],
  }));
  if (samples.some((s) => s.value.some((x) => !Number.isFinite(x))))
    return { ok: false, error: `${r.property} is not a number or a list of numbers` };
  const report = analyzeCurve(samples, r.fps);
  let graph: string | null = null;
  if (typeof args.outPath === "string") {
    if (!path.isAbsolute(args.outPath)) return { ok: false, error: "`outPath` must be absolute (.png)" };
    const g = curveGraph(report, { width: 480, height: 160 });
    await fs.mkdir(path.dirname(args.outPath), { recursive: true });
    await fs.writeFile(args.outPath, encodePngSrgb8(g.width, g.height, g.rgb));
    graph = args.outPath;
  }
  return {
    ok: true,
    layer: r.layer,
    property: r.property,
    fps: r.fps,
    span: { from: samples[0]?.frame ?? null, to: samples[samples.length - 1]?.frame ?? null },
    keys: r.keys,
    moves: report.moves,
    flags: report.flags,
    reading: report.reading,
    graph,
    ...(args.perFrame === true ? { frames: report.frames } : {}),
  };
}

/** JSX: Convert Audio to Keyframes on a layer; the amplitude per frame of each channel; the helper layer removed. */
function amplitudeJsx(args: { comp: unknown; layer: unknown }): string {
  return `
            ${jsxCompLayerPreamble(args as Record<string, unknown>)}
            if (!_layer.hasAudio) return { ok: false, error: _layer.name + " has no audio" };
            var _was = [];
            for (var _i = 1; _i <= _comp.numLayers; _i++) { _was.push(_comp.layer(_i).selected); _comp.layer(_i).selected = false; }
            var _before = _comp.numLayers;
            _comp.openInViewer();
            _layer.selected = true;
            var _id = app.findMenuCommandId("Convert Audio to Keyframes");
            if (!_id) return { ok: false, error: "After Effects has no Convert Audio to Keyframes command here" };
            app.executeCommand(_id);
            if (_comp.numLayers !== _before + 1) return { ok: false, error: "Convert Audio to Keyframes made no layer" };
            var _amp = null;
            for (var _j = 1; _j <= _comp.numLayers; _j++) { var _l = _comp.layer(_j); var _fx = _l.property("ADBE Effect Parade"); if (_fx && _fx.numProperties === 3 && _l !== _layer && _l.name.indexOf("Audio Amplitude") === 0) _amp = _l; }
            if (!_amp) return { ok: false, error: "could not find the Audio Amplitude layer" };
            var _fd = _comp.frameDuration;
            var _n = Math.round(_comp.duration / _fd);
            var _read = function (k) { var p = _amp.property("ADBE Effect Parade").property(k).property(1); var v = []; for (var f = 0; f < _n; f++) v.push(Math.round(p.valueAtTime(f * _fd, false) * 1000) / 1000); return v; };
            var _out = { ok: true, fps: 1 / _fd, left: _read(1), right: _read(2), both: _read(3) };
            _amp.remove();
            for (var _r = 1; _r <= _comp.numLayers && _r <= _was.length; _r++) _comp.layer(_r).selected = _was[_r - 1];
            return _out;
        `;
}

function fpsJsx(args: { comp: unknown }): string {
  return `
            ${jsxCompPreamble(args as Record<string, unknown>)}
            return { ok: true, fps: 1 / _comp.frameDuration };
        `;
}

/** JSX: comp markers whose comment starts with "<prefix>:" removed (when asked), the new ones added. */
function addMarkersJsx(args: { comp: unknown; markers: Array<{ time: number; comment: string }>; prefix: string; replace: boolean }): string {
  return `
            ${jsxCompPreamble(args as Record<string, unknown>)}
            var _mp = _comp.markerProperty;
            var _removed = 0;
            if (${jsxVal(args.replace)}) {
                for (var _k = _mp.numKeys; _k >= 1; _k--) if (String(_mp.keyValue(_k).comment).indexOf(${jsxVal(args.prefix + ":")}) === 0) { _mp.removeKey(_k); _removed++; }
            }
            var _ms = ${jsxVal(args.markers)};
            for (var _i = 0; _i < _ms.length; _i++) _mp.setValueAtTime(_ms[_i].time, new MarkerValue(_ms[_i].comment));
            return { ok: true, added: _ms.length, removed: _removed, numMarkers: _mp.numKeys };
        `;
}

/** Convert Audio to Keyframes' amplitude under this on every frame is silence (about -57 dB of full scale on its scale: 0.3 of full scale reads 21.2). */
export const SILENCE_BELOW = 0.1;

export async function runSoundMarkers(args: Record<string, unknown>, io: MotionSoundIO): Promise<Json> {
  const prefix = typeof args.prefix === "string" && args.prefix ? args.prefix : "sound";
  const hasTiming = typeof args.timing === "string";
  if (hasTiming === (args.layer !== undefined))
    return { ok: false, error: "give exactly one of `timing` (a timing file) or `layer` (a layer with sound, read by loudness)" };
  let fps: number;
  let found: Array<{ time: number; label: string; frame: number; level?: number }>;
  let source: Json;
  if (hasTiming) {
    const f = args.timing as string;
    if (!path.isAbsolute(f)) return { ok: false, error: "`timing` must be an absolute path" };
    const r = await io.execute(fpsJsx({ comp: args.comp }), { label: "sound.markers fps", timeoutMs: 30_000 });
    if (!r?.ok) return { ok: false, error: r?.error ?? "could not read the comp" };
    fps = r.fps;
    try {
      found = parseTiming(await fs.readFile(f, "utf8"), fps).map((m) => ({ ...m, frame: Math.round(m.time * fps) }));
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
    source = { kind: "timing file", path: f };
  } else {
    const r = await io.execute(amplitudeJsx({ comp: args.comp, layer: args.layer }), {
      label: "sound.markers amplitude",
      timeoutMs: 300_000,
      undoGroup: true,
    });
    if (!r?.ok) return { ok: false, error: r?.error ?? "Convert Audio to Keyframes failed" };
    fps = r.fps;
    const left = r.left as number[];
    const right = r.right as number[];
    const louder = left.map((v, i) => Math.max(v, right[i] ?? 0));
    const top = Math.max(0, ...louder);
    // Measured live: a tone at 0.3 of full scale reads 21.2; the four-channel take's voice read a top of 0.002.
    if (top < SILENCE_BELOW)
      return {
        ok: false,
        error:
          `After Effects read this layer's sound as silence (Convert Audio to Keyframes' amplitude stays under ${SILENCE_BELOW} on every frame; its top was ${top}). A four-channel AAC take did this, though a four-channel WAV with the voice on its first channel read as left: extract the voice to a mono WAV (ffmpeg -i take.mp4 -af pan=mono|c0=c0 voice.wav), import that and read it instead, or give a timing file.`,
      };
    found = soundOnsets(louder, fps, {
      share: typeof args.share === "number" ? args.share : undefined,
    }).map((o) => ({ time: o.time, frame: o.frame, label: "beat", level: o.level }));
    source = { kind: "loudness", layer: args.layer, channels: { left: Math.max(0, ...left), right: Math.max(0, ...right) } };
  }
  const add = await io.execute(
    addMarkersJsx({
      comp: args.comp,
      markers: found.map((m) => ({ time: m.time, comment: `${prefix}: ${m.label}` })),
      prefix,
      replace: args.replace !== false,
    }),
    { label: "sound.markers add", timeoutMs: 60_000, undoGroup: true },
  );
  if (!add?.ok) return { ok: false, error: add?.error ?? "could not add the markers" };
  return {
    ok: true,
    source,
    fps,
    markers: found,
    added: add.added,
    removed: add.removed,
    reading: `${found.length} marker${found.length === 1 ? "" : "s"} added as '${prefix}: …'${add.removed ? `, ${add.removed} earlier ones replaced` : ""}.`,
  };
}

/** JSX: the comp's markers, and named events: key times of properties and layers' in-points. */
function syncReadJsx(args: { comp: unknown; keys: Array<{ layer: unknown; path: string[] }>; inPoints: unknown[] }): string {
  return `
            ${jsxCompPreamble(args as Record<string, unknown>)}
            var _mp = _comp.markerProperty;
            var _markers = [];
            for (var _k = 1; _k <= _mp.numKeys; _k++) _markers.push({ time: _mp.keyTime(_k), comment: String(_mp.keyValue(_k).comment) });
            var _events = [];
            var _keys = ${jsxVal(args.keys)};
            for (var _i = 0; _i < _keys.length; _i++) {
                var _l = AE.findLayerInComp(_comp, _keys[_i].layer);
                if (!_l) return { ok: false, error: "no layer " + _keys[_i].layer };
                var _p = AE.propertyAtPath(_l, _keys[_i].path);
                if (!_p) return { ok: false, error: "no property " + _keys[_i].path.join(" > ") + " on " + _l.name };
                for (var _j = 1; _j <= _p.numKeys; _j++) _events.push({ name: _l.name + " " + _p.name + " key " + _j, time: _p.keyTime(_j) });
            }
            var _ins = ${jsxVal(args.inPoints)};
            for (var _n = 0; _n < _ins.length; _n++) {
                var _li = AE.findLayerInComp(_comp, _ins[_n]);
                if (!_li) return { ok: false, error: "no layer " + _ins[_n] };
                _events.push({ name: _li.name + " in-point", time: _li.inPoint });
            }
            return { ok: true, fps: 1 / _comp.frameDuration, markers: _markers, events: _events };
        `;
}

export async function runSync(args: Record<string, unknown>, io: MotionSoundIO): Promise<Json> {
  const keys = Array.isArray(args.keys)
    ? (args.keys as Array<{ layer: unknown; property: unknown }>).map((k) => ({ layer: k.layer, path: propertyPath(k.property) ?? [] }))
    : [];
  if (keys.some((k) => !k.path.length)) return { ok: false, error: "each of `keys` needs { layer, property }" };
  const inPoints = Array.isArray(args.inPoints) ? args.inPoints : [];
  const given = Array.isArray(args.events) ? (args.events as Array<{ name: string; time: number }>) : [];
  if (!keys.length && !inPoints.length && !given.length)
    return { ok: false, error: "give events: `keys`, `inPoints` or `events` ({ name, time }, for example spikes from ae_render_frame diff)" };
  const r = await io.execute(syncReadJsx({ comp: args.comp, keys, inPoints }), { label: "sound.sync read", timeoutMs: 60_000 });
  if (!r?.ok) return { ok: false, error: r?.error ?? "could not read the comp" };
  const prefix = typeof args.markerPrefix === "string" ? args.markerPrefix : null;
  const markers = (r.markers as Array<{ time: number; comment: string }>)
    .filter((m) => prefix === null || m.comment.startsWith(prefix))
    .map((m) => ({ time: m.time, label: m.comment }));
  const rep = syncReport([...r.events, ...given], markers, r.fps, {
    lateFrames: typeof args.lateFrames === "number" ? args.lateFrames : undefined,
    earlyFrames: typeof args.earlyFrames === "number" ? args.earlyFrames : undefined,
  });
  return { ok: true, fps: r.fps, markers: markers.length, ...rep };
}

registerOp({
  name: "motion.curve",
  category: "motion",
  readOnly: true,
  description:
    "How a property moves: its value at every frame over a span (default the layer's span), speed per frame (units a second), the moves (from rest to rest), and flags: a move with no ease (its first or last moving frame already at 60% or more of its middle speed), a sudden jump in speed inside a move (2.5 times from one frame to the next and a quarter of its top speed), and how far a move overshoots and how many frames it takes to settle within 1%. `outPath` draws a 480 x 160 graph (values light, speed orange, moves shaded, flags red). Keys and their interpolation come with it. Thresholds are starting points, not judgments: a mechanical, constant move is linear on purpose.",
  params: [
    { name: "comp", type: "any", description: "Comp name or id", required: true },
    { name: "layer", type: "any", description: "Layer index, name or { id }", required: true },
    { name: "property", type: "any", description: "A transform property's name ('Position') or a path of names", required: true },
    { name: "start", type: "number", description: "Seconds (default the layer's in-point)", required: false },
    { name: "end", type: "number", description: "Seconds (default the layer's out-point)", required: false },
    { name: "outPath", type: "string", description: "Absolute .png path for the graph", required: false },
    { name: "perFrame", type: "boolean", description: "Include value and speed of every frame (default false)", required: false },
  ],
  toJsx: () => jsxFail("motion.curve runs in Node; call it through ae_do"),
  run: (args, transport) => runCurve(args, liveIO(transport)),
});

registerOp({
  name: "sound.markers",
  category: "sound",
  description:
    "Put word or beat times on the comp as markers ('<prefix>: <label>', prefix default 'sound'; earlier ones with the same prefix are replaced unless replace: false). From `timing` (a JSON list of { word|w|text|label, start|time|t in seconds, or frame }, or CSV time,label) or from `layer`'s loudness: After Effects' Convert Audio to Keyframes is run on the layer (the comp is opened in the viewer for it), the amplitude read per frame (the louder of left and right), the helper layer removed, and a beat marked where loudness rises past 30% of the way from its median to its top. Checked live on mono, stereo and four-channel WAVs (signal on channel 1 reads as left). A track After Effects reads as silence is refused with what to do.",
  params: [
    { name: "comp", type: "any", description: "Comp name or id", required: true },
    { name: "timing", type: "string", description: "Absolute path of a timing file", required: false },
    { name: "layer", type: "any", description: "A layer with sound, read by loudness", required: false },
    { name: "prefix", type: "string", description: "Marker comment prefix (default 'sound')", required: false },
    { name: "replace", type: "boolean", description: "Replace earlier markers with the prefix (default true)", required: false },
    { name: "share", type: "number", description: "Loudness threshold, share of the way from median to top (default 0.3)", required: false },
  ],
  toJsx: () => jsxFail("sound.markers runs in Node; call it through ae_do"),
  run: (args, transport) => runSoundMarkers(args, liveIO(transport)),
});

registerOp({
  name: "sound.sync",
  category: "sound",
  readOnly: true,
  description:
    "How far named events sit from the nearest comp marker, in frames: key times of properties (`keys`: [{ layer, property }]), layers' in-points (`inPoints`), and any `events` you give ({ name, time }, for example spikes from ae_render_frame diff). Positive is after the marker. Flagged from 2 frames after or 4 before (ITU-R BT.1359's detectability thresholds, sound 45 ms early and 125 ms late, at 30 fps); `markerPrefix` keeps only markers whose comment starts with it.",
  params: [
    { name: "comp", type: "any", description: "Comp name or id", required: true },
    { name: "keys", type: "array", description: "[{ layer, property }]: each key is an event", required: false },
    { name: "inPoints", type: "array", description: "Layers whose in-points are events", required: false },
    { name: "events", type: "array", description: "[{ name, time }] in seconds", required: false },
    { name: "markerPrefix", type: "string", description: "Only markers whose comment starts with this", required: false },
    { name: "lateFrames", type: "number", description: "Flag from this many frames after (default 2)", required: false },
    { name: "earlyFrames", type: "number", description: "Flag from this many frames before (default 4)", required: false },
  ],
  toJsx: () => jsxFail("sound.sync runs in Node; call it through ae_do"),
  run: (args, transport) => runSync(args, liveIO(transport)),
});
