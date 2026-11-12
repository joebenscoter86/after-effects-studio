import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import {
  SPECK_DEFAULTS,
  distanceTo,
  furthestFrame,
  matteCoverage,
  subjectTop,
  cutoutRegions,
  outlineTracker,
  speckPieces,
  SEEN_THROUGH_DEFAULTS,
  seenThroughInside,
  EDGE_DEFAULTS,
  enclosedHoles,
  growMask
} from "../color/matte.js";
import { decodePng, encodePngGray8, encodePngSrgb8 } from "../color/png16.js";
import {
  composeContactSheet,
  flattenOver,
  labOf,
  lookCrops,
  measureLook,
  resample,
  summarizeLookSeries
} from "../color/sheet.js";
import { rejectedOutputPath } from "../config.js";
import {
  registerOp,
  jsxFail,
  jsxVal,
  jsxCompLayerPreamble,
  jsxCompPreamble,
  getOp
} from "../registry.js";
import { PARK_QUEUE_FN, QUEUE_CHANGE_NOTE, RENDER_QUEUE_UNDO_WARNING } from "./render.js";
import { renderFrameTool } from "../tools/render-frame.js";
const KEYLIGHT_MATCH_NAME = "Keylight 906";
const KEY_CLEANER_MATCH_NAME = "ADBE KeyCleaner";
const SPILL_SUPPRESSOR_MATCH_NAME = "ADBE Spill2";
const VIEW_MATCH_NAME = "Keylight 906-0002";
const SCREEN_COLOUR_MATCH_NAME = "Keylight 906-0004";
const KEYLIGHT_VIEWS = [
  "source",
  "source_alpha",
  "corrected_source",
  "colour_correction_edges",
  "screen_matte",
  "inside_mask",
  "outside_mask",
  "combined_matte",
  "status",
  "intermediate_result",
  "final_result"
];
const VIEW_LIST = KEYLIGHT_VIEWS.map((v, i) => `${v} (${i + 1})`).join(", ");
const KEYLIGHT_SETTINGS = {
  screenColour: {
    matchName: SCREEN_COLOUR_MATCH_NAME,
    kind: "colour",
    doc: "Screen Colour [r, g, b] 0..1, capture values: from ae_render_frame `screen` (colour.nearSubject or colour.median) on the un-keyed source"
  },
  screenGain: {
    matchName: "Keylight 906-0005",
    kind: "number",
    doc: "Screen Gain, 0..5000 (default 100)"
  },
  screenBalance: {
    matchName: "Keylight 906-0006",
    kind: "number",
    doc: "Screen Balance, 0..100 (default 50)"
  },
  despillBias: {
    matchName: "Keylight 906-0007",
    kind: "colour",
    doc: "Despill Bias [r, g, b] 0..1 (default 0.498 grey)"
  },
  alphaBias: {
    matchName: "Keylight 906-0008",
    kind: "colour",
    doc: "Alpha Bias [r, g, b] 0..1 (default 0.498 grey)"
  },
  lockBiases: {
    matchName: "Keylight 906-0009",
    kind: "switch",
    doc: "Lock Biases Together (default on)"
  },
  screenPreBlur: {
    matchName: "Keylight 906-0010",
    kind: "number",
    doc: "Screen Pre-blur, 0..5000 (default 0)"
  },
  clipBlack: {
    matchName: "Keylight 906-0012",
    kind: "number",
    doc: "Clip Black, 0..100 (default 0)"
  },
  clipWhite: {
    matchName: "Keylight 906-0013",
    kind: "number",
    doc: "Clip White, 0..100 (default 100)"
  },
  clipRollback: {
    matchName: "Keylight 906-0014",
    kind: "number",
    doc: "Clip Rollback, 0..5000 (default 0)"
  },
  screenShrinkGrow: {
    matchName: "Keylight 906-0015",
    kind: "number",
    doc: "Screen Shrink/Grow, -5000..5000 (default 0)"
  },
  screenSoftness: {
    matchName: "Keylight 906-0016",
    kind: "number",
    doc: "Screen Softness, 0..5000 (default 0)"
  },
  despotBlack: {
    matchName: "Keylight 906-0017",
    kind: "number",
    doc: "Screen Despot Black, 0..5000 (default 0)"
  },
  despotWhite: {
    matchName: "Keylight 906-0018",
    kind: "number",
    doc: "Screen Despot White, 0..5000 (default 0)"
  }
};
const KEY_CLEANER_SETTINGS = {
  additionalEdgeRadius: {
    matchName: "ADBE KeyCleaner-0006",
    kind: "number",
    doc: "Additional Edge Radius, 0..250 (default 10)"
  },
  reduceChatter: {
    matchName: "ADBE KeyCleaner-0002",
    kind: "switch",
    doc: "Reduce Chatter (default off)"
  },
  alphaContrast: {
    matchName: "ADBE KeyCleaner-0016",
    kind: "number",
    doc: "Alpha Contrast, 0..100 (default 0)"
  },
  strength: {
    matchName: "ADBE KeyCleaner-0001",
    kind: "number",
    doc: "Strength, 0..100 (default 100)"
  }
};
const SPILL_SUPPRESSOR_SETTINGS = {
  method: { matchName: "ADBE Spill2-0001", kind: "number", doc: "Method, 1 or 2 (default 1)" },
  suppression: {
    matchName: "ADBE Spill2-1001",
    kind: "number",
    doc: "Suppression, 0..100 (default 100)"
  },
  keyColor: {
    matchName: "ADBE Spill2-0003",
    kind: "colour",
    doc: "Key Color [r, g, b] 0..1 (default pure green), or 'keylight' for Keylight's Screen Colour"
  },
  tolerance: {
    matchName: "ADBE Spill2-0004",
    kind: "number",
    doc: "Tolerance, 0..100 (default 50)"
  },
  desaturate: {
    matchName: "ADBE Spill2-0005",
    kind: "number",
    doc: "Desaturate, 0..100 (default 50)"
  },
  spillRange: {
    matchName: "ADBE Spill2-0006",
    kind: "number",
    doc: "Spill Range, 0..100 (default 50)"
  },
  spillColorCorrection: {
    matchName: "ADBE Spill2-0007",
    kind: "number",
    doc: "Spill Color Correction, 0..100 (default 50)"
  },
  lumaCorrection: {
    matchName: "ADBE Spill2-0008",
    kind: "number",
    doc: "Luma Correction, 0..100 (default 0)"
  }
};
function readMap(settings, extra = {}) {
  const out = { ...extra };
  for (const [k, s] of Object.entries(settings)) out[k] = s.matchName;
  return out;
}
function colourValue(name, v) {
  const ok = Array.isArray(v) && (v.length === 3 || v.length === 4) && v.every((c2) => typeof c2 === "number" && Number.isFinite(c2) && c2 >= 0 && c2 <= 1);
  if (!ok) {
    return `\`${name}\` must be [r, g, b] or [r, g, b, a] with each number in 0..1 (capture values); got ${JSON.stringify(v)}`;
  }
  const c = v;
  return c.length === 3 ? [...c, 1] : [...c];
}
function settingValue(name, s, v) {
  if (s.kind === "colour") return colourValue(name, v);
  if (s.kind === "switch") {
    if (typeof v !== "boolean" && v !== 0 && v !== 1) return `\`${name}\` must be true or false`;
    return v === true || v === 1 ? 1 : 0;
  }
  if (typeof v !== "number" || !Number.isFinite(v))
    return `\`${name}\` must be a number; got ${JSON.stringify(v)}`;
  return v;
}
function keylightViewNumber(v) {
  if (typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= KEYLIGHT_VIEWS.length)
    return v;
  if (typeof v === "string") {
    const norm = v.trim().toLowerCase().replace(/[\s-]+/g, "_").replace(/color/g, "colour");
    const i = KEYLIGHT_VIEWS.indexOf(norm);
    if (i >= 0) return i + 1;
  }
  return `unknown Keylight view ${JSON.stringify(v)}; views: ${VIEW_LIST}`;
}
const keylightIndexParam = {
  name: "effectIndex",
  type: "number",
  description: "1-based index of the Keylight to use when the layer has several (it must be Keylight). Default: the first Keylight in the stack.",
  required: false
};
const compLayerParams = [
  { name: "comp", type: "any", description: "Comp name or id", required: true },
  {
    name: "layer",
    type: "any",
    description: "1-based layer index, or the layer name",
    required: true
  }
];
const FX_ROOT_JSX = `
            var _fxRoot = _layer.property("ADBE Effect Parade");
            if (!_fxRoot) return { ok: false, error: "layer '" + _layer.name + "' cannot carry effects" };
`;
function keylightLookupJsx(effectIndexJsx, hint) {
  return `
            var _kl = AE.pickEffect(_fxRoot, ${jsxVal(KEYLIGHT_MATCH_NAME)}, "Keylight", ${effectIndexJsx});
            if (_kl.error) return { ok: false, error: _kl.error };
            if (_kl.index === null) return { ok: false, error: "layer '" + _layer.name + "' has no Keylight (effects: " + AE.effectListText(_fxRoot) + ")" + ${jsxVal(hint)} };
`;
}
registerOp({
  name: "key.keylight",
  category: "key",
  description: "Key a layer with Keylight from measured values: add Keylight (Keylight 906) if the layer has none, or update the one there, then read every setting back. Measure first: render the un-keyed source with ae_render_frame { screen: true } and pass colour.nearSubject (or colour.median) as screenColour. Every value is checked against After Effects' reported range before anything is written; a refusal writes nothing and removes a Keylight this call added. Returns effectIndex, added, keylightCount, written, values (view and every setting below, as read back) and the effect order. With no settings it only reads. Then look at the result with key.view (screen_matte, status) and ae_render_frame { edge: true }.",
  params: [
    ...compLayerParams,
    keylightIndexParam,
    ...Object.entries(KEYLIGHT_SETTINGS).map(([name, s]) => ({
      name,
      type: s.kind === "colour" ? "array" : s.kind === "switch" ? "boolean" : "number",
      description: s.doc,
      required: false
    }))
  ],
  toJsx(args) {
    const writes = [];
    for (const [key, s] of Object.entries(KEYLIGHT_SETTINGS)) {
      if (args[key] === void 0) continue;
      const v = settingValue(key, s, args[key]);
      if (typeof v === "string") return jsxFail(v);
      writes.push({ key, matchName: s.matchName, value: v });
    }
    const addHint = "; adding one needs screenColour: measure it from the un-keyed source with ae_render_frame { screen: true } and pass colour.nearSubject or colour.median";
    return `
            ${jsxCompLayerPreamble(args)}
            ${FX_ROOT_JSX}
            var _pick = AE.pickEffect(_fxRoot, ${jsxVal(KEYLIGHT_MATCH_NAME)}, "Keylight", ${jsxVal(args.effectIndex ?? null)});
            if (_pick.error) return { ok: false, error: _pick.error };
            var _writes = ${jsxVal(writes)};
            var _idx = _pick.index;
            var _added = false;
            if (_idx === null) {
                if (!${jsxVal(args.screenColour !== void 0)}) {
                    return { ok: false, error: "layer '" + _layer.name + "' has no Keylight (effects: " + AE.effectListText(_fxRoot) + ")" + ${jsxVal(addHint)} };
                }
                _idx = _fxRoot.addProperty(${jsxVal(KEYLIGHT_MATCH_NAME)}).propertyIndex;
                _added = true;
            }
            var _refused = AE.checkEffectWrites(_fxRoot.property(_idx), _writes);
            if (_refused.length > 0) {
                if (_added) { try { _fxRoot.property(_idx).remove(); } catch (eRm) {} }
                var _msgs = [];
                for (var _ri = 0; _ri < _refused.length; _ri++) _msgs.push(_refused[_ri].error);
                return { ok: false, error: "nothing written: " + _msgs.join("; "), refused: _refused, removedAddedKeylight: _added };
            }
            var _failed = AE.applyEffectWrites(_fxRoot.property(_idx), _writes);
            var _written = [];
            for (var _wi = 0; _wi < _writes.length; _wi++) {
                var _bad = false;
                for (var _fi = 0; _fi < _failed.length; _fi++) if (_failed[_fi].setting === _writes[_wi].key) _bad = true;
                if (!_bad) _written.push(_writes[_wi].key);
            }
            var _out = {
                ok: _failed.length === 0,
                effectIndex: _idx,
                added: _added,
                keylightCount: _pick.count + (_added ? 1 : 0),
                name: _fxRoot.property(_idx).name,
                written: _written,
                values: AE.readEffectValues(_fxRoot.property(_idx), ${jsxVal(readMap(KEYLIGHT_SETTINGS, { view: VIEW_MATCH_NAME }))}),
                order: AE.effectOrder(_fxRoot)
            };
            if (_failed.length > 0) {
                _out.failed = _failed;
                _out.error = "After Effects rejected " + _failed.length + " of the checked writes; the rest were written";
            }
            return _out;
        `;
  }
});
registerOp({
  name: "key.view",
  category: "key",
  description: "Set Keylight's View and report the previous one (pass previous.number back to restore it). Look at the key in screen_matte (the key's own matte, before the layer masks), combined_matte (with the masks), status (white solid, black clear, grey partly transparent) and intermediate_result (keyed, without Keylight's own despill). Use source to measure the screen with ae_render_frame { screen: true }. The view is not keyframable.",
  params: [
    ...compLayerParams,
    {
      name: "view",
      type: "any",
      description: `View by name or number: ${VIEW_LIST}. Spaces, hyphens and 'color' are accepted (Screen Matte, final-result).`,
      required: true
    },
    keylightIndexParam
  ],
  toJsx(args) {
    const view = keylightViewNumber(args.view);
    if (typeof view === "string") return jsxFail(view);
    return `
            ${jsxCompLayerPreamble(args)}
            ${FX_ROOT_JSX}
            ${keylightLookupJsx(jsxVal(args.effectIndex ?? null), "; add one with key.keylight")}
            var _names = ${jsxVal(KEYLIGHT_VIEWS)};
            var _viewProp = _fxRoot.property(_kl.index).property(${jsxVal(VIEW_MATCH_NAME)});
            if (!_viewProp) return { ok: false, error: "Keylight has no View property " + ${jsxVal(VIEW_MATCH_NAME)} };
            var _prev = AE.safeGet(function () { return _viewProp.value; }, null);
            var _want = ${jsxVal(view)};
            var _why = AE.checkPropertyWrite(_viewProp, _want);
            if (_why !== null) return { ok: false, error: _why };
            _viewProp.setValue(_want);
            var _now = AE.safeGet(function () { return _viewProp.value; }, null);
            return {
                ok: true,
                effectIndex: _kl.index,
                view: { number: _now, name: _names[_now - 1] || null },
                previous: { number: _prev, name: _prev === null ? null : (_names[_prev - 1] || null) }
            };
        `;
  }
});
function cleanupGroup(name, v, settings) {
  if (v === false) return { want: false };
  if (v === void 0 || v === true) return { want: true, writes: [], fromKeylight: false };
  if (typeof v !== "object" || v === null || Array.isArray(v)) {
    return `\`${name}\` must be an object of settings, true (defaults) or false (leave it out); got ${JSON.stringify(v)}`;
  }
  const writes = [];
  let fromKeylight = false;
  for (const [key, val] of Object.entries(v)) {
    const s = settings[key];
    if (!s)
      return `\`${name}.${key}\` is not a setting; settings: ${Object.keys(settings).join(", ")}`;
    if (key === "keyColor" && val === "keylight") {
      fromKeylight = true;
      continue;
    }
    const value = settingValue(`${name}.${key}`, s, val);
    if (typeof value === "string") return value;
    writes.push({ key, matchName: s.matchName, value });
  }
  return { want: true, writes, fromKeylight };
}
registerOp({
  name: "key.cleanup",
  category: "key",
  description: "Add or update Key Cleaner (ADBE KeyCleaner) and Advanced Spill Suppressor (ADBE Spill2) after the layer's Keylight, in that order, moving existing ones into place, with their main settings (checked before writing; a refusal writes and moves nothing and removes what this call added). Adobe's intended chain is Keylight on Intermediate Result (View 10), then Key Cleaner, then Advanced Spill Suppressor: with Keylight on Final Result, Keylight has already despilled what the others receive. The caller chooses: keylightView: 'intermediate_result' sets that view; otherwise the view is left and a chainNote says so. Returns keylight {index, view}, keyCleaner and spillSuppressor {index, added, written, values} (null when left out), the effect order, and chainNote. Remove spill only after the matte is right; read edge spill on the final alpha afterwards.",
  params: [
    ...compLayerParams,
    {
      name: "keyCleaner",
      type: "any",
      description: `Key Cleaner settings object, true for its defaults (the default), or false to leave it out. Settings: ${Object.entries(
        KEY_CLEANER_SETTINGS
      ).map(([k, s]) => `${k} (${s.doc})`).join("; ")}.`,
      required: false
    },
    {
      name: "spillSuppressor",
      type: "any",
      description: `Advanced Spill Suppressor settings object, true for its defaults (the default), or false to leave it out. Settings: ${Object.entries(
        SPILL_SUPPRESSOR_SETTINGS
      ).map(([k, s]) => `${k} (${s.doc})`).join("; ")}. Which Method value is Standard and which Ultra was not confirmed live.`,
      required: false
    },
    {
      name: "keylightView",
      type: "any",
      description: "Also set Keylight's View (name or number, as key.view); 'intermediate_result' for Adobe's intended chain.",
      required: false
    },
    { ...keylightIndexParam, name: "keylightIndex" }
  ],
  toJsx(args) {
    const kc = cleanupGroup("keyCleaner", args.keyCleaner, KEY_CLEANER_SETTINGS);
    if (typeof kc === "string") return jsxFail(kc);
    const ss = cleanupGroup("spillSuppressor", args.spillSuppressor, SPILL_SUPPRESSOR_SETTINGS);
    if (typeof ss === "string") return jsxFail(ss);
    let view = null;
    if (args.keylightView !== void 0) {
      const v = keylightViewNumber(args.keylightView);
      if (typeof v === "string") return jsxFail(`keylightView: ${v}`);
      view = v;
    }
    const chainNote = "Adobe's intended chain is Keylight on Intermediate Result (10), then Key Cleaner, then Advanced Spill Suppressor; on any other view Keylight hands the cleanup effects its own output (on Final Result already despilled). Pass keylightView: 'intermediate_result' (or use key.view) for that chain.";
    return `
            ${jsxCompLayerPreamble(args)}
            ${FX_ROOT_JSX}
            ${keylightLookupJsx(jsxVal(args.keylightIndex ?? null), "; key the layer with key.keylight first")}
            var _names = ${jsxVal(KEYLIGHT_VIEWS)};
            var _wantKC = ${jsxVal(kc.want)};
            var _wantSS = ${jsxVal(ss.want)};
            var _kcWrites = ${jsxVal(kc.want ? kc.writes : [])};
            var _ssWrites = ${jsxVal(ss.want ? ss.writes : [])};
            var _view = ${jsxVal(view)};
            var _track = { kl: _kl.index, kc: null, ss: null };
            var _kcAnchorOnly = false;
            var _kcFound = AE.pickEffect(_fxRoot, ${jsxVal(KEY_CLEANER_MATCH_NAME)}, "Key Cleaner", null);
            if (_wantKC) _track.kc = _kcFound.index;
            else if (_kcFound.index !== null && _kcFound.index > _kl.index) { _track.kc = _kcFound.index; _kcAnchorOnly = true; }
            if (_wantSS) _track.ss = AE.pickEffect(_fxRoot, ${jsxVal(SPILL_SUPPRESSOR_MATCH_NAME)}, "Advanced Spill Suppressor", null).index;
            if (${jsxVal(ss.want && ss.fromKeylight)}) {
                var _sc = AE.safeGet(function () { return AE.valueToJson(_fxRoot.property(_kl.index).property(${jsxVal(SCREEN_COLOUR_MATCH_NAME)}).value); }, null);
                if (!_sc) return { ok: false, error: "could not read Keylight's Screen Colour for keyColor 'keylight'" };
                _ssWrites.push({ key: "keyColor", matchName: ${jsxVal(SPILL_SUPPRESSOR_SETTINGS.keyColor.matchName)}, value: _sc });
            }
            var _kcAdded = false;
            var _ssAdded = false;
            if (_wantKC && _track.kc === null) { _track.kc = _fxRoot.addProperty(${jsxVal(KEY_CLEANER_MATCH_NAME)}).propertyIndex; _kcAdded = true; }
            if (_wantSS && _track.ss === null) { _track.ss = _fxRoot.addProperty(${jsxVal(SPILL_SUPPRESSOR_MATCH_NAME)}).propertyIndex; _ssAdded = true; }
            var _refused = [];
            if (_wantKC) _refused = _refused.concat(AE.checkEffectWrites(_fxRoot.property(_track.kc), _kcWrites));
            if (_wantSS) _refused = _refused.concat(AE.checkEffectWrites(_fxRoot.property(_track.ss), _ssWrites));
            if (_view !== null) {
                var _vw = AE.checkPropertyWrite(_fxRoot.property(_track.kl).property(${jsxVal(VIEW_MATCH_NAME)}), _view);
                if (_vw !== null) _refused.push({ setting: "keylightView", error: _vw });
            }
            if (_refused.length > 0) {
                var _drop = [];
                if (_kcAdded) _drop.push(_track.kc);
                if (_ssAdded) _drop.push(_track.ss);
                _drop.sort(function (a, b) { return b - a; });
                for (var _di = 0; _di < _drop.length; _di++) { try { _fxRoot.property(_drop[_di]).remove(); } catch (eRm) {} }
                var _msgs = [];
                for (var _ri = 0; _ri < _refused.length; _ri++) _msgs.push(_refused[_ri].error);
                return { ok: false, error: "nothing written or moved: " + _msgs.join("; "), refused: _refused };
            }
            if (_wantKC) AE.placeTrackedAfter(_fxRoot, _track, "kc", "kl");
            if (_wantSS) AE.placeTrackedAfter(_fxRoot, _track, "ss", _track.kc !== null ? "kc" : "kl");
            var _failed = [];
            if (_wantKC) _failed = _failed.concat(AE.applyEffectWrites(_fxRoot.property(_track.kc), _kcWrites));
            if (_wantSS) _failed = _failed.concat(AE.applyEffectWrites(_fxRoot.property(_track.ss), _ssWrites));
            var _viewProp = _fxRoot.property(_track.kl).property(${jsxVal(VIEW_MATCH_NAME)});
            if (_view !== null) {
                try { _viewProp.setValue(_view); } catch (eV) { _failed.push({ setting: "keylightView", error: AE.errText(eV) }); }
            }
            function _keys(ws) { var o = []; for (var i = 0; i < ws.length; i++) o.push(ws[i].key); return o; }
            var _nowView = AE.safeGet(function () { return _viewProp.value; }, null);
            var _out = {
                ok: _failed.length === 0,
                keylight: { index: _track.kl, view: { number: _nowView, name: _names[_nowView - 1] || null } },
                keyCleaner: _wantKC ? {
                    index: _track.kc,
                    added: _kcAdded,
                    written: _keys(_kcWrites),
                    values: AE.readEffectValues(_fxRoot.property(_track.kc), ${jsxVal(readMap(KEY_CLEANER_SETTINGS))})
                } : null,
                spillSuppressor: _wantSS ? {
                    index: _track.ss,
                    added: _ssAdded,
                    written: _keys(_ssWrites),
                    values: AE.readEffectValues(_fxRoot.property(_track.ss), ${jsxVal(readMap(SPILL_SUPPRESSOR_SETTINGS))})
                } : null,
                order: AE.effectOrder(_fxRoot)
            };
            if (_kcAnchorOnly) _out.keyCleanerLeftAsIs = _track.kc;
            if (_nowView !== 10) _out.chainNote = ${jsxVal(chainNote)};
            if (_failed.length > 0) {
                _out.failed = _failed;
                _out.error = "After Effects rejected " + _failed.length + " of the checked writes; the rest were written";
            }
            return _out;
        `;
  }
});
const OBJECT_MATTE_MATCH_NAME = "ADBE Samurai";
const OBJECT_MATTE_SELECTIONS_MATCH_NAME = "ADBE Samurai Strokes Group";
const PAINT_DURATION_MATCH_NAME = "ADBE Paint Duration";
const PAINT_TRANSFORM_MATCH_NAME = "ADBE Paint Transform";
const PAINT_POSITION_MATCH_NAME = "ADBE Paint Position";
const OBJECT_MATTE_SETTINGS = {
  version: {
    matchName: "/propagation_method",
    name: "Version",
    min: 1,
    max: 4,
    default: 4,
    kind: "number",
    writable: false
  },
  feather: {
    matchName: "/spatialsmoothing2",
    name: "Feather",
    min: 0,
    max: 1e3,
    default: 5,
    kind: "number",
    writable: true
  },
  contrast: {
    matchName: "/spatialsoftness2",
    name: "Contrast",
    min: 0,
    max: 100,
    default: 80,
    kind: "number",
    writable: true
  },
  shiftEdge: {
    matchName: "/rmshiftedges",
    name: "Shift Edge",
    min: -100,
    max: 100,
    default: 0,
    kind: "number",
    writable: true
  },
  reduceChatter: {
    matchName: "/rmreducechatter",
    name: "Reduce Chatter",
    min: 0,
    max: 100,
    default: 0,
    kind: "number",
    writable: true
  },
  invert: {
    matchName: "/invertforegroundbackground",
    name: "Invert Foreground/Background",
    min: 0,
    max: 1,
    default: null,
    kind: "switch",
    writable: true,
    doc: "Invert Foreground/Background: true keeps everything except the selection"
  },
  fineTune: {
    matchName: "/rmrefinematteenable",
    name: "Fine-tune Object Matte",
    min: 0,
    max: 1,
    default: 1,
    kind: "switch",
    writable: false
  },
  useMotionBlur: {
    matchName: "/rmusemotionblur",
    name: "Use Motion Blur",
    min: null,
    max: null,
    default: null,
    kind: "switch",
    writable: false
  },
  decontaminateEdgeColors: {
    matchName: "/rmcleanedgecolors",
    name: "Decontaminate Edge Colors",
    min: 0,
    max: 1,
    default: null,
    kind: "switch",
    writable: true,
    doc: "Decontaminate Edge Colors: true takes the background's colour out of the edge. On green-screen footage it moved the edge's green excess from -0.0005 to -0.009; turn it on when ae_render_frame's edge report shows the edge leaning to the screen colour. With no green screen, on the half-size take, it took the wall's colour in the hair's edge from 56% to 38% at the top and 23% at the side (look edgeColour against the wall), with no change to the alpha: the default for an Object Matte cut-out (keying.md Recipe 3)"
  }
};
const SUBJECT_MATTE_NOTICE = "One step here needs you in After Effects: a single click on the subject, about ten seconds. Everything before and after it I do.";
function subjectMatteSteps(opts = {}) {
  const clip = opts.clip === void 0 ? "the clip's name" : `"${opts.clip}"`;
  const given = opts.subject?.trim();
  const self = given !== void 0 && /^(yourself|you)$/i.test(given);
  const subject = self ? "yourself" : given || "the person";
  const tint = self ? "You tint magenta." : given ? `${subject.charAt(0).toUpperCase()}${subject.slice(1)} tints magenta.` : "They tint magenta.";
  return [
    `After Effects is showing your clip in the Layer panel (the tab reads "Layer", then ${clip}). I opened it for you.`,
    'In the toolbar at the top, click the Object Matte Tool: the dashed square with an arrow, just left of the pin. If that icon looks different, click and hold it and choose "Object Matte Tool" from the list.',
    'If a tip titled "Object Matte" appears, click OK.',
    'If a yellow bar in the Layer panel says "Draw Object Matte strokes at full resolution", choose View > Resolution > Full in the menu bar, and tell me the bar was there.',
    `Move the pointer over ${subject} in the Layer panel. ${tint} Click once.`,
    `Anything else that should stay in the cut-out, such as a microphone, can be several pieces: hover each piece, check that it tints magenta, and click it. A gap between things, such as between a stand and an arm, needs no click: I take care of gaps afterwards. Do not click ${subject} again.`,
    'Tell me "done". No Spacebar and no Freeze are needed. I will then check the cut-out and show you what is in and what is out.'
  ];
}
function selectionKind(name) {
  if (/^Add Object \d+$/.test(name)) return "object";
  if (/^Add Object Rect \d+$/.test(name)) return "rectangle";
  if (/^Quick Select Foreground \d+$/.test(name)) return "quick-selection";
  return "other";
}
const CLOSE_CLICK_SHARE = 0.05;
const closeClickReading = (a, b, d, limit) => `${a} and ${b} were clicked ${Math.round(d)} source pixels apart (closer than ${Math.round(limit)}): they probably selected the same thing, so a click meant for something else (a microphone) may have landed on the subject again`;
function closeClicks(clicks, sourceSize, minDistance) {
  const limit = minDistance ?? (sourceSize ? Math.round(CLOSE_CLICK_SHARE * Math.min(sourceSize[0], sourceSize[1]) * 100) / 100 : null);
  if (limit === null) return [];
  const out = [];
  const pts = clicks.filter((c) => Array.isArray(c.point) && c.point.length >= 2);
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++) {
      const p = pts[i].point;
      const q = pts[j].point;
      const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
      if (d < limit)
        out.push({
          a: pts[i].name,
          b: pts[j].name,
          distance: Math.round(d * 100) / 100,
          limit,
          reading: closeClickReading(pts[i].name, pts[j].name, d, limit)
        });
    }
  return out;
}
const CHECK_NEXT = "Run subject.check next, before building anything on the cut-out: it renders the cut-out over a flat colour across the clip, finds holes, and returns a picture to show the user.";
const VIEWER_FULL_JSX = `
            function _viewerToFull() {
                var _fid = app.findMenuCommandId("Full");
                if (!_fid) throw new Error("After Effects has no menu command named 'Full' (View > Resolution > Full)");
                app.executeCommand(_fid);
                return _fid;
            }
`;
const VIEWER_NOTE = "View > Resolution > Full sets the comp's resolutionFactor (measured in After Effects 27.0, with the comp open in the viewer); verified means the comp read [1, 1] after the command and again after the Layer panel opened. Starting from the viewer's Auto setting (it drew at Half while the comp was set to Full on 2026-11-11) is not verified, and a script cannot choose Auto. If the yellow full-resolution bar shows, step 4 has the user choose Full.";
const COUNT_NOTE = "A selection count is not a check: it does not say what was selected. Run subject.check and look at its picture before building anything on the cut-out.";
const NEED_CLICK = "run subject.prepare and ask the user for the click, relaying its steps word for word";
const OBJECT_MATTE_JSX = `
            function _omWalk(g, key, field, depth) {
                if (depth > 4) return null;
                var n = AE.safeGet(function () { return g.numProperties; }, 0);
                for (var i = 1; i <= n; i++) {
                    var c = null;
                    try { c = g.property(i); } catch (eC) { c = null; }
                    if (!c) continue;
                    var cm = AE.safeGet(function () { return c.matchName; }, "");
                    var cv = field === "matchName" ? cm : AE.safeGet(function () { return c.name; }, "");
                    if (cv === key) return c;
                    if (cm === ${jsxVal(OBJECT_MATTE_SELECTIONS_MATCH_NAME)}) continue;
                    var ct = AE.safeGet(function () { return c.propertyType; }, null);
                    if (ct !== null && ct !== PropertyType.PROPERTY) {
                        var r = _omWalk(c, key, field, depth + 1);
                        if (r) return r;
                    }
                }
                return null;
            }
            function _omFind(fx, mn, nm) {
                var p = null;
                try { p = fx.property(mn); } catch (eP) { p = null; }
                if (p && AE.safeGet(function () { return p.matchName; }, "") === mn) return { prop: p, foundBy: "matchName" };
                p = _omWalk(fx, mn, "matchName", 0);
                if (p) return { prop: p, foundBy: "walk" };
                if (nm) { p = _omWalk(fx, nm, "name", 0); if (p) return { prop: p, foundBy: "name" }; }
                return { prop: null, foundBy: null };
            }
            function _omKind(nm) {
                if (/^Add Object \\d+$/.test(nm)) return "object";
                if (/^Add Object Rect \\d+$/.test(nm)) return "rectangle";
                if (/^Quick Select Foreground \\d+$/.test(nm)) return "quick-selection";
                return "other";
            }
            function _omCloseClicks(list, size) {
                var out = [];
                if (!size) return out;
                var lim = Math.round(${jsxVal(CLOSE_CLICK_SHARE)} * Math.min(size[0], size[1]) * 100) / 100;
                for (var i = 0; i < list.length; i++) {
                    for (var j = i + 1; j < list.length; j++) {
                        var p = list[i].point, q = list[j].point;
                        if (!p || !q) continue;
                        var d = Math.sqrt((p[0] - q[0]) * (p[0] - q[0]) + (p[1] - q[1]) * (p[1] - q[1]));
                        if (d < lim) out.push({ a: list[i].name, b: list[j].name, distance: Math.round(d * 100) / 100, limit: lim,
                            reading: list[i].name + " and " + list[j].name + " were clicked " + Math.round(d) + " source pixels apart (closer than " + Math.round(lim) + "): " +
                                "they probably selected the same thing, so a click meant for something else (a microphone) may have landed on the subject again" });
                    }
                }
                return out;
            }
            function _omSelections(fx) {
                var g = _omFind(fx, ${jsxVal(OBJECT_MATTE_SELECTIONS_MATCH_NAME)}, "Selections").prop;
                var list = [];
                if (!g) return { found: false, list: list };
                var n = AE.safeGet(function () { return g.numProperties; }, 0);
                for (var i = 1; i <= n; i++) {
                    var s = null;
                    try { s = g.property(i); } catch (eS) { s = null; }
                    if (!s) continue;
                    var nm = AE.safeGet(function () { return s.name; }, "");
                    var dur = AE.safeGet(function () { return AE.valueToJson(s.property(${jsxVal(PAINT_DURATION_MATCH_NAME)}).value); }, null);
                    var pt = AE.safeGet(function () { return AE.valueToJson(s.property(${jsxVal(PAINT_TRANSFORM_MATCH_NAME)}).property(${jsxVal(PAINT_POSITION_MATCH_NAME)}).value); }, null);
                    var cp = (pt && typeof _layer !== "undefined") ? AE.safeGet(function () { return AE.valueToJson(_layer.sourcePointToComp([pt[0], pt[1]])); }, null) : null;
                    list.push({ index: i, name: nm, matchName: AE.safeGet(function () { return s.matchName; }, ""), kind: _omKind(nm), duration: dur,
                        point: pt ? [pt[0], pt[1]] : null, compPoint: cp ? [cp[0], cp[1]] : null,
                        clickTime: (dur && dur.length) ? dur[0] : null,
                        clickFrame: (dur && dur.length && typeof _comp !== "undefined") ? AE.safeGet(function () { return Math.round((AE.safeGet(function () { return _layer.startTime; }, 0) + dur[0]) / _comp.frameDuration); }, null) : null });
                }
                return { found: true, list: list };
            }
            function _omSettings(fx, table) {
                var out = {};
                for (var k in table) {
                    if (!table.hasOwnProperty(k)) continue;
                    var f = _omFind(fx, table[k].matchName, table[k].name);
                    var row = { name: table[k].name, matchName: table[k].matchName, foundBy: f.foundBy, value: null };
                    if (f.prop) {
                        row.value = AE.safeGet(function () { return AE.valueToJson(f.prop.value); }, null);
                        var rg = AE.propertyRange(f.prop);
                        row.reportedRange = { min: rg.min, max: rg.max };
                    }
                    row.measuredRange = { min: table[k].min, max: table[k].max };
                    row["default"] = table[k]["default"];
                    out[k] = row;
                }
                return out;
            }
            function _omFillLayer() {
                var want = _layer.name + " gap fill";
                for (var i = 1; i <= _comp.numLayers; i++) {
                    var n = AE.safeGet(function () { return _comp.layer(i).name; }, "");
                    if (n === want) return n;
                }
                return null;
            }
            function _omAeCache() {
                // After Effects' Disk Cache folder (Preferences > Media & Disk Cache), read only.
                var f = null;
                var types = [];
                try { types = [PREFType.PREF_Type_MACHINE_SPECIFIC, PREFType.PREF_Type_MACHINE_INDEPENDENT]; } catch (eT) { types = []; }
                for (var i = 0; i < types.length && !f; i++) {
                    var t = types[i];
                    f = AE.safeGet(function () { return app.preferences.havePref("Disk Cache Controls", "Folder 7", t) ? app.preferences.getPrefAsString("Disk Cache Controls", "Folder 7", t) : null; }, null);
                }
                return { folder: f || null, version: AE.safeGet(function () { return app.version; }, null) };
            }
            function _omSoftEdge() {
                // The precomp layer subject.soften_edge built for this layer, if any (its comment carries the settings).
                var want = _layer.name + " soft edge";
                for (var i = 1; i <= _comp.numLayers; i++) {
                    var l = _comp.layer(i);
                    if (AE.safeGet(function () { return l.name; }, "") !== want) continue;
                    var c = AE.safeGet(function () { return l.comment; }, "");
                    if (c.indexOf("soft-edge") < 0) continue;
                    var st = null;
                    try { st = eval("(" + c + ")"); } catch (eJ) { st = null; }
                    return { layer: want, index: i, enabled: AE.safeGet(function () { return l.enabled; }, null), matteCopies: 2, settings: st };
                }
                return null;
            }
            function _omSourceSize() {
                var w = AE.safeGet(function () { return _layer.source.width; }, null);
                var h = AE.safeGet(function () { return _layer.source.height; }, null);
                return (typeof w === "number" && typeof h === "number") ? [w, h] : null;
            }
            function _omSpan() {
                var fd = _comp.frameDuration;
                var a = Math.min(_layer.inPoint, _layer.outPoint), b = Math.max(_layer.inPoint, _layer.outPoint);
                return { inFrame: Math.round(a / fd), outFrame: Math.round(b / fd), frameRate: Math.round(1000 / fd) / 1000 };
            }
            function _omSummary(present, sel) {
                if (!present) return "no Object Matte on this layer: the user has not clicked yet";
                if (sel.length === 0) return "Object Matte is on the layer but has no selection yet: the user has not clicked (an Object Matte with no selection makes no matte)";
                var c = { object: 0, rectangle: 0, "quick-selection": 0, other: 0 };
                for (var i = 0; i < sel.length; i++) c[sel[i].kind]++;
                var parts = [];
                if (c.object > 0) parts.push(c.object + (c.object === 1 ? " object selected" : " objects selected"));
                if (c.rectangle > 0) parts.push(c.rectangle + (c.rectangle === 1 ? " rectangle selection" : " rectangle selections"));
                if (c["quick-selection"] > 0) parts.push(c["quick-selection"] + (c["quick-selection"] === 1 ? " quick-selection stroke" : " quick-selection strokes"));
                if (c.other > 0) parts.push(c.other + (c.other === 1 ? " other selection" : " other selections"));
                return parts.join(", ");
            }
`;
const subjectIndexParam = {
  name: "effectIndex",
  type: "number",
  description: "1-based index of the Object Matte to use when the layer has several (it must be Object Matte, ADBE Samurai). Default: the first in the stack.",
  required: false
};
const REMOVE_NOTE = "To take out one wrong selection (a second click that landed on the subject, an 'Add Object Rect' from a click that dragged): subject.remove_selection { comp, layer, selection }. To start the whole selection again: remove this Object Matte with effect.remove { comp, layer, effectIndex }, run subject.prepare, and ask the user for the click again. The user can also take one thing out by Option-clicking it with the Object Matte Tool.";
registerOp({
  name: "subject.prepare",
  category: "subject",
  description: "Get a footage layer ready for the one manual step of a subject matte (After Effects 2027's Object Matte, the old Roto Brush): the user clicks the subject once with the Object Matte Tool; a script cannot make that selection. This call brings the comp forward, chooses View > Resolution > Full and reads the comp's resolution back (viewerResolution: verified only when it reads [1, 1] after the command and after the Layer panel opens; starting from the viewer's Auto setting is not verified), moves to `time` (default: the layer's in point; pick a frame where the subject is clearly visible), selects only that layer and opens it in the Layer panel. It adds no effect and does not pick the tool. Returns notice and steps (the user's instructions, with the clip's name and the subject filled in) and userMessage (both as one text): relay them to the user word for word. Also returns did (the steps done), couldNotDo (any that failed, with the error; beforeSteps then says what to tell the user first) and existing (an Object Matte already on the layer and its selections). Before any of that matters, read sourceAdvice and soundAdvice (or soundNote) when they are there. sourceAdvice: the layer's footage is at least 1.5 times the comp's size in both directions and scaled down to fit (a 2176 x 3840 take at 50% in a 1080 x 1920 comp); it gives the sizes, the disk cache a render needs at each, and the delivery-size copy to make and matte instead, before the click (replacing the footage under a matte freezes it), and relay then says not to give the steps yet. soundAdvice: the file's sound has more than two channels, or After Effects reports none while the file has some (a four-channel take with the voice on the first read as silence, with no warning); it gives the ffmpeg line that extracts the voice to a mono WAV. The file is only read (ffprobe), never changed. After the user says done, run subject.check before building anything. Verified in After Effects 27.0 on a real take, apart from the resolution step as written here; sourceAdvice and soundAdvice are worked out in Node from what After Effects reports and are tested offline.",
  params: [
    ...compLayerParams,
    {
      name: "time",
      type: "number",
      description: "Comp time in seconds to show for the click. Default: the layer's in point. Must be inside the layer.",
      required: false
    },
    {
      name: "subject",
      type: "string",
      description: "What to cut out, as the user would say it ('the presenter', 'the bottle'); goes into step 4. Default: the person.",
      required: false
    }
  ],
  toJsx(args) {
    const mark = "CLIP";
    const steps = subjectMatteSteps({
      clip: mark,
      subject: typeof args.subject === "string" ? args.subject : void 0
    });
    return `
            ${jsxCompLayerPreamble(args)}
            ${FX_ROOT_JSX}
            ${OBJECT_MATTE_JSX}
            var _src = AE.safeGet(function () { return _layer.source; }, null);
            if (!_src) return { ok: false, error: "layer '" + _layer.name + "' has no footage source (a text, shape, null, camera or light layer); Object Matte cuts a subject out of footage" };
            var _in = Math.min(_layer.inPoint, _layer.outPoint);
            var _outP = Math.max(_layer.inPoint, _layer.outPoint);
            var _t = ${jsxVal(args.time ?? null)};
            if (_t === null) _t = _in;
            if (_t < _in || _t >= _outP) return { ok: false, error: "time " + _t + " is outside layer '" + _layer.name + "' (in " + _in + ", out " + _outP + "); nothing was changed" };
            var _did = [];
            var _couldNot = [];
            function _step(what, fn) {
                try { fn(); _did.push(what); } catch (eSt) { _couldNot.push({ step: what, error: AE.errText(eSt) }); }
            }
            _step("brought the comp forward", function () { _comp.openInViewer(); });
            ${VIEWER_FULL_JSX}
            function _resNow() { return AE.safeGet(function () { return [_comp.resolutionFactor[0], _comp.resolutionFactor[1]]; }, null); }
            function _isFull(r) { return r !== null && r[0] === 1 && r[1] === 1; }
            function _resText(r) { return r === null ? "unknown" : "[" + r[0] + ", " + r[1] + "]"; }
            var _viewer = { command: "Full", commandId: null, before: _resNow(), after: null, afterLayerPanel: null, verified: false, note: ${jsxVal(VIEWER_NOTE)} };
            try {
                _viewer.commandId = _viewerToFull();
                _viewer.after = _resNow();
                if (_isFull(_viewer.after)) _did.push("chose View > Resolution > Full (the comp's resolution now reads [1, 1])");
                else _couldNot.push({ step: "chose View > Resolution > Full", error: "the comp's resolution still reads " + _resText(_viewer.after) + " after View > Resolution > Full" });
            } catch (eFull) {
                var _fullMsg = AE.errText(eFull);
                try {
                    _comp.resolutionFactor = [1, 1];
                    _fullMsg += "; set the comp's resolutionFactor to [1, 1] instead (the viewer can still draw at another resolution while it is on Auto)";
                } catch (eRes) { _fullMsg += "; setting the comp's resolutionFactor failed too: " + AE.errText(eRes); }
                _viewer.after = _resNow();
                _couldNot.push({ step: "chose View > Resolution > Full", error: _fullMsg });
            }
            _step("moved to " + _t + " s", function () { _comp.time = _t; });
            _step("selected only layer '" + _layer.name + "'", function () {
                for (var _li = 1; _li <= _comp.numLayers; _li++) { var _l = _comp.layer(_li); if (_l.selected) _l.selected = false; }
                _layer.selected = true;
            });
            var _opened = false;
            _step("opened the layer in the Layer panel", function () {
                var _id = app.findMenuCommandId("Open Layer");
                if (!_id) throw new Error("After Effects has no menu command named 'Open Layer'");
                app.executeCommand(_id);
                _opened = true;
            });
            _viewer.afterLayerPanel = _resNow();
            if (_viewer.commandId !== null && _isFull(_viewer.after)) {
                if (_isFull(_viewer.afterLayerPanel)) _viewer.verified = true;
                else _couldNot.push({ step: "kept the resolution at Full", error: "the comp's resolution read " + _resText(_viewer.afterLayerPanel) + " after the Layer panel opened" });
            }
            var _pick = AE.pickEffect(_fxRoot, ${jsxVal(OBJECT_MATTE_MATCH_NAME)}, "Object Matte", null);
            var _existing = { objectMatte: _pick.index !== null, effectIndex: _pick.index, count: _pick.count || 0, selections: [] };
            if (_pick.index !== null) _existing.selections = _omSelections(_fxRoot.property(_pick.index)).list;
            _existing.summary = _omSummary(_pick.index !== null, _existing.selections);
            var _tmpl = ${jsxVal(steps)};
            var _steps = [];
            for (var _si = 0; _si < _tmpl.length; _si++) _steps.push(_tmpl[_si].split(${jsxVal(mark)}).join(_layer.name));
            var _notice = ${jsxVal(SUBJECT_MATTE_NOTICE)};
            var _lines = [_notice];
            for (var _sj = 0; _sj < _steps.length; _sj++) _lines.push((_sj + 1) + ". " + _steps[_sj]);
            var _spanP = _omSpan();
            var _footage = {
                sourceSize: _omSourceSize(),
                compSize: [_comp.width, _comp.height],
                scale: AE.safeGet(function () { var _sv = _layer.property("ADBE Transform Group").property("ADBE Scale").valueAtTime(_t, false); return [_sv[0], _sv[1]]; }, null),
                frames: _spanP.outFrame - _spanP.inFrame,
                file: AE.safeGet(function () { return _src.file ? _src.file.fsName : null; }, null),
                hasAudio: AE.safeGet(function () { return _src.hasAudio === true; }, false)
            };
            var _out = {
                ok: _couldNot.length === 0,
                comp: _comp.name,
                layer: _layer.name,
                time: _t,
                footage: _footage,
                did: _did,
                couldNotDo: _couldNot,
                viewerResolution: _viewer,
                existing: _existing,
                notice: _notice,
                steps: _steps,
                userMessage: _lines.join("\\n"),
                relay: "Give the user notice and steps word for word (userMessage holds both); do not paraphrase them. Then wait for 'done' and run subject.status.",
                removeNote: ${jsxVal(REMOVE_NOTE)}
            };
            if (!_opened) _out.beforeSteps = "The Layer panel could not be opened by script. Before step 1, tell the user: double-click the layer '" + _layer.name + "' in the timeline to open it in the Layer panel.";
            if (_couldNot.length > 0) {
                var _msgs = [];
                for (var _ci = 0; _ci < _couldNot.length; _ci++) _msgs.push(_couldNot[_ci].step + " (" + _couldNot[_ci].error + ")");
                _out.error = "could not do every step: " + _msgs.join("; ") + ". The steps are still returned; see beforeSteps when the Layer panel did not open.";
            }
            return _out;
        `;
  },
  // In Node too: a source much larger than the comp, and sound After Effects may read as silence.
  async run(args, transport) {
    return runSubjectPrepare(args, {
      execute: async (code) => {
        const r = await transport.execute({ code, label: "subject.prepare", timeoutMs: 6e4 });
        return r.ok ? r.result : { ok: false, error: r.error ?? "subject.prepare failed" };
      },
      probeAudio: ffprobeAudio
    });
  }
});
registerOp({
  name: "subject.status",
  category: "subject",
  readOnly: true,
  description: "Read a layer's subject matte (Object Matte, ADBE Samurai) without changing anything: whether the effect is there, its selections (name; kind 'object' for a click with the Object Matte Tool, 'Add Object N', 'quick-selection' for a stroke with the old brush, 'Quick Select Foreground N', 'other' otherwise; duration), its settings (value, the range After Effects reports now, the range measured in After Effects 27.0, default, and foundBy: how the property was found, matchName, walk or name), and summary, one plain sentence ('no selection yet: the user has not clicked', '1 object selected'). Also each selection's clicked point (Transform > Position, source pixels; compPoint in comp pixels where After Effects gives it), clickTime (the selection's Duration start: seconds, measured 0.49999667 for a click at frame 15) and clickFrame (comp frames), closeClicks (two clicks closer than 5% of the source's shorter side probably selected the same thing), sourceSize, compSize and span (the layer in comp frames). A selection count is not a check: after the user says done, run subject.check. removeNote says how to take a selection out or start again. disk: the size of After Effects' disk cache (its folder read from the Disk Cache preference) and the free space on that drive; diskNote, when that drive has under 10 GB free, says to purge it (Edit > Purge > All Memory & Disk Cache). Nothing is deleted and no preference changed.",
  params: [...compLayerParams, subjectIndexParam],
  toJsx(args) {
    return `
            ${jsxCompLayerPreamble(args)}
            ${FX_ROOT_JSX}
            ${OBJECT_MATTE_JSX}
            var _pick = AE.pickEffect(_fxRoot, ${jsxVal(OBJECT_MATTE_MATCH_NAME)}, "Object Matte", ${jsxVal(args.effectIndex ?? null)});
            if (_pick.error) return { ok: false, error: _pick.error };
            if (_pick.index === null) {
                return { ok: true, layer: _layer.name, objectMatte: { present: false, effectIndex: null, count: 0 }, selections: [], settings: null,
                    summary: _omSummary(false, []), next: ${jsxVal(`Nothing selected: ${NEED_CLICK}.`)}, effects: AE.effectOrder(_fxRoot), aeCache: _omAeCache(), softEdge: _omSoftEdge(),
                    sourceSize: _omSourceSize(), compSize: [_comp.width, _comp.height], span: _omSpan() };
            }
            var _fx = _fxRoot.property(_pick.index);
            var _sel = _omSelections(_fx);
            var _counts = { object: 0, rectangle: 0, quickSelection: 0, other: 0 };
            for (var _i = 0; _i < _sel.list.length; _i++) {
                var _k = _sel.list[_i].kind;
                if (_k === "object") _counts.object++; else if (_k === "rectangle") _counts.rectangle++; else if (_k === "quick-selection") _counts.quickSelection++; else _counts.other++;
            }
            var _src = _omSourceSize();
            var _out = {
                ok: true,
                layer: _layer.name,
                objectMatte: { present: true, effectIndex: _pick.index, count: _pick.count, name: _fx.name, enabled: AE.safeGet(function () { return _fx.enabled; }, null), selectionsGroupFound: _sel.found },
                selections: _sel.list,
                counts: _counts,
                settings: _omSettings(_fx, ${jsxVal(OBJECT_MATTE_SETTINGS)}),
                summary: _omSummary(true, _sel.list),
                countNote: ${jsxVal(COUNT_NOTE)},
                closeClicks: _omCloseClicks(_sel.list, _src),
                sourceSize: _src,
                fillLayer: _omFillLayer(),
                softEdge: _omSoftEdge(),
                aeCache: _omAeCache(),
                compSize: [_comp.width, _comp.height],
                span: _omSpan(),
                removeNote: ${jsxVal(REMOVE_NOTE)},
                effects: AE.effectOrder(_fxRoot),
                next: ${jsxVal(CHECK_NEXT)}
            };
            if (_sel.list.length === 0) _out.next = ${jsxVal(`No selection yet: ${NEED_CLICK}.`)};
            return _out;
        `;
  },
  // In Node too: the size of After Effects' disk cache and the free space on its drive (a note when low).
  async run(args, transport) {
    const r = await transport.execute({
      code: getOp("subject.status").toJsx(args),
      label: "subject.status",
      undoGroup: false,
      timeoutMs: 3e4
    });
    if (!r.ok) return { ok: false, error: r.error ?? "subject.status failed" };
    const st = r.result;
    if (!st?.ok) return st;
    st.disk = await diskReport(st.aeCache);
    if (st.disk?.note) st.diskNote = st.disk.note;
    return st;
  }
});
const MATTE_WRITABLE = Object.entries(OBJECT_MATTE_SETTINGS).filter(([, s]) => s.writable);
function matteSettingValue(key, s, v) {
  if (s.kind === "switch") {
    if (typeof v !== "boolean" && v !== 0 && v !== 1)
      return `\`${key}\` must be true or false; got ${JSON.stringify(v)}`;
    return v === true || v === 1 ? 1 : 0;
  }
  if (typeof v !== "number" || !Number.isFinite(v))
    return `\`${key}\` must be a number; got ${JSON.stringify(v)}`;
  if (s.min !== null && v < s.min || s.max !== null && v > s.max) {
    return `\`${key}\` refused ${v}: Object Matte's ${s.name} takes ${s.min} to ${s.max} (the range After Effects 27.0 reported)`;
  }
  return v;
}
registerOp({
  name: "subject.settings",
  category: "subject",
  description: "Set a subject matte's edge settings on Object Matte (ADBE Samurai) after the user's click: " + MATTE_WRITABLE.map(
    ([k, s]) => `${k} (${s.name}, ${s.min} to ${s.max}${s.default !== null ? `, default ${s.default}` : ""})`
  ).join(", ") + ". Each value is checked against the range measured in After Effects 27.0 and then against the range After Effects reports, before anything is written; one refusal writes nothing. Refuses when the layer has no Object Matte or it has no selection (the user has not clicked: run subject.prepare and ask for the click). Returns effectIndex, written, settings (every setting read back, as subject.status gives them) and summary. Choose values from ae_render_frame's edge report on the matte.",
  params: [
    ...compLayerParams,
    subjectIndexParam,
    ...MATTE_WRITABLE.map(([name, s]) => ({
      name,
      type: s.kind === "switch" ? "boolean" : "number",
      description: s.kind === "switch" ? s.doc ?? `${s.name}: true or false` : `${s.name}, ${s.min} to ${s.max}${s.default !== null ? ` (default ${s.default})` : ""}`,
      required: false
    }))
  ],
  toJsx(args) {
    const writes = [];
    for (const [key, s] of MATTE_WRITABLE) {
      if (args[key] === void 0) continue;
      const v = matteSettingValue(key, s, args[key]);
      if (typeof v === "string") return jsxFail(`${v}; nothing written`);
      writes.push({ key, matchName: s.matchName, name: s.name, value: v });
    }
    if (writes.length === 0) {
      return jsxFail(
        `pass at least one of ${MATTE_WRITABLE.map(([k]) => k).join(", ")}; to read the settings, use subject.status`
      );
    }
    return `
            ${jsxCompLayerPreamble(args)}
            ${FX_ROOT_JSX}
            ${OBJECT_MATTE_JSX}
            var _pick = AE.pickEffect(_fxRoot, ${jsxVal(OBJECT_MATTE_MATCH_NAME)}, "Object Matte", ${jsxVal(args.effectIndex ?? null)});
            if (_pick.error) return { ok: false, error: _pick.error };
            if (_pick.index === null) return { ok: false, error: "layer '" + _layer.name + "' has no Object Matte, so there is no subject matte to set: " + ${jsxVal(`${NEED_CLICK}; nothing written`)} };
            var _fx = _fxRoot.property(_pick.index);
            var _sel = _omSelections(_fx);
            if (_sel.list.length === 0) return { ok: false, error: "Object Matte on layer '" + _layer.name + "' has no selection yet (the user has not clicked), so it makes no matte: " + ${jsxVal(`${NEED_CLICK}; nothing written`)} };
            var _writes = ${jsxVal(writes)};
            var _props = [];
            var _refused = [];
            for (var _wi = 0; _wi < _writes.length; _wi++) {
                var _f = _omFind(_fx, _writes[_wi].matchName, _writes[_wi].name);
                _props.push(_f.prop);
                if (!_f.prop) { _refused.push({ setting: _writes[_wi].key, error: "Object Matte has no property " + _writes[_wi].matchName + " (" + _writes[_wi].name + ")" }); continue; }
                var _why = AE.checkPropertyWrite(_f.prop, _writes[_wi].value);
                if (_why !== null) _refused.push({ setting: _writes[_wi].key, error: _why, range: AE.propertyRange(_f.prop) });
            }
            if (_refused.length > 0) {
                var _msgs = [];
                for (var _ri = 0; _ri < _refused.length; _ri++) _msgs.push(_refused[_ri].error);
                return { ok: false, error: "nothing written: " + _msgs.join("; "), refused: _refused };
            }
            var _failed = [];
            var _written = [];
            for (var _wj = 0; _wj < _writes.length; _wj++) {
                try { _props[_wj].setValue(_writes[_wj].value); _written.push(_writes[_wj].key); }
                catch (eW) { _failed.push({ setting: _writes[_wj].key, error: AE.errText(eW) }); }
            }
            var _out = {
                ok: _failed.length === 0,
                layer: _layer.name,
                effectIndex: _pick.index,
                written: _written,
                settings: _omSettings(_fx, ${jsxVal(OBJECT_MATTE_SETTINGS)}),
                summary: _omSummary(true, _sel.list)
            };
            if (_failed.length > 0) {
                _out.failed = _failed;
                _out.error = "After Effects rejected " + _failed.length + " of the checked writes; the rest were written";
            }
            return _out;
        `;
  }
});
registerOp({
  name: "subject.remove_selection",
  category: "subject",
  description: "Remove one selection from a layer's Object Matte, by its name ('Add Object 2', 'Add Object Rect 1') or its 1-based place in subject.status's list, so a wrong click does not mean starting again. remove() on a selection was confirmed in After Effects 27.0: the matte read the same afterwards when the removed selection had selected nothing. Returns removed, the selections left and summary. Run subject.check afterwards.",
  params: [
    ...compLayerParams,
    {
      name: "selection",
      type: "any",
      description: "The selection's name, or its 1-based place in subject.status's selections (newest first).",
      required: true
    },
    subjectIndexParam
  ],
  toJsx(args) {
    const sel = args.selection;
    if (!(typeof sel === "string" && sel.trim() !== "") && !(typeof sel === "number" && Number.isInteger(sel) && sel >= 1)) {
      return jsxFail(
        `\`selection\` must be a selection's name or a 1-based number; got ${JSON.stringify(sel)}`
      );
    }
    return `
            ${jsxCompLayerPreamble(args)}
            ${FX_ROOT_JSX}
            ${OBJECT_MATTE_JSX}
            var _pick = AE.pickEffect(_fxRoot, ${jsxVal(OBJECT_MATTE_MATCH_NAME)}, "Object Matte", ${jsxVal(args.effectIndex ?? null)});
            if (_pick.error) return { ok: false, error: _pick.error };
            if (_pick.index === null) return { ok: false, error: "layer '" + _layer.name + "' has no Object Matte, so there is no selection to remove" };
            var _fx = _fxRoot.property(_pick.index);
            var _g = _omFind(_fx, ${jsxVal(OBJECT_MATTE_SELECTIONS_MATCH_NAME)}, "Selections").prop;
            var _before = _omSelections(_fx).list;
            var _names = [];
            for (var _i = 0; _i < _before.length; _i++) _names.push(_before[_i].name);
            var _want = ${jsxVal(sel)};
            var _at = -1;
            if (typeof _want === "number") { if (_want >= 1 && _want <= _before.length) _at = _want; }
            else { for (var _j = 0; _j < _before.length; _j++) if (_before[_j].name === _want) { _at = _before[_j].index; break; } }
            if (_at < 0 || !_g) {
                return { ok: false, error: (typeof _want === "number" ? "no selection at place " + _want : "no selection '" + _want + "'") +
                    " on Object Matte (selections: " + (_names.length ? _names.join(", ") : "none") + ")" };
            }
            var _removed = AE.safeGet(function () { return _g.property(_at).name; }, String(_want));
            _g.property(_at).remove();
            var _after = _omSelections(_fx).list;
            return { ok: true, layer: _layer.name, effectIndex: _pick.index, removed: _removed, selections: _after,
                summary: _omSummary(true, _after), next: ${jsxVal(CHECK_NEXT)} };
        `;
  }
});
const CUTOUT_HOLE_LIMIT = 1e3;
const CUTOUT_FRAMES = 8;
const CUTOUT_OVER = "#ff00ff";
const CUTOUT_SECONDS_PER_FRAME = 60;
const EDGE_TRANSPARENT = EDGE_DEFAULTS.transparent;
const SETTLE_MAX_MS = 6e5;
const THUMB = 360;
const PICTURE_DEFLATE = 1;
const intersects = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
const union = (a, b) => {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y
  };
};
const fmt = (n) => Math.round(n).toLocaleString("en-US");
const boxText = (b) => `(${b.x}, ${b.y}, ${b.width} \xD7 ${b.height})`;
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const boxArea = (b) => b.width * b.height;
const iou = (a, b) => {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  if (w <= 0 || h <= 0) return 0;
  const inter = w * h;
  return inter / (boxArea(a) + boxArea(b) - inter);
};
function alikeRegions(a, b) {
  if (iou(a, b) >= 0.5) return true;
  if (!intersects(a, b)) return false;
  const big = Math.max(a.area, b.area);
  const small = Math.min(a.area, b.area);
  return small > 0 && big / small <= 2;
}
const isFrozenEntry = (e) => !("box" in e) && e.kind === "frozen";
function frozenAccepted(run, accept) {
  return accept.some(
    (e) => isFrozenEntry(e) && (e.from === void 0 || e.from <= run.to) && (e.to === void 0 || e.to >= run.from)
  );
}
function acceptedBy(f, accept) {
  return accept.some((e) => {
    if (isFrozenEntry(e)) return false;
    const box = "box" in e ? e.box : e;
    const kind = ("box" in e ? e.kind : void 0) ?? "opening";
    return kind === f.kind && iou(f.box, box) >= 0.5;
  });
}
function cutoutFindings(frames, limit) {
  const out = [];
  for (const kind of ["hole", "opening"]) {
    const groups = [];
    for (const fr of frames) {
      for (const h of (kind === "hole" ? fr.holes : fr.openings) ?? []) {
        if (h.area < limit) continue;
        const b = { x: h.x, y: h.y, width: h.width, height: h.height };
        const g = groups.find((x) => x.members.some((m) => alikeRegions(m, h)));
        if (g) {
          const f = g.f;
          g.members.push(h);
          f.box = union(f.box, b);
          if (h.area > f.largestArea) {
            f.largestArea = h.area;
            f.largestFrame = fr.frame;
          }
          f.smallestArea = Math.min(f.smallestArea, h.area);
          if (!f.frames.includes(fr.frame)) f.frames.push(fr.frame);
          if (f.edges) {
            for (const e of h.edges ?? []) if (!f.edges.includes(e)) f.edges.push(e);
          }
        } else
          groups.push({
            members: [h],
            f: {
              kind,
              frames: [fr.frame],
              smallestArea: h.area,
              largestArea: h.area,
              largestFrame: fr.frame,
              box: b,
              ...kind === "opening" ? { edges: [...h.edges ?? []] } : {}
            }
          });
      }
    }
    out.push(...groups.map((g) => g.f).sort((a, b) => b.largestArea - a.largestArea));
  }
  return out;
}
async function writePng(io, file, data) {
  if (io.writePng) return io.writePng(file, data);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, data);
}
const GB = 1e9;
const gb = (n) => `${(n / GB).toFixed(1)} GB`;
const OVERSIZE_FACTOR = 1.5;
const even = (n) => Math.max(2, Math.round(n / 2) * 2);
const stemOf = (file) => path.join(path.dirname(file), path.basename(file, path.extname(file)));
const dims = (d) => `${d[0]} \xD7 ${d[1]}`;
function sourceAdviceFor(f) {
  if (!f?.sourceSize || !f.compSize || !f.scale) return null;
  const [sw, sh] = f.sourceSize;
  const [cw, ch] = f.compSize;
  const [sx, sy] = f.scale.map((v) => Math.abs(v));
  const big = sw >= OVERSIZE_FACTOR * cw && sh >= OVERSIZE_FACTOR * ch;
  const shrunk = sx > 0 && sy > 0 && sx <= 100 / OVERSIZE_FACTOR && sy <= 100 / OVERSIZE_FACTOR;
  if (!big || !shrunk) return null;
  const delivery = [even(sw * sx / 100), even(sh * sy / 100)];
  const frames = typeof f.frames === "number" && f.frames > 0 ? f.frames : null;
  const atSource = frames ? cacheBytesFor(frames, [sw, sh]) : null;
  const atDelivery = frames ? cacheBytesFor(frames, delivery) : null;
  const ratio = Math.round(sw * sh / (delivery[0] * delivery[1]) * 10) / 10;
  const copy = f.file ? `ffmpeg -i "${f.file}" -vf "scale=${delivery[0]}:${delivery[1]}:flags=lanczos" -c:v prores_ks -profile:v 3 -c:a pcm_s16le "${stemOf(f.file)}_${delivery[0]}x${delivery[1]}.mov"` : null;
  const cache = atSource !== null && atDelivery !== null ? `about ${gb(atSource)} of After Effects disk cache a render of the ${frames} frames at this size (an estimate; 19 GB was measured for 320 frames of a 2176 \xD7 3840 take) against about ${gb(atDelivery)} at ${dims(delivery)}` : `about ${ratio} times the disk cache a render needs at ${dims(delivery)}`;
  return {
    sourceSize: [sw, sh],
    compSize: [cw, ch],
    scale: [sx, sy],
    deliverySize: delivery,
    frames,
    cacheAtSource: atSource,
    cacheAtDelivery: atDelivery,
    copy,
    reading: `This layer's footage is ${dims([sw, sh])}, shown at ${Math.round(sx)}% in a ${dims([cw, ch])} comp. Object Matte works on the footage's own pixels, ${ratio} times as many as the comp shows: ${cache}, and a render takes about that much longer (on one take of 320 frames: 279 to 390 s at 2176 \xD7 3840 against 65 to 92 s at 1088 \xD7 1920, with the same edge; the two cut-outs overlapped at 0.991). Make a ${dims(delivery)} copy of the footage first and matte that: ` + (copy ? `with ffmpeg, \`${copy}\`; without it, render the footage alone from After Effects at that size (ProRes 422 HQ). ` : "render the footage alone from After Effects at that size (ProRes 422 HQ). ") + "Import the copy, put it in the comp in this layer's place at 100% (same position and start time), switch this layer off, and run subject.prepare on the copy's layer. Do it before the click: replacing the footage under a matte freezes the matte (the outline stops following the subject), so a copy made afterwards needs the click again."
  };
}
function soundAdviceFor(f, streams) {
  if (!f?.file) return {};
  if (streams === null)
    return f.hasAudio ? {
      soundNote: "I could not count the take's sound channels (ffprobe was not found or could not read the file). Takes with more than two channels have read as silence in After Effects with no warning: measure the take's sound now, and measure the delivered file's sound before calling the piece done."
    } : {};
  const most = streams.reduce((m, st) => Math.max(m, st.channels || 0), 0);
  const unheard = streams.length > 0 && !f.hasAudio;
  if (most <= 2 && !unheard) return {};
  const layout = streams.find((st) => st.channels === most)?.layout;
  const extract = `ffmpeg -i "${f.file}" -map 0:a:0 -af "pan=mono|c0=c0" -c:a pcm_s16le "${stemOf(f.file)}_voice.wav"`;
  return {
    soundAdvice: {
      channels: most,
      streams,
      afterEffectsHasAudio: f.hasAudio,
      extract,
      reading: (unheard ? `The take's file has sound (${plural(most, "channel")}) that After Effects does not report for this footage. ` : `The take's sound has ${most} channels${layout ? ` (${layout})` : ""}. `) + `A take with four channels and the voice on the first read as silence in After Effects, with no warning (seen on 2026-11-12). Before the render, extract the voice to a mono WAV: \`${extract}\` (c0 is the first channel; listen to it, or measure each channel's level, to find the one with the voice, and change c0 if it is another). Import the WAV, put it in the comp over the layer's span, and switch the take's own audio off. Measure the delivered file's sound before calling the piece done.`
    }
  };
}
const FFPROBE = ["ffprobe", "/opt/homebrew/bin/ffprobe", "/usr/local/bin/ffprobe"];
async function ffprobeAudio(file) {
  for (const exe of FFPROBE) {
    const out = await new Promise((resolve) => {
      execFile(
        exe,
        [
          "-v",
          "error",
          "-select_streams",
          "a",
          "-show_entries",
          "stream=channels,channel_layout",
          "-of",
          "json",
          file
        ],
        { timeout: 15e3 },
        (err, stdout) => {
          if (err)
            resolve({ missing: err.code === "ENOENT", stdout: null });
          else resolve({ missing: false, stdout: String(stdout) });
        }
      );
    });
    if (out.missing) continue;
    if (out.stdout === null) return null;
    try {
      const j = JSON.parse(out.stdout);
      return (j.streams ?? []).map((st) => ({
        channels: Number(st.channels) || 0,
        layout: st.channel_layout ?? null
      }));
    } catch {
      return null;
    }
  }
  return null;
}
const PREPARE_HOLD = "Do not give the user the steps yet: tell the user what sourceAdvice says (the footage is much larger than the comp), make the delivery-size copy, then run subject.prepare on the copy's layer and relay its steps word for word. If the user wants to click on this footage anyway, relay notice and steps word for word (userMessage holds both).";
async function runSubjectPrepare(args, io) {
  const op = getOp("subject.prepare");
  const res = await io.execute(op.toJsx(args));
  if (!res || typeof res !== "object" || !res.footage) return res;
  const f = res.footage;
  const source = sourceAdviceFor(f);
  const sound = f.file ? soundAdviceFor(f, await io.probeAudio(f.file)) : {};
  if (source) {
    res.sourceAdvice = source;
    res.relay = PREPARE_HOLD;
  }
  if (sound.soundAdvice) res.soundAdvice = sound.soundAdvice;
  if (sound.soundNote) res.soundNote = sound.soundNote;
  if (sound.soundAdvice || sound.soundNote)
    res.relay = `${res.relay} Sound: tell the user what ${sound.soundAdvice ? "soundAdvice" : "soundNote"} says, and deal with it before the render.`;
  return res;
}
const RENDER_BYTES_PER_HD_FRAME = 76e4;
const RENDER_MARGIN_BYTES = 3 * GB;
const PICTURE_MARGIN_BYTES = 1 * GB;
const LOW_FREE_BYTES = 10 * GB;
function renderCutoutBytes(frames, size) {
  return frames * RENDER_BYTES_PER_HD_FRAME * (size[0] * size[1] / (1080 * 1920));
}
const captureBytes = (size) => (Array.isArray(size) ? size[0] * size[1] : 1080 * 1920) * 4;
async function statfsFree(dir) {
  let d = path.resolve(dir);
  for (; ; ) {
    try {
      const st = await fs.statfs(d);
      return Number(st.bavail) * Number(st.bsize);
    } catch {
      const up = path.dirname(d);
      if (up === d) return null;
      d = up;
    }
  }
}
async function spaceRefusal(io, dir, needed, margin, what) {
  const free = await (io.freeBytes ?? statfsFree)(dir);
  if (free === null || free >= needed + margin) return null;
  return {
    ok: false,
    error: `only ${gb(free)} free on the drive holding ${dir}; ${what} needs about ${gb(needed)} plus a margin of ${gb(margin)} (After Effects writes its disk cache to the same drive while it renders, and a render on a nearly full drive stalls instead of failing). Free some space first, for example by purging After Effects' cache: Edit > Purge > All Memory & Disk Cache. Nothing was rendered.`,
    space: { free, needed: Math.round(needed), margin, where: dir }
  };
}
function cacheBytesFor(frames, sourceSize) {
  const [w, h] = Array.isArray(sourceSize) && sourceSize.length >= 2 ? sourceSize : [1920, 1080];
  return frames * w * h * 8;
}
async function volumeKey(dir) {
  let d = path.resolve(dir);
  for (; ; ) {
    try {
      return (await fs.stat(d)).dev;
    } catch {
      const up = path.dirname(d);
      if (up === d) return null;
      d = up;
    }
  }
}
const PART_NAMES = {
  movie: "the movie",
  cache: "After Effects' disk cache",
  pictures: "captures and pictures"
};
async function spacePlan(io, entries, margin, what) {
  const byVol = [];
  for (const e of entries) {
    const key = await (io.volumeOf ?? volumeKey)(e.where);
    const v = byVol.find((x) => x.key === key && key !== null);
    if (v)
      for (const [k, n] of Object.entries(e.parts))
        v.parts[k] = (v.parts[k] ?? 0) + (n ?? 0);
    else byVol.push({ key, where: e.where, parts: { ...e.parts } });
  }
  const volumes = [];
  let refusal = null;
  for (const v of byVol) {
    const free = await (io.freeBytes ?? statfsFree)(v.where);
    const needed = Object.values(v.parts).reduce((a, b) => a + (b ?? 0), 0);
    const ok = free === null || free >= needed + margin;
    const row = { where: v.where, free, parts: v.parts, needed: Math.round(needed), margin, ok };
    volumes.push(row);
    if (!ok && !refusal) {
      const partText = Object.entries(v.parts).map(([k, n]) => `${PART_NAMES[k]} ${gb(n ?? 0)}`).join(", ");
      refusal = {
        ok: false,
        error: `only ${gb(free)} free on the drive holding ${v.where}; ${what} needs about ${gb(needed)} there (${partText}) plus a margin of ${gb(margin)}. A render on a nearly full drive stalls instead of failing. Free some space first, for example by purging After Effects' cache: Edit > Purge > All Memory & Disk Cache. Nothing was rendered.`,
        space: { ...row, volumes }
      };
    }
  }
  if (refusal) refusal.space.volumes = volumes;
  return { volumes, refusal };
}
const trackedSpan = (frames) => frames.length ? Math.max(...frames) - Math.min(...frames) + 1 : 0;
function aeCacheRoot(folder, version) {
  if (!folder || !version) return null;
  const m = /^(\d+)\.(\d+)/.exec(version);
  if (!m) return null;
  return path.join(folder, "Adobe", "After Effects", `${m[1]}.${m[2]}`);
}
async function folderBytes(root, budgetMs = 5e3) {
  const t0 = performance.now();
  let bytes = 0;
  const stack = [root];
  try {
    await fs.access(root);
  } catch {
    return null;
  }
  while (stack.length) {
    if (performance.now() - t0 > budgetMs) return { bytes, complete: false };
    const d = stack.pop();
    let entries = [];
    try {
      entries = await fs.readdir(d, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile())
        bytes += await fs.stat(p).then(
          (st) => st.size,
          () => 0
        );
    }
  }
  return { bytes, complete: true };
}
async function diskReport(cache, freeFn = statfsFree) {
  const cacheRoot = aeCacheRoot(cache?.folder, cache?.version);
  if (!cacheRoot)
    return {
      cacheRoot: null,
      cacheBytes: null,
      free: null,
      low: null,
      reading: "After Effects' disk cache folder could not be read from its preferences."
    };
  const size = await folderBytes(cacheRoot);
  const free = await freeFn(cacheRoot);
  const low = free !== null && free < LOW_FREE_BYTES;
  const out = {
    cacheRoot,
    cacheBytes: size?.bytes ?? null,
    complete: size?.complete ?? null,
    free,
    low
  };
  if (low)
    out.note = `Only ${gb(free)} free on the drive After Effects caches to (${cacheRoot}); its disk cache holds ${size ? gb(size.bytes) + (size.complete ? "" : " or more") : "an unknown amount"}. Object Matte work grows it past the Disk Cache size set in the preferences (about one 16-bit frame of the source for every frame it tracks through), and a render on a nearly full drive stalls. Ask the user to purge it: Edit > Purge > All Memory & Disk Cache in After Effects. Nothing was deleted and no preference was changed.`;
  return out;
}
const FROZEN_DEFAULTS = { gap: 30, limit: 2e-3, minFrames: 60 };
const frozenOpts = (args) => ({
  gap: typeof args.frozenGap === "number" ? args.frozenGap : FROZEN_DEFAULTS.gap,
  limit: typeof args.frozenLimit === "number" ? args.frozenLimit : FROZEN_DEFAULTS.limit,
  minFrames: typeof args.frozenFrames === "number" ? args.frozenFrames : FROZEN_DEFAULTS.minFrames
});
function frozenFinding(run, pictures) {
  const moved = run.footageChange > 1e-3;
  return {
    kind: "frozen",
    ...run,
    pictures,
    reading: `The cut-out's outline did not move for ${run.length} frames` + (moved ? ` while the footage did (frames ${run.from} to ${run.to}; ${(run.footageChange * 100).toFixed(1)}% of the frame changed inside the outline)` : ` (frames ${run.from} to ${run.to}), and the picture inside it barely changed either`) + `. The selection is probably not tracking: this happens when the layer's footage is replaced after the click. Click again on this footage (subject.prepare, then the steps). If the subject is genuinely motionless (a product on a table, a locked-off object) this is expected: pass accept: [{ kind: "frozen" }] to wave it through once seen.`
  };
}
const QUICK_NOTE = "Quick check: the click frames and two frames either side, which After Effects renders in seconds. A missed object, an enclosed gap and a second click on the same thing show there. To look across the clip, render the cut-out once (subject.render_cutout) and check the file (subject.check_file); across: true checks the live matte across the clip instead, which takes minutes (4 to 9 for nine frames on a 2176 x 3840 take), because After Effects recomputes the matte on every capture.";
const ACROSS_NOTE = "Across the clip on the live matte: After Effects recomputes the matte on every capture, so this takes minutes (4 to 9 for nine frames on a 2176 x 3840 take). Rendering the cut-out once (subject.render_cutout) and checking the file (subject.check_file) reads every frame in about the time of one pass.";
function quickFrames(span, clickFrames) {
  const a = span?.inFrame ?? 0;
  const b = span?.outFrame ?? a + 3;
  const set = /* @__PURE__ */ new Set();
  for (const c of clickFrames) {
    if (typeof c !== "number") continue;
    for (let d = -2; d <= 2; d++) {
      const f = Math.round(c) + d;
      if (f >= a && f < b) set.add(f);
    }
  }
  if (!set.size) for (let f = a; f < Math.min(b, a + 3); f++) set.add(f);
  return [...set].sort((x, y) => x - y);
}
function framesAcross(span, count, extra) {
  const a = span?.inFrame ?? 0;
  const b = span?.outFrame ?? a + 1;
  const set = /* @__PURE__ */ new Set();
  for (let i = 0; i < count; i++) set.add(a + Math.floor(i * (b - a) / count));
  for (const e of extra) if (typeof e === "number" && e >= a && e < b) set.add(Math.round(e));
  return [...set].sort((x, y) => x - y).slice(0, 64);
}
const renderTally = () => ({
  frames: 0,
  calls: 0,
  ms: 0,
  aeCallMs: 0,
  settleMs: 0,
  renderNodeMs: 0
});
const pixelTally = () => ({
  frames: 0,
  readMs: 0,
  regionsMs: 0,
  picturesMs: 0,
  sheetMs: 0,
  ms: 0
});
const since = (t) => performance.now() - t;
const roundTally = (t) => Object.fromEntries(
  Object.entries(t).map(([k, v]) => [k, typeof v === "number" ? Math.round(v) : v])
);
async function renderChunked(io, base, frames, perFrameMs, outDir, stem, tally = renderTally(), firstCall = 0) {
  const size = Math.max(1, Math.min(32, Math.floor(SETTLE_MAX_MS / perFrameMs)));
  const out = [];
  for (let c = 0; c * size < frames.length; c++) {
    const chunk = frames.slice(c * size, (c + 1) * size);
    const t0 = performance.now();
    const payload = await io.render({
      ...base,
      frames: chunk,
      outPath: path.join(outDir, `${stem}-${firstCall + c}.png`),
      settleTimeoutMs: Math.min(SETTLE_MAX_MS, Math.max(1, Math.round(perFrameMs * chunk.length)))
    });
    tally.calls++;
    tally.frames += chunk.length;
    tally.ms += since(t0);
    tally.aeCallMs += payload?.timing?.aeCallMs ?? 0;
    tally.settleMs += payload?.timing?.settleMs ?? payload?.captureSettle?.waitedMs ?? 0;
    tally.renderNodeMs += payload?.timing?.nodeMs ?? 0;
    if (!payload?.ok) {
      for (const frame of chunk)
        out.push({
          frame,
          ok: false,
          error: `the render call failed: ${payload?.error ?? "no result"}`
        });
      continue;
    }
    const list = payload.frames ?? (payload.writtenTo ? [{ ...payload, ok: true, frame: chunk[0] }] : []);
    for (const [i, frame] of chunk.entries()) {
      const f = list.find((x) => x.frame === frame) ?? list[i];
      if (!f) out.push({ frame, ok: false, error: "not in the render's result" });
      else if (f.ok === false || typeof f.writtenTo !== "string")
        out.push({ frame, ok: false, error: f.error ?? "the frame was not written" });
      else out.push({ frame, ok: true, file: f.writtenTo, edge: f.edge });
    }
  }
  return out;
}
function parseHex(c) {
  const m = /^#?([0-9a-f]{6})$/i.exec(c.trim());
  if (!m) return [1, 0, 1];
  const v = parseInt(m[1], 16);
  return [(v >> 16 & 255) / 255, (v >> 8 & 255) / 255, (v & 255) / 255];
}
async function measureFrames(io, rendered, limit, over, sheetPath, tally = pixelTally(), pictures = true, onImage) {
  const started = performance.now();
  const colour = parseHex(over);
  const readings = [];
  const thumbs = [];
  const labels = [];
  const split = (list) => ({
    big: list.filter((r) => r.area >= limit),
    small: {
      count: list.filter((r) => r.area < limit).length,
      area: list.filter((r) => r.area < limit).reduce((s, r) => s + r.area, 0)
    }
  });
  for (const r of rendered) {
    if (!r.ok || !r.file) {
      readings.push({
        frame: r.frame,
        checked: false,
        holes: null,
        openings: null,
        error: r.error
      });
      continue;
    }
    let img;
    const tRead = performance.now();
    try {
      img = await io.readImage(r.file);
    } catch (err) {
      readings.push({
        frame: r.frame,
        checked: false,
        holes: null,
        openings: null,
        error: `could not read ${r.file}: ${err instanceof Error ? err.message : String(err)}`
      });
      continue;
    } finally {
      tally.readMs += since(tRead);
    }
    if (!img.alpha) {
      readings.push({
        frame: r.frame,
        checked: false,
        holes: null,
        openings: null,
        error: `${r.file} has no alpha channel`
      });
      continue;
    }
    tally.frames++;
    const tRegions = performance.now();
    const regions = cutoutRegions(img.alpha, img.width, img.height);
    let opaquePx = 0;
    const alpha = img.alpha;
    for (let p = 0; p < alpha.length; p++) if (alpha[p] >= EDGE_DEFAULTS.opaque) opaquePx++;
    tally.regionsMs += since(tRegions);
    const h = split(regions.holes);
    const o = split(regions.openings);
    const tPic = performance.now();
    if (!pictures) {
      readings.push({
        frame: r.frame,
        checked: true,
        file: r.file,
        opaqueShare: Math.round(opaquePx / img.alpha.length * 1e4) / 1e4,
        holes: h.big,
        openings: o.big,
        holesUnderLimit: h.small,
        openingsUnderLimit: o.small
      });
      onImage?.(readings[readings.length - 1], img);
      continue;
    }
    const composite = flattenOver(img, { kind: "color", color: colour });
    const picture2 = r.file.replace(/\.png$/i, "") + "_over.png";
    await writePng(io, picture2, encodePngSrgb8(img.width, img.height, composite, PICTURE_DEFLATE));
    const tw = Math.min(THUMB, img.width);
    const th = Math.max(1, Math.round(img.height * tw / img.width));
    thumbs.push({
      width: tw,
      height: th,
      rgb: resample({ ...img, rgb: composite }, tw, th),
      bitDepth: 8
    });
    labels.push(`frame ${r.frame}`);
    tally.picturesMs += since(tPic);
    readings.push({
      frame: r.frame,
      checked: true,
      file: r.file,
      picture: picture2,
      opaqueShare: Math.round(opaquePx / img.alpha.length * 1e4) / 1e4,
      holes: h.big,
      openings: o.big,
      holesUnderLimit: h.small,
      openingsUnderLimit: o.small,
      edgeWidth: r.edge?.width ? { typical: r.edge.width.typical ?? null, p90: r.edge.width.p90 ?? null } : null,
      solidAreas: r.edge?.solidAreas?.count ?? null
    });
    onImage?.(readings[readings.length - 1], img);
  }
  let picture = null;
  const tSheet = performance.now();
  if (thumbs.length) {
    const sheet = composeContactSheet(thumbs, { labels, thumbWidth: THUMB });
    await writePng(
      io,
      sheetPath,
      encodePngSrgb8(sheet.width, sheet.height, sheet.rgb, PICTURE_DEFLATE)
    );
    picture = sheetPath;
  }
  tally.sheetMs += since(tSheet);
  tally.ms += since(started);
  return { readings, picture };
}
function regionLines(findings, frames) {
  return findings.map(
    (f) => `${f.smallestArea === f.largestArea ? `${fmt(f.largestArea)} px` : `${fmt(f.smallestArea)} to ${fmt(f.largestArea)} px (largest on frame ${f.largestFrame})`} at ${boxText(f.box)} on ${f.frames.length} of ${frames} frames (${f.frames.join(", ")})` + (f.kind === "opening" && f.edges?.length ? `, reaches the ${f.edges.join(" and ")} edge` : "")
  );
}
const needSelection = (st) => {
  if (!st?.objectMatte?.present || !Array.isArray(st.selections) || st.selections.length === 0)
    return `${st?.summary ?? "no selection"}; ${NEED_CLICK}`;
  return null;
};
const perFrameMsOf = (args) => Math.max(
  1,
  Math.round(
    (typeof args.secondsPerFrame === "number" && args.secondsPerFrame > 0 ? args.secondsPerFrame : CUTOUT_SECONDS_PER_FRAME) * 1e3
  )
);
const TAKES_MINUTES = "This check can take minutes: on a 2176 x 3840 take each frame took 20 to 40 s the first time (the matte is tracked from the click), well under a second once rendered; tell the user before it runs on a long or large clip.";
function summarize(readings, limit, accept, picture = null, passText = null) {
  const regions = cutoutFindings(readings, limit);
  const accepted = regions.filter((f) => acceptedBy(f, accept));
  const open = regions.filter((f) => !accepted.includes(f));
  const missed = readings.filter((r) => !r.checked);
  const checked = { frames: readings.length - missed.length, of: readings.length };
  const notChecked = missed.length ? [
    {
      kind: "not-checked",
      frames: missed.map((r) => r.frame),
      errors: [...new Set(missed.map((r) => r.error ?? "not rendered"))]
    }
  ] : [];
  const holes = open.filter((f) => f.kind === "hole");
  const openings = open.filter((f) => f.kind === "opening");
  const parts = [];
  parts.push(
    missed.length ? `Checked ${checked.frames} of ${checked.of} frames; ${missed.length} did not render (${missed.map((r) => r.frame).join(", ")}): ${notChecked[0].errors.join("; ")}. Those frames were not checked.` : `Checked ${checked.frames} of ${checked.of} frames.`
  );
  if (holes.length)
    parts.push(
      `${plural(holes.length, "enclosed hole")} of ${fmt(limit)} px or more inside the cut-out: ${regionLines(holes, readings.length).join("; ")}. A hole is something in front of the subject not selected (a cup) or a gap inside a piece that no click fills (subject.fill_gaps).`
    );
  if (openings.length)
    parts.push(
      `${plural(openings.length, "opening")} of ${fmt(limit)} px or more, closed off by the subject and the frame edge: ${regionLines(openings, readings.length).join("; ")}. An opening may be something in front of the subject left out (a microphone, a desk), or a real gap such as between an arm and the body; the picture decides.`
    );
  if (!holes.length && !openings.length)
    parts.push(
      missed.length ? `No hole or opening of ${fmt(limit)} px or more on the ${checked.frames} frames checked; the other ${missed.length} were not checked.` : passText ?? `Nothing over the limit on ${checked.frames} of ${checked.of} frames; the picture is at ${picture ?? "(none)"}.`
    );
  if (accepted.length)
    parts.push(
      `Accepted earlier and not counted: ${regionLines(accepted, readings.length).join("; ")}.`
    );
  return { findings: [...open, ...notChecked], accepted, checked, text: parts.join(" ") };
}
const RECHECK_NOTE = "Each frame with a hole or opening over the limit was rendered a second time at the end. After Effects may have served the second render from its cache, so two renders that agree do not show the frame is stable; a frame that differed between them did come out differently (on 2026-11-11 frame 0 of a take rendered once without the microphone and then with it; the cause is not known).";
const regionsOf = (r) => [
  ...(r.holes ?? []).map((x) => ({ ...x, kind: "hole" })),
  ...(r.openings ?? []).map((x) => ({ ...x, kind: "opening" }))
];
async function overPicture(io, file, over) {
  try {
    const img = await io.readImage(file);
    const picture = file.replace(/\.png$/i, "") + "_over.png";
    await writePng(
      io,
      picture,
      encodePngSrgb8(
        img.width,
        img.height,
        flattenOver(img, { kind: "color", color: parseHex(over) }),
        PICTURE_DEFLATE
      )
    );
    return picture;
  } catch {
    return null;
  }
}
async function recheckFrames(io, readings, limit, over, outDir, perFrameMs, base, accept, renders, pixels) {
  const isAccepted = (x) => acceptedBy(
    { kind: x.kind, box: { x: x.x, y: x.y, width: x.width, height: x.height } },
    accept
  );
  const withRegions = readings.filter((r) => r.checked && regionsOf(r).length > 0);
  const first = withRegions.filter((r) => !regionsOf(r).every(isAccepted));
  const skippedAccepted = withRegions.length - first.length;
  const frames = first.map((r) => r.frame);
  if (!frames.length)
    return {
      frames,
      agreed: 0,
      differed: [],
      failed: [],
      skippedAccepted,
      unstable: [],
      note: skippedAccepted ? `No frame was rendered a second time: the regions on ${plural(skippedAccepted, "frame")} were all accepted.` : "No frame had a hole or opening over the limit, so none was rendered a second time."
    };
  const rendered = await renderChunked(
    io,
    base,
    frames,
    perFrameMs,
    outDir,
    "cutout-recheck",
    renders
  );
  const { readings: again } = await measureFrames(
    io,
    rendered,
    limit,
    over,
    path.join(outDir, "cutout-recheck_sheet.png"),
    pixels,
    false
  );
  const unstable = [];
  const failed = [];
  let agreed = 0;
  const brief = (rs) => rs.map((x) => ({
    kind: x.kind,
    area: x.area,
    box: { x: x.x, y: x.y, width: x.width, height: x.height }
  }));
  for (const a of first) {
    const b = again.find((x) => x.frame === a.frame);
    if (!b || !b.checked) {
      failed.push(a.frame);
      continue;
    }
    const ra = regionsOf(a);
    const rb = regionsOf(b);
    const matched = (x, ys) => ys.some((y) => y.kind === x.kind && alikeRegions(x, y));
    if (ra.every((x) => matched(x, rb)) && rb.every((y) => matched(y, ra))) {
      agreed++;
      continue;
    }
    const tPic = performance.now();
    const secondPicture = b.file ? await overPicture(io, b.file, over) : null;
    pixels.picturesMs += since(tPic);
    pixels.ms += since(tPic);
    unstable.push({
      kind: "unstable",
      frame: a.frame,
      first: { regions: brief(ra), opaqueShare: a.opaqueShare ?? null, picture: a.picture },
      second: { regions: brief(rb), opaqueShare: b.opaqueShare ?? null, picture: secondPicture },
      reading: `Frame ${a.frame}: the cut-out differed between two renders of the same frame (opaque share ${a.opaqueShare} then ${b.opaqueShare}; ${plural(ra.length, "region")} then ${rb.length} over the limit). Both pictures are kept.`
    });
  }
  return {
    frames,
    agreed,
    differed: unstable.map((u) => u.frame),
    failed,
    skippedAccepted,
    unstable,
    captures: again.map((r) => r.file).filter((f) => typeof f === "string"),
    note: RECHECK_NOTE + (failed.length ? ` Frames ${failed.join(", ")} did not render the second time and were not compared.` : "") + (skippedAccepted ? ` ${plural(skippedAccepted, "frame")} whose regions were all accepted ${skippedAccepted === 1 ? "was" : "were"} not rendered again.` : "")
  };
}
const closeHead = (pairs) => `${plural(pairs.length, "pair")} of clicks closer than ${Math.round(pairs[0].limit)} source pixels (${pairs.slice(0, 3).map((p) => `${p.a} and ${p.b}`).join("; ")}${pairs.length > 3 ? `; and ${pairs.length - 3} more` : ""})`;
function closeNote(pairs) {
  return `Clicks: ${closeHead(pairs)}. Nothing is missing, so they need not change anything; they are close together and probably redundant, and can be removed (notes gives the commands).`;
}
function laterClicks(pairs) {
  const num = (n) => Number(/(\d+)\s*$/.exec(n)?.[1] ?? -1);
  return [...new Set(pairs.map((p) => num(p.a) >= num(p.b) ? p.a : p.b))];
}
function closeNoteAdvice(pairs) {
  return "To remove the redundant clicks, take the later one of each pair out: " + laterClicks(pairs).map((n) => `subject.remove_selection { selection: "${n}" }`).join(", then ") + ". Measured twice: on the take of 2026-11-11 the matte did not change when the redundant click was removed (opaque share 0.3083 before and after on frame 0); on 2026-11-12, removing five of twelve close clicks left the click frame identical and the opaque share the same on the frames near it, with only a thin band along the outline different elsewhere (After Effects tracking again after the change). Then run subject.check again. Leaving them in is also fine.";
}
function closeMissText(pairs) {
  return `Clicks: ${closeHead(pairs)}. With something missing, two of them probably selected the same thing, so a click meant for something else (a microphone) may have landed on the subject again; the close-clicks finding says which to take out.`;
}
function closeAdvice(pairs) {
  return "When both clicks are on the same thing, take the later one out: " + laterClicks(pairs).map((n) => `subject.remove_selection { selection: "${n}" }`).join(", then ") + ". On the take of 2026-11-11 the matte did not change when the redundant click was removed (opaque share 0.3083 before and after on frame 0). If the later click was meant for something else (a microphone), ask for that click again.";
}
function checkTiming(statusMs, first, second, pixels, totalMs) {
  return {
    statusMs: Math.round(statusMs),
    firstRender: roundTally(first),
    secondRender: roundTally(second),
    pixels: roundTally(pixels),
    totalMs: Math.round(totalMs)
  };
}
const secs = (ms) => (ms / 1e3).toFixed(1);
function timeReading(first, second, pixels, totalMs) {
  const ae = first.aeCallMs + second.aeCallMs;
  const settle = first.settleMs + second.settleMs;
  const renderNode = first.renderNodeMs + second.renderNodeMs;
  const frames = first.frames + second.frames;
  const head = `This check took ${secs(totalMs)} s: ${secs(ae)} s in After Effects rendering ${plural(frames, "frame")} (${first.frames} first, ${second.frames} again), ${secs(settle)} s waiting for the files to finish writing, ${secs(renderNode + pixels.ms)} s in Node (${secs(pixels.ms)} s of it reading the pixels and drawing the pictures).`;
  const share = totalMs > 0 ? (ae + settle) / totalMs : 0;
  return share >= 0.6 && frames > 0 ? `${head} Most of it was After Effects rendering, about ${secs((ae + settle) / frames)} s a frame; frames it has rendered before are much quicker.` : head;
}
async function runSubjectCheck(args, io) {
  const outDir = args.outDir;
  if (typeof outDir !== "string" || !path.isAbsolute(outDir))
    return { ok: false, error: "`outDir` must be an absolute folder for the pictures" };
  const limit = typeof args.holeLimit === "number" ? args.holeLimit : CUTOUT_HOLE_LIMIT;
  const over = typeof args.over === "string" ? args.over : CUTOUT_OVER;
  const accept = Array.isArray(args.accept) ? args.accept : [];
  const started = performance.now();
  const st = await io.status();
  const statusMs = since(started);
  if (!st?.ok) return { ok: false, error: st?.error ?? "subject.status failed", status: st };
  const missing = needSelection(st);
  if (missing) return { ok: false, error: missing };
  const first = renderTally();
  const second = renderTally();
  const pixels = pixelTally();
  const clicks = st.selections.map((s) => ({
    name: s.name,
    kind: s.kind,
    point: s.point ?? null,
    clickTime: s.clickTime ?? null,
    clickFrame: s.clickFrame ?? null
  }));
  const across = args.across === true;
  const clickFrames = [args.clickFrame, ...clicks.map((c) => c.clickFrame)];
  const frames = Array.isArray(args.frames) ? args.frames.slice().sort((a, b) => a - b) : across ? framesAcross(
    st.span,
    typeof args.count === "number" ? args.count : CUTOUT_FRAMES,
    clickFrames
  ) : quickFrames(st.span, clickFrames);
  const checkSpace = await spacePlan(
    io,
    [
      { where: outDir, parts: { pictures: frames.length * 2 * 2 * captureBytes(st.compSize) } },
      // After Effects tracks the matte through every frame from the first to the last asked for.
      {
        where: aeCacheRoot(st.aeCache?.folder, st.aeCache?.version) ?? outDir,
        parts: { cache: cacheBytesFor(trackedSpan(frames), st.sourceSize ?? st.compSize) }
      }
    ],
    PICTURE_MARGIN_BYTES,
    "this check"
  );
  if (checkSpace.refusal) return checkSpace.refusal;
  const fillLayer = typeof st.fillLayer === "string" ? st.fillLayer : null;
  const cutLayer = typeof st.softEdge?.layer === "string" ? st.softEdge.layer : args.layer;
  const isolate = fillLayer ? [cutLayer, fillLayer] : cutLayer;
  const outline = outlineTracker(frozenOpts(args));
  const rendered = await renderChunked(
    io,
    { compNameOrId: args.comp, isolate, channels: "rgba", edge: true },
    frames,
    perFrameMsOf(args),
    outDir,
    "cutout",
    first
  );
  const { readings, picture } = await measureFrames(
    io,
    rendered,
    limit,
    over,
    path.join(outDir, "cutout_sheet.png"),
    pixels,
    true,
    (r, img) => {
      if (img.alpha) outline.add(r.frame, img.alpha, img.rgb, img.width, img.height);
    }
  );
  const outlineResult = outline.result();
  const sum = summarize(readings, limit, accept, picture);
  const close = closeClicks(clicks, st.sourceSize ?? null);
  const findings = [...sum.findings];
  const recheck = args.recheck === false ? { skipped: true, note: "recheck: false; no frame was rendered a second time" } : await recheckFrames(
    io,
    readings,
    limit,
    over,
    outDir,
    perFrameMsOf(args),
    // No edge report on the second render: only the regions are compared (edge costs about 1 s a 1080 x 1920 frame).
    { compNameOrId: args.comp, isolate, channels: "rgba" },
    accept,
    second,
    pixels
  );
  if ("unstable" in recheck) findings.push(...recheck.unstable);
  const frozenAcceptedRuns = [];
  for (const run of outlineResult.frozen) {
    if (frozenAccepted(run, accept)) {
      frozenAcceptedRuns.push({ kind: "frozen", ...run });
      continue;
    }
    const pic = (f) => readings.find((r) => r.frame === f)?.picture ?? null;
    findings.push(frozenFinding(run, [pic(run.from), pic(run.to)]));
  }
  const somethingMissing = findings.length > 0;
  const notes = [];
  if (close.length && somethingMissing)
    findings.push({ kind: "close-clicks", pairs: close, advice: closeAdvice(close) });
  else if (close.length)
    notes.push({
      kind: "close-clicks",
      pairs: close,
      reading: closeNote(close),
      advice: closeNoteAdvice(close)
    });
  const rects = clicks.filter((c) => c.kind === "rectangle").map((c) => c.name);
  const solid = readings.find((r) => typeof r.solidAreas === "number")?.solidAreas;
  const inText = `In: ${st.summary}` + (fillLayer ? ` (with its gap fill (${fillLayer}))` : "") + (typeof solid === "number" ? `, making ${plural(solid, "solid area")} on the first frame checked` : "") + ".";
  const clickText = !close.length ? "" : somethingMissing ? ` ${closeMissText(close)}` : ` ${closeNote(close)}`;
  const rectText = rects.length ? ` ${rects.join(", ")}: a click that dragged a little; it may hold nothing (subject.remove_selection).` : "";
  const pictureText = picture ? ` Look at the picture (${picture}): it shows what no number does, such as the background kept or something the brief names left out.` : " No frame rendered, so there is no picture.";
  const stop = findings.length > 0;
  if (args.keepCaptures !== true) {
    const files = [
      ...readings.map((r) => r.file),
      ..."captures" in recheck ? recheck.captures : []
    ].filter((f) => typeof f === "string");
    await Promise.all(files.map((f) => fs.rm(f, { force: true })));
    for (const r of readings) delete r.file;
  }
  return {
    ok: true,
    layer: st.layer,
    fillLayer,
    stop,
    findings,
    notes,
    accepted: [...sum.accepted, ...frozenAcceptedRuns],
    outline: outlineResult,
    checked: sum.checked,
    recheck: "unstable" in recheck ? {
      frames: recheck.frames,
      agreed: recheck.agreed,
      differed: recheck.differed,
      failed: recheck.failed,
      skippedAccepted: recheck.skippedAccepted,
      note: recheck.note
    } : recheck,
    inOut: `${inText} ${sum.text}${clickText}${rectText}${stop || !picture ? pictureText : ""}`,
    picture,
    frames: readings,
    clicks,
    countNote: COUNT_NOTE,
    scope: {
      across: across && !Array.isArray(args.frames),
      frames,
      note: across || Array.isArray(args.frames) ? ACROSS_NOTE : QUICK_NOTE
    },
    timing: checkTiming(statusMs, first, second, pixels, since(started)),
    timeReading: timeReading(first, second, pixels, since(started)),
    holeLimit: limit,
    next: stop ? "Stop. In your reply, before the next call, tell the user what is out in plain words and give the picture's path; then fix it, before building anything else. " + (findings.some((f) => f.kind === "unstable") ? "A frame came out differently on two renders (kind 'unstable'): run subject.check again, and look at the first frames of the delivered video as well. " : "") + "Something left out needs another click (subject.prepare, then the steps); a wrong extra click comes out with subject.remove_selection; an enclosed gap no click fills goes to subject.fill_gaps, without `only` (every enclosed gap at once: one under the limit here can grow past it on other frames; openings are never filled). When the user says a region shown is fine (a real gap between an arm and the body), run subject.check again with accept: [that finding's box] (an opening), or accept: [{ box, kind: 'hole' }] for a hole, so it is not shown again. Two clicks on the same thing: take the later one out with subject.remove_selection. Frames not checked: run subject.check again on those frames with a larger secondsPerFrame. " + TAKES_MINUTES : "Nothing over the limit. Still look at the picture yourself and tell the user what is in and what is out before building on the cut-out. " + TAKES_MINUTES
  };
}
const FILL_LIMITS = (frame) => [
  `The still comes from one frame (frame ${frame}): it assumes a locked camera and that what is in front of the subject does not move. Anything that moves away from the still's gaps shows through the fill.`,
  "What shows through a filled gap is whatever is behind it in the footage. That is the subject only while the subject is behind the gap.",
  "Every enclosed gap at that frame is filled, including a real one (between an arm and the body) where the background will show, and including those under the limit, which can grow past it on other frames; pass `only` boxes only to keep a real enclosed gap unfilled. Openings (regions that reach the frame edge) are never filled."
];
async function runFillGaps(args, io) {
  const captures = [];
  const watched = {
    ...io,
    render: async (a) => {
      const out = await io.render(a);
      for (const f of out?.frames ?? [])
        if (typeof f?.writtenTo === "string") captures.push(f.writtenTo);
      if (typeof out?.writtenTo === "string") captures.push(out.writtenTo);
      return out;
    }
  };
  try {
    const res = await fillGaps(args, watched);
    if (args.keepCaptures !== true) for (const r of res?.after?.frames ?? []) delete r.file;
    return res;
  } finally {
    if (args.keepCaptures !== true)
      await Promise.all(captures.map((f) => fs.rm(f, { force: true })));
  }
}
async function fillGaps(args, io) {
  const still = args.stillPath;
  if (typeof still !== "string" || !path.isAbsolute(still) || path.extname(still).toLowerCase() !== ".png") {
    return {
      ok: false,
      error: "`stillPath` must be an absolute path to a .png file, kept with the project (the comp will use it)"
    };
  }
  const rejected = rejectedOutputPath(still);
  if (rejected) return { ok: false, error: rejected };
  const outDir = typeof args.outDir === "string" && path.isAbsolute(args.outDir) ? args.outDir : path.dirname(still);
  const limit = typeof args.holeLimit === "number" ? args.holeLimit : CUTOUT_HOLE_LIMIT;
  const over = typeof args.over === "string" ? args.over : CUTOUT_OVER;
  const minArea = typeof args.minArea === "number" ? args.minArea : 20;
  const grow = typeof args.grow === "number" ? args.grow : 3;
  const perFrameMs = perFrameMsOf(args);
  const started = performance.now();
  const st = await io.status();
  const statusMs = since(started);
  const refTally = renderTally();
  const aloneTally = renderTally();
  const afterTally = renderTally();
  const pixels = pixelTally();
  let buildMs = 0;
  if (!st?.ok) return { ok: false, error: st?.error ?? "subject.status failed", status: st };
  const missing = needSelection(st);
  if (missing) return { ok: false, error: missing };
  const frame = typeof args.frame === "number" ? args.frame : st.span?.inFrame ?? 0;
  const fillFrames = Array.isArray(args.frames) ? [frame, ...args.frames] : args.across === true ? [st.span?.inFrame ?? 0, Math.max(0, (st.span?.outFrame ?? 1) - 1), frame] : [frame - 2, frame + 2];
  const fillSpace = await spacePlan(
    io,
    [
      { where: outDir, parts: { pictures: 16 * 2 * captureBytes(st.compSize) } },
      {
        where: aeCacheRoot(st.aeCache?.folder, st.aeCache?.version) ?? outDir,
        parts: { cache: cacheBytesFor(trackedSpan(fillFrames), st.sourceSize ?? st.compSize) }
      }
    ],
    PICTURE_MARGIN_BYTES,
    "filling the gaps"
  );
  if (fillSpace.refusal) return fillSpace.refusal;
  const [ref] = await renderChunked(
    io,
    { compNameOrId: args.comp, isolate: args.layer, channels: "rgba" },
    [frame],
    perFrameMs,
    outDir,
    "fill-reference",
    refTally
  );
  const refused = (why) => ({
    ok: false,
    error: `the reference frame ${frame} did not render (${why}). Nothing was built. Try again with a larger secondsPerFrame.`
  });
  if (!ref?.ok || !ref.file) return refused(ref?.error ?? "no result");
  let img;
  try {
    img = await io.readImage(ref.file);
  } catch (err) {
    return refused(err instanceof Error ? err.message : String(err));
  }
  if (!img.alpha) return refused(`${ref.file} has no alpha channel`);
  const [cw, ch] = Array.isArray(st.compSize) ? st.compSize : [img.width, img.height];
  if (img.width !== cw || img.height !== ch) {
    return {
      ok: false,
      error: `the reference render came back ${img.width} \xD7 ${img.height}, not the comp's size ${cw} \xD7 ${ch}; set the comp to Full resolution and try again. Nothing was built.`
    };
  }
  const only = Array.isArray(args.only) ? args.only : null;
  const found = enclosedHoles(img.alpha, img.width, img.height, {
    minArea,
    keep: only ? (h) => only.some((b) => intersects(h, b)) : void 0
  });
  const openings = cutoutRegions(img.alpha, img.width, img.height, { minArea }).openings;
  const area = found.holes.reduce((s, h) => s + h.area, 0);
  const filled = {
    holes: found.holes.length,
    area,
    list: found.holes.slice(0, 20),
    dropped: found.dropped,
    leftOut: found.leftOut,
    openingsNotFilled: { count: openings.length, area: openings.reduce((s, o) => s + o.area, 0) },
    grow,
    minArea
  };
  if (found.holes.length === 0) {
    return {
      ok: true,
      reference: { frame, file: ref.file },
      filled,
      reading: `No enclosed gap of ${minArea} px or more to fill at frame ${frame}; nothing was built.` + (openings.length ? ` ${plural(openings.length, "opening")} reaching the frame edge were left alone: an opening is never filled.` : ""),
      limits: FILL_LIMITS(frame)
    };
  }
  const grown = growMask(found.mask, img.width, img.height, grow);
  const values = new Float64Array(grown.length);
  let grownArea = 0;
  for (let p = 0; p < grown.length; p++)
    if (grown[p]) {
      values[p] = 1;
      grownArea++;
    }
  filled.grownArea = grownArea;
  filled.still = still;
  await writePng(io, still, encodePngGray8(img.width, img.height, values));
  const tBuild = performance.now();
  const built = await io.build({ comp: args.comp, layer: args.layer, stillPath: still });
  buildMs = since(tBuild);
  if (!built?.ok)
    return {
      ok: false,
      error: `the still was written to ${still}, but the fill could not be built: ${built?.error ?? "no result"}`,
      filled,
      build: built
    };
  const layers = {
    fill: built.fillLayer,
    mask: built.maskLayer,
    stillItem: built.stillItem,
    stillItemId: built.stillItemId ?? null,
    audioOff: built.audioOff === true,
    audio: built.audioOff === true ? "switched off, so the footage's sound plays once" : built.hasAudio === false ? "the footage has no audio: nothing to switch off" : built.audioError ? `could not be switched off: ${built.audioError}` : "left as it was",
    ...built.audioError ? { audioError: built.audioError } : {}
  };
  const [alone] = await renderChunked(
    io,
    { compNameOrId: args.comp, isolate: [built.fillLayer], channels: "rgba" },
    [frame],
    perFrameMs,
    outDir,
    "fill-alone",
    aloneTally
  );
  let fillAlone;
  try {
    if (!alone?.ok || !alone.file) throw new Error(alone?.error ?? "not rendered");
    const a = await io.readImage(alone.file);
    let covered = 0;
    for (const v of a.alpha ?? []) if (v > EDGE_TRANSPARENT) covered++;
    fillAlone = { covered, mask: grownArea, ok: covered <= grownArea * 1.1 + 100 };
  } catch (err) {
    fillAlone = {
      covered: null,
      mask: grownArea,
      ok: null,
      error: err instanceof Error ? err.message : String(err)
    };
  }
  if (fillAlone.ok === false) {
    const undone = await io.unbuild({
      comp: args.comp,
      fillLayer: built.fillLayer,
      maskLayer: built.maskLayer,
      stillItemId: layers.stillItemId
    });
    return {
      ok: false,
      error: `the fill layer alone covers ${fmt(fillAlone.covered)} px, more than the gap mask's ${fmt(grownArea)} px: the track matte is not limiting it. ` + (undone?.ok ? `The build was undone (${(undone.removed ?? []).join(", ")}).` : `Undoing the build failed (${undone?.error ?? "no result"}): delete '${built.fillLayer}' and '${built.maskLayer}' by hand.`),
      filled,
      fillAlone,
      layers
    };
  }
  const frames = Array.isArray(args.frames) ? args.frames.slice().sort((a, b) => a - b) : args.across === true ? framesAcross(st.span, typeof args.count === "number" ? args.count : CUTOUT_FRAMES, [frame]) : quickFrames(st.span, [frame]);
  const afterRendered = await renderChunked(
    io,
    {
      compNameOrId: args.comp,
      isolate: [
        typeof st.softEdge?.layer === "string" ? st.softEdge.layer : args.layer,
        built.fillLayer
      ],
      channels: "rgba",
      edge: true
    },
    frames,
    perFrameMs,
    outDir,
    "fill-after",
    afterTally
  );
  const measured = await measureFrames(
    io,
    afterRendered,
    limit,
    over,
    path.join(outDir, "fill-after_sheet.png"),
    pixels
  );
  const sum = summarize(measured.readings, limit, []);
  return {
    ok: true,
    reference: { frame, file: ref.file },
    filled,
    fillAlone,
    layers,
    after: {
      frames: measured.readings,
      findings: sum.findings,
      checked: sum.checked,
      picture: measured.picture,
      reading: sum.text
    },
    limits: FILL_LIMITS(frame),
    timing: {
      statusMs: Math.round(statusMs),
      referenceRender: roundTally(refTally),
      buildMs: Math.round(buildMs),
      fillAloneRender: roundTally(aloneTally),
      afterRender: roundTally(afterTally),
      pixels: roundTally(pixels),
      totalMs: Math.round(since(started))
    },
    next: "Show the user the picture after the fill and say what is left. To undo the fill, delete the two layers it added." + (layers.audioOff ? " The fill copy's audio was switched off, so the footage's sound plays once." : "") + (built.audioError ? ` The fill copy's audio could not be switched off (${built.audioError}): the sound may play twice; switch it off by hand.` : "") + (fillAlone.ok === null ? " The fill layer alone could not be rendered, so whether the track matte limits it was not checked: look at it." : "")
  };
}
function fillUnbuildJsx(args) {
  return `
            ${jsxCompPreamble(args)}
            var _names = [${jsxVal(args.fillLayer)}, ${jsxVal(args.maskLayer)}];
            var _removed = [];
            for (var _ni = 0; _ni < _names.length; _ni++) {
                for (var _li = _comp.numLayers; _li >= 1; _li--) {
                    var _l = _comp.layer(_li);
                    if (_l.name === _names[_ni]) { _l.remove(); _removed.push(_names[_ni]); break; }
                }
            }
            var _id = ${jsxVal(args.stillItemId)};
            if (_id !== null) {
                var _item = AE.safeGet(function () { return app.project.itemByID(_id); }, null);
                if (_item) { var _iname = _item.name; _item.remove(); _removed.push(_iname); }
            }
            return { ok: true, removed: _removed };
        `;
}
function fillBuildJsx(args) {
  return `
            ${jsxCompLayerPreamble(args)}
            var _fillName = _layer.name + " gap fill";
            var _maskName = _layer.name + " gap mask";
            for (var _li = 1; _li <= _comp.numLayers; _li++) {
                var _ln = _comp.layer(_li).name;
                if (_ln === _fillName || _ln === _maskName) return { ok: false, error: "comp " + _comp.name + " already has a layer '" + _ln + "'; delete the earlier fill's two layers first" };
            }
            var _file = new File(${jsxVal(args.stillPath)});
            if (!_file.exists) return { ok: false, error: "no file at " + ${jsxVal(args.stillPath)} };
            var _item = app.project.importFile(new ImportOptions(_file));
            var _mask = _comp.layers.add(_item);
            _mask.name = _maskName;
            var _fill = _layer.duplicate();
            _fill.name = _fillName;
            var _fxs = _fill.property("ADBE Effect Parade");
            var _removed = 0;
            if (_fxs) {
                for (var _fi = _fxs.numProperties; _fi >= 1; _fi--) {
                    if (_fxs.property(_fi).matchName === ${jsxVal(OBJECT_MATTE_MATCH_NAME)}) { _fxs.property(_fi).remove(); _removed++; }
                }
            }
            _fill.moveAfter(_layer);
            _mask.moveBefore(_fill);
            var _spanError = null;
            try {
                _mask.startTime = 0;
                _mask.inPoint = Math.min(_layer.inPoint, _layer.outPoint);
                _mask.outPoint = Math.max(_layer.inPoint, _layer.outPoint);
            } catch (eSpan) { _spanError = AE.errText(eSpan); }
            _fill.setTrackMatte(_mask, TrackMatteType.LUMA);
            _mask.enabled = false;
            var _audioOff = false;
            var _audioError = null;
            if (AE.safeGet(function () { return _fill.hasAudio; }, false)) {
                try { _fill.audioEnabled = false; _audioOff = true; } catch (eAud) { _audioError = AE.errText(eAud); }
            }
            var _out = { ok: true, fillLayer: _fill.name, fillIndex: _fill.index, maskLayer: _mask.name, maskIndex: _mask.index, stillItem: _item.name, stillItemId: AE.safeGet(function () { return _item.id; }, null), removedFromCopy: _removed, audioOff: _audioOff, hasAudio: AE.safeGet(function () { return _fill.hasAudio; }, false) };
            if (_audioError !== null) _out.audioError = _audioError;
            if (_spanError !== null) _out.maskSpanError = _spanError;
            return _out;
        `;
}
function liveCutoutIO(args, transport) {
  return {
    async status() {
      const code = getOp("subject.status").toJsx({
        comp: args.comp,
        layer: args.layer,
        effectIndex: args.effectIndex
      });
      const r = await transport.execute({
        code,
        label: "subject.status",
        undoGroup: false,
        timeoutMs: 3e4
      });
      return r.ok ? r.result : { ok: false, error: r.error ?? "subject.status failed" };
    },
    async render(renderArgs) {
      const out = await renderFrameTool.handler(renderArgs, transport);
      const sc = out.structuredContent;
      if (out.isError)
        return {
          ok: false,
          error: sc?.error?.message ?? sc?.error ?? "ae_render_frame failed",
          details: sc
        };
      return sc?.result ?? { ok: false, error: "ae_render_frame returned no result" };
    },
    async readImage(file) {
      return decodePng(await fs.readFile(file));
    },
    async unbuild(a) {
      const r = await transport.execute({
        code: fillUnbuildJsx(a),
        label: "subject.fill_gaps undo",
        undoGroup: true,
        suppressDialogs: true,
        timeoutMs: 6e4
      });
      return r.ok ? r.result : { ok: false, error: r.error ?? "undoing the build failed" };
    },
    async build(a) {
      const r = await transport.execute({
        code: fillBuildJsx(a),
        label: "subject.fill_gaps",
        undoGroup: true,
        suppressDialogs: true,
        rollback: true,
        timeoutMs: 6e4
      });
      return r.ok ? r.result : { ok: false, error: r.error ?? "the build failed", rollback: r.rollback };
    }
  };
}
const NODE_ONLY = (name) => jsxFail(
  `${name} runs in Node (it reads pixels), so it cannot ride inside batch.run; call it through ae_do`
);
const frameListParam = {
  name: "frames",
  type: "array",
  description: "Comp frame numbers to look at, instead of the default: `count` frames evenly spaced across the layer, plus the click frame.",
  required: false
};
const secondsPerFrameParam = {
  name: "secondsPerFrame",
  type: "number",
  description: `Settle time to allow each frame, s (default ${CUTOUT_SECONDS_PER_FRAME}; measured 20 to 40 s a frame the first time on a 2176 x 3840 take). Frames are split over several renders when one cannot hold them (600 s a render).`,
  required: false
};
const overParam = {
  name: "over",
  type: "string",
  description: `The flat colour of the picture (default '${CUTOUT_OVER}').`,
  required: false
};
registerOp({
  name: "subject.check",
  category: "subject",
  description: `Proof a subject matte after the user says done, before anything else is built. Renders the cut-out with its alpha (ae_render_frame isolate, channels 'rgba'; with the layer's gap fill from subject.fill_gaps when the comp has one, reported as fillLayer) at the click frames and frames across the clip, finds holes (regions below opaque the frame edge cannot reach) and openings (regions closed off only by the subject and the frame edge: the missed microphone of 2026-11-11 ran off the bottom of the frame), draws each frame over a flat colour and one contact sheet, and returns picture (the sheet), findings, accepted, checked {frames, of}, inOut (a plain statement of what is in and what is out), frames, clicks and stop. A hole or opening of holeLimit px or more (default ${CUTOUT_HOLE_LIMIT}, at the comp's size) is a finding; so are frames that did not render (kind 'not-checked': a frame that was not rendered is never counted as clean). Two clicks close together are a finding only when something is missing too (a click meant for it may have landed on the subject again); otherwise they are the pieces of something clicked one by one, listed in notes, and do not set stop. With stop true: say in your reply what is out, in plain words, and give the picture's path, before the next call. \`accept\` entries (earlier findings the user called fine, such as a real gap between an arm and the body) are not counted again. Each frame with a finding is rendered once more at the end; a frame whose cut-out differs between the two renders is a finding of kind 'unstable' (seen once on 2026-11-11, cause unknown; agreement may come from the cache and does not prove a frame stable). A selection count is not a check. It can take minutes: 20 to 40 s a frame the first time on a 2176 x 3840 take; say so to the user before it runs. \`timing\` says where the time went (status, each render's After Effects call, settle wait and Node work, the pixel work, the total) and \`timeReading\` says it in one sentence.`,
  params: [
    ...compLayerParams,
    {
      name: "outDir",
      type: "string",
      description: "Absolute folder for the pictures.",
      required: true
    },
    {
      name: "clickFrame",
      type: "number",
      description: "A comp frame to look at as well. The selections' own click frames are always looked at.",
      required: false
    },
    frameListParam,
    {
      name: "count",
      type: "number",
      description: `How many frames across the layer (default ${CUTOUT_FRAMES}).`,
      required: false
    },
    {
      name: "holeLimit",
      type: "number",
      description: `Smallest hole or opening that is a finding, px at the comp's size (default ${CUTOUT_HOLE_LIMIT}).`,
      required: false
    },
    {
      name: "accept",
      type: "array",
      description: "Findings the user has seen and called fine, so a later run does not stop on them: each a box {x, y, width, height} (it accepts an opening) or { box, kind: 'hole' | 'opening' }. A finding is accepted only by an entry of its kind whose box overlaps its own by at least half their union; a hole inside an accepted opening's box is not accepted.",
      required: false
    },
    {
      name: "across",
      type: "boolean",
      description: "Look across the clip (count frames spread over the layer) on the live matte instead of the quick check (the click frames and two either side). Takes minutes: 4 to 9 for nine frames on a 2176 x 3840 take; prefer subject.render_cutout and subject.check_file.",
      required: false
    },
    {
      name: "recheck",
      type: "boolean",
      description: "Render each frame with a hole or opening over the limit once more at the end and report a frame that differs (kind 'unstable'). Default true; false skips it.",
      required: false
    },
    {
      name: "frozenLimit",
      type: "number",
      description: "A drift over frozenGap frames (share of the frame whose alpha changed by more than 0.1) under this counts as an unmoved outline (default 0.002; not yet calibrated live).",
      required: false
    },
    {
      name: "frozenFrames",
      type: "number",
      description: "Shortest run of unmoved outline that is a 'frozen' finding, frames (default 60).",
      required: false
    },
    {
      name: "frozenGap",
      type: "number",
      description: "Frames between the two frames compared for drift (default 30).",
      required: false
    },
    {
      name: "keepCaptures",
      type: "boolean",
      description: "Keep the raw captures ae_render_frame wrote (default false: each is removed once read; the pictures stay).",
      required: false
    },
    secondsPerFrameParam,
    overParam,
    subjectIndexParam
  ],
  toJsx: () => NODE_ONLY("subject.check"),
  run: (args, transport) => runSubjectCheck(args, liveCutoutIO(args, transport))
});
registerOp({
  name: "subject.fill_gaps",
  category: "subject",
  description: "Fill enclosed gaps in a subject matte that no click fills (a gap in a microphone's shock mount with the shirt behind it): reads the matte at one reference frame at the comp's size, keeps the regions below opaque that the frame edge cannot reach (openings are never filled), drops those under minArea (default 20 px), grows the rest by `grow` px (default 3), writes them as a still (stillPath), and adds a copy of the same footage under the cut-out showing only through that still (luma track matte). It then renders the fill layer alone and undoes the build when that covers more than the mask, and measures holes and openings again across the clip. Refuses, building nothing, when the reference frame does not render. Limits, stated in the result: one reference frame, so it assumes a locked camera and a prop that does not move; what shows through is whatever is behind the gap. `only` boxes fill just the gaps they touch. Can take minutes, as subject.check does (180 s on the take). Verified in After Effects 27.0 on one take (2026-11-11): the layers, the luma track matte, a switched-off mask that still mattes, and the measurements after; undoing the build when the fill covers too much is not verified there. The fill copy's audio is switched off (audioOff) so the sound does not play twice.",
  params: [
    ...compLayerParams,
    {
      name: "stillPath",
      type: "string",
      description: "Absolute .png path for the gap mask, kept with the project (the comp uses it).",
      required: true
    },
    {
      name: "frame",
      type: "number",
      description: "Reference comp frame (default: the layer's first frame; use the click frame).",
      required: false
    },
    {
      name: "minArea",
      type: "number",
      description: "Smallest gap filled, px (default 20).",
      required: false
    },
    {
      name: "grow",
      type: "number",
      description: "Grow each gap by this many px (default 3).",
      required: false
    },
    {
      name: "only",
      type: "array",
      description: "Boxes {x, y, width, height} in comp pixels: fill only the gaps they touch (from subject.check's findings). Leave it out to fill every enclosed gap, which is the default to use: pass it only to keep a real enclosed gap (between an arm and the body) unfilled; a gap under the limit at one frame can grow past it on others.",
      required: false
    },
    {
      name: "outDir",
      type: "string",
      description: "Absolute folder for the measuring renders (default: the still's folder).",
      required: false
    },
    frameListParam,
    {
      name: "count",
      type: "number",
      description: `How many frames to measure after the fill (default ${CUTOUT_FRAMES}).`,
      required: false
    },
    {
      name: "holeLimit",
      type: "number",
      description: `Smallest hole or opening reported after the fill, px (default ${CUTOUT_HOLE_LIMIT}).`,
      required: false
    },
    {
      name: "across",
      type: "boolean",
      description: "Measure after the fill across the clip instead of near the reference frame. Takes minutes; prefer subject.render_cutout and subject.check_file.",
      required: false
    },
    {
      name: "keepCaptures",
      type: "boolean",
      description: "Keep the raw captures ae_render_frame wrote (default false: each is removed once read; the pictures stay).",
      required: false
    },
    secondsPerFrameParam,
    overParam,
    subjectIndexParam
  ],
  toJsx: () => NODE_ONLY("subject.fill_gaps"),
  run: (args, transport) => runFillGaps(args, liveCutoutIO(args, transport))
});
const ALPHA_TEMPLATES = ["High Quality with Alpha", "Lossless with Alpha"];
const isSequence = (name) => /sequence/i.test(name);
function chooseAlphaTemplate(available, wanted) {
  const list = available.join(", ") || "none";
  if (wanted !== void 0) {
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
      why: `'${other}' is the first template whose name says alpha and that writes a movie`
    };
  return {
    error: `no output template that writes a movie with alpha (templates: ${list}). subject.check_file reads a movie; an image-sequence template is not used. Make a movie template with RGB + Alpha in After Effects' Output Module settings and pass its name as outputTemplate.`
  };
}
function renderCutoutPlanJsx(args) {
  return `
            ${jsxCompLayerPreamble(args)}
            var rq = app.project.renderQueue;
            if (AE.safeGet(function () { return rq.rendering; }, false)) return { ok: false, error: "the render queue is already rendering; wait for it to finish" };
            var _fillName = _layer.name + " gap fill";
            var _fill = null;
            var _fillEnabled = null;
            for (var _li = 1; _li <= _comp.numLayers; _li++) if (_comp.layer(_li).name === _fillName) { _fill = _fillName; _fillEnabled = !!_comp.layer(_li).enabled; }
            // After subject.soften_edge the cut-out is its precomp layer (two copies of the matte inside), not the matted layer.
            var _softName = _layer.name + " soft edge";
            var _soft = null;
            for (var _si = 1; _si <= _comp.numLayers; _si++) {
                var _sl = _comp.layer(_si);
                if (_sl.name === _softName && String(AE.safeGet(function () { return _sl.comment; }, "")).indexOf("soft-edge") >= 0) _soft = _softName;
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
            return { ok: true, layer: _layer.name, fillLayer: _fill, fillEnabled: _fillEnabled, softEdge: _soft, matteCopies: _soft ? 2 : 1, keep: _keep, compSize: [_comp.width, _comp.height], sourceSize: _src,
                aeCache: { folder: _cacheFolder || null, version: AE.safeGet(function () { return app.version; }, null) },
                span: { start: _start, duration: _end - _start, frames: Math.round((_end - _start) / _fd), frameRate: Math.round(1000 / _fd) / 1000 },
                templates: { output: _out, render: _rend } };
        `;
}
function renderCutoutJsx(args) {
  return `
            ${jsxCompPreamble(args)}
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
                    var _want2 = _kept(L.name) ? _s.enabled : false;
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
async function runRenderCutout(args, io) {
  const started = performance.now();
  const outputPath = args.outputPath;
  if (typeof outputPath !== "string" || !path.isAbsolute(outputPath))
    return { ok: false, error: "`outputPath` must be an absolute path for the movie" };
  const rejected = rejectedOutputPath(outputPath);
  if (rejected) return { ok: false, error: rejected };
  const plan = await io.execute(renderCutoutPlanJsx({ comp: args.comp, layer: args.layer }), {
    label: "subject.render_cutout plan",
    timeoutMs: 6e4,
    undoGroup: true
  });
  if (!plan?.ok) return { ok: false, error: plan?.error ?? "could not read the comp", plan };
  const planMs = since(started);
  const fillOff = typeof plan.fillLayer === "string" && plan.fillEnabled === false;
  const fillOffText = fillOff ? `The gap fill layer '${plan.fillLayer}' is switched off, so the cut-out would render with its gaps open (the holes subject.fill_gaps filled show the background through), and subject.check_file would stop on them.` : "";
  if (fillOff && args.withoutFill !== true)
    return {
      ok: false,
      error: `${fillOffText} Nothing was rendered. Switch the fill layer on and render again, or pass withoutFill: true if the gaps are meant to be open.`,
      fillLayer: plan.fillLayer
    };
  const choice = chooseAlphaTemplate(
    plan.templates?.output ?? [],
    typeof args.outputTemplate === "string" ? args.outputTemplate : void 0
  );
  if ("error" in choice) return { ok: false, error: choice.error, templates: plan.templates };
  const frames = plan.span?.frames ?? 0;
  const where = path.dirname(outputPath);
  const cacheRoot = aeCacheRoot(plan.aeCache?.folder, plan.aeCache?.version);
  const movieBytes = renderCutoutBytes(frames, plan.compSize ?? [1080, 1920]);
  const matteCopies = typeof plan.matteCopies === "number" && plan.matteCopies > 1 ? plan.matteCopies : 1;
  const cacheBytes = matteCopies * cacheBytesFor(frames, plan.sourceSize ?? plan.compSize);
  const planned = await spacePlan(
    io,
    [
      { where, parts: { movie: movieBytes } },
      // An unknown cache folder is counted on the output's drive.
      { where: cacheRoot ?? where, parts: { cache: cacheBytes } }
    ],
    RENDER_MARGIN_BYTES,
    `rendering ${frames} frames`
  );
  if (planned.refusal) return planned.refusal;
  const space = {
    parts: { movie: Math.round(movieBytes), cache: cacheBytes },
    volumes: planned.volumes,
    cacheWhere: cacheRoot ?? "unknown (After Effects' Disk Cache folder could not be read); counted on the output's drive"
  };
  const t1 = performance.now();
  const r = await io.execute(
    renderCutoutJsx({
      comp: args.comp,
      keep: plan.keep,
      outputPath,
      outputTemplate: choice.template,
      start: plan.span.start,
      duration: plan.span.duration,
      overwrite: args.overwrite === true
    }),
    // Measured: 390 s for 320 frames of a 2176 x 3840 take; allow 5 s a frame and two minutes over.
    { label: "subject.render_cutout", timeoutMs: 12e4 + frames * 5e3, undoGroup: true }
  );
  const renderMs = since(t1);
  let spaceAtTimeout = null;
  if (r && r.ok === false && /timeout|timed out/i.test(String(r.error ?? ""))) {
    const free = await (io.freeBytes ?? statfsFree)(where);
    spaceAtTimeout = { free, where };
    if (free !== null && free < RENDER_MARGIN_BYTES)
      r.error = `the render timed out with only ${gb(free)} free on the drive holding ${where}: a full drive is a likely cause (a render on a nearly full drive stalls instead of failing). Ask the user to free space, for example Edit > Purge > All Memory & Disk Cache in After Effects, then render again. After Effects said: ${r.error}`;
  }
  const audio = r?.audio && Object.keys(r.audio).length ? r.audio : null;
  const sound = (audio ? `The output module's sound settings read ${Object.entries(audio).map(([k, v]) => `${k}: ${v}`).join("; ")}; whether the file carries a sound track depends on them and was not checked.` : "The output module's sound settings could not be read; the file may or may not carry a sound track.") + " The original layer keeps the sound: subject.use_cutout leaves its audio as it is and switches the movie's audio off, so it plays once.";
  const out = {
    ...r,
    outputTemplate: choice.template,
    templateChoice: choice.why,
    layers: plan.keep,
    sound,
    timing: {
      planMs: Math.round(planMs),
      renderMs: Math.round(renderMs),
      totalMs: Math.round(since(started))
    }
  };
  if (!r?.ok)
    return {
      ...out,
      ok: false,
      error: r?.error ?? "the render failed",
      ...spaceAtTimeout ? { spaceAtTimeout } : {}
    };
  return {
    ...out,
    space,
    ...fillOff ? { fillWarning: `${fillOffText} Rendered anyway (withoutFill: true).` } : {},
    cacheNote: `This render should have added about ${gb(cacheBytes)} to After Effects' disk cache (one 16-bit frame of the source per frame${matteCopies > 1 ? `, for each of the ${matteCopies === 2 ? "two" : matteCopies} copies of the matte subject.soften_edge built` : ""}). Nothing was deleted and no preference was changed.`,
    next: (fillOff ? "The gap fill was off, so the file has its gaps open; tell the user before building on it. " : "") + `Check the file before building on it: subject.check_file { path: "${r.outputPath}", outDir }. Then subject.use_cutout puts it in the comp in place of the live matte. Once the file is checked, the cache this work wrote is no longer needed: tell the user to purge it (Edit > Purge > All Memory & Disk Cache in After Effects); it should free about ${gb(cacheBytes)} or more.`
  };
}
const CHECK_FILE_MAX_FRAMES = 400;
const CHECK_FILE_JUMP_LIMIT = 0.025;
function checkFileFrames(n, cap) {
  if (n <= cap) return { frames: Array.from({ length: n }, (_, i) => i), step: 1 };
  const step = Math.ceil(n / Math.max(1, Math.floor(cap / 2)));
  const set = /* @__PURE__ */ new Set();
  for (let s0 = 0; s0 < n - 1; s0 += step) {
    set.add(s0);
    set.add(s0 + 1);
  }
  for (const f of [0, 1, 2, n - 3, n - 2, n - 1]) if (f >= 0 && f < n) set.add(f);
  return { frames: [...set].sort((a, b) => a - b), step };
}
function fileCompJsx(args) {
  return `
            var _item = null;
            var _imported = false;
            if (${jsxVal(args.item)} !== null) {
                _item = AE.safeGet(function () { return app.project.itemByID(${jsxVal(args.item)}); }, null);
                if (!_item) return { ok: false, error: "no project item with id " + ${jsxVal(args.item)} };
            } else {
                var _f = new File(${jsxVal(args.path)});
                if (!_f.exists) return { ok: false, error: "no file at " + ${jsxVal(args.path)} };
                _item = app.project.importFile(new ImportOptions(_f));
                _imported = true;
            }
            if (!AE.safeGet(function () { return _item.hasVideo; }, false)) return { ok: false, error: "'" + _item.name + "' has no video" };
            var _fr = AE.safeGet(function () { return _item.frameRate; }, 0) || 30;
            var _dur = _item.duration;
            var _c = app.project.items.addComp("check_file " + _item.name, _item.width, _item.height, AE.safeGet(function () { return _item.pixelAspect; }, 1) || 1, _dur, _fr);
            _c.layers.add(_item);
            return { ok: true, compId: _c.id, compName: _c.name, itemId: _item.id, itemName: _item.name, imported: _imported,
                width: _item.width, height: _item.height, frames: Math.round(_dur * _fr), frameRate: _fr };
        `;
}
function fileCleanupJsx(args) {
  return `
            var _removed = [];
            var _c = AE.safeGet(function () { return app.project.itemByID(${jsxVal(args.compId)}); }, null);
            if (_c) { var _cn = _c.name; _c.remove(); _removed.push(_cn); }
            var removeItem = ${jsxVal(args.removeItem)};
            if (removeItem && ${jsxVal(args.itemId)} !== null) {
                var _it = AE.safeGet(function () { return app.project.itemByID(${jsxVal(args.itemId)}); }, null);
                if (_it) { var _in = _it.name; _it.remove(); _removed.push(_in); }
            }
            return { ok: true, removed: _removed };
        `;
}
function frameRanges(frames) {
  const out = [];
  for (let i = 0; i < frames.length; ) {
    let j = i;
    while (j + 1 < frames.length && frames[j + 1] === frames[j] + 1) j++;
    out.push(i === j ? String(frames[i]) : `${frames[i]} to ${frames[j]}`);
    i = j + 1;
  }
  return out.join(", ");
}
function speckAccepted(p, accept) {
  const cx = p.x + p.width / 2;
  const cy = p.y + p.height / 2;
  return accept.some((e) => {
    if (!("box" in e) || e.kind !== "speck") return false;
    const b = e.box;
    return cx >= b.x && cx <= b.x + b.width && cy >= b.y && cy <= b.y + b.height;
  });
}
function longestSpeckRun(t) {
  const touch = (a, b) => a.x <= b.x + b.width && b.x <= a.x + a.width && a.y <= b.y + b.height && b.y <= a.y + a.height;
  const run = /* @__PURE__ */ new Map();
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
function addSpeck(tracks, frame, p) {
  const near = (b) => p.x < b.x + b.width + SPECK_JOIN_PX && b.x < p.x + p.width + SPECK_JOIN_PX && p.y < b.y + b.height + SPECK_JOIN_PX && b.y < p.y + p.height + SPECK_JOIN_PX;
  const t = tracks.find((x) => near(x.box));
  const pb = { x: p.x, y: p.y, width: p.width, height: p.height };
  if (!t) {
    tracks.push({
      frames: [frame],
      box: pb,
      largestArea: p.area,
      largestFrame: frame,
      smallestArea: p.area,
      pieces: [{ frame, box: pb }]
    });
    return;
  }
  t.pieces.push({ frame, box: pb });
  if (!t.frames.includes(frame)) t.frames.push(frame);
  const x0 = Math.min(t.box.x, pb.x);
  const y0 = Math.min(t.box.y, pb.y);
  t.box = {
    x: x0,
    y: y0,
    width: Math.max(t.box.x + t.box.width, pb.x + pb.width) - x0,
    height: Math.max(t.box.y + t.box.height, pb.y + pb.height) - y0
  };
  if (p.area > t.largestArea) {
    t.largestArea = p.area;
    t.largestFrame = frame;
  }
  t.smallestArea = Math.min(t.smallestArea, p.area);
}
async function runCheckFile(args, io) {
  const started = performance.now();
  const file = typeof args.path === "string" ? args.path : null;
  const item = typeof args.item === "number" ? args.item : null;
  if (file === null === (item === null))
    return {
      ok: false,
      error: "give exactly one of `path` (the movie) or `item` (a footage item's id)"
    };
  if (file !== null) {
    if (!path.isAbsolute(file))
      return { ok: false, error: "`path` must be an absolute path to the movie" };
    const there = io.exists ? await io.exists(file) : await fs.access(file).then(
      () => true,
      () => false
    );
    if (!there) return { ok: false, error: `no file at ${file}` };
  }
  const outDir = args.outDir;
  if (typeof outDir !== "string" || !path.isAbsolute(outDir))
    return { ok: false, error: "`outDir` must be an absolute folder for the pictures" };
  const limit = typeof args.holeLimit === "number" ? args.holeLimit : CUTOUT_HOLE_LIMIT;
  const jumpLimit = typeof args.jumpLimit === "number" ? args.jumpLimit : CHECK_FILE_JUMP_LIMIT;
  const cap = typeof args.maxFrames === "number" && args.maxFrames >= 8 ? Math.floor(args.maxFrames) : CHECK_FILE_MAX_FRAMES;
  const over = typeof args.over === "string" ? args.over : CUTOUT_OVER;
  const accept = Array.isArray(args.accept) ? args.accept : [];
  const perFrameMs = Math.max(
    1,
    Math.round(
      (typeof args.secondsPerFrame === "number" && args.secondsPerFrame > 0 ? args.secondsPerFrame : 10) * 1e3
    )
  );
  const speckLimits = {
    minArea: typeof args.speckMinArea === "number" ? args.speckMinArea : SPECK_DEFAULTS.minArea,
    maxArea: typeof args.speckMaxArea === "number" ? args.speckMaxArea : SPECK_DEFAULTS.maxArea
  };
  const speckMinRun = typeof args.speckMinFrames === "number" && args.speckMinFrames >= 1 ? Math.floor(args.speckMinFrames) : SPECK_DEFAULTS.minRun;
  const speckTime = { ms: 0, frames: 0 };
  const seenLimits = { ...SEEN_THROUGH_DEFAULTS };
  for (const k of ["deep", "minArea"]) {
    const v = args[k === "deep" ? "seenThroughDepth" : "seenThroughMinArea"];
    if (typeof v === "number" && v > 0) seenLimits[k] = v;
  }
  const seenTime = { ms: 0, frames: 0 };
  const seen = /* @__PURE__ */ new Map();
  let seenLargest = -1;
  const specks = [];
  const specksAccepted = [];
  const setup = await io.execute(fileCompJsx({ path: file, item }), {
    label: "subject.check_file setup",
    timeoutMs: 12e4,
    undoGroup: true
  });
  if (!setup?.ok)
    return { ok: false, error: setup?.error ?? "could not bring the movie into a comp", setup };
  const renders = renderTally();
  const pixels = pixelTally();
  const { frames, step } = checkFileFrames(setup.frames, cap);
  const keepCaptures = args.keepCaptures === true;
  const sheetPlan = /* @__PURE__ */ new Set();
  for (let i = 0; i < Math.min(24, frames.length); i++)
    sheetPlan.add(frames[Math.floor(i * frames.length / Math.min(24, frames.length))]);
  const isAccepted = (x) => acceptedBy(
    { kind: x.kind, box: { x: x.x, y: x.y, width: x.width, height: x.height } },
    accept
  );
  const tracks = [];
  const jumpFrames = /* @__PURE__ */ new Set();
  const kept = /* @__PURE__ */ new Map();
  let readings = [];
  let prev = null;
  let cleanup = null;
  const needed = () => {
    const n = /* @__PURE__ */ new Set([...jumpFrames, ...sheetPlan]);
    for (const t of tracks) n.add(t.bestFrame);
    for (const t of specks) if (longestSpeckRun(t) >= speckMinRun) n.add(t.largestFrame);
    if (seenLargest >= 0) n.add(seenLargest);
    return n;
  };
  const release = async (frame) => {
    const f = kept.get(frame);
    if (!f || keepCaptures) return;
    kept.delete(frame);
    await fs.rm(f, { force: true });
  };
  const outline = outlineTracker(frozenOpts(args));
  let outlineResult = null;
  const frozenFindings = [];
  const frozenAcceptedRuns = [];
  const size = Math.max(1, Math.min(32, Math.floor(SETTLE_MAX_MS / perFrameMs)));
  try {
    const roomless = await spaceRefusal(
      io,
      outDir,
      (size + 30) * captureBytes([setup.width, setup.height]),
      PICTURE_MARGIN_BYTES,
      "this file check"
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
        b
      );
      const got = (await measureFrames(
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
          for (const p of speckPieces(img.alpha, img.width, img.height, speckLimits))
            addSpeck(speckAccepted(p, accept) ? specksAccepted : specks, r.frame, p);
          speckTime.ms += performance.now() - tSpeck;
          speckTime.frames++;
          const tSeen = performance.now();
          const st = seenThroughInside(img.alpha, img.width, img.height, seenLimits);
          if (st.box && st.px >= seenLimits.minArea) {
            seen.set(r.frame, { px: st.px, box: st.box });
            if (seenLargest < 0 || st.px > (seen.get(seenLargest)?.px ?? 0)) seenLargest = r.frame;
          }
          seenTime.ms += performance.now() - tSeen;
          seenTime.frames++;
        }
      )).readings;
      for (const r of got) {
        readings.push(r);
        if (!r.checked || !r.file) continue;
        kept.set(r.frame, r.file);
        for (const x of regionsOf(r)) {
          if (x.area < limit || isAccepted(x)) continue;
          const t = tracks.find(
            (tr) => tr.kind === x.kind && tr.members.some((m) => alikeRegions(m, x))
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
        const need2 = needed();
        for (const f of Array.from(kept.keys()))
          if (f !== r.frame && !need2.has(f)) await release(f);
        prev = r;
      }
    }
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
        renders
      );
      const pics = [];
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
        removeItem: setup.imported === true && args.keepFootage !== true
      }),
      { label: "subject.check_file cleanup", timeoutMs: 6e4, undoGroup: true }
    );
  }
  const need = needed();
  for (const f of Array.from(kept.keys())) if (!need.has(f)) await release(f);
  const byFrame = new Map(readings.filter((r) => r.checked).map((r) => [r.frame, r]));
  const jumps = [];
  let pairs = 0;
  let largestStep = { from: -1, to: -1, change: 0 };
  for (const r of readings) {
    const next = byFrame.get(r.frame + 1);
    if (!r.checked || !next) continue;
    pairs++;
    const change = Math.round(Math.abs((next.opaqueShare ?? 0) - (r.opaqueShare ?? 0)) * 1e4) / 1e4;
    if (change > largestStep.change || largestStep.from < 0)
      largestStep = { from: r.frame, to: next.frame, change };
    if (change > jumpLimit)
      jumps.push({
        kind: "jump",
        from: r.frame,
        to: next.frame,
        change,
        opaque: [r.opaqueShare, next.opaqueShare]
      });
  }
  const checkedReadings = readings.filter((r) => r.checked && typeof r.opaqueShare === "number");
  const minR = checkedReadings.reduce(
    (m, r) => !m || (r.opaqueShare ?? 1) < (m.opaqueShare ?? 1) ? r : m,
    null
  );
  const maxR = checkedReadings.reduce(
    (m, r) => !m || (r.opaqueShare ?? 0) > (m.opaqueShare ?? 0) ? r : m,
    null
  );
  const opaque = {
    min: minR?.opaqueShare ?? null,
    minFrame: minR?.frame ?? null,
    max: maxR?.opaqueShare ?? null,
    maxFrame: maxR?.frame ?? null,
    largestStep
  };
  const seenFrames = [...seen.keys()].sort((a, b) => a - b);
  let seenRun = 0;
  {
    let run = 0;
    let last = -1;
    for (const f of frames) {
      run = seen.has(f) ? last >= 0 && seen.has(last) ? run + 1 : 1 : 0;
      seenRun = Math.max(seenRun, run);
      last = f;
    }
  }
  const seenLasting = seenFrames.length > 0 && seenRun >= seenLimits.minRun;
  let seenBox = null;
  for (const f of seenFrames) {
    const b = seen.get(f).box;
    seenBox = !seenBox ? { ...b } : {
      x: Math.min(seenBox.x, b.x),
      y: Math.min(seenBox.y, b.y),
      width: Math.max(seenBox.x + seenBox.width, b.x + b.width) - Math.min(seenBox.x, b.x),
      height: Math.max(seenBox.y + seenBox.height, b.y + b.height) - Math.min(seenBox.y, b.y)
    };
  }
  const tPic = performance.now();
  const pictureFrames = /* @__PURE__ */ new Set([
    ...tracks.map((t) => t.bestFrame),
    ...jumps.flatMap((j) => [j.from, j.to]),
    ...specks.filter((t) => longestSpeckRun(t) >= speckMinRun).map((t) => t.largestFrame),
    ...seenLasting ? [seenLargest] : []
  ]);
  const pictureOf = /* @__PURE__ */ new Map();
  let pictureBytes = 0;
  for (const f of [...pictureFrames].sort((a, b) => a - b)) {
    const file2 = kept.get(f);
    const pic = file2 ? await overPicture(io, file2, over) : null;
    pictureOf.set(f, pic);
    if (pic)
      pictureBytes += await fs.stat(pic).then(
        (st) => st.size,
        () => 0
      );
  }
  for (const j of jumps) j.pictures = [pictureOf.get(j.from) ?? null, pictureOf.get(j.to) ?? null];
  for (const r of readings)
    if (pictureOf.get(r.frame)) r.picture = pictureOf.get(r.frame) ?? void 0;
  const picMs = since(tPic);
  pixels.picturesMs += picMs;
  pixels.ms += picMs;
  const tSheet = performance.now();
  const sheetFrames = [.../* @__PURE__ */ new Set([...pictureFrames, ...sheetPlan])].filter((f) => kept.has(f)).slice(0, 24).sort((a, b) => a - b);
  let picture = null;
  let sheetBytes = 0;
  const thumbs = [];
  const labels = [];
  for (const f of sheetFrames) {
    try {
      const img = await io.readImage(kept.get(f));
      const comp = flattenOver(img, { kind: "color", color: parseHex(over) });
      const tw = Math.min(240, img.width);
      const th = Math.max(1, Math.round(img.height * tw / img.width));
      thumbs.push({
        width: tw,
        height: th,
        rgb: resample({ ...img, rgb: comp }, tw, th),
        bitDepth: 8
      });
      labels.push(`frame ${f}${pictureFrames.has(f) ? " !" : ""}`);
    } catch {
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
  for (const f of Array.from(kept.keys())) await release(f);
  if (!keepCaptures) for (const r of readings) delete r.file;
  const pictures = {
    written: [...pictureOf.values()].filter(Boolean).length,
    bytes: pictureBytes,
    sheet: picture,
    sheetBytes,
    capturesKept: keepCaptures
  };
  const compared = `${plural(pairs, "pair")} of neighbouring frames` + (step > 1 ? ` (each frame and the next), one pair every ${step} frames, and the first and last three frames` : "") + ` compared for jumps over ${jumpLimit} in opaque share.`;
  const passText = jumps.length || frozenFindings.length || seenLasting || specks.some((t) => longestSpeckRun(t) >= speckMinRun) ? `No hole or opening of ${fmt(limit)} px or more on the ${byFrame.size} frames read.` : `Nothing over the limit on ${byFrame.size} of ${readings.length} frames read; no jump between neighbouring frames over ${jumpLimit}; the picture is at ${picture ?? "(none)"}.`;
  const sum = summarize(readings, limit, accept, picture, passText);
  const lasting = specks.filter((t) => longestSpeckRun(t) >= speckMinRun);
  const brief = specks.filter((t) => longestSpeckRun(t) < speckMinRun);
  const speckNotes = brief.map((t) => ({
    kind: "speck",
    frames: t.frames.slice().sort((a, b) => a - b),
    longestRun: longestSpeckRun(t),
    largestArea: t.largestArea,
    box: t.box
  }));
  const briefText = brief.length ? ` ${plural(brief.length, "small piece")} apart from the cut-out on single frames, never on ${speckMinRun} or more frames in a row (${brief.map((t) => `frame${t.frames.length > 1 ? "s" : ""} ${frameRanges(t.frames.slice().sort((a, b) => a - b))}, ${t.largestArea} px at (${t.box.x}, ${t.box.y})`).join("; ")}): a flash of a thirtieth of a second that nobody sees, or a wisp of hair, so not a stop; listed in notes.` : "";
  const speckFindings = lasting.map((t) => {
    const frames2 = t.frames.slice().sort((a, b2) => a - b2);
    const b = t.box;
    return {
      kind: "speck",
      frames: frames2,
      longestRun: longestSpeckRun(t),
      largestArea: t.largestArea,
      largestFrame: t.largestFrame,
      smallestArea: t.smallestArea,
      box: b,
      picture: pictureOf.get(t.largestFrame) ?? null,
      reading: `A small opaque piece apart from the cut-out (or joined to it by a neck a pixel or two wide) on ${plural(frames2.length, "frame")} (${frameRanges(frames2)}): ${t.smallestArea} to ${t.largestArea} px, largest on frame ${t.largestFrame}, within (${b.x}, ${b.y}, ${b.width} \xD7 ${b.height}). Usually a sliver of the background the matte kept (a chair edge beside an arm); look at the picture. Remove it with a mask on the cut-out movie on those frames (keying.md, removing a speck), or, if it belongs to the subject, accept it: accept: [{ kind: 'speck', box }].`
    };
  });
  const seenSummary = seenFrames.length && seenBox ? {
    kind: "seen-through",
    frames: seenFrames,
    longestRun: seenRun,
    largestArea: seen.get(seenLargest).px,
    largestFrame: seenLargest,
    box: seenBox
  } : null;
  const seenFindings = seenSummary && seenLasting ? [
    {
      ...seenSummary,
      picture: pictureOf.get(seenLargest) ?? null,
      reading: `Partly see-through inside the cut-out on ${plural(seenFrames.length, "frame")} (${frameRanges(seenFrames)}): up to ${seenSummary.largestArea} px under ${seenLimits.below} alpha more than ${seenLimits.deep} px inside the body (frame ${seenLargest}), within (${seenBox.x}, ${seenBox.y}, ${seenBox.width} \xD7 ${seenBox.height}). The background shows through the subject there: a seam where two copies of the matte meet (subject.soften_edge) or a matte gone soft inside. Look at the picture.`
    }
  ] : [];
  const seenNotes = seenSummary && !seenLasting ? [seenSummary] : [];
  const seenText = seenNotes.length ? ` Partly see-through inside the cut-out on single frames only (${frameRanges(seenFrames)}, up to ${seenSummary.largestArea} px), never on ${seenLimits.minRun} or more frames read in a row: not a stop; listed in notes.` : "";
  const findings = [
    ...sum.findings,
    ...jumps,
    ...frozenFindings,
    ...speckFindings,
    ...seenFindings
  ];
  const stop = findings.length > 0;
  const frozenText = frozenFindings.map((f) => ` ${f.reading}`).join("");
  const jumpText = jumps.length ? ` ${plural(jumps.length, "jump")} in opaque share between neighbouring frames: ${jumps.map((j) => `${j.from} to ${j.to}, ${j.change}`).join("; ")}. A jump of about 0.05 is a dropped object (a microphone); look at both frames.` : "";
  const opaqueText = opaque.min !== null ? ` Opaque share ${opaque.min} (frame ${opaque.minFrame}) to ${opaque.max} (frame ${opaque.maxFrame}); largest step ${largestStep.change} (frames ${largestStep.from} to ${largestStep.to}).` : "";
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
        largestArea: t.largestArea
      }))
    ],
    outline: outlineResult,
    checked: sum.checked,
    compared,
    notes: [...speckNotes, ...seenNotes],
    speckLimits: {
      ...speckLimits,
      minFrames: speckMinRun,
      opaque: SPECK_DEFAULTS.opaque,
      neckPx: 2 * SPECK_DEFAULTS.neck
    },
    seenThroughLimits: { ...seenLimits },
    opaque,
    inOut: `${sum.text}${jumpText}${frozenText}${speckFindings.map((f) => ` ${f.reading}`).join("")}${briefText}${seenFindings.map((f) => ` ${f.reading}`).join("")}${seenText}${opaqueText} ${compared}${stop && picture ? ` Look at the picture (${picture}).` : ""}`,
    picture,
    pictures,
    frameReadings: readings.map((r) => ({
      frame: r.frame,
      checked: r.checked,
      opaqueShare: r.opaqueShare ?? null,
      regions: r.checked ? regionsOf(r).length : null,
      ...r.picture ? { picture: r.picture } : {},
      ...r.error ? { error: r.error } : {}
    })),
    cleanup,
    timing: {
      render: roundTally(renders),
      pixels: roundTally(pixels),
      speck: { ms: Math.round(speckTime.ms), frames: speckTime.frames },
      seenThrough: { ms: Math.round(seenTime.ms), frames: seenTime.frames },
      totalMs: Math.round(since(started))
    },
    next: stop ? "Stop. In your reply, before the next call, tell the user what is wrong in plain words and give the picture's path, before building on this file. A jump or a hole on one frame means the live matte rendered that frame wrong: render the cut-out again (subject.render_cutout) and check the new file. A speck (a small piece apart from the cut-out) does not go away with a new render: mask it out of the cut-out movie on its frames (keying.md), then check again with accept for anything that belongs to the subject." + (seenFindings.length ? " Seen through inside the cut-out, on a soft edge: undo it (subject.soften_edge { comp, layer, undo: true }), switch Decontaminate Edge Colors on instead (subject.settings { comp, layer, decontaminateEdgeColors: true }), render again and check the new file." : "") : "The file is checked. Build on it: subject.use_cutout puts it in the comp in place of the live matte."
  };
}
function useCutoutJsx(args) {
  return `
            ${jsxCompLayerPreamble(args)}
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
function liveFileIO(transport) {
  const cut = liveCutoutIO({}, transport);
  return {
    render: cut.render,
    readImage: cut.readImage,
    async execute(code, opts) {
      const r = await transport.execute({
        code,
        label: opts.label,
        timeoutMs: opts.timeoutMs,
        undoGroup: opts.undoGroup ?? true,
        suppressDialogs: true
      });
      return r.ok ? r.result : { ok: false, error: r.error ?? `${opts.label} failed` };
    },
    exists: (file) => fs.access(file).then(
      () => true,
      () => false
    )
  };
}
registerOp({
  name: "subject.render_cutout",
  category: "subject",
  description: "Render the cut-out once to a movie with alpha, so the piece is built on a file that cannot change: the layer with its gap fill when there is one, alone (every other layer's picture switched off for the render and put back afterwards, even when it fails; cameras and lights left as they are), over the layer's span, through one temporary render-queue item (other queue items are parked). Picks an output template that writes a movie with alpha ('High Quality with Alpha', 'Lossless with Alpha', or another whose name says alpha; image sequences are not used) and refuses, naming the templates, when none does. Returns outputPath, frameCount, renderSeconds, outputTemplate, templateChoice, layersSwitched, restored, sound and timing. Measured: 390 s for 320 frames of a 2176 x 3840 take, about one pass through the clip; tell the user before it runs. The movie is in comp space. The original layer keeps the sound; whether the movie carries a sound track is not promised. The kept layers render switched as they are: when the gap fill layer exists and is switched off, it refuses before rendering and says so (the file would come out with the gaps open), unless withoutFill: true, and then the result's fillWarning says the gaps are open (not checked live). Before rendering it checks that each drive has room for its share, the movie and After Effects' disk cache (about one 16-bit frame of the source per frame: 19 GB measured for 320 frames of a 2176 x 3840 take), plus 3 GB; `space` and `cacheNote` give the numbers, and `next` says to purge the cache once the file is checked." + RENDER_QUEUE_UNDO_WARNING,
  params: [
    ...compLayerParams,
    {
      name: "outputPath",
      type: "string",
      description: "Absolute path for the movie (the template may change the extension; the path written is returned).",
      required: true
    },
    {
      name: "outputTemplate",
      type: "string",
      description: "An output-module template that carries alpha (default: the first found, see above).",
      required: false
    },
    {
      name: "overwrite",
      type: "boolean",
      description: "Replace an existing file at outputPath (default false: refuse).",
      required: false
    },
    {
      name: "withoutFill",
      type: "boolean",
      description: "Render even though the gap fill layer is switched off, leaving its gaps open in the file (default false: refuse).",
      required: false
    }
  ],
  toJsx: () => NODE_ONLY("subject.render_cutout"),
  run: (args, transport) => runRenderCutout(args, liveFileIO(transport))
});
registerOp({
  name: "subject.check_file",
  category: "subject",
  description: `Check a rendered cut-out movie (from subject.render_cutout) frame by frame: brings it into a throwaway comp, reads frames in batches of at most 32 (every frame up to maxFrames, default ${CHECK_FILE_MAX_FRAMES}; beyond it pairs of neighbouring frames in steps, always the first and last three), and reports holes and openings (as subject.check: holeLimit, accept), the opaque share of every frame, and a 'jump' finding when neighbouring frames differ by more than jumpLimit (default ${CHECK_FILE_JUMP_LIMIT}: on the take of 2026-11-11 the rendered cut-out ran 0.279 to 0.314 with no step over 0.012, and a dropped microphone is about 0.05). A speck is a small opaque piece apart from the cut-out, or joined to it by a neck a pixel or two wide, not touching the frame edge: speckMinArea to speckMaxArea px (default 20 to 2,000, chosen on the 4K fresh-session file, where a sliver of chair 1 to 5 px off the right arm read 20 to 240 px on about 40 frames and nothing else in 320 frames was caught); findings of kind 'speck' give the frames, the longest run of frames in a row, the largest area and frame, the box and a picture; a speck on at least speckMinFrames frames in a row (default 2) stops, since a new render keeps it, and a shorter one (a single-frame flash, a wisp of hair) goes to notes and one sentence of inOut. accept: [{ kind: 'speck', box }] takes one off. Checked through a real subject.check_file run on two files of one take (2026-11-12); the limits come from those two files. timing.speck is the pass's own cost (about 5.5 ms a 1080 x 1920 frame). Seen through: pixels partly see-through (alpha 0.5 to 0.95) more than seenThroughDepth px (default 30) inside the cut-out's body and from the frame's edge, as where two copies of a matte meet in a seam; seenThroughMinArea px or more on a frame (default 400) on at least 2 frames read in a row is a finding of kind 'seen-through' that stops, with the frames, the largest area and frame, the box and a picture; single frames go to notes. Limits chosen on two files of the half-size take, as clicked and with subject.soften_edge (at most 82 and 41 px on every fourth frame), and a band of the soft-edge file's alpha multiplied by 0.75 (about 3,900 px a frame); not checked live: it has not run in After Effects on a file with a real seam. timing.seenThrough is its cost. Only true neighbours are compared, and \`compared\` says which. A frame that could not be read is 'not-checked' and stops. Pictures: the largest frame of each finding not accepted and both frames of each jump, full size, and a sheet of up to 24 frames; \`pictures\` counts them and their bytes. Each raw capture is removed once read unless keepCaptures (one run on the take had left 630 MB). The throwaway comp is removed afterwards, and the imported footage too unless keepFootage. \`outline\` says how much the outline changed between neighbouring frames and over frozenGap frames (share of the frame whose alpha changed by more than 0.1, at full size); a run where it did not move is a 'frozen' finding (the selection is probably not tracking, as after replacing the layer's footage; accept: [{ kind: "frozen" }] for a subject that really is still). The frozen limits are not yet calibrated live. Measured: about 0.55 s a frame reading the file. Returns stop, findings, accepted, checked, compared, opaque, outline, inOut, picture, frameReadings, timing.`,
  params: [
    {
      name: "path",
      type: "string",
      description: "Absolute path of the movie. Or `item`.",
      required: false
    },
    {
      name: "item",
      type: "number",
      description: "Id of a footage item already in the project (it is never removed). Or `path`.",
      required: false
    },
    {
      name: "outDir",
      type: "string",
      description: "Absolute folder for the frames and pictures.",
      required: true
    },
    {
      name: "holeLimit",
      type: "number",
      description: `Smallest hole or opening that is a finding, px (default ${CUTOUT_HOLE_LIMIT}).`,
      required: false
    },
    {
      name: "accept",
      type: "array",
      description: "As subject.check's accept: boxes (openings) or { box, kind }.",
      required: false
    },
    {
      name: "speckMinArea",
      type: "number",
      description: `Smallest piece apart from the cut-out reported as a speck, px (default ${SPECK_DEFAULTS.minArea}).`,
      required: false
    },
    {
      name: "speckMinFrames",
      type: "number",
      description: `A speck stops the check only when the same piece is there on at least this many frames in a row (default ${SPECK_DEFAULTS.minRun}); shorter ones go to notes.`,
      required: false
    },
    {
      name: "seenThroughDepth",
      type: "number",
      description: `How far inside the cut-out's body (and from the frame's edge) partial transparency counts as seen through, px (default ${SEEN_THROUGH_DEFAULTS.deep}).`,
      required: false
    },
    {
      name: "seenThroughMinArea",
      type: "number",
      description: `Seen-through pixels on one frame that count (default ${SEEN_THROUGH_DEFAULTS.minArea}).`,
      required: false
    },
    {
      name: "speckMaxArea",
      type: "number",
      description: `Largest, px (default ${SPECK_DEFAULTS.maxArea}; bigger is another object, not a speck).`,
      required: false
    },
    {
      name: "jumpLimit",
      type: "number",
      description: `Largest change in opaque share between neighbouring frames that is not a finding (default ${CHECK_FILE_JUMP_LIMIT}).`,
      required: false
    },
    {
      name: "maxFrames",
      type: "number",
      description: `Most frames read one by one (default ${CHECK_FILE_MAX_FRAMES}).`,
      required: false
    },
    {
      name: "keepFootage",
      type: "boolean",
      description: "Keep the imported footage item in the project (default false; subject.use_cutout imports it again).",
      required: false
    },
    {
      name: "secondsPerFrame",
      type: "number",
      description: "Settle time allowed per frame, s (default 10).",
      required: false
    },
    {
      name: "frozenLimit",
      type: "number",
      description: "A drift over frozenGap frames (share of the frame whose alpha changed by more than 0.1) under this counts as an unmoved outline (default 0.002; not yet calibrated live).",
      required: false
    },
    {
      name: "frozenFrames",
      type: "number",
      description: "Shortest run of unmoved outline that is a 'frozen' finding, frames (default 60).",
      required: false
    },
    {
      name: "frozenGap",
      type: "number",
      description: "Frames between the two frames compared for drift (default 30).",
      required: false
    },
    {
      name: "keepCaptures",
      type: "boolean",
      description: "Keep the raw captures ae_render_frame wrote (default false: each is removed once read; the pictures stay).",
      required: false
    },
    overParam
  ],
  toJsx: () => NODE_ONLY("subject.check_file"),
  run: (args, transport) => runCheckFile(args, liveFileIO(transport))
});
registerOp({
  name: "subject.use_cutout",
  category: "subject",
  description: "Build on the checked file: add the rendered cut-out movie (path, or a footage item id) to the comp directly above the cut-out layer, named '<layer> cut-out', over the cut-out's span. The movie is in comp space (subject.render_cutout renders the comp), so it has no transform or parent of its own. Switches the cut-out layer's and its gap fill's pictures off; they and the selections stay in the project for a later re-click. The original keeps its audio; the movie's audio is switched off. Returns movieLayer, switchedOff, audio and note. Refuses when the comp already has the movie.",
  params: [
    ...compLayerParams,
    {
      name: "path",
      type: "string",
      description: "Absolute path of the movie. Or `item`.",
      required: false
    },
    {
      name: "item",
      type: "number",
      description: "Id of the movie's footage item. Or `path`.",
      required: false
    },
    {
      name: "startTime",
      type: "number",
      description: "Where the movie starts in the comp, s (default: the cut-out's in point, where subject.render_cutout's render starts; pass its timeSpanStart).",
      required: false
    }
  ],
  toJsx(args) {
    if (typeof args.path === "string" === (typeof args.item === "number"))
      return jsxFail("give exactly one of `path` (the movie) or `item` (its footage item's id)");
    return useCutoutJsx(
      args
    );
  }
});
const SOFT_EDGE_DEFAULTS = {
  radius: 8,
  smooth: 0,
  chatterReduction: 2,
  decontaminate: true,
  feather: 60,
  regionDepth: 0.12,
  /** With `across: true`: frames spread across the clip. */
  samples: 5,
  /** By default the check samples the click frame and every `nearStep`th frame after it, up to `near` frames on. */
  near: 60,
  nearStep: 10,
  /** The closing check: a pixel solid in the matte as clicked and more than this far inside its edge must stay solid. */
  deep: 30,
  /** Matte more than this far outside the outline as clicked counts as spread (a smear). */
  outside: 10,
  /** Spread pixels allowed before the build is undone (look C left 0 to 12 px on the take; look D's smear was 156). */
  outsideLimit: 50,
  /** Face colour against the matte as clicked, CIELAB difference allowed. */
  colourLimit: 1
};
const SOFT_EDGE_COST = "The soft edge is two copies of the matte, so After Effects computes Object Matte twice for every frame: a render writes about twice the disk cache and takes several times as long (on the half-size take, 320 frames at 1088 \xD7 1920: 342 s and 9.0 GB of cache, against 65 to 92 s and about 5 GB with one matte; subject.render_cutout counts both copies).";
function softRegionBottom(tops, compHeight, given) {
  if (typeof given === "number" && Number.isFinite(given)) return Math.round(given);
  const valid = tops.filter((t) => t >= 0);
  const lowest = valid.length ? Math.max(...valid) : 0;
  return Math.min(compHeight, lowest + Math.round(SOFT_EDGE_DEFAULTS.regionDepth * compHeight));
}
const SOFT_MARKER = "soft-edge";
function softenBuildJsx(args) {
  const marker = {
    compRoom: SOFT_MARKER,
    radius: args.radius,
    smooth: args.smooth,
    chatterReduction: args.chatterReduction,
    decontaminate: args.decontaminate,
    regionBottom: args.regionBottom,
    feather: args.feather
  };
  return `
            ${jsxCompLayerPreamble(args)}
            var _name = _layer.name + " soft edge";
            for (var _li = 1; _li <= _comp.numLayers; _li++) if (_comp.layer(_li).name === _name) return { ok: false, error: "comp " + _comp.name + " already has a layer '" + _name + "'; undo it first (subject.soften_edge { undo: true })" };
            var _fxRoot = _layer.property("ADBE Effect Parade");
            var _om = null;
            for (var _fi = 1; _fi <= _fxRoot.numProperties; _fi++) if (_fxRoot.property(_fi).matchName === ${jsxVal(OBJECT_MATTE_MATCH_NAME)}) { _om = _fi; break; }
            if (_om === null) return { ok: false, error: "layer '" + _layer.name + "' has no Object Matte" };
            function _walk(g, mn) {
                for (var k = 1; k <= g.numProperties; k++) {
                    var p = g.property(k);
                    if (p.matchName === mn) return p;
                    if (p.propertyType !== PropertyType.PROPERTY && p.matchName !== ${jsxVal(OBJECT_MATTE_SELECTIONS_MATCH_NAME)}) { var r = _walk(p, mn); if (r) return r; }
                }
                return null;
            }
            function _set(layer, vals) {
                var fx = layer.property("ADBE Effect Parade").property(_om);
                for (var k in vals) { if (!vals.hasOwnProperty(k)) continue; var p = _walk(fx, k); if (!p) throw new Error("Object Matte has no property " + k); p.setValue(vals[k]); }
            }
            var _wasEnabled = _layer.enabled;
            var _up = _layer.duplicate(); _up.name = _layer.name + " soft";
            var _lo = _layer.duplicate(); _lo.name = _layer.name + " as clicked";
            var _dec = ${jsxVal(args.decontaminate ? 1 : 0)};
            _set(_up, { "/baserefineedgeradius": ${jsxVal(args.radius)}, "/HBspatialsmoothing": ${jsxVal(args.smooth)}, "/chatter_reduction2": ${jsxVal(args.chatterReduction)}, "/rmcleanedgecolors": _dec });
            _set(_lo, { "/rmcleanedgecolors": _dec });
            var _copies = [_up, _lo];
            for (var _ci = 0; _ci < _copies.length; _ci++) {
                var _c = _copies[_ci];
                _c.enabled = true;
                if (AE.safeGet(function () { return _c.hasAudio; }, false)) { try { _c.audioEnabled = false; } catch (eA) {} }
            }
            var _w = _comp.width, _h = _comp.height;
            var _z = _comp.layers.addSolid([1, 1, 1], _layer.name + " edge region", _w, _h, 1, _comp.duration);
            var _m = _z.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
            var _sh = new Shape();
            _sh.vertices = [[-_w, -_h], [2 * _w, -_h], [2 * _w, ${jsxVal(args.regionBottom)}], [-_w, ${jsxVal(args.regionBottom)}]];
            _sh.closed = true;
            _m.property("ADBE Mask Shape").setValue(_sh);
            _m.property("ADBE Mask Feather").setValue([${jsxVal(args.feather)}, ${jsxVal(args.feather)}]);
            _m.maskMode = MaskMode.ADD;
            _lo.moveBefore(_layer); _up.moveBefore(_lo); _z.moveBefore(_up);
            _up.setTrackMatte(_z, TrackMatteType.ALPHA);
            _lo.setTrackMatte(_z, TrackMatteType.ALPHA_INVERTED);
            _up.blendingMode = BlendingMode.ALPHA_ADD;
            var _pc = _comp.layers.precompose([_z.index, _up.index, _lo.index], _name, true);
            var _pl = null;
            for (var _pi = 1; _pi <= _comp.numLayers; _pi++) if (AE.safeGet(function () { return _comp.layer(_pi).source; }, null) === _pc) { _pl = _comp.layer(_pi); break; }
            if (!_pl) throw new Error("the precomp layer was not found after precompose");
            _pl.name = _name;
            var _mk = ${jsxVal(marker)};
            _mk.layer = _layer.name; _mk.wasEnabled = _wasEnabled;
            function _q(t) { var o = ""; for (var i = 0; i < t.length; i++) { var ch = t.charAt(i); if (ch === '"' || ch === '\\\\') o += '\\\\'; o += ch; } return '"' + o + '"'; }
            _pl.comment = "{" + '"compRoom":"' + _mk.compRoom + '","layer":' + _q(String(_mk.layer)) + ',"radius":' + _mk.radius + ',"smooth":' + _mk.smooth + ',"chatterReduction":' + _mk.chatterReduction + ',"decontaminate":' + _mk.decontaminate + ',"regionBottom":' + _mk.regionBottom + ',"feather":' + _mk.feather + ',"wasEnabled":' + _mk.wasEnabled + "}";
            _pc.comment = "comp-room ${SOFT_MARKER} of " + _layer.name;
            _pl.moveBefore(_layer);
            _pl.enabled = true;
            _layer.enabled = false;
            return { ok: true, softLayer: _name, softIndex: _pl.index, precomp: _pc.name, precompId: _pc.id, wasEnabled: _wasEnabled,
                inside: [_layer.name + " edge region", _layer.name + " soft", _layer.name + " as clicked"] };
        `;
}
function softenUndoJsx(args) {
  return `
            ${jsxCompLayerPreamble(args)}
            var _name = _layer.name + " soft edge";
            var _pl = null;
            for (var _li = 1; _li <= _comp.numLayers; _li++) {
                var _l = _comp.layer(_li);
                if (_l.name === _name && String(AE.safeGet(function () { return _l.comment; }, "")).indexOf(${jsxVal(SOFT_MARKER)}) >= 0) { _pl = _l; break; }
            }
            if (!_pl) return { ok: false, error: "comp " + _comp.name + " has no soft edge for layer '" + _layer.name + "'" };
            var _was = true;
            try { var _st = eval("(" + _pl.comment + ")"); if (_st && _st.wasEnabled === false) _was = false; } catch (eJ) {}
            var _pc = _pl.source;
            var _solids = [];
            for (var _ii = 1; _ii <= _pc.numLayers; _ii++) {
                var _src = AE.safeGet(function () { return _pc.layer(_ii).source; }, null);
                if (_src && _src.mainSource && _src.mainSource instanceof SolidSource) _solids.push(_src);
            }
            _pl.remove();
            var _removed = [_name];
            try { _pc.remove(); _removed.push("precomp " + _name); } catch (eP) {}
            for (var _si = 0; _si < _solids.length; _si++) { try { if (_solids[_si].usedIn.length === 0) { _solids[_si].remove(); _removed.push("solid"); } } catch (eS) {} }
            _layer.enabled = _was;
            return { ok: true, removed: _removed, restored: _layer.name, enabled: _layer.enabled };
        `;
}
const meanLab = (img, pick) => {
  const sum = [0, 0, 0];
  let n = 0;
  for (let p = 0; p < img.width * img.height; p++) {
    if (!pick(p)) continue;
    for (let k = 0; k < 3; k++) sum[k] += img.rgb[p * 3 + k];
    n++;
  }
  return n ? { lab: labOf(sum.map((v) => v / n)), n } : null;
};
const deltaE = (a, b) => Math.hypot(a.L - b.L, a.a - b.a, a.b - b.b);
async function runSoftenEdge(args, io) {
  const started = performance.now();
  if (args.undo === true) {
    const u = await io.execute(softenUndoJsx({ comp: args.comp, layer: args.layer }), {
      label: "subject.soften_edge undo",
      timeoutMs: 6e4
    });
    return u?.ok ? { ...u, note: "The comp is back to the single matted layer." } : { ok: false, error: u?.error ?? "the undo failed" };
  }
  const outDir = args.outDir;
  if (typeof outDir !== "string" || !path.isAbsolute(outDir))
    return { ok: false, error: "`outDir` must be an absolute folder for the pictures" };
  const num = (k, d) => typeof args[k] === "number" && Number.isFinite(args[k]) ? args[k] : d;
  const D = SOFT_EDGE_DEFAULTS;
  const settings = {
    radius: num("radius", D.radius),
    smooth: num("smooth", D.smooth),
    chatterReduction: num("chatterReduction", D.chatterReduction),
    decontaminate: typeof args.decontaminate === "boolean" ? args.decontaminate : D.decontaminate,
    feather: num("feather", D.feather)
  };
  const outsideLimit = num("outsideLimit", D.outsideLimit);
  const background = Array.isArray(args.background) ? args.background : void 0;
  const st = await io.status();
  if (!st?.ok) return { ok: false, error: st?.error ?? "subject.status failed", status: st };
  const missing = needSelection(st);
  if (missing) return { ok: false, error: missing };
  if (st.softEdge)
    return {
      ok: false,
      error: `the layer already has a soft edge ('${st.softEdge.layer}'); undo it first with subject.soften_edge { undo: true }`
    };
  const span = st.span ?? { inFrame: 0, outFrame: 1 };
  const clicks = (st.selections ?? []).map((s) => s.clickFrame).filter((f) => typeof f === "number");
  const click = clicks.length ? Math.min(...clicks) : span.inFrame;
  const sampling = Array.isArray(args.sampleFrames) ? "given" : args.across === true ? "across the clip" : "near the click";
  const nearFrames = [];
  for (let f = click; f < Math.min(span.outFrame, click + D.near); f += D.nearStep) nearFrames.push(f);
  const samples = Array.isArray(args.sampleFrames) ? [
    .../* @__PURE__ */ new Set([
      click,
      ...args.sampleFrames.filter((f) => typeof f === "number" && f >= span.inFrame && f < span.outFrame).map((f) => Math.round(f))
    ])
  ].sort((a, b) => a - b) : args.across === true ? framesAcross(span, Math.max(2, Math.floor(num("samples", D.samples))), [click]) : nearFrames;
  const held = [];
  for (let f = click; f < Math.min(span.outFrame, click + 5); f++) held.push(f);
  const perFrame = perFrameMsOf(args);
  const room = await spacePlan(
    io,
    [
      {
        where: outDir,
        parts: { pictures: (samples.length + held.length) * 4 * captureBytes(st.compSize) }
      },
      {
        where: aeCacheRoot(st.aeCache?.folder, st.aeCache?.version) ?? outDir,
        parts: { cache: 3 * cacheBytesFor(trackedSpan(samples), st.sourceSize ?? st.compSize) }
      }
    ],
    PICTURE_MARGIN_BYTES,
    "the soft edge's check"
  );
  if (room.refusal) return room.refusal;
  const captures = [];
  const renderFrames = async (frames, name, extra) => {
    const r = await io.render({
      compNameOrId: args.comp,
      frames,
      outPath: path.join(outDir, `${name}.png`),
      settleTimeoutMs: Math.min(SETTLE_MAX_MS, frames.length * perFrame + 3e4),
      ...extra
    });
    const out = /* @__PURE__ */ new Map();
    for (const f of r?.frames ?? []) {
      if (!f?.ok || typeof f.writtenTo !== "string") continue;
      captures.push(f.writtenTo);
      out.set(f.frame, { file: f.writtenTo, img: await io.readImage(f.writtenTo) });
    }
    return out;
  };
  const uniq = (a) => [...new Set(a)].sort((x, y) => x - y);
  const asClicked = await renderFrames(uniq([...samples, ...held]), "soft-edge_as-clicked", {
    isolate: args.layer,
    channels: "rgba"
  });
  const ref = asClicked.get(click);
  if (!ref?.img.alpha)
    return { ok: false, error: `the matte as clicked did not render on frame ${click}` };
  const W = ref.img.width;
  const H = ref.img.height;
  const others = samples.filter((f) => f !== click && asClicked.get(f)?.img.alpha).map((f) => ({ frame: f, alpha: asClicked.get(f).img.alpha }));
  const furthest = others.length ? furthestFrame(ref.img.alpha, others, W, H) : { frame: click, overlap: 1 };
  const tops = samples.map(
    (f) => asClicked.get(f)?.img.alpha ? subjectTop(asClicked.get(f).img.alpha, W, H) : -1
  );
  const given = typeof args.regionBottom === "number" ? args.regionBottom : void 0;
  const bottom = softRegionBottom(tops, H, given);
  const checkFrames = uniq([click, furthest.frame]);
  const top = subjectTop(ref.img.alpha, W, H);
  const xs = (y0, y1) => {
    let a = W;
    let b = -1;
    for (let y = Math.max(0, y0); y < Math.min(H, y1); y++)
      for (let x = 0; x < W; x++)
        if (ref.img.alpha[y * W + x] >= 0.5) {
          if (x < a) a = x;
          if (x > b) b = x;
        }
    return b < 0 ? null : { x: Math.max(0, a - 12), width: Math.min(W, b + 13) - Math.max(0, a - 12) };
  };
  const regionDefs = [
    { name: "regionTop", y0: top - 20, y1: top + Math.max(40, Math.round(0.035 * H)) },
    {
      name: "regionSide",
      y0: top + Math.max(40, Math.round(0.035 * H)),
      y1: bottom - Math.round(settings.feather / 2)
    },
    {
      name: "outside",
      y0: bottom + settings.feather + 20,
      y1: bottom + settings.feather + 20 + Math.round(0.1 * H)
    }
  ];
  const lookArgs = {
    regions: regionDefs.filter((r) => r.y1 - r.y0 >= 6).map((r) => ({
      name: r.name,
      y: Math.max(0, r.y0),
      height: Math.min(H, r.y1) - Math.max(0, r.y0),
      ...xs(r.y0, r.y1) ?? { x: 0, width: W }
    })),
    minContrast: 0.08,
    ...background ? { background } : {}
  };
  const lookOf = (frames) => {
    const first = frames.get(click)?.img;
    if (!first) return null;
    const per = measureLook(first, lookArgs).regions;
    const series = summarizeLookSeries(
      held.filter((f) => frames.get(f)).map((f) => lookCrops(frames.get(f).img, lookArgs)),
      lookArgs
    );
    const out = {};
    for (const r of per) {
      if ("error" in r) continue;
      out[r.name] = {
        box: r.rect,
        edgeWidth: r.matte?.edgeWidth ?? null,
        p90: r.matte?.p90 ?? null,
        softBand: r.matte?.softBand ?? null,
        towardBackground: r.edgeColour?.towardBackground ?? null,
        edgeColourDifference: r.edgeColour?.difference ?? null,
        matteChange: series.regions.find((x) => x.name === r.name)?.matteChange ?? null
      };
    }
    return out;
  };
  const lookBefore = lookOf(asClicked);
  const wholeBefore = await renderFrames(checkFrames, "soft-edge_whole-before", {});
  const built = await io.execute(
    softenBuildJsx({ comp: args.comp, layer: args.layer, ...settings, regionBottom: bottom }),
    { label: "subject.soften_edge", timeoutMs: 12e4 }
  );
  if (!built?.ok) return { ok: false, error: built?.error ?? "the build failed", built };
  const softLayer = built.softLayer;
  const after = await renderFrames(uniq([...checkFrames, ...held]), "soft-edge_after", {
    isolate: softLayer,
    channels: "rgba"
  });
  const wholeAfter = await renderFrames(checkFrames, "soft-edge_whole-after", {});
  const checks = checkFrames.map((f) => {
    const a = asClicked.get(f)?.img;
    const b = after.get(f)?.img;
    const wb = wholeBefore.get(f)?.img;
    const wa = wholeAfter.get(f)?.img;
    if (!a?.alpha || !b?.alpha || !wb || !wa)
      return { frame: f, error: "a render of this frame is missing", seenThrough: null };
    const cov = matteCoverage(a.alpha, b.alpha, W, H, { deep: D.deep, outside: D.outside });
    const scratch = new Float32Array(W * H);
    const dIn = new Float32Array(W * H);
    distanceToSolid(a.alpha, W, H, scratch, dIn);
    const deepAt = (p) => a.alpha[p] >= 0.99 && dIn[p] > D.deep;
    let worst = 0;
    const whole0 = meanLab(wb, deepAt);
    const whole1 = meanLab(wa, deepAt);
    if (whole0 && whole1) worst = deltaE(whole0.lab, whole1.lab);
    for (let y = Math.max(0, bottom - settings.feather); y < Math.min(H, bottom + settings.feather); y += 4) {
      const inRow = (p) => p >= y * W && p < (y + 4) * W && deepAt(p);
      const r0 = meanLab(wb, inRow);
      const r1 = meanLab(wa, inRow);
      if (r0 && r1 && r0.n >= 20) worst = Math.max(worst, deltaE(r0.lab, r1.lab));
    }
    return {
      frame: f,
      seenThrough: cov.seenThrough,
      minAlpha: cov.minAlpha,
      band: cov.band,
      outside: cov.outside,
      colourDifference: Math.round(worst * 100) / 100
    };
  });
  const failures = [];
  for (const c of checks) {
    if (c.seenThrough === null) failures.push(`frame ${c.frame}: ${c.error}`);
    else {
      if (c.seenThrough > 0)
        failures.push(
          `frame ${c.frame}: ${c.seenThrough} px seen through (alpha down to ${c.minAlpha}, rows ${c.band?.from} to ${c.band?.to})`
        );
      if ((c.outside?.px ?? 0) > outsideLimit)
        failures.push(
          `frame ${c.frame}: ${c.outside.px} px of matte more than ${D.outside} px outside the outline as clicked (a smear, within ${JSON.stringify(c.outside.box)})`
        );
      if ((c.colourDifference ?? 0) > D.colourLimit)
        failures.push(
          `frame ${c.frame}: colour inside the subject differs from the matte as clicked by ${c.colourDifference} (CIELAB)`
        );
    }
  }
  const check = {
    passed: failures.length === 0,
    frames: checks,
    furthest,
    failures,
    definition: `seen through: a pixel solid in the matte as clicked and more than ${D.deep} px inside its edge that is under 0.99 after; outside: matte at alpha 0.2 or more lying more than ${D.outside} px outside the outline as clicked (allowed: ${outsideLimit} px); colour: CIELAB difference inside the subject against the matte as clicked (allowed: ${D.colourLimit})`
  };
  const pictures = checkFrames.map((f) => wholeAfter.get(f)?.file).filter((f) => typeof f === "string");
  if (args.keepCaptures !== true)
    await Promise.all(
      captures.filter((c) => !pictures.includes(c)).map((c) => fs.rm(c, { force: true }))
    );
  const region = {
    bottom,
    feather: settings.feather,
    chosen: given === void 0 ? "automatic" : "given",
    tops: samples.map((f, i) => ({ frame: f, top: tops[i] })),
    rule: given === void 0 ? `${Math.round(D.regionDepth * 100)}% of the comp's height under the lowest top of the subject on the sampled frames` : "regionBottom as given"
  };
  const last = samples[samples.length - 1];
  const sampled = {
    how: sampling,
    frames: samples,
    leavesOut: sampling === "across the clip" ? `Frames between the ${samples.length} sampled were not read; subject.check_file reads every frame of the rendered file for see-through inside the cut-out.` : `Only frames ${click} to ${last} were read: a later frame where the subject has moved further from the click, or where its top is higher (which would move the region's line), is not checked here. subject.check_file reads every frame of the rendered file for see-through inside the cut-out; across: true samples the whole clip before the render instead, which takes minutes.`
  };
  const timing = { totalMs: Math.round(since(started)) };
  if (!check.passed) {
    const undo = await io.execute(softenUndoJsx({ comp: args.comp, layer: args.layer }), {
      label: "subject.soften_edge undo",
      timeoutMs: 6e4
    });
    return {
      ok: false,
      error: `the soft edge failed its closing check and was undone (${undo?.ok ? "the comp is back to the single matted layer" : `the undo failed: ${undo?.error}; run subject.soften_edge { undo: true }`}): ${failures.join("; ")}`,
      check,
      region,
      sampling: sampled,
      settings,
      undone: undo,
      pictures,
      fallback: `Fall back to Decontaminate Edge Colors alone on the matted layer, which changes no alpha: subject.settings { comp, layer, decontaminateEdgeColors: true }.`,
      timing
    };
  }
  return {
    ok: true,
    softLayer,
    precomp: built.precomp,
    inside: built.inside,
    region,
    sampling: sampled,
    settings,
    check,
    look: { before: lookBefore, after: lookOf(after) },
    pictures,
    cost: SOFT_EDGE_COST,
    undo: "subject.soften_edge { comp, layer, undo: true } takes the comp back to the single matted layer (it removes the precomp and switches the matted layer back on).",
    next: "Look at the pictures (whole frames over the background) and show the user the region at twice size before and after. Then render the cut-out (subject.render_cutout keeps this layer and counts both copies' cache) and check the file (subject.check_file): a seen-through finding there means undo the soft edge and render again with the fallback, Decontaminate Edge Colors alone.",
    timing
  };
}
function distanceToSolid(alpha, w, h, scratch, out) {
  distanceTo(alpha, w, h, (a) => a < 0.99, scratch, out);
}
registerOp({
  name: "subject.soften_edge",
  category: "subject",
  description: "Soften a subject matte's edge inside a region (usually the hair) and prove it: builds keying.md fact 38's construction from the matted layer (Object Matte, ADBE Samurai): two copies of it in a precomp '<layer> soft edge', the upper with Refine Edge (Base Refine Edge Radius, the refine group's Smooth and Chatter Reduction), the lower as clicked, both with Decontaminate Edge Colors, split by one feathered matte over the region (the upper copy's Alpha track matte, the lower's Alpha Inverted, the upper in Alpha Add). The matted layer is switched off and otherwise untouched; it keeps the sound. Defaults: look C, the user's choice on the half-size take (radius 8, Smooth 0, Chatter Reduction 2, Decontaminate on, feather 60). The region is everything above a line: `regionBottom` (comp pixels), or by default 12% of the comp's height under the lowest top of the subject on the sampled frames. Then it runs the closing check on the click frame and the frame furthest from it (the least overlap of the outline with the click frame's, from the sampled frames: by default the click frame and every 10th frame of the 60 after it; `across: true` spreads `samples` frames over the clip instead): no pixel solid in the matte as clicked and more than 30 px inside its edge may drop under 0.99, the colour inside the subject must match the matte as clicked within 1 (CIELAB), and no more than `outsideLimit` px may spread over 10 px outside the outline. On any failure it undoes the build and says so; the fallback is Decontaminate Edge Colors alone (subject.settings). Reports look before and after on the region's top and sides and on the outline below it (edge width and widest tenth on the alpha, soft band, the share of `background`'s colour in the edge when given, the change from frame to frame over five held frames), the region and how it was chosen, and the whole frames after as pictures. After it, subject.check, subject.fill_gaps, subject.render_cutout and subject.use_cutout use the soft-edge layer. Two copies of the matte mean Object Matte is computed twice for every frame: a render writes about twice the disk cache and takes several times as long (on the half-size take, 342 s and 9.0 GB against 65 to 92 s and about 5 GB with one matte). The result's `sampling` says which frames were read and what that leaves out; subject.check_file reads every frame of the render and reports see-through inside the cut-out, which means undo the soft edge and render again with the fallback. undo: true takes the comp back to the single matted layer. Ran once in After Effects 27.0 on the half-size take sampling frames 0 to 50 (given as sampleFrames, the same frames the default now picks); across: true has not run there.",
  params: [
    ...compLayerParams,
    {
      name: "outDir",
      type: "string",
      description: "Absolute folder for the pictures (needed unless undo).",
      required: false
    },
    {
      name: "radius",
      type: "number",
      description: `Base Refine Edge Radius of the upper copy (default ${SOFT_EDGE_DEFAULTS.radius}).`,
      required: false
    },
    {
      name: "smooth",
      type: "number",
      description: `The refine group's Smooth (default ${SOFT_EDGE_DEFAULTS.smooth}).`,
      required: false
    },
    {
      name: "chatterReduction",
      type: "number",
      description: `The refine group's Chatter Reduction menu, 1 to 4 (default ${SOFT_EDGE_DEFAULTS.chatterReduction}; 1 turns its Reduce Chatter off).`,
      required: false
    },
    {
      name: "decontaminate",
      type: "boolean",
      description: "Decontaminate Edge Colors on both copies (default true).",
      required: false
    },
    {
      name: "regionBottom",
      type: "number",
      description: "The region's lower line, comp pixels from the top; the region is everything above it. Default: worked out from the matte.",
      required: false
    },
    {
      name: "feather",
      type: "number",
      description: `Feather of the region's line, px (default ${SOFT_EDGE_DEFAULTS.feather}).`,
      required: false
    },
    {
      name: "background",
      type: "array",
      description: "The background the subject was cut from ([r, g, b] 0..1, the wall's mean): look then reports the share of it in the edge.",
      required: false
    },
    {
      name: "across",
      type: "boolean",
      description: `Sample \`samples\` frames spread across the whole clip instead of near the click: finds a frame far into the clip where the subject has moved further, and a higher top, but makes After Effects track the matte out to each (keying.md fact 3), which takes minutes and was not measured on the disk cache. Default false: the click frame and every ${SOFT_EDGE_DEFAULTS.nearStep}th frame of the ${SOFT_EDGE_DEFAULTS.near} after it (frames 0 to 50 on the half-size take: 4 s, nothing added to the disk cache); subject.check_file then reads every frame of the render for see-through.`,
      required: false
    },
    {
      name: "samples",
      type: "number",
      description: `With across: true, how many frames are spread across the clip (default ${SOFT_EDGE_DEFAULTS.samples}).`,
      required: false
    },
    {
      name: "sampleFrames",
      type: "array",
      description: "Frames to sample in place of the default or `across` (the click frame is always added).",
      required: false
    },
    {
      name: "outsideLimit",
      type: "number",
      description: `Spread pixels allowed more than 10 px outside the outline before the build is undone (default ${SOFT_EDGE_DEFAULTS.outsideLimit}).`,
      required: false
    },
    {
      name: "secondsPerFrame",
      type: "number",
      description: "Settle time allowed per frame rendered (default 60).",
      required: false
    },
    {
      name: "keepCaptures",
      type: "boolean",
      description: "Keep the raw captures (default false: only the whole frames after stay).",
      required: false
    },
    {
      name: "undo",
      type: "boolean",
      description: "Take the comp back to the single matted layer: remove the soft-edge precomp and switch the matted layer back on.",
      required: false
    }
  ],
  toJsx() {
    return "throw new Error('subject.soften_edge runs in Node');";
  },
  async run(args, transport) {
    const cut = liveCutoutIO(args, transport);
    return runSoftenEdge(args, {
      status: cut.status,
      render: cut.render,
      readImage: cut.readImage,
      async execute(code, opts) {
        const r = await transport.execute({
          code,
          label: opts.label,
          timeoutMs: opts.timeoutMs ?? 6e4,
          undoGroup: true,
          suppressDialogs: true
        });
        return r.ok ? r.result : { ok: false, error: r.error ?? `${opts.label} failed` };
      }
    });
  }
});
export {
  CHECK_FILE_JUMP_LIMIT,
  CHECK_FILE_MAX_FRAMES,
  CLOSE_CLICK_SHARE,
  CUTOUT_HOLE_LIMIT,
  CUTOUT_SECONDS_PER_FRAME,
  KEYLIGHT_MATCH_NAME,
  KEYLIGHT_SETTINGS,
  KEYLIGHT_VIEWS,
  KEY_CLEANER_MATCH_NAME,
  KEY_CLEANER_SETTINGS,
  OBJECT_MATTE_MATCH_NAME,
  OBJECT_MATTE_SELECTIONS_MATCH_NAME,
  OBJECT_MATTE_SETTINGS,
  OVERSIZE_FACTOR,
  RENDER_MARGIN_BYTES,
  SOFT_EDGE_COST,
  SOFT_EDGE_DEFAULTS,
  SPILL_SUPPRESSOR_MATCH_NAME,
  SPILL_SUPPRESSOR_SETTINGS,
  SUBJECT_MATTE_NOTICE,
  acceptedBy,
  aeCacheRoot,
  alikeRegions,
  cacheBytesFor,
  checkFileFrames,
  chooseAlphaTemplate,
  closeClicks,
  cutoutFindings,
  diskReport,
  fillBuildJsx,
  fillUnbuildJsx,
  keylightViewNumber,
  renderCutoutBytes,
  renderCutoutJsx,
  renderCutoutPlanJsx,
  runCheckFile,
  runFillGaps,
  runRenderCutout,
  runSoftenEdge,
  runSubjectCheck,
  runSubjectPrepare,
  selectionKind,
  softRegionBottom,
  softenBuildJsx,
  softenUndoJsx,
  soundAdviceFor,
  sourceAdviceFor,
  statfsFree,
  subjectMatteSteps,
  useCutoutJsx
};
