// Keying operations (agent-eyes plan, stage 6): Keylight from measured values,
// its views, and the cleanup effects after it. Every effect and property is
// addressed by matchName, never by display name. Match names, defaults, ranges
// and the eleven view numbers are the ones After Effects 2027 reported live
// (2026-11-10, an 8 bpc project with no working space). Every write goes
// through AE.checkPropertyWrite (stage 5) for all values first, so a refused
// value means nothing was written.
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { cutoutRegions, EDGE_DEFAULTS, enclosedHoles, growMask, } from "../color/matte.js";
import { decodePng, encodePngGray8, encodePngSrgb8 } from "../color/png16.js";
import { composeContactSheet, flattenOver, resample } from "../color/sheet.js";
import { rejectedOutputPath } from "../config.js";
import { registerOp, jsxFail, jsxVal, jsxCompLayerPreamble, jsxCompPreamble, getOp, } from "../registry.js";
import { renderFrameTool } from "../tools/render-frame.js";
export const KEYLIGHT_MATCH_NAME = "Keylight 906";
export const KEY_CLEANER_MATCH_NAME = "ADBE KeyCleaner";
export const SPILL_SUPPRESSOR_MATCH_NAME = "ADBE Spill2";
const VIEW_MATCH_NAME = "Keylight 906-0002";
const SCREEN_COLOUR_MATCH_NAME = "Keylight 906-0004";
/** Keylight's View values 1..11, by name (confirmed live by rendering each). */
export const KEYLIGHT_VIEWS = [
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
    "final_result",
];
const VIEW_LIST = KEYLIGHT_VIEWS.map((v, i) => `${v} (${i + 1})`).join(", ");
/** The Keylight settings key.keylight writes, as After Effects 2027 reports them. */
export const KEYLIGHT_SETTINGS = {
    screenColour: {
        matchName: SCREEN_COLOUR_MATCH_NAME,
        kind: "colour",
        doc: "Screen Colour [r, g, b] 0..1, capture values: from ae_render_frame `screen` (colour.nearSubject or colour.median) on the un-keyed source",
    },
    screenGain: {
        matchName: "Keylight 906-0005",
        kind: "number",
        doc: "Screen Gain, 0..5000 (default 100)",
    },
    screenBalance: {
        matchName: "Keylight 906-0006",
        kind: "number",
        doc: "Screen Balance, 0..100 (default 50)",
    },
    despillBias: {
        matchName: "Keylight 906-0007",
        kind: "colour",
        doc: "Despill Bias [r, g, b] 0..1 (default 0.498 grey)",
    },
    alphaBias: {
        matchName: "Keylight 906-0008",
        kind: "colour",
        doc: "Alpha Bias [r, g, b] 0..1 (default 0.498 grey)",
    },
    lockBiases: {
        matchName: "Keylight 906-0009",
        kind: "switch",
        doc: "Lock Biases Together (default on)",
    },
    screenPreBlur: {
        matchName: "Keylight 906-0010",
        kind: "number",
        doc: "Screen Pre-blur, 0..5000 (default 0)",
    },
    clipBlack: {
        matchName: "Keylight 906-0012",
        kind: "number",
        doc: "Clip Black, 0..100 (default 0)",
    },
    clipWhite: {
        matchName: "Keylight 906-0013",
        kind: "number",
        doc: "Clip White, 0..100 (default 100)",
    },
    clipRollback: {
        matchName: "Keylight 906-0014",
        kind: "number",
        doc: "Clip Rollback, 0..5000 (default 0)",
    },
    screenShrinkGrow: {
        matchName: "Keylight 906-0015",
        kind: "number",
        doc: "Screen Shrink/Grow, -5000..5000 (default 0)",
    },
    screenSoftness: {
        matchName: "Keylight 906-0016",
        kind: "number",
        doc: "Screen Softness, 0..5000 (default 0)",
    },
    despotBlack: {
        matchName: "Keylight 906-0017",
        kind: "number",
        doc: "Screen Despot Black, 0..5000 (default 0)",
    },
    despotWhite: {
        matchName: "Keylight 906-0018",
        kind: "number",
        doc: "Screen Despot White, 0..5000 (default 0)",
    },
};
export const KEY_CLEANER_SETTINGS = {
    additionalEdgeRadius: {
        matchName: "ADBE KeyCleaner-0006",
        kind: "number",
        doc: "Additional Edge Radius, 0..250 (default 10)",
    },
    reduceChatter: {
        matchName: "ADBE KeyCleaner-0002",
        kind: "switch",
        doc: "Reduce Chatter (default off)",
    },
    alphaContrast: {
        matchName: "ADBE KeyCleaner-0016",
        kind: "number",
        doc: "Alpha Contrast, 0..100 (default 0)",
    },
    strength: {
        matchName: "ADBE KeyCleaner-0001",
        kind: "number",
        doc: "Strength, 0..100 (default 100)",
    },
};
export const SPILL_SUPPRESSOR_SETTINGS = {
    method: { matchName: "ADBE Spill2-0001", kind: "number", doc: "Method, 1 or 2 (default 1)" },
    suppression: {
        matchName: "ADBE Spill2-1001",
        kind: "number",
        doc: "Suppression, 0..100 (default 100)",
    },
    keyColor: {
        matchName: "ADBE Spill2-0003",
        kind: "colour",
        doc: "Key Color [r, g, b] 0..1 (default pure green), or 'keylight' for Keylight's Screen Colour",
    },
    tolerance: {
        matchName: "ADBE Spill2-0004",
        kind: "number",
        doc: "Tolerance, 0..100 (default 50)",
    },
    desaturate: {
        matchName: "ADBE Spill2-0005",
        kind: "number",
        doc: "Desaturate, 0..100 (default 50)",
    },
    spillRange: {
        matchName: "ADBE Spill2-0006",
        kind: "number",
        doc: "Spill Range, 0..100 (default 50)",
    },
    spillColorCorrection: {
        matchName: "ADBE Spill2-0007",
        kind: "number",
        doc: "Spill Color Correction, 0..100 (default 50)",
    },
    lumaCorrection: {
        matchName: "ADBE Spill2-0008",
        kind: "number",
        doc: "Luma Correction, 0..100 (default 0)",
    },
};
/** { key: matchName } for reading every setting back. */
function readMap(settings, extra = {}) {
    const out = { ...extra };
    for (const [k, s] of Object.entries(settings))
        out[k] = s.matchName;
    return out;
}
/** [r, g, b] or [r, g, b, a] in 0..1 → four numbers; or a message. */
function colourValue(name, v) {
    const ok = Array.isArray(v) &&
        (v.length === 3 || v.length === 4) &&
        v.every((c) => typeof c === "number" && Number.isFinite(c) && c >= 0 && c <= 1);
    if (!ok) {
        return `\`${name}\` must be [r, g, b] or [r, g, b, a] with each number in 0..1 (capture values); got ${JSON.stringify(v)}`;
    }
    const c = v;
    return c.length === 3 ? [...c, 1] : [...c];
}
/** One setting's value as After Effects takes it, or a message. */
function settingValue(name, s, v) {
    if (s.kind === "colour")
        return colourValue(name, v);
    if (s.kind === "switch") {
        if (typeof v !== "boolean" && v !== 0 && v !== 1)
            return `\`${name}\` must be true or false`;
        return v === true || v === 1 ? 1 : 0;
    }
    if (typeof v !== "number" || !Number.isFinite(v))
        return `\`${name}\` must be a number; got ${JSON.stringify(v)}`;
    return v;
}
/** A Keylight view by name (forgiving spelling) or number 1..11 → number, or a message. */
export function keylightViewNumber(v) {
    if (typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= KEYLIGHT_VIEWS.length)
        return v;
    if (typeof v === "string") {
        const norm = v
            .trim()
            .toLowerCase()
            .replace(/[\s-]+/g, "_")
            .replace(/color/g, "colour");
        const i = KEYLIGHT_VIEWS.indexOf(norm);
        if (i >= 0)
            return i + 1;
    }
    return `unknown Keylight view ${JSON.stringify(v)}; views: ${VIEW_LIST}`;
}
const keylightIndexParam = {
    name: "effectIndex",
    type: "number",
    description: "1-based index of the Keylight to use when the layer has several (it must be Keylight). Default: the first Keylight in the stack.",
    required: false,
};
const compLayerParams = [
    { name: "comp", type: "any", description: "Comp name or id", required: true },
    {
        name: "layer",
        type: "any",
        description: "1-based layer index, or the layer name",
        required: true,
    },
];
/** JSX: `_fxRoot` = the layer's effect stack. */
const FX_ROOT_JSX = `
            var _fxRoot = _layer.property("ADBE Effect Parade");
            if (!_fxRoot) return { ok: false, error: "layer '" + _layer.name + "' cannot carry effects" };
`;
/**
 * JSX: `_kl` = { index, count } of the Keylight, or return a clear error.
 * Expects `_fxRoot`; `effectIndexJsx` is the index already encoded with jsxVal.
 */
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
    description: "Key a layer with Keylight from measured values: add Keylight (Keylight 906) if the layer has none, or update the one there, then read every setting back. " +
        "Measure first: render the un-keyed source with ae_render_frame { screen: true } and pass colour.nearSubject (or colour.median) as screenColour. " +
        "Every value is checked against After Effects' reported range before anything is written; a refusal writes nothing and removes a Keylight this call added. " +
        "Returns effectIndex, added, keylightCount, written, values (view and every setting below, as read back) and the effect order. " +
        "With no settings it only reads. Then look at the result with key.view (screen_matte, status) and ae_render_frame { edge: true }.",
    params: [
        ...compLayerParams,
        keylightIndexParam,
        ...Object.entries(KEYLIGHT_SETTINGS).map(([name, s]) => ({
            name,
            type: (s.kind === "colour" ? "array" : s.kind === "switch" ? "boolean" : "number"),
            description: s.doc,
            required: false,
        })),
    ],
    toJsx(args) {
        const writes = [];
        for (const [key, s] of Object.entries(KEYLIGHT_SETTINGS)) {
            if (args[key] === undefined)
                continue;
            const v = settingValue(key, s, args[key]);
            if (typeof v === "string")
                return jsxFail(v);
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
                if (!${jsxVal(args.screenColour !== undefined)}) {
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
    },
});
registerOp({
    name: "key.view",
    category: "key",
    description: "Set Keylight's View and report the previous one (pass previous.number back to restore it). Look at the key in screen_matte (the key's own matte, before the layer masks), " +
        "combined_matte (with the masks), status (white solid, black clear, grey partly transparent) and intermediate_result (keyed, without Keylight's own despill). " +
        "Use source to measure the screen with ae_render_frame { screen: true }. The view is not keyframable.",
    params: [
        ...compLayerParams,
        {
            name: "view",
            type: "any",
            description: `View by name or number: ${VIEW_LIST}. Spaces, hyphens and 'color' are accepted (Screen Matte, final-result).`,
            required: true,
        },
        keylightIndexParam,
    ],
    toJsx(args) {
        const view = keylightViewNumber(args.view);
        if (typeof view === "string")
            return jsxFail(view);
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
    },
});
/** Node-side parse of key.cleanup's keyCleaner / spillSuppressor argument. */
function cleanupGroup(name, v, settings) {
    if (v === false)
        return { want: false };
    if (v === undefined || v === true)
        return { want: true, writes: [], fromKeylight: false };
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
        if (typeof value === "string")
            return value;
        writes.push({ key, matchName: s.matchName, value });
    }
    return { want: true, writes, fromKeylight };
}
registerOp({
    name: "key.cleanup",
    category: "key",
    description: "Add or update Key Cleaner (ADBE KeyCleaner) and Advanced Spill Suppressor (ADBE Spill2) after the layer's Keylight, in that order, moving existing ones into place, with their main settings (checked before writing; a refusal writes and moves nothing and removes what this call added). " +
        "Adobe's intended chain is Keylight on Intermediate Result (View 10), then Key Cleaner, then Advanced Spill Suppressor: with Keylight on Final Result, Keylight has already despilled what the others receive. " +
        "The caller chooses: keylightView: 'intermediate_result' sets that view; otherwise the view is left and a chainNote says so. " +
        "Returns keylight {index, view}, keyCleaner and spillSuppressor {index, added, written, values} (null when left out), the effect order, and chainNote. " +
        "Remove spill only after the matte is right; read edge spill on the final alpha afterwards.",
    params: [
        ...compLayerParams,
        {
            name: "keyCleaner",
            type: "any",
            description: `Key Cleaner settings object, true for its defaults (the default), or false to leave it out. Settings: ${Object.entries(KEY_CLEANER_SETTINGS)
                .map(([k, s]) => `${k} (${s.doc})`)
                .join("; ")}.`,
            required: false,
        },
        {
            name: "spillSuppressor",
            type: "any",
            description: `Advanced Spill Suppressor settings object, true for its defaults (the default), or false to leave it out. Settings: ${Object.entries(SPILL_SUPPRESSOR_SETTINGS)
                .map(([k, s]) => `${k} (${s.doc})`)
                .join("; ")}. Which Method value is Standard and which Ultra was not confirmed live.`,
            required: false,
        },
        {
            name: "keylightView",
            type: "any",
            description: "Also set Keylight's View (name or number, as key.view); 'intermediate_result' for Adobe's intended chain.",
            required: false,
        },
        { ...keylightIndexParam, name: "keylightIndex" },
    ],
    toJsx(args) {
        const kc = cleanupGroup("keyCleaner", args.keyCleaner, KEY_CLEANER_SETTINGS);
        if (typeof kc === "string")
            return jsxFail(kc);
        const ss = cleanupGroup("spillSuppressor", args.spillSuppressor, SPILL_SUPPRESSOR_SETTINGS);
        if (typeof ss === "string")
            return jsxFail(ss);
        let view = null;
        if (args.keylightView !== undefined) {
            const v = keylightViewNumber(args.keylightView);
            if (typeof v === "string")
                return jsxFail(`keylightView: ${v}`);
            view = v;
        }
        const chainNote = "Adobe's intended chain is Keylight on Intermediate Result (10), then Key Cleaner, then Advanced Spill Suppressor; " +
            "on any other view Keylight hands the cleanup effects its own output (on Final Result already despilled). " +
            "Pass keylightView: 'intermediate_result' (or use key.view) for that chain.";
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
    },
});
// ------------------------------------------------------------------------
// Subject matte ("finish like a professional", stage 12): After Effects
// 2027's Object Matte (the old Roto Brush, match name ADBE Samurai). A script
// cannot make its selection: the user clicks the subject once with the Object
// Matte Tool, and these operations do everything around that click. The match
// names, names, ranges and defaults below are the ones After Effects 27.0
// reported live (macOS, 2026-11-11). The slash match names resolve there
// (fx.property("/rmreducechatter")), and so do the display names; every lookup
// still falls back to walking the effect's properties and comparing matchName,
// then display name, in case another version differs.
export const OBJECT_MATTE_MATCH_NAME = "ADBE Samurai";
export const OBJECT_MATTE_SELECTIONS_MATCH_NAME = "ADBE Samurai Strokes Group";
const PAINT_DURATION_MATCH_NAME = "ADBE Paint Duration";
// A selection's Transform > Position: the clicked point, in source pixels (measured 2026-11-11).
const PAINT_TRANSFORM_MATCH_NAME = "ADBE Paint Transform";
const PAINT_POSITION_MATCH_NAME = "ADBE Paint Position";
/** Object Matte's settings, as After Effects 27.0 reported them (2026-11-11). */
export const OBJECT_MATTE_SETTINGS = {
    version: {
        matchName: "/propagation_method",
        name: "Version",
        min: 1,
        max: 4,
        default: 4,
        kind: "number",
        writable: false,
    },
    feather: {
        matchName: "/spatialsmoothing2",
        name: "Feather",
        min: 0,
        max: 1000,
        default: 5,
        kind: "number",
        writable: true,
    },
    contrast: {
        matchName: "/spatialsoftness2",
        name: "Contrast",
        min: 0,
        max: 100,
        default: 80,
        kind: "number",
        writable: true,
    },
    shiftEdge: {
        matchName: "/rmshiftedges",
        name: "Shift Edge",
        min: -100,
        max: 100,
        default: 0,
        kind: "number",
        writable: true,
    },
    reduceChatter: {
        matchName: "/rmreducechatter",
        name: "Reduce Chatter",
        min: 0,
        max: 100,
        default: 0,
        kind: "number",
        writable: true,
    },
    invert: {
        matchName: "/invertforegroundbackground",
        name: "Invert Foreground/Background",
        min: 0,
        max: 1,
        default: null,
        kind: "switch",
        writable: true,
        doc: "Invert Foreground/Background: true keeps everything except the selection",
    },
    fineTune: {
        matchName: "/rmrefinematteenable",
        name: "Fine-tune Object Matte",
        min: 0,
        max: 1,
        default: 1,
        kind: "switch",
        writable: false,
    },
    useMotionBlur: {
        matchName: "/rmusemotionblur",
        name: "Use Motion Blur",
        min: null,
        max: null,
        default: null,
        kind: "switch",
        writable: false,
    },
    decontaminateEdgeColors: {
        matchName: "/rmcleanedgecolors",
        name: "Decontaminate Edge Colors",
        min: 0,
        max: 1,
        default: null,
        kind: "switch",
        writable: true,
        doc: "Decontaminate Edge Colors: true takes the background's colour out of the edge. On green-screen footage it moved the edge's green excess from -0.0005 to -0.009; turn it on when ae_render_frame's edge report shows the edge leaning to the screen colour",
    },
};
/** Said to the user before the steps, and in the skill before building starts. */
export const SUBJECT_MATTE_NOTICE = "One step here needs you in After Effects: a single click on the subject, about ten seconds. Everything before and after it I do.";
/**
 * The user's steps for the click, written once. subject.prepare returns them
 * with the clip's name and the subject filled in; keying.md quotes the
 * defaults (no clip name, "the person") and a test keeps the two the same.
 */
