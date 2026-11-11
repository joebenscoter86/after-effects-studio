// Keying operations (agent-eyes plan, stage 6): Keylight from measured values,
// its views, and the cleanup effects after it. Every effect and property is
// addressed by matchName, never by display name. Match names, defaults, ranges
// and the eleven view numbers are the ones After Effects 2027 reported live
// (2026-11-10, an 8 bpc project with no working space). Every write goes
// through AE.checkPropertyWrite (stage 5) for all values first, so a refused
// value means nothing was written.
import { registerOp, jsxFail, jsxVal, jsxCompLayerPreamble } from "../registry.js";
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
//# sourceMappingURL=keying.js.map