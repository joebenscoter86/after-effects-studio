// Subject operations, motion edge: subject.motion_edge.
// A sibling of subject.soften_edge (keying-subject-soften.ts); keying.ts registers it after the soft edge.
//
// Object Matte cuts a moving hand hard: the motion blur in the take is lost. A
// per-pixel machine-learning keyer effect, installed separately, keeps that
// blur but alone half-keeps green things near the subject and fills small
// gaps. This builds, around the matted layer, the crisp Object Matte outline
// over the keyer's edge, the keyer showing only in a band round the outline
// where the take moves from one frame to the next. Built by hand and judged on
// a 4K studio take (2026-11-16); the defaults are MOTION_EDGE_DEFAULTS.
import { registerOp, jsxVal, jsxCompLayerPreamble } from "../registry.js";
import { MOTION_EDGE_DEFAULTS, OBJECT_MATTE_MATCH_NAME, compLayerParams, cutoutMovieUndoGuardJsx, liveCutoutIO, needSelection, otherEdgeError, since, } from "./keying-shared.js";
export const MOTION_EDGE_COST = "The motion edge keys every frame twice, with Object Matte and with the separately installed keyer, so a render does twice the keying work: the whole 8.9 s studio take (2176 × 3840, 30 fps) rendered in 986 s to ProRes 4444, roughly 2 minutes of render per second of 4K.";
const MOTION_MARKER = "motion-edge";
// The stock effects' property match names. The effects themselves are added by match name, and
// the track mattes and the Difference blend are set through After Effects' enums, which do not
// depend on the language. The property match names are not yet confirmed in After Effects: the
// English names are the fallback, so the motion edge is confirmed only on English After Effects.
const LEVELS = (t) => [
    ["ADBE Easy Levels2-0003", "Input Black", t.black],
    ["ADBE Easy Levels2-0004", "Input White", t.white],
];
const MINIMAX = (m) => [
    ["ADBE Minimax-0002", "Radius", m.radius],
    ...(m.channel === undefined ? [] : [["ADBE Minimax-0003", "Channel", m.channel]]),
    ...(m.dontShrink === undefined
        ? []
        : [["ADBE Minimax-0005", "Don't Shrink Edges", m.dontShrink]]),
];
const BOX_BLUR = (radius, iterations) => [
    ["ADBE Box Blur2-0001", "Blur Radius", radius],
    ["ADBE Box Blur2-0002", "Iterations", iterations],
];
/** The settings from the call's arguments, with the defaults filled in; or why they are refused. */
export function motionEdgeSettings(args) {
    const D = MOTION_EDGE_DEFAULTS;
    const fail = (error) => ({ ok: false, error });
    const isNum = (v) => typeof v === "number" && Number.isFinite(v);
    if (typeof args.keyerMatchName !== "string" || args.keyerMatchName.trim() === "")
        return fail("`keyerMatchName` must be the match name of the keyer effect (a per-pixel machine-learning keyer installed separately): ask the user which keyer they have, and read its match name from the effect on a layer (ae_layer_info) or from app.effects");
    const keyerSettings = {};
    if (args.keyerSettings !== undefined) {
        const ks = args.keyerSettings;
        if (typeof ks !== "object" || ks === null || Array.isArray(ks))
            return fail('`keyerSettings` must be an object of { property name: value }, such as { "Despill Strength": 1 }');
        for (const [k, v] of Object.entries(ks)) {
            if (typeof v === "boolean")
                keyerSettings[k] = v ? 1 : 0;
            else if (isNum(v))
                keyerSettings[k] = v;
            else if (Array.isArray(v) && v.length > 0 && v.every(isNum))
                keyerSettings[k] = v;
            else
                return fail(`\`keyerSettings\`: '${k}' must be a number, a boolean or an array of numbers`);
        }
    }
    let threshold = { ...D.threshold };
    if (args.threshold !== undefined) {
        const t = args.threshold;
        if (typeof t !== "object" || t === null || Array.isArray(t))
            return fail("`threshold` must be { black, white }, each 0 to 1");
        for (const k of ["black", "white"])
            if (t[k] !== undefined && !isNum(t[k]))
                return fail(`\`threshold.${k}\` must be a number from 0 to 1`);
        threshold = {
            black: isNum(t.black) ? t.black : D.threshold.black,
            white: isNum(t.white) ? t.white : D.threshold.white,
        };
    }
    if (threshold.black < 0 || threshold.white > 1 || threshold.black >= threshold.white)
        return fail(`\`threshold\` must have 0 <= black < white <= 1 (given black ${threshold.black}, white ${threshold.white}; default ${D.threshold.black} to ${D.threshold.white})`);
    const size = (k, min) => {
        const v = args[k];
        if (v === undefined)
            return D[k];
        if (!isNum(v) || v < min)
            return null;
        return v;
    };
    const motionGrow = size("motionGrow", 0);
    if (motionGrow === null)
        return fail("`motionGrow` must be a number of pixels, 0 or more");
    const motionBlur = size("motionBlur", 0);
    if (motionBlur === null)
        return fail("`motionBlur` must be a number of pixels, 0 or more");
    const band = args.band === undefined ? D.band : isNum(args.band) && args.band > 0 ? args.band : null;
    if (band === null)
        return fail("`band` must be a number of pixels, more than 0");
    return {
        ok: true,
        settings: {
            keyerMatchName: args.keyerMatchName.trim(),
            keyerSettings,
            threshold,
            motionGrow,
            motionBlur,
            band,
        },
    };
}
/**
 * JSX: refuse unless an installed effect has the keyer's match name (app.effects).
 * Leaves `_keyerName`, the effect's display name, for the code after it.
 */