export function subjectMatteSteps(opts = {}) {
    const clip = opts.clip === undefined ? "the clip's name" : `"${opts.clip}"`;
    const given = opts.subject?.trim();
    // The user cutting themself out: "yourself" (or "you") reads in the second person.
    const self = given !== undefined && /^(yourself|you)$/i.test(given);
    const subject = self ? "yourself" : given || "the person";
    const tint = self
        ? "You tint magenta."
        : given
            ? `${subject.charAt(0).toUpperCase()}${subject.slice(1)} tints magenta.`
            : "They tint magenta.";
    return [
        `After Effects is showing your clip in the Layer panel (the tab reads "Layer", then ${clip}). I opened it for you.`,
        'In the toolbar at the top, click the Object Matte Tool: the dashed square with an arrow, just left of the pin. If that icon looks different, click and hold it and choose "Object Matte Tool" from the list.',
        'If a tip titled "Object Matte" appears, click OK.',
        'If a yellow bar in the Layer panel says "Draw Object Matte strokes at full resolution", choose View > Resolution > Full in the menu bar, and tell me the bar was there.',
        `Move the pointer over ${subject} in the Layer panel. ${tint} Click once.`,
        `Anything else that should stay in the cut-out, such as a microphone, can be several pieces: hover each piece, check that it tints magenta, and click it. Do not click ${subject} again.`,
        'Tell me "done". No Spacebar and no Freeze are needed. I will then check the cut-out and show you what is in and what is out.',
    ];
}
/**
 * A selection's kind from its name: a click with the Object Matte Tool
 * ("Add Object N"), a click that dragged a little and became a rectangle
 * ("Add Object Rect N", which may select nothing), a stroke with the old
 * brush ("Quick Select Foreground N"), or other.
 */
