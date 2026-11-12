import { promises as fs } from "node:fs";
import * as path from "node:path";
import { enclosedHoles, growMask } from "../color/matte.js";
import { decodePng, encodePngGray8 } from "../color/png16.js";
import { rejectedOutputPath } from "../config.js";
import { registerOp, jsxFail, jsxVal, jsxCompLayerPreamble, getOp } from "../registry.js";
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
    doc: "Decontaminate Edge Colors: true takes the background's colour out of the edge. On green-screen footage it moved the edge's green excess from -0.0005 to -0.009; turn it on when ae_render_frame's edge report shows the edge leaning to the screen colour"
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
    `Anything else that should stay in the cut-out, such as a microphone, can be several pieces: hover each piece, check that it tints magenta, and click it. Do not click ${subject} again.`,
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
                        point: pt ? [pt[0], pt[1]] : null, compPoint: cp ? [cp[0], cp[1]] : null, durationStart: (dur && dur.length) ? dur[0] : null });
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
  description: "Get a footage layer ready for the one manual step of a subject matte (After Effects 2027's Object Matte, the old Roto Brush): the user clicks the subject once with the Object Matte Tool; a script cannot make that selection. This call brings the comp forward, sets the comp's resolution to Full, moves to `time` (default: the layer's in point; pick a frame where the subject is clearly visible), selects only that layer, opens it in the Layer panel and chooses View > Resolution > Full there (viewerResolution: the menu command is looked up by its name 'Full', and a script cannot read whether the viewer then draws at Full; not verified). It adds no effect and does not pick the tool. Returns notice and steps (the user's instructions, with the clip's name and the subject filled in) and userMessage (both as one text): relay them to the user word for word. Also returns did (the steps done), couldNotDo (any that failed, with the error; beforeSteps then says what to tell the user first) and existing (an Object Matte already on the layer and its selections). After the user says done, run subject.check before building anything. Verified in After Effects 27.0 on a real take, apart from the View > Resolution > Full step.",
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
            _step("set the comp's resolution to Full (the viewer can still draw at another resolution while it is on Auto)", function () { _comp.resolutionFactor = [1, 1]; });
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
            ${VIEWER_FULL_JSX}
            var _viewer = { command: "Full", commandId: null, verified: false,
                note: "chose View > Resolution > Full for the Layer panel; a script cannot read the viewer's resolution, so whether it now draws at Full is not known. If After Effects' yellow bar asks for full resolution, step 4 has the user choose it" };
            if (_opened) {
                _step("chose View > Resolution > Full", function () { _viewer.commandId = _viewerToFull(); });
            } else {
                _couldNot.push({ step: "chose View > Resolution > Full", error: "skipped: the Layer panel did not open, and the command acts on the active viewer" });
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
            var _out = {
                ok: _couldNot.length === 0,
                comp: _comp.name,
                layer: _layer.name,
                time: _t,
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
  }
});
registerOp({
  name: "subject.status",
  category: "subject",
  readOnly: true,
  description: "Read a layer's subject matte (Object Matte, ADBE Samurai) without changing anything: whether the effect is there, its selections (name; kind 'object' for a click with the Object Matte Tool, 'Add Object N', 'quick-selection' for a stroke with the old brush, 'Quick Select Foreground N', 'other' otherwise; duration), its settings (value, the range After Effects reports now, the range measured in After Effects 27.0, default, and foundBy: how the property was found, matchName, walk or name), and summary, one plain sentence ('no selection yet: the user has not clicked', '1 object selected'). Also each selection's clicked point (Transform > Position, source pixels; compPoint in comp pixels where After Effects gives it) and Duration start, closeClicks (two clicks closer than 5% of the source's shorter side probably selected the same thing), sourceSize, compSize and span (the layer in comp frames). A selection count is not a check: after the user says done, run subject.check. removeNote says how to take a selection out or start again.",
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
                    summary: _omSummary(false, []), next: ${jsxVal(`Nothing selected: ${NEED_CLICK}.`)}, effects: AE.effectOrder(_fxRoot),
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
                compSize: [_comp.width, _comp.height],
                span: _omSpan(),
                removeNote: ${jsxVal(REMOVE_NOTE)},
                effects: AE.effectOrder(_fxRoot),
                next: ${jsxVal(CHECK_NEXT)}
            };
            if (_sel.list.length === 0) _out.next = ${jsxVal(`No selection yet: ${NEED_CLICK}.`)};
            return _out;
        `;
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
const CUTOUT_LISTED = 50;
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
function cutoutFindings(frames, limit) {
  const out = [];
  for (const f of frames) {
    for (const h of f.holes) {
      if (h.area < limit) continue;
      const b = { x: h.x, y: h.y, width: h.width, height: h.height };
      const hit = out.find((o) => intersects(o.box, b));
      if (hit) {
        hit.box = union(hit.box, b);
        hit.largestArea = Math.max(hit.largestArea, h.area);
        if (!hit.frames.includes(f.frame)) hit.frames.push(f.frame);
      } else out.push({ kind: "hole", frames: [f.frame], largestArea: h.area, box: b });
    }
  }
  return out.sort((a, b) => b.largestArea - a.largestArea);
}
function framesAcross(span, count, extra) {
  const a = span?.inFrame ?? 0;
  const b = span?.outFrame ?? a + 1;
  const set = /* @__PURE__ */ new Set();
  for (let i = 0; i < count; i++) set.add(a + Math.floor(i * (b - a) / count));
  for (const e of extra) if (typeof e === "number" && e >= a && e < b) set.add(Math.round(e));
  return [...set].sort((x, y) => x - y).slice(0, 32);
}
function frameReadings(payload, limit) {
  const list = payload.frames ?? (payload.writtenTo ? [payload] : []);
  return list.map((f) => {
    const holes = (f.edge?.holes?.list ?? []).map((h) => ({
      x: h.x,
      y: h.y,
      width: h.width,
      height: h.height,
      area: h.area
    }));
    const big = holes.filter((h) => h.area >= limit);
    const small = holes.filter((h) => h.area < limit);
    return {
      frame: f.frame,
      picture: f.writtenTo,
      holes: big,
      holesUnderLimit: { count: small.length, area: small.reduce((s, h) => s + h.area, 0) },
      holeCount: f.edge?.holes?.count ?? holes.length,
      solidAreas: f.edge?.solidAreas?.count ?? null,
      specks: f.edge?.specks?.count ?? null,
      edgeWidth: f.edge?.width ? { typical: f.edge.width.typical, p90: f.edge.width.p90 } : null,
      ...f.error ? { error: f.error } : {}
    };
  });
}
function holeLines(findings, frames) {
  return findings.map(
    (h) => `${fmt(h.largestArea)} px at ${boxText(h.box)} on ${h.frames.length} of ${frames} frames (${h.frames.join(", ")})`
  );
}
const needSelection = (st) => {
  if (!st?.objectMatte?.present || !Array.isArray(st.selections) || st.selections.length === 0)
    return `${st?.summary ?? "no selection"}; ${NEED_CLICK}`;
  return null;
};
async function runSubjectCheck(args, io) {
  const outDir = args.outDir;
  if (typeof outDir !== "string" || !path.isAbsolute(outDir))
    return { ok: false, error: "`outDir` must be an absolute folder for the pictures" };
  const limit = typeof args.holeLimit === "number" ? args.holeLimit : CUTOUT_HOLE_LIMIT;
  const st = await io.status();
  if (!st?.ok) return { ok: false, error: st?.error ?? "subject.status failed", status: st };
  const missing = needSelection(st);
  if (missing) return { ok: false, error: missing };
  const frames = Array.isArray(args.frames) ? args.frames.slice().sort((a, b) => a - b) : framesAcross(st.span, typeof args.count === "number" ? args.count : CUTOUT_FRAMES, [
    args.clickFrame
  ]);
  const payload = await io.render({
    compNameOrId: args.comp,
    frames,
    outPath: path.join(outDir, "cutout.png"),
    isolate: args.layer,
    over: typeof args.over === "string" ? args.over : CUTOUT_OVER,
    edge: { listed: CUTOUT_LISTED },
    contactSheet: {}
  });
  if (!payload?.ok)
    return {
      ok: false,
      error: `the cut-out render failed: ${payload?.error ?? "no result"}`,
      render: payload
    };
  const readings = frameReadings(payload, limit);
  const holes = cutoutFindings(readings, limit);
  const clicks = st.selections.map((s) => ({
    name: s.name,
    kind: s.kind,
    point: s.point ?? null,
    durationStart: s.durationStart ?? null
  }));
  const close = closeClicks(clicks, st.sourceSize ?? null);
  const findings = [...holes];
  if (close.length) findings.push({ kind: "close-clicks", pairs: close });
  const rects = clicks.filter((c) => c.kind === "rectangle").map((c) => c.name);
  const picture = payload.contactSheet?.writtenTo ?? readings[0]?.picture ?? null;
  const solid = readings.find((r) => r.solidAreas !== null)?.solidAreas;
  const inText = `In: ${st.summary}` + (typeof solid === "number" ? `, making ${solid} solid area${solid === 1 ? "" : "s"} on the first frame` : "") + ".";
  const outText = holes.length ? `Out: ${holes.length} enclosed hole${holes.length === 1 ? "" : "s"} of ${fmt(limit)} px or more inside the cut-out: ${holeLines(holes, readings.length).join("; ")}. A hole in the subject is something not selected (a microphone, a cup) or a gap in it that no click fills (subject.fill_gaps).` : `Out: no enclosed hole over ${fmt(limit)} px on the ${readings.length} frames looked at.`;
  const clickText = close.length ? ` Clicks: ${close.map((c) => c.reading).join("; ")}.` : "";
  const rectText = rects.length ? ` ${rects.join(", ")}: a click that dragged a little; it may hold nothing (subject.remove_selection).` : "";
  return {
    ok: true,
    layer: st.layer,
    stop: findings.length > 0,
    findings,
    inOut: `${inText} ${outText}${clickText}${rectText} Look at the picture (${picture}): it shows what no number does, such as the background kept or something the brief names left out without a hole.`,
    picture,
    frames: readings,
    clicks,
    countNote: COUNT_NOTE,
    holeLimit: limit,
    next: findings.length ? "Stop: show the user the picture and say what is out, before building anything else. A missed object needs another click (subject.prepare, then the steps); a wrong extra click comes out with subject.remove_selection; an enclosed gap no click fills goes to subject.fill_gaps. Then run subject.check again." : "Nothing over the limit. Still look at the picture yourself and tell the user what is in and what is out before building on the cut-out."
  };
}
const FILL_LIMITS = (frame) => [
  `The still comes from one frame (frame ${frame}): it assumes a locked camera and that what is in front of the subject does not move. Anything that moves away from the still's gaps shows through the fill.`,
  "What shows through a filled gap is whatever is behind it in the footage. That is the subject only while the subject is behind the gap.",
  "Every enclosed gap at that frame is filled, including a real one (between an arm and the body) where the background will show; pass `only` boxes to fill just the gaps you mean."
];
async function runFillGaps(args, io) {
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
  const minArea = typeof args.minArea === "number" ? args.minArea : 20;
  const grow = typeof args.grow === "number" ? args.grow : 3;
  const st = await io.status();
  if (!st?.ok) return { ok: false, error: st?.error ?? "subject.status failed", status: st };
  const missing = needSelection(st);
  if (missing) return { ok: false, error: missing };
  const frame = typeof args.frame === "number" ? args.frame : st.span?.inFrame ?? 0;
  const ref = await io.render({
    compNameOrId: args.comp,
    frames: [frame],
    outPath: path.join(outDir, "fill-reference.png"),
    isolate: args.layer,
    channels: "rgba"
  });
  if (!ref?.ok)
    return {
      ok: false,
      error: `the reference render failed: ${ref?.error ?? "no result"}`,
      render: ref
    };
  const refFile = ref.frames?.[0]?.writtenTo ?? ref.writtenTo;
  if (!refFile) return { ok: false, error: "the reference render wrote no file", render: ref };
  const img = await io.readAlpha(refFile);
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
  const area = found.holes.reduce((s, h) => s + h.area, 0);
  const filled = {
    holes: found.holes.length,
    area,
    list: found.holes.slice(0, 20),
    dropped: found.dropped,
    leftOut: found.leftOut,
    grow,
    minArea
  };
  if (found.holes.length === 0) {
    return {
      ok: true,
      reference: { frame, picture: refFile },
      filled,
      reading: `No enclosed gap of ${minArea} px or more to fill at frame ${frame}; nothing was built.`,
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
  const png = encodePngGray8(img.width, img.height, values);
  if (io.writePng) await io.writePng(still, png);
  else {
    await fs.mkdir(path.dirname(still), { recursive: true });
    await fs.writeFile(still, png);
  }
  const built = await io.build({ comp: args.comp, layer: args.layer, stillPath: still });
  if (!built?.ok)
    return {
      ok: false,
      error: `the still was written to ${still}, but the fill could not be built: ${built?.error ?? "no result"}`,
      filled,
      build: built
    };
  const frames = Array.isArray(args.frames) ? args.frames.slice().sort((a, b) => a - b) : framesAcross(st.span, typeof args.count === "number" ? args.count : CUTOUT_FRAMES, [frame]);
  const after = await io.render({
    compNameOrId: args.comp,
    frames,
    outPath: path.join(outDir, "fill-after.png"),
    isolate: [args.layer, built.fillLayer],
    over: typeof args.over === "string" ? args.over : CUTOUT_OVER,
    edge: { listed: CUTOUT_LISTED },
    contactSheet: {}
  });
  const afterOut = after?.ok ? (() => {
    const readings = frameReadings(after, limit);
    const findings = cutoutFindings(readings, limit);
    return {
      frames: readings,
      findings,
      picture: after.contactSheet?.writtenTo ?? null,
      reading: findings.length ? `Still over ${fmt(limit)} px after the fill: ${holeLines(findings, readings.length).join("; ")}.` : `No enclosed hole over ${fmt(limit)} px on the ${readings.length} frames looked at after the fill.`
    };
  })() : { error: `the render after the fill failed: ${after?.error ?? "no result"}` };
  return {
    ok: true,
    reference: { frame, picture: refFile },
    filled,
    layers: { fill: built.fillLayer, mask: built.maskLayer, stillItem: built.stillItem },
    after: afterOut,
    limits: FILL_LIMITS(frame),
    next: "Show the user the picture after the fill and say what is left. To undo the fill, delete the two layers it added."
  };
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
            var _out = { ok: true, fillLayer: _fill.name, fillIndex: _fill.index, maskLayer: _mask.name, maskIndex: _mask.index, stillItem: _item.name, removedFromCopy: _removed };
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
    async readAlpha(file) {
      const img = decodePng(await fs.readFile(file));
      if (!img.alpha) throw new Error(`${file} has no alpha channel`);
      return { width: img.width, height: img.height, alpha: img.alpha };
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
registerOp({
  name: "subject.check",
  category: "subject",
  description: `Proof a subject matte after the user says done, before anything else is built: renders the cut-out over a flat colour (default magenta) at the click frame and at frames across the clip (ae_render_frame isolate, edge, a contact sheet), finds enclosed holes with edge's code, and returns picture (the sheet), findings, inOut (a plain statement of what is in and what is out) and stop. A hole of holeLimit px or more (default ${CUTOUT_HOLE_LIMIT}, at the comp's size) is a finding, and so are two clicks close together (they probably selected the same thing). With stop true: show the user the picture and say what is out before doing anything else. A selection count is not a check. Renders track the matte from the click: about 0.13 s a frame the first time (measured).`,
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
      description: "The comp frame the user clicked at (subject.prepare's time in frames). Looked at as well.",
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
      description: `Smallest hole that is a finding, px at the comp's size (default ${CUTOUT_HOLE_LIMIT}).`,
      required: false
    },
    {
      name: "over",
      type: "string",
      description: `The flat colour (default '${CUTOUT_OVER}').`,
      required: false
    },
    subjectIndexParam
  ],
  toJsx: () => NODE_ONLY("subject.check"),
  run: (args, transport) => runSubjectCheck(args, liveCutoutIO(args, transport))
});
registerOp({
  name: "subject.fill_gaps",
  category: "subject",
  description: "Fill enclosed gaps in a subject matte that no click fills (a gap in a microphone's shock mount with the shirt behind it): reads the matte at one reference frame at the comp's size, keeps the transparent regions the frame edge cannot reach, drops those under minArea (default 20 px), grows the rest by `grow` px (default 3), writes them as a still (stillPath), and adds a copy of the same footage under the cut-out showing only through that still (luma track matte); then measures holes again across the clip and reports what is left. Limits, stated in the result: one reference frame, so it assumes a locked camera and a prop that does not move; what shows through is whatever is behind the gap. `only` boxes fill just the gaps they touch. Probed by hand in After Effects 27.0; this operation is not verified there yet.",
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
      description: "Boxes {x, y, width, height} in comp pixels: fill only the gaps they touch (from subject.check's findings).",
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
      description: `Smallest hole reported after the fill, px (default ${CUTOUT_HOLE_LIMIT}).`,
      required: false
    },
    {
      name: "over",
      type: "string",
      description: `The flat colour (default '${CUTOUT_OVER}').`,
      required: false
    },
    subjectIndexParam
  ],
  toJsx: () => NODE_ONLY("subject.fill_gaps"),
  run: (args, transport) => runFillGaps(args, liveCutoutIO(args, transport))
});
export {
  CLOSE_CLICK_SHARE,
  CUTOUT_HOLE_LIMIT,
  KEYLIGHT_MATCH_NAME,
  KEYLIGHT_SETTINGS,
  KEYLIGHT_VIEWS,
  KEY_CLEANER_MATCH_NAME,
  KEY_CLEANER_SETTINGS,
  OBJECT_MATTE_MATCH_NAME,
  OBJECT_MATTE_SELECTIONS_MATCH_NAME,
  OBJECT_MATTE_SETTINGS,
  SPILL_SUPPRESSOR_MATCH_NAME,
  SPILL_SUPPRESSOR_SETTINGS,
  SUBJECT_MATTE_NOTICE,
  closeClicks,
  cutoutFindings,
  fillBuildJsx,
  keylightViewNumber,
  runFillGaps,
  runSubjectCheck,
  selectionKind,
  subjectMatteSteps
};