export function motionKeyerCheckJsx(matchName) {
    return `
            var _keyerMN = ${jsxVal(matchName)};
            var _keyerName = null;
            var _fxList = null;
            try { _fxList = app.effects; } catch (eFx) { _fxList = null; }
            if (!_fxList) return { ok: false, error: "could not read the installed effects (app.effects), so the keyer '" + _keyerMN + "' could not be checked" };
            for (var _ei = 0; _ei < _fxList.length; _ei++) if (_fxList[_ei] && _fxList[_ei].matchName === _keyerMN) { _keyerName = _fxList[_ei].displayName; break; }
            if (_keyerName === null) return { ok: false, error: "no installed effect has the match name '" + _keyerMN + "' (" + _fxList.length + " effects installed). subject.motion_edge needs a per-pixel machine-learning keyer effect installed separately: install it, or pass the match name of the keyer that is installed." };
`;
}
/**
 * JSX: build the motion edge around the matted layer. Five comps, none of them
 * a copy of the user's comp:
 *  - "<layer> object matte": a copy of the matted layer as clicked (it keeps the selections);
 *  - "<layer> keyer": a copy of the take with every effect taken off and the keyer on;
 *  - "<layer> motion": the take, the take again one frame later in Difference, and an
 *    adjustment layer with Levels (the threshold), Tint, Minimax (motionGrow) and Box Blur (motionBlur);
 *  - "<layer> band": the Object Matte comp with Minimax on its alpha (band, Don't Shrink
 *    Edges), Luma-matted by the motion comp;
 *  - "<layer> motion edge": the Object Matte outline over the band (switched off) over the
 *    keyer's edge, which takes the band as its Alpha matte.
 * The last goes into the comp above the matted layer, which is switched off and otherwise
 * untouched (it keeps the sound); every copy's sound is off.
 */