export function selectionKind(name) {
    if (/^Add Object \d+$/.test(name))
        return "object";
    if (/^Add Object Rect \d+$/.test(name))
        return "rectangle";
    if (/^Quick Select Foreground \d+$/.test(name))
        return "quick-selection";
    return "other";
}
/** Two clicks closer than this share of the source's shorter side probably selected the same thing. */
export const CLOSE_CLICK_SHARE = 0.05;
const closeClickReading = (a, b, d, limit) => `${a} and ${b} were clicked ${Math.round(d)} source pixels apart (closer than ${Math.round(limit)}): ` +
    "they probably selected the same thing, so a click meant for something else (a microphone) may have landed on the subject again";
/**
 * Pairs of selections whose clicked points (source pixels) are closer than
 * `minDistance`, default CLOSE_CLICK_SHARE of the source's shorter side. The
 * two mistaken clicks of 2026-11-11 were 57 px apart on a 2176 x 3840 source;
 * the click on the microphone was about 820 px from them.
 */
export function closeClicks(clicks, sourceSize, minDistance) {
    const limit = minDistance ??
        (sourceSize
            ? Math.round(CLOSE_CLICK_SHARE * Math.min(sourceSize[0], sourceSize[1]) * 100) / 100
            : null);
    if (limit === null)
        return [];
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
                    reading: closeClickReading(pts[i].name, pts[j].name, d, limit),
                });
        }
    return out;
}
const CHECK_NEXT = "Run subject.check next, before building anything on the cut-out: it renders the cut-out over a flat colour across the clip, finds holes, and returns a picture to show the user.";
/**
 * JSX: `_viewerToFull()` chooses View > Resolution > Full for the active
 * viewer and returns the command id, looked up by name at run time (27.0 gave
 * 2048; Half 2047, Third 2081, Quarter 2046, Custom... 2049; Auto is not in
 * that menu, so a script cannot choose it). Measured in After Effects 27.0
 * with the comp open in the viewer: the command sets comp.resolutionFactor
 * ([2, 2] to [1, 1] and back with Half), the viewer's dropdown then reads
 * Full and the yellow full-resolution bar is gone. Starting from the viewer's
 * Auto setting, which reported Full while drawing at Half, is not verified.
 */
const VIEWER_FULL_JSX = `
            function _viewerToFull() {
                var _fid = app.findMenuCommandId("Full");
                if (!_fid) throw new Error("After Effects has no menu command named 'Full' (View > Resolution > Full)");
                app.executeCommand(_fid);
                return _fid;
            }
`;
const VIEWER_NOTE = "View > Resolution > Full sets the comp's resolutionFactor (measured in After Effects 27.0, with the comp open in the viewer); verified means the comp read [1, 1] after the command and again after the Layer panel opened. " +
    "Starting from the viewer's Auto setting (it drew at Half while the comp was set to Full on 2026-11-11) is not verified, and a script cannot choose Auto. If the yellow full-resolution bar shows, step 4 has the user choose Full.";
const COUNT_NOTE = "A selection count is not a check: it does not say what was selected. Run subject.check and look at its picture before building anything on the cut-out.";
const NEED_CLICK = "run subject.prepare and ask the user for the click, relaying its steps word for word";
/**
 * JSX: `_omFind(fx, matchName, name)` → { prop, foundBy } where foundBy is
 * "matchName" (fx.property(matchName) resolved to it), "walk" (found by
 * walking the effect's properties and comparing matchName), "name" (only the
 * display name matched) or null. The selections group is not walked into.
 * `_omKind(name)` is selectionKind. Expects `_fxRoot`.
 */
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
    required: false,
};
const REMOVE_NOTE = "To take out one wrong selection (a second click that landed on the subject, an 'Add Object Rect' from a click that dragged): subject.remove_selection { comp, layer, selection }. " +
    "To start the whole selection again: remove this Object Matte with effect.remove { comp, layer, effectIndex }, run subject.prepare, and ask the user for the click again. " +
    "The user can also take one thing out by Option-clicking it with the Object Matte Tool.";
registerOp({
    name: "subject.prepare",
    category: "subject",
    description: "Get a footage layer ready for the one manual step of a subject matte (After Effects 2027's Object Matte, the old Roto Brush): the user clicks the subject once with the Object Matte Tool; a script cannot make that selection. " +
        "This call brings the comp forward, chooses View > Resolution > Full and reads the comp's resolution back (viewerResolution: verified only when it reads [1, 1] after the command and after the Layer panel opens; starting from the viewer's Auto setting is not verified), moves to `time` (default: the layer's in point; pick a frame where the subject is clearly visible), selects only that layer and opens it in the Layer panel. It adds no effect and does not pick the tool. " +
        "Returns notice and steps (the user's instructions, with the clip's name and the subject filled in) and userMessage (both as one text): relay them to the user word for word. " +
        "Also returns did (the steps done), couldNotDo (any that failed, with the error; beforeSteps then says what to tell the user first) and existing (an Object Matte already on the layer and its selections). " +
        "After the user says done, run subject.check before building anything. Verified in After Effects 27.0 on a real take, apart from the resolution step as written here.",
    params: [
        ...compLayerParams,
        {
            name: "time",
            type: "number",
            description: "Comp time in seconds to show for the click. Default: the layer's in point. Must be inside the layer.",
            required: false,
        },
        {
            name: "subject",
            type: "string",
            description: "What to cut out, as the user would say it ('the presenter', 'the bottle'); goes into step 4. Default: the person.",
            required: false,
        },
    ],
    toJsx(args) {
        const mark = "\u0001CLIP\u0001";
        const steps = subjectMatteSteps({
            clip: mark,
            subject: typeof args.subject === "string" ? args.subject : undefined,
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
    },
});
registerOp({
    name: "subject.status",
    category: "subject",
    readOnly: true,
    description: "Read a layer's subject matte (Object Matte, ADBE Samurai) without changing anything: whether the effect is there, its selections (name; kind 'object' for a click with the Object Matte Tool, 'Add Object N', 'quick-selection' for a stroke with the old brush, 'Quick Select Foreground N', 'other' otherwise; duration), " +
        "its settings (value, the range After Effects reports now, the range measured in After Effects 27.0, default, and foundBy: how the property was found, matchName, walk or name), and summary, one plain sentence ('no selection yet: the user has not clicked', '1 object selected'). " +
        "Also each selection's clicked point (Transform > Position, source pixels; compPoint in comp pixels where After Effects gives it), clickTime (the selection's Duration start: seconds, measured 0.49999667 for a click at frame 15) and clickFrame (comp frames), closeClicks (two clicks closer than 5% of the source's shorter side probably selected the same thing), sourceSize, compSize and span (the layer in comp frames). " +
        "A selection count is not a check: after the user says done, run subject.check. removeNote says how to take a selection out or start again.",
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
    },
});
const MATTE_WRITABLE = Object.entries(OBJECT_MATTE_SETTINGS).filter(([, s]) => s.writable);
/** Node-side check of one subject.settings value against the measured range: the value to write, or a message. */
function matteSettingValue(key, s, v) {
    if (s.kind === "switch") {
        if (typeof v !== "boolean" && v !== 0 && v !== 1)
            return `\`${key}\` must be true or false; got ${JSON.stringify(v)}`;
        return v === true || v === 1 ? 1 : 0;
    }
    if (typeof v !== "number" || !Number.isFinite(v))
        return `\`${key}\` must be a number; got ${JSON.stringify(v)}`;
    if ((s.min !== null && v < s.min) || (s.max !== null && v > s.max)) {
        return `\`${key}\` refused ${v}: Object Matte's ${s.name} takes ${s.min} to ${s.max} (the range After Effects 27.0 reported)`;
    }
    return v;
}
registerOp({
    name: "subject.settings",
    category: "subject",
    description: "Set a subject matte's edge settings on Object Matte (ADBE Samurai) after the user's click: " +
        MATTE_WRITABLE.map(([k, s]) => `${k} (${s.name}, ${s.min} to ${s.max}${s.default !== null ? `, default ${s.default}` : ""})`).join(", ") +
        ". Each value is checked against the range measured in After Effects 27.0 and then against the range After Effects reports, before anything is written; one refusal writes nothing. " +
        "Refuses when the layer has no Object Matte or it has no selection (the user has not clicked: run subject.prepare and ask for the click). " +
        "Returns effectIndex, written, settings (every setting read back, as subject.status gives them) and summary. Choose values from ae_render_frame's edge report on the matte.",
    params: [
        ...compLayerParams,
        subjectIndexParam,
        ...MATTE_WRITABLE.map(([name, s]) => ({
            name,
            type: (s.kind === "switch" ? "boolean" : "number"),
            description: s.kind === "switch"
                ? (s.doc ?? `${s.name}: true or false`)
                : `${s.name}, ${s.min} to ${s.max}${s.default !== null ? ` (default ${s.default})` : ""}`,
            required: false,
        })),
    ],
    toJsx(args) {
        const writes = [];
        for (const [key, s] of MATTE_WRITABLE) {
            if (args[key] === undefined)
                continue;
            const v = matteSettingValue(key, s, args[key]);
            if (typeof v === "string")
                return jsxFail(`${v}; nothing written`);
            writes.push({ key, matchName: s.matchName, name: s.name, value: v });
        }
        if (writes.length === 0) {
            return jsxFail(`pass at least one of ${MATTE_WRITABLE.map(([k]) => k).join(", ")}; to read the settings, use subject.status`);
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
    },
});
registerOp({
    name: "subject.remove_selection",
    category: "subject",
    description: "Remove one selection from a layer's Object Matte, by its name ('Add Object 2', 'Add Object Rect 1') or its 1-based place in subject.status's list, so a wrong click does not mean starting again. " +
        "remove() on a selection was confirmed in After Effects 27.0: the matte read the same afterwards when the removed selection had selected nothing. " +
        "Returns removed, the selections left and summary. Run subject.check afterwards.",
    params: [
        ...compLayerParams,
        {
            name: "selection",
            type: "any",
            description: "The selection's name, or its 1-based place in subject.status's selections (newest first).",
            required: true,
        },
        subjectIndexParam,
    ],
    toJsx(args) {
        const sel = args.selection;
        if (!(typeof sel === "string" && sel.trim() !== "") &&
            !(typeof sel === "number" && Number.isInteger(sel) && sel >= 1)) {
            return jsxFail(`\`selection\` must be a selection's name or a 1-based number; got ${JSON.stringify(sel)}`);
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
    },
});
// ------------------------------------------------------------------------
// Proofing the cut-out (stage 12b). After the click, subject.check renders
// the cut-out with its alpha at the click frame and across the clip, finds
// holes and openings, and draws it over a flat colour for the user;
// subject.fill_gaps fills enclosed gaps (a shock mount with the shirt behind
// it) from a still made at one frame. Both run in Node: the pixels are read
// with color/matte.ts, and every After Effects call goes through `CutoutIO`,
// so the tests drive them with made-up mattes.
/** A hole or opening at least this big (px at the comp's size) is a finding the agent stops on and shows. */
export const CUTOUT_HOLE_LIMIT = 1000;
// From the build record of 2026-11-11 at 1080 x 1920: a missed microphone left
// an opening of about 115,000 px (it ran off the bottom of the frame), a gap in
// its shock mount a hole of about 4,500 px, an arm against the body an opening
// of about 10,400 px, and the leftovers after filling were 7 to 835 px.
const CUTOUT_FRAMES = 8;
const CUTOUT_OVER = "#ff00ff";
/** Settle time asked of ae_render_frame per frame. Measured: 20 to 40 s a frame the first time on a 2176 x 3840 take. */
export const CUTOUT_SECONDS_PER_FRAME = 60;
const EDGE_TRANSPARENT = EDGE_DEFAULTS.transparent;
/** ae_render_frame's largest settleTimeoutMs. */
const SETTLE_MAX_MS = 600_000;
const THUMB = 360;
const intersects = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
const union = (a, b) => {
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    return {
        x,
        y,
        width: Math.max(a.x + a.width, b.x + b.width) - x,
        height: Math.max(a.y + a.height, b.y + b.height) - y,
    };
};
const fmt = (n) => Math.round(n).toLocaleString("en-US");
const boxText = (b) => `(${b.x}, ${b.y}, ${b.width} × ${b.height})`;
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const boxArea = (b) => b.width * b.height;
const iou = (a, b) => {
    const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
    const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
    if (w <= 0 || h <= 0)
        return 0;
    const inter = w * h;
    return inter / (boxArea(a) + boxArea(b) - inter);
};
/**
 * Two regions are alike (the same thing on two frames, or on two renders of
 * one frame) when their boxes overlap by at least half their union, or when
 * they overlap and their areas are within a factor of two. A small opening
 * under a microphone stand inside the box of a missed microphone is not
 * alike to it (2026-11-11: 1,862 px against 114,769 px).
 */
export function alikeRegions(a, b) {
    if (iou(a, b) >= 0.5)
        return true;
    if (!intersects(a, b))
        return false;
    const big = Math.max(a.area, b.area);
    const small = Math.min(a.area, b.area);
    return small > 0 && big / small <= 2;
}
/**
 * Whether a finding is one the user accepted: an entry of the same kind
 * (openings unless the entry says "hole") whose box overlaps the finding's by
 * at least half their union. A hole is never accepted through an opening's
 * box, and a box does not accept what merely lies inside it.
 */
export function acceptedBy(f, accept) {
    return accept.some((e) => {
        const box = "box" in e ? e.box : e;
        const kind = ("box" in e ? e.kind : undefined) ?? "opening";
        return kind === f.kind && iou(f.box, box) >= 0.5;
    });
}
/** Holes and openings at least `limit` px, each kind grouped across frames where they are alike. */
export function cutoutFindings(frames, limit) {
    const out = [];
    for (const kind of ["hole", "opening"]) {
        const groups = [];
        for (const fr of frames) {
            for (const h of (kind === "hole" ? fr.holes : fr.openings) ?? []) {
                if (h.area < limit)
                    continue;
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
                    if (!f.frames.includes(fr.frame))
                        f.frames.push(fr.frame);
                    if (f.edges)
                        for (const e of h.edges ?? [])
                            if (!f.edges.includes(e))
                                f.edges.push(e);
                }
                else
                    groups.push({
                        members: [h],
                        f: {
                            kind,
                            frames: [fr.frame],
                            smallestArea: h.area,
                            largestArea: h.area,
                            largestFrame: fr.frame,
                            box: b,
                            ...(kind === "opening" ? { edges: [...(h.edges ?? [])] } : {}),
                        },
                    });
            }
        }
        out.push(...groups.map((g) => g.f).sort((a, b) => b.largestArea - a.largestArea));
    }
    return out;
}
async function writePng(io, file, data) {
    if (io.writePng)
        return io.writePng(file, data);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, data);
}
/** Frames to look at: `count` evenly spaced across the layer, plus `extra`, inside the layer, sorted. */
function framesAcross(span, count, extra) {
    const a = span?.inFrame ?? 0;
    const b = span?.outFrame ?? a + 1;
    const set = new Set();
    for (let i = 0; i < count; i++)
        set.add(a + Math.floor((i * (b - a)) / count));
    for (const e of extra)
        if (typeof e === "number" && e >= a && e < b)
            set.add(Math.round(e));
    return [...set].sort((x, y) => x - y).slice(0, 64);
}
/**
 * Render `frames` with `base` arguments, in as many ae_render_frame calls as
 * its settle limit needs at `perFrameMs` a frame. A call that fails marks its
 * frames failed; a frame that did not settle comes back failed with
 * ae_render_frame's error.
 */
async function renderChunked(io, base, frames, perFrameMs, outDir, stem) {
    const size = Math.max(1, Math.floor(SETTLE_MAX_MS / perFrameMs));
    const out = [];
    for (let c = 0; c * size < frames.length; c++) {
        const chunk = frames.slice(c * size, (c + 1) * size);
        const payload = await io.render({
            ...base,
            frames: chunk,
            outPath: path.join(outDir, `${stem}-${c}.png`),
            settleTimeoutMs: Math.min(SETTLE_MAX_MS, Math.max(1, Math.round(perFrameMs * chunk.length))),
        });
        if (!payload?.ok) {
            for (const frame of chunk)
                out.push({
                    frame,
                    ok: false,
                    error: `the render call failed: ${payload?.error ?? "no result"}`,
                });
            continue;
        }
        const list = payload.frames ?? (payload.writtenTo ? [{ ...payload, ok: true, frame: chunk[0] }] : []);
        for (const [i, frame] of chunk.entries()) {
            const f = list.find((x) => x.frame === frame) ?? list[i];
            if (!f)
                out.push({ frame, ok: false, error: "not in the render's result" });
            else if (f.ok === false || typeof f.writtenTo !== "string")
                out.push({ frame, ok: false, error: f.error ?? "the frame was not written" });
            else
                out.push({ frame, ok: true, file: f.writtenTo, edge: f.edge });
        }
    }
    return out;
}
function parseHex(c) {
    const m = /^#?([0-9a-f]{6})$/i.exec(c.trim());
    if (!m)
        return [1, 0, 1];
    const v = parseInt(m[1], 16);
    return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}
/** Read each rendered frame's alpha: holes and openings, a picture over `over`, and one contact sheet. */
async function measureFrames(io, rendered, limit, over, sheetPath) {
    const colour = parseHex(over);
    const readings = [];
    const thumbs = [];
    const labels = [];
    const split = (list) => ({
        big: list.filter((r) => r.area >= limit),
        small: {
            count: list.filter((r) => r.area < limit).length,
            area: list.filter((r) => r.area < limit).reduce((s, r) => s + r.area, 0),
        },
    });
    for (const r of rendered) {
        if (!r.ok || !r.file) {
            readings.push({
                frame: r.frame,
                checked: false,
                holes: null,
                openings: null,
                error: r.error,
            });
            continue;
        }
        let img;
        try {
            img = await io.readImage(r.file);
        }
        catch (err) {
            readings.push({
                frame: r.frame,
                checked: false,
                holes: null,
                openings: null,
                error: `could not read ${r.file}: ${err instanceof Error ? err.message : String(err)}`,
            });
            continue;
        }
        if (!img.alpha) {
            readings.push({
                frame: r.frame,
                checked: false,
                holes: null,
                openings: null,
                error: `${r.file} has no alpha channel`,
            });
            continue;
        }
        const regions = cutoutRegions(img.alpha, img.width, img.height);
        let opaquePx = 0;
        for (const v of img.alpha)
            if (v >= EDGE_DEFAULTS.opaque)
                opaquePx++;
        const h = split(regions.holes);
        const o = split(regions.openings);
        const composite = flattenOver(img, { kind: "color", color: colour });
        const picture = r.file.replace(/\.png$/i, "") + "_over.png";
        await writePng(io, picture, encodePngSrgb8(img.width, img.height, composite));
        const tw = Math.min(THUMB, img.width);
        const th = Math.max(1, Math.round((img.height * tw) / img.width));
        thumbs.push({
            width: tw,
            height: th,
            rgb: resample({ ...img, rgb: composite }, tw, th),
            bitDepth: 8,
        });
        labels.push(`frame ${r.frame}`);
        readings.push({
            frame: r.frame,
            checked: true,
            file: r.file,
            picture,
            opaqueShare: Math.round((opaquePx / img.alpha.length) * 10000) / 10000,
            holes: h.big,
            openings: o.big,
            holesUnderLimit: h.small,
            openingsUnderLimit: o.small,
            edgeWidth: r.edge?.width
                ? { typical: r.edge.width.typical ?? null, p90: r.edge.width.p90 ?? null }
                : null,
            solidAreas: r.edge?.solidAreas?.count ?? null,
        });
    }
    let picture = null;
    if (thumbs.length) {
        const sheet = composeContactSheet(thumbs, { labels, thumbWidth: THUMB });
        await writePng(io, sheetPath, encodePngSrgb8(sheet.width, sheet.height, sheet.rgb));
        picture = sheetPath;
    }
    return { readings, picture };
}
function regionLines(findings, frames) {
    return findings.map((f) => `${f.smallestArea === f.largestArea ? `${fmt(f.largestArea)} px` : `${fmt(f.smallestArea)} to ${fmt(f.largestArea)} px (largest on frame ${f.largestFrame})`} at ${boxText(f.box)} on ${f.frames.length} of ${frames} frames (${f.frames.join(", ")})` +
        (f.kind === "opening" && f.edges?.length
            ? `, reaches the ${f.edges.join(" and ")} edge`
            : ""));
}
const needSelection = (st) => {
    if (!st?.objectMatte?.present || !Array.isArray(st.selections) || st.selections.length === 0)
        return `${st?.summary ?? "no selection"}; ${NEED_CLICK}`;
    return null;
};
const perFrameMsOf = (args) => Math.max(1, Math.round((typeof args.secondsPerFrame === "number" && args.secondsPerFrame > 0
    ? args.secondsPerFrame
    : CUTOUT_SECONDS_PER_FRAME) * 1000));
const TAKES_MINUTES = "This check can take minutes: on a 2176 x 3840 take each frame took 20 to 40 s the first time (the matte is tracked from the click), well under a second once rendered; tell the user before it runs on a long or large clip.";
/** The findings over the limit, the not-checked frames, and a plain statement, for a set of readings. */
function summarize(readings, limit, accept, picture = null) {
    const regions = cutoutFindings(readings, limit);
    const accepted = regions.filter((f) => acceptedBy(f, accept));
    const open = regions.filter((f) => !accepted.includes(f));
    const missed = readings.filter((r) => !r.checked);
    const checked = { frames: readings.length - missed.length, of: readings.length };
    const notChecked = missed.length
        ? [
            {
                kind: "not-checked",
                frames: missed.map((r) => r.frame),
                errors: [...new Set(missed.map((r) => r.error ?? "not rendered"))],
            },
        ]
        : [];
    const holes = open.filter((f) => f.kind === "hole");
    const openings = open.filter((f) => f.kind === "opening");
    const parts = [];
    parts.push(missed.length
        ? `Checked ${checked.frames} of ${checked.of} frames; ${missed.length} did not render (${missed.map((r) => r.frame).join(", ")}): ${notChecked[0].errors.join("; ")}. Those frames were not checked.`
        : `Checked ${checked.frames} of ${checked.of} frames.`);
    if (holes.length)
        parts.push(`${plural(holes.length, "enclosed hole")} of ${fmt(limit)} px or more inside the cut-out: ${regionLines(holes, readings.length).join("; ")}. A hole is something in front of the subject not selected (a cup) or a gap inside a piece that no click fills (subject.fill_gaps).`);
    if (openings.length)
        parts.push(`${plural(openings.length, "opening")} of ${fmt(limit)} px or more, closed off by the subject and the frame edge: ${regionLines(openings, readings.length).join("; ")}. An opening may be something in front of the subject left out (a microphone, a desk), or a real gap such as between an arm and the body; the picture decides.`);
    if (!holes.length && !openings.length)
        parts.push(missed.length
            ? `No hole or opening of ${fmt(limit)} px or more on the ${checked.frames} frames checked; the other ${missed.length} were not checked.`
            : `Nothing over the limit on ${checked.frames} of ${checked.of} frames; the picture is at ${picture ?? "(none)"}.`);
    if (accepted.length)
        parts.push(`Accepted earlier and not counted: ${regionLines(accepted, readings.length).join("; ")}.`);
    return { findings: [...open, ...notChecked], accepted, checked, text: parts.join(" ") };
}
const RECHECK_NOTE = "Each frame with a hole or opening over the limit was rendered a second time at the end. After Effects may have served the second render from its cache, so two renders that agree do not show the frame is stable; " +
    "a frame that differed between them did come out differently (on 2026-11-11 frame 0 of a take rendered once without the microphone and then with it; the cause is not known).";
const regionsOf = (r) => [
    ...(r.holes ?? []).map((x) => ({ ...x, kind: "hole" })),
    ...(r.openings ?? []).map((x) => ({ ...x, kind: "opening" })),
];
/** Render once more each frame with a region over the limit, and report the frames whose regions differ. */
async function recheckFrames(io, readings, limit, over, outDir, perFrameMs, base) {
    const first = readings.filter((r) => r.checked && regionsOf(r).length > 0);
    const frames = first.map((r) => r.frame);
    if (!frames.length)
        return {
            frames,
            agreed: 0,
            differed: [],
            failed: [],
            unstable: [],
            note: "No frame had a hole or opening over the limit, so none was rendered a second time.",
        };
    const rendered = await renderChunked(io, base, frames, perFrameMs, outDir, "cutout-recheck");
    const { readings: again } = await measureFrames(io, rendered, limit, over, path.join(outDir, "cutout-recheck_sheet.png"));
    const unstable = [];
    const failed = [];
    let agreed = 0;
    const brief = (rs) => rs.map((x) => ({
        kind: x.kind,
        area: x.area,
        box: { x: x.x, y: x.y, width: x.width, height: x.height },
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
        unstable.push({
            kind: "unstable",
            frame: a.frame,
            first: { regions: brief(ra), opaqueShare: a.opaqueShare ?? null, picture: a.picture },
            second: { regions: brief(rb), opaqueShare: b.opaqueShare ?? null, picture: b.picture },
            reading: `Frame ${a.frame}: the cut-out differed between two renders of the same frame ` +
                `(opaque share ${a.opaqueShare} then ${b.opaqueShare}; ${plural(ra.length, "region")} then ${rb.length} over the limit). Both pictures are kept.`,
        });
    }
    return {
        frames,
        agreed,
        differed: unstable.map((u) => u.frame),
        failed,
        unstable,
        note: RECHECK_NOTE +
            (failed.length
                ? ` Frames ${failed.join(", ")} did not render the second time and were not compared.`
                : ""),
    };
}
/** What to do about two clicks on the same thing: take the later one out. */
function closeAdvice(pairs) {
    const num = (n) => Number(/(\d+)\s*$/.exec(n)?.[1] ?? -1);
    const later = pairs.map((p) => (num(p.a) >= num(p.b) ? p.a : p.b));
    return ("When both clicks are on the same thing, take the later one out: " +
        [...new Set(later)]
            .map((n) => `subject.remove_selection { selection: "${n}" }`)
            .join(", then ") +
        ". On the take of 2026-11-11 the matte did not change when the redundant click was removed (opaque share 0.3083 before and after on frame 0). If the later click was meant for something else (a microphone), ask for that click again.");
}
export async function runSubjectCheck(args, io) {
    const outDir = args.outDir;
    if (typeof outDir !== "string" || !path.isAbsolute(outDir))
        return { ok: false, error: "`outDir` must be an absolute folder for the pictures" };
    const limit = typeof args.holeLimit === "number" ? args.holeLimit : CUTOUT_HOLE_LIMIT;
    const over = typeof args.over === "string" ? args.over : CUTOUT_OVER;
    const accept = Array.isArray(args.accept) ? args.accept : [];
    const st = await io.status();
    if (!st?.ok)
        return { ok: false, error: st?.error ?? "subject.status failed", status: st };
    const missing = needSelection(st);
    if (missing)
        return { ok: false, error: missing };
    const clicks = st.selections.map((s) => ({
        name: s.name,
        kind: s.kind,
        point: s.point ?? null,
        clickTime: s.clickTime ?? null,
        clickFrame: s.clickFrame ?? null,
    }));
    const frames = Array.isArray(args.frames)
        ? args.frames.slice().sort((a, b) => a - b)
        : framesAcross(st.span, typeof args.count === "number" ? args.count : CUTOUT_FRAMES, [
            args.clickFrame,
            ...clicks.map((c) => c.clickFrame),
        ]);
    const rendered = await renderChunked(io, { compNameOrId: args.comp, isolate: args.layer, channels: "rgba", edge: true }, frames, perFrameMsOf(args), outDir, "cutout");
    const { readings, picture } = await measureFrames(io, rendered, limit, over, path.join(outDir, "cutout_sheet.png"));
    const sum = summarize(readings, limit, accept, picture);
    const close = closeClicks(clicks, st.sourceSize ?? null);
    const findings = [...sum.findings];
    const recheck = args.recheck === false
        ? { skipped: true, note: "recheck: false; no frame was rendered a second time" }
        : await recheckFrames(io, readings, limit, over, outDir, perFrameMsOf(args), {
            compNameOrId: args.comp,
            isolate: args.layer,
            channels: "rgba",
            edge: true,
        });
    if ("unstable" in recheck)
        findings.push(...recheck.unstable);
    if (close.length)
        findings.push({ kind: "close-clicks", pairs: close, advice: closeAdvice(close) });
    const rects = clicks.filter((c) => c.kind === "rectangle").map((c) => c.name);
    const solid = readings.find((r) => typeof r.solidAreas === "number")?.solidAreas;
    const inText = `In: ${st.summary}` +
        (typeof solid === "number"
            ? `, making ${plural(solid, "solid area")} on the first frame checked`
            : "") +
        ".";
    const clickText = close.length ? ` Clicks: ${close.map((c) => c.reading).join("; ")}.` : "";
    const rectText = rects.length
        ? ` ${rects.join(", ")}: a click that dragged a little; it may hold nothing (subject.remove_selection).`
        : "";
    const pictureText = picture
        ? ` Look at the picture (${picture}): it shows what no number does, such as the background kept or something the brief names left out.`
        : " No frame rendered, so there is no picture.";
    const stop = findings.length > 0;
    return {
        ok: true,
        layer: st.layer,
        stop,
        findings,
        accepted: sum.accepted,
        checked: sum.checked,
        recheck: "unstable" in recheck
            ? {
                frames: recheck.frames,
                agreed: recheck.agreed,
                differed: recheck.differed,
                failed: recheck.failed,
                note: recheck.note,
            }
            : recheck,
        inOut: `${inText} ${sum.text}${clickText}${rectText}${stop || !picture ? pictureText : ""}`,
        picture,
        frames: readings,
        clicks,
        countNote: COUNT_NOTE,
        holeLimit: limit,
        next: stop
            ? "Stop: show the user the picture and say what is out, before building anything else. " +
                (findings.some((f) => f.kind === "unstable")
                    ? "A frame came out differently on two renders (kind 'unstable'): run subject.check again, and look at the first frames of the delivered video as well. "
                    : "") +
                "Something left out needs another click (subject.prepare, then the steps); a wrong extra click comes out with subject.remove_selection; an enclosed gap no click fills goes to subject.fill_gaps. " +
                "When the user says a region shown is fine (a real gap between an arm and the body), run subject.check again with accept: [that finding's box] (an opening), or accept: [{ box, kind: 'hole' }] for a hole, so it is not shown again. Two clicks on the same thing: take the later one out with subject.remove_selection. " +
                "Frames not checked: run subject.check again on those frames with a larger secondsPerFrame. " +
                TAKES_MINUTES
            : "Nothing over the limit. Still look at the picture yourself and tell the user what is in and what is out before building on the cut-out. " +
                TAKES_MINUTES,
    };
}
const FILL_LIMITS = (frame) => [
    `The still comes from one frame (frame ${frame}): it assumes a locked camera and that what is in front of the subject does not move. Anything that moves away from the still's gaps shows through the fill.`,
    "What shows through a filled gap is whatever is behind it in the footage. That is the subject only while the subject is behind the gap.",
    "Every enclosed gap at that frame is filled, including a real one (between an arm and the body) where the background will show; pass `only` boxes to fill just the gaps you mean. Openings (regions that reach the frame edge) are never filled.",
];
export async function runFillGaps(args, io) {
    const still = args.stillPath;
    if (typeof still !== "string" ||
        !path.isAbsolute(still) ||
        path.extname(still).toLowerCase() !== ".png") {
        return {
            ok: false,
            error: "`stillPath` must be an absolute path to a .png file, kept with the project (the comp will use it)",
        };
    }
    const rejected = rejectedOutputPath(still);
    if (rejected)
        return { ok: false, error: rejected };
    const outDir = typeof args.outDir === "string" && path.isAbsolute(args.outDir)
        ? args.outDir
        : path.dirname(still);
    const limit = typeof args.holeLimit === "number" ? args.holeLimit : CUTOUT_HOLE_LIMIT;
    const over = typeof args.over === "string" ? args.over : CUTOUT_OVER;
    const minArea = typeof args.minArea === "number" ? args.minArea : 20;
    const grow = typeof args.grow === "number" ? args.grow : 3;
    const perFrameMs = perFrameMsOf(args);
    const st = await io.status();
    if (!st?.ok)
        return { ok: false, error: st?.error ?? "subject.status failed", status: st };
    const missing = needSelection(st);
    if (missing)
        return { ok: false, error: missing };
    const frame = typeof args.frame === "number" ? args.frame : (st.span?.inFrame ?? 0);
    const [ref] = await renderChunked(io, { compNameOrId: args.comp, isolate: args.layer, channels: "rgba" }, [frame], perFrameMs, outDir, "fill-reference");
    const refused = (why) => ({
        ok: false,
        error: `the reference frame ${frame} did not render (${why}). Nothing was built. Try again with a larger secondsPerFrame.`,
    });
    if (!ref?.ok || !ref.file)
        return refused(ref?.error ?? "no result");
    let img;
    try {
        img = await io.readImage(ref.file);
    }
    catch (err) {
        return refused(err instanceof Error ? err.message : String(err));
    }
    if (!img.alpha)
        return refused(`${ref.file} has no alpha channel`);
    const [cw, ch] = Array.isArray(st.compSize) ? st.compSize : [img.width, img.height];
    if (img.width !== cw || img.height !== ch) {
        return {
            ok: false,
            error: `the reference render came back ${img.width} × ${img.height}, not the comp's size ${cw} × ${ch}; set the comp to Full resolution and try again. Nothing was built.`,
        };
    }
    const only = Array.isArray(args.only) ? args.only : null;
    const found = enclosedHoles(img.alpha, img.width, img.height, {
        minArea,
        keep: only ? (h) => only.some((b) => intersects(h, b)) : undefined,
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
        minArea,
    };
    if (found.holes.length === 0) {
        return {
            ok: true,
            reference: { frame, file: ref.file },
            filled,
            reading: `No enclosed gap of ${minArea} px or more to fill at frame ${frame}; nothing was built.` +
                (openings.length
                    ? ` ${plural(openings.length, "opening")} reaching the frame edge were left alone: an opening is never filled.`
                    : ""),
            limits: FILL_LIMITS(frame),
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
    const built = await io.build({ comp: args.comp, layer: args.layer, stillPath: still });
    if (!built?.ok)
        return {
            ok: false,
            error: `the still was written to ${still}, but the fill could not be built: ${built?.error ?? "no result"}`,
            filled,
            build: built,
        };
    const layers = {
        fill: built.fillLayer,
        mask: built.maskLayer,
        stillItem: built.stillItem,
        stillItemId: built.stillItemId ?? null,
        audioOff: built.audioOff === true,
        ...(built.audioError ? { audioError: built.audioError } : {}),
    };
    // The fill layer alone must show no more than the still lets through.
    const [alone] = await renderChunked(io, { compNameOrId: args.comp, isolate: [built.fillLayer], channels: "rgba" }, [frame], perFrameMs, outDir, "fill-alone");
    let fillAlone;
    try {
        if (!alone?.ok || !alone.file)
            throw new Error(alone?.error ?? "not rendered");
        const a = await io.readImage(alone.file);
        let covered = 0;
        for (const v of a.alpha ?? [])
            if (v > EDGE_TRANSPARENT)
                covered++;
        fillAlone = { covered, mask: grownArea, ok: covered <= grownArea * 1.1 + 100 };
    }
    catch (err) {
        fillAlone = {
            covered: null,
            mask: grownArea,
            ok: null,
            error: err instanceof Error ? err.message : String(err),
        };
    }
    if (fillAlone.ok === false) {
        const undone = await io.unbuild({
            comp: args.comp,
            fillLayer: built.fillLayer,
            maskLayer: built.maskLayer,
            stillItemId: layers.stillItemId,
        });
        return {
            ok: false,
            error: `the fill layer alone covers ${fmt(fillAlone.covered)} px, more than the gap mask's ${fmt(grownArea)} px: the track matte is not limiting it. ` +
                (undone?.ok
                    ? `The build was undone (${(undone.removed ?? []).join(", ")}).`
                    : `Undoing the build failed (${undone?.error ?? "no result"}): delete '${built.fillLayer}' and '${built.maskLayer}' by hand.`),
            filled,
            fillAlone,
            layers,
        };
    }
    const frames = Array.isArray(args.frames)
        ? args.frames.slice().sort((a, b) => a - b)
        : framesAcross(st.span, typeof args.count === "number" ? args.count : CUTOUT_FRAMES, [frame]);
    const afterRendered = await renderChunked(io, {
        compNameOrId: args.comp,
        isolate: [args.layer, built.fillLayer],
        channels: "rgba",
        edge: true,
    }, frames, perFrameMs, outDir, "fill-after");
    const measured = await measureFrames(io, afterRendered, limit, over, path.join(outDir, "fill-after_sheet.png"));
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
            reading: sum.text,
        },
        limits: FILL_LIMITS(frame),
        next: "Show the user the picture after the fill and say what is left. To undo the fill, delete the two layers it added." +
            (layers.audioOff
                ? " The fill copy's audio was switched off, so the footage's sound plays once."
                : "") +
            (built.audioError
                ? ` The fill copy's audio could not be switched off (${built.audioError}): the sound may play twice; switch it off by hand.`
                : "") +
            (fillAlone.ok === null
                ? " The fill layer alone could not be rendered, so whether the track matte limits it was not checked: look at it."
                : ""),
    };
}
/** JSX: remove subject.fill_gaps' two layers and its imported still. */
export function fillUnbuildJsx(args) {
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
/**
 * JSX for subject.fill_gaps' build: import the still, add it as a hidden
 * layer, duplicate the footage layer directly under the cut-out with its
 * Object Matte removed, and give the copy the still as its luma track matte
 * (setTrackMatte; its ALPHA form was confirmed in After Effects 27.0, LUMA was
 * not). Refuses when a fill is already there.
 */
export function fillBuildJsx(args) {
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
            var _out = { ok: true, fillLayer: _fill.name, fillIndex: _fill.index, maskLayer: _mask.name, maskIndex: _mask.index, stillItem: _item.name, stillItemId: AE.safeGet(function () { return _item.id; }, null), removedFromCopy: _removed, audioOff: _audioOff };
            if (_audioError !== null) _out.audioError = _audioError;
            if (_spanError !== null) _out.maskSpanError = _spanError;
            return _out;
        `;
}
/** The CutoutIO a live call uses: subject.status and ae_render_frame through `transport`. */
function liveCutoutIO(args, transport) {
    return {
        async status() {
            const code = getOp("subject.status").toJsx({
                comp: args.comp,
                layer: args.layer,
                effectIndex: args.effectIndex,
            });
            const r = await transport.execute({
                code,
                label: "subject.status",
                undoGroup: false,
                timeoutMs: 30_000,
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
                    details: sc,
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
                timeoutMs: 60_000,
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
                timeoutMs: 60_000,
            });
            return r.ok
                ? r.result
                : { ok: false, error: r.error ?? "the build failed", rollback: r.rollback };
        },
    };
}
const NODE_ONLY = (name) => jsxFail(`${name} runs in Node (it reads pixels), so it cannot ride inside batch.run; call it through ae_do`);
const frameListParam = {
    name: "frames",
    type: "array",
    description: "Comp frame numbers to look at, instead of the default: `count` frames evenly spaced across the layer, plus the click frame.",
    required: false,
};
const secondsPerFrameParam = {
    name: "secondsPerFrame",
    type: "number",
    description: `Settle time to allow each frame, s (default ${CUTOUT_SECONDS_PER_FRAME}; measured 20 to 40 s a frame the first time on a 2176 x 3840 take). Frames are split over several renders when one cannot hold them (600 s a render).`,
    required: false,
};
const overParam = {
    name: "over",
    type: "string",
    description: `The flat colour of the picture (default '${CUTOUT_OVER}').`,
    required: false,
};
registerOp({
    name: "subject.check",
    category: "subject",
    description: "Proof a subject matte after the user says done, before anything else is built. Renders the cut-out with its alpha (ae_render_frame isolate, channels 'rgba') at the click frames and frames across the clip, " +
        "finds holes (regions below opaque the frame edge cannot reach) and openings (regions closed off only by the subject and the frame edge: the missed microphone of 2026-11-11 ran off the bottom of the frame), draws each frame over a flat colour and one contact sheet, and returns " +
        "picture (the sheet), findings, accepted, checked {frames, of}, inOut (a plain statement of what is in and what is out), frames, clicks and stop. " +
        `A hole or opening of holeLimit px or more (default ${CUTOUT_HOLE_LIMIT}, at the comp's size) is a finding; so are frames that did not render (kind 'not-checked': a frame that was not rendered is never counted as clean) and two clicks close together. ` +
        "With stop true: show the user the picture and say what is out before doing anything else. `accept` entries (earlier findings the user called fine, such as a real gap between an arm and the body) are not counted again. " +
        "Each frame with a finding is rendered once more at the end; a frame whose cut-out differs between the two renders is a finding of kind 'unstable' (seen once on 2026-11-11, cause unknown; agreement may come from the cache and does not prove a frame stable). " +
        "A selection count is not a check. It can take minutes: 20 to 40 s a frame the first time on a 2176 x 3840 take; say so to the user before it runs.",
    params: [
        ...compLayerParams,
        {
            name: "outDir",
            type: "string",
            description: "Absolute folder for the pictures.",
            required: true,
        },
        {
            name: "clickFrame",
            type: "number",
            description: "A comp frame to look at as well. The selections' own click frames are always looked at.",
            required: false,
        },
        frameListParam,
        {
            name: "count",
            type: "number",
            description: `How many frames across the layer (default ${CUTOUT_FRAMES}).`,
            required: false,
        },
        {
            name: "holeLimit",
            type: "number",
            description: `Smallest hole or opening that is a finding, px at the comp's size (default ${CUTOUT_HOLE_LIMIT}).`,
            required: false,
        },
        {
            name: "accept",
            type: "array",
            description: "Findings the user has seen and called fine, so a later run does not stop on them: each a box {x, y, width, height} (it accepts an opening) or { box, kind: 'hole' | 'opening' }. A finding is accepted only by an entry of its kind whose box overlaps its own by at least half their union; a hole inside an accepted opening's box is not accepted.",
            required: false,
        },
        {
            name: "recheck",
            type: "boolean",
            description: "Render each frame with a hole or opening over the limit once more at the end and report a frame that differs (kind 'unstable'). Default true; false skips it.",
            required: false,
        },
        secondsPerFrameParam,
        overParam,
        subjectIndexParam,
    ],
    toJsx: () => NODE_ONLY("subject.check"),
    run: (args, transport) => runSubjectCheck(args, liveCutoutIO(args, transport)),
});
registerOp({
    name: "subject.fill_gaps",
    category: "subject",
    description: "Fill enclosed gaps in a subject matte that no click fills (a gap in a microphone's shock mount with the shirt behind it): reads the matte at one reference frame at the comp's size, keeps the regions below opaque that the frame edge cannot reach (openings are never filled), drops those under minArea (default 20 px), grows the rest by `grow` px (default 3), " +
        "writes them as a still (stillPath), and adds a copy of the same footage under the cut-out showing only through that still (luma track matte). It then renders the fill layer alone and undoes the build when that covers more than the mask, and measures holes and openings again across the clip. " +
        "Refuses, building nothing, when the reference frame does not render. Limits, stated in the result: one reference frame, so it assumes a locked camera and a prop that does not move; what shows through is whatever is behind the gap. `only` boxes fill just the gaps they touch. " +
        "Can take minutes, as subject.check does (180 s on the take). Verified in After Effects 27.0 on one take (2026-11-11): the layers, the luma track matte, a switched-off mask that still mattes, and the measurements after; undoing the build when the fill covers too much is not verified there. The fill copy's audio is switched off (audioOff) so the sound does not play twice.",
    params: [
        ...compLayerParams,
        {
            name: "stillPath",
            type: "string",
            description: "Absolute .png path for the gap mask, kept with the project (the comp uses it).",
            required: true,
        },
        {
            name: "frame",
            type: "number",
            description: "Reference comp frame (default: the layer's first frame; use the click frame).",
            required: false,
        },
        {
            name: "minArea",
            type: "number",
            description: "Smallest gap filled, px (default 20).",
            required: false,
        },
        {
            name: "grow",
            type: "number",
            description: "Grow each gap by this many px (default 3).",
            required: false,
        },
        {
            name: "only",
            type: "array",
            description: "Boxes {x, y, width, height} in comp pixels: fill only the gaps they touch (from subject.check's findings).",
            required: false,
        },
        {
            name: "outDir",
            type: "string",
            description: "Absolute folder for the measuring renders (default: the still's folder).",
            required: false,
        },
        frameListParam,
        {
            name: "count",
            type: "number",
            description: `How many frames to measure after the fill (default ${CUTOUT_FRAMES}).`,
            required: false,
        },
        {
            name: "holeLimit",
            type: "number",
            description: `Smallest hole or opening reported after the fill, px (default ${CUTOUT_HOLE_LIMIT}).`,
            required: false,
        },
        secondsPerFrameParam,
        overParam,
        subjectIndexParam,
    ],
    toJsx: () => NODE_ONLY("subject.fill_gaps"),
    run: (args, transport) => runFillGaps(args, liveCutoutIO(args, transport)),
});
//# sourceMappingURL=keying.js.map