export function motionEdgeBuildJsx(args) {
    const D = MOTION_EDGE_DEFAULTS;
    const settings = {
        keyerMatchName: args.keyerMatchName,
        keyerSettings: args.keyerSettings,
        threshold: args.threshold,
        motionGrow: args.motionGrow,
        motionBlur: args.motionBlur,
        band: args.band,
    };
    // The keyer lookup embeds the match name through jsxVal.
    const keyerCheck = motionKeyerCheckJsx(args.keyerMatchName);
    return `
            ${jsxCompLayerPreamble(args)}
            var _L = _layer.name;
            var _name = _L + " motion edge";
            for (var _li = 1; _li <= _comp.numLayers; _li++) if (_comp.layer(_li).name === _name) return { ok: false, error: "comp " + _comp.name + " already has a layer '" + _name + "'; undo it first (subject.motion_edge { undo: true })" };
            ${keyerCheck}
            var _fxRoot = _layer.property("ADBE Effect Parade");
            var _hasOm = false;
            if (_fxRoot) for (var _fi = 1; _fi <= _fxRoot.numProperties; _fi++) if (_fxRoot.property(_fi).matchName === ${jsxVal(OBJECT_MATTE_MATCH_NAME)}) { _hasOm = true; break; }
            if (!_hasOm) return { ok: false, error: "layer '" + _L + "' has no Object Matte" };
            function _find(fx, key) {
                var p = null;
                try { p = fx.property(key); } catch (eP) { p = null; }
                if (p) return p;
                function walk(g) {
                    for (var k = 1; k <= g.numProperties; k++) {
                        var q = g.property(k);
                        if (q.matchName === key || q.name === key) return q;
                        if (q.propertyType !== PropertyType.PROPERTY) { var r = walk(q); if (r) return r; }
                    }
                    return null;
                }
                return walk(fx);
            }
            function _setAll(fx, vals, what) {
                for (var k in vals) {
                    if (!vals.hasOwnProperty(k)) continue;
                    var p = _find(fx, k);
                    if (!p) throw new Error(what + " has no property '" + k + "'");
                    p.setValue(vals[k]);
                }
            }
            // Stock effects: each property as [match name, English name, value]. The match name is tried first and works
            // in any language; the English name is the fallback when After Effects does not know the match name. The property
            // match names are not yet confirmed in After Effects: where the English name finds a different property than the
            // match name, the English one is set (the match name is wrong) and the pair is reported in matchNameMismatch.
            var _mismatch = [];
            function _setEach(fx, list, what) {
                for (var k = 0; k < list.length; k++) {
                    var ent = list[k];
                    var pm = _find(fx, ent[0]);
                    var pn = _find(fx, ent[1]);
                    var p = pm ? pm : pn;
                    if (pm && pn && pm.matchName !== pn.matchName) { p = pn; _mismatch.push(what + ": '" + ent[0] + "' is '" + pm.name + "', not '" + ent[1] + "' (" + pn.matchName + ")"); }
                    if (!p) throw new Error(what + " has no property '" + ent[0] + "' ('" + ent[1] + "')");
                    p.setValue(ent[2]);
                }
            }
            function _strip(l) { var r = l.property("ADBE Effect Parade"); for (var i = r.numProperties; i >= 1; i--) r.property(i).remove(); }
            function _mute(l) { if (AE.safeGet(function () { return l.hasAudio; }, false)) { try { l.audioEnabled = false; } catch (eA) {} } }
            function _pre(indices, name) {
                var pc = _comp.layers.precompose(indices, name, true);
                for (var i = 1; i <= _comp.numLayers; i++) if (AE.safeGet(function () { return _comp.layer(i).source; }, null) === pc) return { comp: pc, layer: _comp.layer(i) };
                throw new Error("the precomp layer of '" + name + "' was not found after precompose");
            }
            function _newComp(name) { return app.project.items.addComp(name, _comp.width, _comp.height, _comp.pixelAspect, _comp.duration, _comp.frameRate); }
            var _wasEnabled = _layer.enabled;
            var _fd = _comp.frameDuration;
            // The Object Matte comp: the matted layer as clicked.
            var _om = _layer.duplicate(); _om.name = _L + " object matte"; _om.enabled = true; _mute(_om);
            var _omP = _pre([_om.index], _L + " object matte");
            // The keyer comp: the take with the keyer and nothing else.
            var _ck = _layer.duplicate(); _ck.name = _L + " keyer"; _ck.enabled = true; _mute(_ck); _strip(_ck);
            if (!_ck.property("ADBE Effect Parade").addProperty(_keyerMN)) throw new Error("the keyer '" + _keyerMN + "' could not be added to the layer");
            _setAll(_ck.property("ADBE Effect Parade").property(1), ${jsxVal(args.keyerSettings)}, "the keyer");
            var _ckP = _pre([_ck.index], _L + " keyer");
            // The motion comp: the take against itself one frame later, thresholded, grown and blurred.
            var _t0 = _layer.duplicate(); _t0.name = _L + " this frame"; _t0.enabled = true; _mute(_t0); _strip(_t0);
            var _t1 = _layer.duplicate(); _t1.name = _L + " frame before"; _t1.enabled = true; _mute(_t1); _strip(_t1);
            _t1.startTime = _t1.startTime + _fd;
            _t1.blendingMode = BlendingMode.DIFFERENCE;
            var _adj = _comp.layers.addSolid([1, 1, 1], _L + " motion threshold", _comp.width, _comp.height, _comp.pixelAspect, _comp.duration);
            _adj.adjustmentLayer = true;
            var _ap = _adj.property("ADBE Effect Parade");
            _ap.addProperty("ADBE Easy Levels2");
            _ap.addProperty("ADBE Tint");
            _ap.addProperty("ADBE Minimax");
            _ap.addProperty("ADBE Box Blur2");
            // Adding an effect invalidates references to the ones added before: fetch each again by index.
            _ap = _adj.property("ADBE Effect Parade");
            _setEach(_ap.property(1), ${jsxVal(LEVELS(args.threshold))}, "Levels");
            _setEach(_ap.property(3), ${jsxVal(MINIMAX({ radius: args.motionGrow }))}, "Minimax");
            _setEach(_ap.property(4), ${jsxVal(BOX_BLUR(args.motionBlur, D.motionBlurIterations))}, "Box Blur");
            _t1.moveBefore(_t0); _adj.moveBefore(_t1);
            var _moP = _pre([_adj.index, _t1.index, _t0.index], _L + " motion");
            // The band: the Object Matte grown, where the take moves.
            var _bandC = _newComp(_L + " band");
            var _bOm = _bandC.layers.add(_omP.comp); _bOm.name = "Object Matte grown";
            var _bMo = _bandC.layers.add(_moP.comp); _bMo.name = "motion";
            _bOm.property("ADBE Effect Parade").addProperty("ADBE Minimax");
            _setEach(_bOm.property("ADBE Effect Parade").property(1), ${jsxVal(MINIMAX({ radius: args.band, channel: D.bandChannel, dontShrink: 1 }))}, "Minimax");
            _bOm.setTrackMatte(_bMo, TrackMatteType.LUMA);
            _bMo.enabled = false;
            // The motion edge, top to bottom: the outline, the band, the keyer's edge.
            var _me = _newComp(_name);
            var _eCk = _me.layers.add(_ckP.comp); _eCk.name = "keyer edge";
            var _eBand = _me.layers.add(_bandC); _eBand.name = "band";
            var _eOm = _me.layers.add(_omP.comp); _eOm.name = "Object Matte outline";
            _eCk.setTrackMatte(_eBand, TrackMatteType.ALPHA);
            _eBand.enabled = false;
            // precompose left a layer of each part in the comp: only the motion edge stays.
            _omP.layer.remove(); _ckP.layer.remove(); _moP.layer.remove();
            var _pl = _comp.layers.add(_me);
            _pl.name = _name;
            var _ids = [_me.id, _bandC.id, _moP.comp.id, _ckP.comp.id, _omP.comp.id];
            function _q(t) { var o = ""; for (var i = 0; i < t.length; i++) { var ch = t.charAt(i); if (ch === '"' || ch === '\\\\') o += '\\\\'; o += ch; } return '"' + o + '"'; }
            _pl.comment = "{" + '"compRoom":"${MOTION_MARKER}","layer":' + _q(String(_L)) + ',"wasEnabled":' + _wasEnabled + ',"comps":[' + _ids.join(",") + '],"settings":' + ${jsxVal(JSON.stringify(settings))} + "}";
            var _parts = [_me, _bandC, _moP.comp, _ckP.comp, _omP.comp];
            for (var _pi = 0; _pi < _parts.length; _pi++) _parts[_pi].comment = "comp-room ${MOTION_MARKER} of " + _L;
            _pl.moveBefore(_layer);
            _pl.enabled = true;
            _layer.enabled = false;
            return { ok: true, motionLayer: _name, motionIndex: _pl.index, precomp: _me.name, precompId: _me.id, wasEnabled: _wasEnabled,
                keyer: { matchName: _keyerMN, name: _keyerName },
                comps: { motionEdge: _me.name, band: _bandC.name, motion: _moP.comp.name, keyer: _ckP.comp.name, objectMatte: _omP.comp.name },
                inside: ["Object Matte outline", "band", "keyer edge"], matchNameMismatch: _mismatch };
        `;
}
/** JSX: remove what motionEdgeBuildJsx made and switch the matted layer back as it was. */
export function motionEdgeUndoJsx(args) {
    return `
            ${jsxCompLayerPreamble(args)}
            var _name = _layer.name + " motion edge";
            var _pl = null;
            for (var _li = 1; _li <= _comp.numLayers; _li++) {
                var _l = _comp.layer(_li);
                if (_l.name === _name && String(AE.safeGet(function () { return _l.comment; }, "")).indexOf(${jsxVal(MOTION_MARKER)}) >= 0) { _pl = _l; break; }
            }
            if (!_pl) return { ok: false, error: "comp " + _comp.name + " has no motion edge for layer '" + _layer.name + "'" };
            ${cutoutMovieUndoGuardJsx("motion edge")}
            var _st = null;
            try { _st = eval("(" + _pl.comment + ")"); } catch (eJ) { _st = null; }
            var _was = !(_st && _st.wasEnabled === false);
            var _ids = (_st && _st.comps && _st.comps.length) ? _st.comps : [_pl.source.id];
            var _comps = [];
            for (var _ii = 0; _ii < _ids.length; _ii++) {
                var _it = AE.safeGet(function () { return app.project.itemByID(_ids[_ii]); }, null);
                if (_it && _it instanceof CompItem && String(AE.safeGet(function () { return _it.comment; }, "")).indexOf(${jsxVal(MOTION_MARKER)}) >= 0) _comps.push(_it);
            }
            var _solids = [];
            for (var _ci = 0; _ci < _comps.length; _ci++)
                for (var _k = 1; _k <= _comps[_ci].numLayers; _k++) {
                    var _src = AE.safeGet(function () { return _comps[_ci].layer(_k).source; }, null);
                    if (_src && _src.mainSource && _src.mainSource instanceof SolidSource) _solids.push(_src);
                }
            _pl.remove();
            var _removed = [_name];
            for (var _ri = 0; _ri < _comps.length; _ri++) { var _cn = _comps[_ri].name; try { _comps[_ri].remove(); _removed.push("comp " + _cn); } catch (eC) {} }
            for (var _si = 0; _si < _solids.length; _si++) { try { if (_solids[_si].usedIn.length === 0) { _solids[_si].remove(); _removed.push("solid"); } } catch (eS) {} }
            _layer.enabled = _was;
            return { ok: true, removed: _removed, restored: _layer.name, enabled: _layer.enabled };
        `;
}
export async function runMotionEdge(args, io) {
    const started = performance.now();
    if (args.undo === true) {
        const u = await io.execute(motionEdgeUndoJsx({ comp: args.comp, layer: args.layer }), {
            label: "subject.motion_edge undo",
            timeoutMs: 60_000,
        });
        return u?.ok
            ? { ...u, note: "The comp is back to the single matted layer." }
            : { ok: false, error: u?.error ?? "the undo failed" };
    }
    const s = motionEdgeSettings(args);
    if (!s.ok)
        return s;
    const settings = s.settings;
    const st = await io.status();
    if (!st?.ok)
        return { ok: false, error: st?.error ?? "subject.status failed", status: st };
    const missing = needSelection(st);
    if (missing)
        return { ok: false, error: missing };
    if (st.softEdge)
        return { ok: false, error: otherEdgeError("soft", String(st.softEdge.layer)) };
    const built = await io.execute(motionEdgeBuildJsx({ comp: args.comp, layer: args.layer, ...settings }), { label: "subject.motion_edge", timeoutMs: 120_000 });
    if (!built?.ok)
        return { ok: false, error: built?.error ?? "the build failed", built };
    return {
        ...built,
        ok: true,
        settings,
        cost: MOTION_EDGE_COST,
        undo: "subject.motion_edge { comp, layer, undo: true } takes the comp back to the single matted layer (it removes the motion-edge layer and its five comps and switches the matted layer back on).",
        next: "Render a few frames where the hands move fastest and a still one (ae_render_frame over the background) and show the user the hands at twice size: a soft blur on the moving fingers, the crisp outline where the subject is still, nothing of the background near the head, gaps still open. subject.check, subject.render_cutout and subject.use_cutout now use the motion-edge layer in place of the matted layer (switched off): subject.check reads the keyer's soft alpha on moving parts as expected and stops only on clear holes; subject.render_cutout renders the motion-edge layer to a movie with alpha (check it with subject.check_file); subject.use_cutout puts the movie above it and switches it off.",
        timing: { totalMs: Math.round(since(started)) },
    };
}
registerOp({
    name: "subject.motion_edge",
    category: "subject",
    description: "Give an Object Matte cut-out a soft, motion-blurred edge where the subject moves, taken from a second key by a per-pixel machine-learning keyer effect installed separately (not part of After Effects or this plugin); where the subject is still, the crisp Object Matte outline stays. Needs the matted layer with at least one selection (the user's click) and `keyerMatchName`, the keyer's match name; it refuses, building nothing, when no installed effect has that match name (app.effects). " +
        "It builds five comps around the matted layer, never a copy of the user's comp: '<layer> object matte' (the matted layer as clicked), '<layer> keyer' (the take with the keyer and `keyerSettings`, such as { \"Despill Strength\": 1 }), '<layer> motion' (the take, the take again one frame later in Difference, and an adjustment layer with Levels from `threshold` black to white, Tint, Minimax `motionGrow` and Box Blur `motionBlur`, 2 iterations), '<layer> band' (the Object Matte comp with Minimax `band` px on its alpha, Don't Shrink Edges on, Luma-matted by the motion comp) and '<layer> motion edge' (the Object Matte outline over the band, switched off, over the keyer's edge, Alpha-matted by the band). The last goes in above the matted layer, which is switched off and otherwise untouched (it keeps the sound); every copy's sound is off. " +
        "Use it instead of subject.soften_edge for fast hand and arm movement against a static background: soften_edge softens the hair inside a region, this follows motion anywhere. Defaults measured on a 2176 × 3840 studio take shot on a phone on a tripod: threshold 0.25 to 0.45 (lower thresholds lit every still edge, since the camera shifts slightly between frames), motionGrow 25, motionBlur 15, band 50. A plain band with no motion mask filled the gaps in a microphone mount, brought back the keyer's halo and let a plant behind the head through. " +
        "Cost: twice the keying work in every render (Object Matte and the keyer): the whole 8.9 s take rendered in 986 s, roughly 2 minutes of render per second of 4K. It does not render or check itself; subject.check, subject.render_cutout and subject.use_cutout use its layer in place of the matted one. Confirmed only on English After Effects: some stock effect settings are found by their English names when their match names are not. On the layer's first frame there is no frame before, so the band there covers the whole outline. Not run in After Effects as an operation: the construction was built by hand. undo: true removes what it built and switches the matted layer back on.",
    params: [
        ...compLayerParams,
        {
            name: "keyerMatchName",
            type: "string",
            description: "Match name of the keyer effect, a per-pixel machine-learning keyer installed separately (needed unless undo). Refused when no installed effect has it.",
            required: false,
        },
        {
            name: "keyerSettings",
            type: "object",
            description: 'Values to set on the keyer, { property name or match name: value }, such as { "Despill Strength": 1 }. A name the keyer does not have stops the build, which is rolled back.',
            required: false,
        },
        {
            name: "threshold",
            type: "object",
            description: `Levels on the difference of neighbouring frames, { black, white } 0 to 1 (default ${MOTION_EDGE_DEFAULTS.threshold.black} to ${MOTION_EDGE_DEFAULTS.threshold.white}). Lower values let more motion through, and with a camera that shifts slightly, every still edge.`,
            required: false,
        },
        {
            name: "motionGrow",
            type: "number",
            description: `Minimax radius on the motion, px (default ${MOTION_EDGE_DEFAULTS.motionGrow}).`,
            required: false,
        },
        {
            name: "motionBlur",
            type: "number",
            description: `Box Blur radius on the motion, px, ${MOTION_EDGE_DEFAULTS.motionBlurIterations} iterations (default ${MOTION_EDGE_DEFAULTS.motionBlur}).`,
            required: false,
        },
        {
            name: "band",
            type: "number",
            description: `How far outside the Object Matte outline the keyer's edge may show, px: Minimax on the matte's alpha (default ${MOTION_EDGE_DEFAULTS.band}).`,
            required: false,
        },
        {
            name: "undo",
            type: "boolean",
            description: "Take the comp back to the single matted layer: remove the motion-edge layer and its five comps and switch the matted layer back on.",
            required: false,
        },
    ],
    toJsx() {
        return "throw new Error('subject.motion_edge runs in Node');";
    },
    async run(args, transport) {
        const cut = liveCutoutIO(args, transport);
        return runMotionEdge(args, {
            status: cut.status,
            async execute(code, opts) {
                const r = await transport.execute({
                    code,
                    label: opts.label,
                    timeoutMs: opts.timeoutMs ?? 60_000,
                    undoGroup: true,
                    suppressDialogs: true,
                });
                return r.ok ? r.result : { ok: false, error: r.error ?? `${opts.label} failed` };
            },
        });
    },
});
//# sourceMappingURL=keying-subject-motion.js.map