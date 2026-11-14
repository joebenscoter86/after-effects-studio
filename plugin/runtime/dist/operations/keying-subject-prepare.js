// Subject operations, prepare and settings: subject.prepare, subject.status, subject.settings, subject.remove_selection.
// Moved whole from keying.ts (which still registers them, in their order, and re-exports what it exported).
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { registerOp, jsxFail, jsxVal, jsxCompLayerPreamble, getOp } from "../registry.js";
import { CLOSE_CLICK_SHARE, COUNT_NOTE, FX_ROOT_JSX, GB, NEED_CLICK, OBJECT_MATTE_MATCH_NAME, OBJECT_MATTE_SELECTIONS_MATCH_NAME, SUBJECT_WHOLE_PIECE_NOTE, aeCacheRoot, cacheBytesFor, compLayerParams, gb, plural, statfsFree, subjectIndexParam } from "./keying-shared.js";
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
        doc: "Decontaminate Edge Colors: true takes the background's colour out of the edge. On green-screen footage it moved the edge's green excess from -0.0005 to -0.009; turn it on when ae_render_frame's edge report shows the edge leaning to the screen colour. With no green screen, on the half-size take, it took the wall's colour in the hair's edge from 56% to 38% at the top and 23% at the side (look edgeColour against the wall), with no change to the alpha: the default for an Object Matte cut-out (keying.md Recipe 3)",
    },
};
/**
 * For the agent, on the cut-out operations' descriptions and results: the
 * click cannot be made unattended (first production use, 2026-11-12: a piece
 * meant to run overnight still needed it).
 */
export const SUBJECT_ATTENDED_NOTE = "The cut-out needs the user's own click in After Effects (the Object Matte Tool); no script can make it, so it cannot be done unattended. " +
    "Get the click, and check it with subject.check, before the user leaves: an overnight or unattended run cannot start a cut-out, only carry on from one the user has clicked.";
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
        `Anything else that should stay in the cut-out, such as a microphone, can be several pieces: hover each piece, check that it tints magenta, and click it. A gap between things, such as between a stand and an arm, needs no click: I take care of gaps afterwards. Do not click ${subject} again.`,
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
const REMOVE_NOTE = "To take out one wrong selection (a second click that landed on the subject, an 'Add Object Rect' from a click that dragged): subject.remove_selection { comp, layer, selection }. " +
    "To start the whole selection again: remove this Object Matte with effect.remove { comp, layer, effectIndex }, run subject.prepare, and ask the user for the click again. " +
    "The user can also take one thing out by Option-clicking it with the Object Matte Tool.";
registerOp({
    name: "subject.prepare",
    category: "subject",
    description: "Get a footage layer ready for the one manual step of a subject matte (After Effects 2027's Object Matte, the old Roto Brush): the user clicks the subject once with the Object Matte Tool; a script cannot make that selection. " +
        SUBJECT_ATTENDED_NOTE +
        " " +
        SUBJECT_WHOLE_PIECE_NOTE +
        " " +
        "This call brings the comp forward, chooses View > Resolution > Full and reads the comp's resolution back (viewerResolution: verified only when it reads [1, 1] after the command and after the Layer panel opens; starting from the viewer's Auto setting is not verified), moves to `time` (default: the layer's in point; pick a frame where the subject is clearly visible), selects only that layer and opens it in the Layer panel. It adds no effect and does not pick the tool. " +
        "Returns notice and steps (the user's instructions, with the clip's name and the subject filled in) and userMessage (both as one text): relay them to the user word for word. " +
        "Also returns did (the steps done), couldNotDo (any that failed, with the error; beforeSteps then says what to tell the user first) and existing (an Object Matte already on the layer and its selections). " +
        "Before any of that matters, read sourceAdvice and soundAdvice (or soundNote) when they are there. sourceAdvice: the layer's footage is at least 1.5 times the comp's size in both directions and scaled down to fit (a 2176 x 3840 take at 50% in a 1080 x 1920 comp); it gives the sizes, the disk cache a render needs at each, and the delivery-size copy to make and matte instead, before the click (replacing the footage under a matte freezes it), and relay then says not to give the steps yet. " +
        "soundAdvice: the file's sound has more than two channels, or After Effects reports none while the file has some (a four-channel take with the voice on the first read as silence, with no warning); it gives the ffmpeg line that extracts the voice to a mono WAV. The file is only read (ffprobe), never changed. " +
        "After the user says done, run subject.check before building anything. Verified in After Effects 27.0 on a real take, apart from the resolution step as written here; sourceAdvice and soundAdvice are worked out in Node from what After Effects reports and are tested offline.",
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
                const r = await transport.execute({ code, label: "subject.prepare", timeoutMs: 60_000 });
                return r.ok
                    ? r.result
                    : { ok: false, error: r.error ?? "subject.prepare failed" };
            },
            probeAudio: ffprobeAudio,
        });
    },
});
registerOp({
    name: "subject.status",
    category: "subject",
    readOnly: true,
    description: "Read a layer's subject matte (Object Matte, ADBE Samurai) without changing anything: whether the effect is there, its selections (name; kind 'object' for a click with the Object Matte Tool, 'Add Object N', 'quick-selection' for a stroke with the old brush, 'Quick Select Foreground N', 'other' otherwise; duration), " +
        "its settings (value, the range After Effects reports now, the range measured in After Effects 27.0, default, and foundBy: how the property was found, matchName, walk or name), and summary, one plain sentence ('no selection yet: the user has not clicked', '1 object selected'). " +
        "Also each selection's clicked point (Transform > Position, source pixels; compPoint in comp pixels where After Effects gives it), clickTime (the selection's Duration start: seconds, measured 0.49999667 for a click at frame 15) and clickFrame (comp frames), closeClicks (two clicks closer than 5% of the source's shorter side probably selected the same thing), sourceSize, compSize and span (the layer in comp frames). " +
        "A selection count is not a check: after the user says done, run subject.check. removeNote says how to take a selection out or start again. " +
        "disk: the size of After Effects' disk cache (its folder read from the Disk Cache preference) and the free space on that drive; diskNote, when that drive has under 10 GB free, says to purge it (Edit > Purge > All Memory & Disk Cache). Nothing is deleted and no preference changed.",
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
            timeoutMs: 30_000,
        });
        if (!r.ok)
            return { ok: false, error: r.error ?? "subject.status failed" };
        const st = r.result;
        if (!st?.ok)
            return st;
        st.disk = await diskReport(st.aeCache);
        if (st.disk?.note)
            st.diskNote = st.disk.note;
        return st;
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
/** Footage this many times the comp's size in both directions, scaled down at least as much, is matted at the delivery size instead. */
export const OVERSIZE_FACTOR = 1.5;
const even = (n) => Math.max(2, Math.round(n / 2) * 2);
const stemOf = (file) => path.join(path.dirname(file), path.basename(file, path.extname(file)));
const dims = (d) => `${d[0]} × ${d[1]}`;
/** When the layer's source is well over the comp's size and scaled down to fit: the numbers, and the copy to make before the click. */
export function sourceAdviceFor(f) {
    if (!f?.sourceSize || !f.compSize || !f.scale)
        return null;
    const [sw, sh] = f.sourceSize;
    const [cw, ch] = f.compSize;
    const [sx, sy] = f.scale.map((v) => Math.abs(v));
    const big = sw >= OVERSIZE_FACTOR * cw && sh >= OVERSIZE_FACTOR * ch;
    const shrunk = sx > 0 && sy > 0 && sx <= 100 / OVERSIZE_FACTOR && sy <= 100 / OVERSIZE_FACTOR;
    if (!big || !shrunk)
        return null;
    const delivery = [even((sw * sx) / 100), even((sh * sy) / 100)];
    const frames = typeof f.frames === "number" && f.frames > 0 ? f.frames : null;
    const atSource = frames ? cacheBytesFor(frames, [sw, sh]) : null;
    const atDelivery = frames ? cacheBytesFor(frames, delivery) : null;
    const ratio = Math.round(((sw * sh) / (delivery[0] * delivery[1])) * 10) / 10;
    const copy = f.file
        ? `ffmpeg -i "${f.file}" -vf "scale=${delivery[0]}:${delivery[1]}:flags=lanczos" -c:v prores_ks -profile:v 3 -c:a pcm_s16le "${stemOf(f.file)}_${delivery[0]}x${delivery[1]}.mov"`
        : null;
    const cache = atSource !== null && atDelivery !== null
        ? `about ${gb(atSource)} of After Effects disk cache a render of the ${frames} frames at this size (an estimate; 19 GB was measured for 320 frames of a 2176 × 3840 take) against about ${gb(atDelivery)} at ${dims(delivery)}`
        : `about ${ratio} times the disk cache a render needs at ${dims(delivery)}`;
    return {
        sourceSize: [sw, sh],
        compSize: [cw, ch],
        scale: [sx, sy],
        deliverySize: delivery,
        frames,
        cacheAtSource: atSource,
        cacheAtDelivery: atDelivery,
        copy,
        reading: `This layer's footage is ${dims([sw, sh])}, shown at ${Math.round(sx)}% in a ${dims([cw, ch])} comp. ` +
            `Object Matte works on the footage's own pixels, ${ratio} times as many as the comp shows: ${cache}, and a render takes about that much longer ` +
            "(on one take of 320 frames: 279 to 390 s at 2176 × 3840 against 65 to 92 s at 1088 × 1920, with the same edge; the two cut-outs overlapped at 0.991). " +
            `Make a ${dims(delivery)} copy of the footage first and matte that: ` +
            (copy
                ? `with ffmpeg, \`${copy}\`; without it, render the footage alone from After Effects at that size (ProRes 422 HQ). `
                : "render the footage alone from After Effects at that size (ProRes 422 HQ). ") +
            "Import the copy, put it in the comp in this layer's place at 100% (same position and start time), switch this layer off, and run subject.prepare on the copy's layer. " +
            "Do it before the click: replacing the footage under a matte freezes the matte (the outline stops following the subject), so a copy made afterwards needs the click again.",
    };
}
/** Sound After Effects may read as silence: more than two channels, or audio in the file that After Effects does not report. */
export function soundAdviceFor(f, streams) {
    if (!f?.file)
        return {};
    if (streams === null)
        return f.hasAudio
            ? {
                soundNote: "I could not count the take's sound channels (ffprobe was not found or could not read the file). Takes with more than two channels have read as silence in After Effects with no warning: measure the take's sound now, and measure the delivered file's sound before calling the piece done.",
            }
            : {};
    const most = streams.reduce((m, st) => Math.max(m, st.channels || 0), 0);
    const unheard = streams.length > 0 && !f.hasAudio;
    if (most <= 2 && !unheard)
        return {};
    const layout = streams.find((st) => st.channels === most)?.layout;
    const extract = `ffmpeg -i "${f.file}" -map 0:a:0 -af "pan=mono|c0=c0" -c:a pcm_s16le "${stemOf(f.file)}_voice.wav"`;
    return {
        soundAdvice: {
            channels: most,
            streams,
            afterEffectsHasAudio: f.hasAudio,
            extract,
            reading: (unheard
                ? `The take's file has sound (${plural(most, "channel")}) that After Effects does not report for this footage. `
                : `The take's sound has ${most} channels${layout ? ` (${layout})` : ""}. `) +
                "A take with four channels and the voice on the first read as silence in After Effects, with no warning (seen on 2026-11-12). " +
                `Before the render, extract the voice to a mono WAV: \`${extract}\` (c0 is the first channel; listen to it, or measure each channel's level, to find the one with the voice, and change c0 if it is another). ` +
                "Import the WAV, put it in the comp over the layer's span, and switch the take's own audio off. Measure the delivered file's sound before calling the piece done.",
        },
    };
}
const FFPROBE = ["ffprobe", "/opt/homebrew/bin/ffprobe", "/usr/local/bin/ffprobe"];
/** The file's audio streams from ffprobe (only read), or null when ffprobe is missing or fails. */
async function ffprobeAudio(file) {
    for (const exe of FFPROBE) {
        const out = await new Promise((resolve) => {
            execFile(exe, [
                "-v",
                "error",
                "-select_streams",
                "a",
                "-show_entries",
                "stream=channels,channel_layout",
                "-of",
                "json",
                file,
            ], { timeout: 15_000 }, (err, stdout) => {
                if (err)
                    resolve({ missing: err.code === "ENOENT", stdout: null });
                else
                    resolve({ missing: false, stdout: String(stdout) });
            });
        });
        if (out.missing)
            continue;
        if (out.stdout === null)
            return null;
        try {
            const j = JSON.parse(out.stdout);
            return (j.streams ?? []).map((st) => ({
                channels: Number(st.channels) || 0,
                layout: st.channel_layout ?? null,
            }));
        }
        catch {
            return null;
        }
    }
    return null;
}
const PREPARE_HOLD = "Do not give the user the steps yet: tell the user what sourceAdvice says (the footage is much larger than the comp), make the delivery-size copy, then run subject.prepare on the copy's layer and relay its steps word for word. If the user wants to click on this footage anyway, relay notice and steps word for word (userMessage holds both).";
/** subject.prepare: the JSX that opens the layer for the click, then the footage and sound checks in Node. */
export async function runSubjectPrepare(args, io) {
    const op = getOp("subject.prepare");
    const res = await io.execute(op.toJsx(args));
    if (!res || typeof res !== "object" || !res.footage)
        return res;
    const f = res.footage;
    const source = sourceAdviceFor(f);
    const sound = f.file ? soundAdviceFor(f, await io.probeAudio(f.file)) : {};
    if (source) {
        res.sourceAdvice = source;
        res.relay = PREPARE_HOLD;
    }
    if (sound.soundAdvice)
        res.soundAdvice = sound.soundAdvice;
    if (sound.soundNote)
        res.soundNote = sound.soundNote;
    if (sound.soundAdvice || sound.soundNote)
        res.relay = `${res.relay} Sound: tell the user what ${sound.soundAdvice ? "soundAdvice" : "soundNote"} says, and deal with it before the render.`;
    res.attended = SUBJECT_ATTENDED_NOTE;
    res.wholePiece = SUBJECT_WHOLE_PIECE_NOTE;
    return res;
}
/** Below this on the drive After Effects caches to, subject.status says so: 10 GB. */
const LOW_FREE_BYTES = 10 * GB;
/** Total bytes under `root`, stopping after `budgetMs` (complete false then: at least that much). */
async function folderBytes(root, budgetMs = 5000) {
    const t0 = performance.now();
    let bytes = 0;
    const stack = [root];
    try {
        await fs.access(root);
    }
    catch {
        return null;
    }
    while (stack.length) {
        if (performance.now() - t0 > budgetMs)
            return { bytes, complete: false };
        const d = stack.pop();
        let entries = [];
        try {
            entries = await fs.readdir(d, { withFileTypes: true });
        }
        catch {
            continue;
        }
        for (const e of entries) {
            const p = path.join(d, e.name);
            if (e.isDirectory())
                stack.push(p);
            else if (e.isFile())
                bytes += await fs.stat(p).then((st) => st.size, () => 0);
        }
    }
    return { bytes, complete: true };
}
/**
 * The size of After Effects' disk cache and the free space on its drive, and
 * a note for the user when that drive is low. Reads only: nothing is deleted
 * and no preference is changed.
 */
export async function diskReport(cache, freeFn = statfsFree) {
    const cacheRoot = aeCacheRoot(cache?.folder, cache?.version);
    if (!cacheRoot)
        return {
            cacheRoot: null,
            cacheBytes: null,
            free: null,
            low: null,
            reading: "After Effects' disk cache folder could not be read from its preferences.",
        };
    const size = await folderBytes(cacheRoot);
    const free = await freeFn(cacheRoot);
    const low = free !== null && free < LOW_FREE_BYTES;
    const out = {
        cacheRoot,
        cacheBytes: size?.bytes ?? null,
        complete: size?.complete ?? null,
        free,
        low,
    };
    if (low)
        out.note =
            `Only ${gb(free)} free on the drive After Effects caches to (${cacheRoot}); its disk cache holds ${size ? gb(size.bytes) + (size.complete ? "" : " or more") : "an unknown amount"}. ` +
                "Object Matte work grows it past the Disk Cache size set in the preferences (about one 16-bit frame of the source for every frame it tracks through), and a render on a nearly full drive stalls. " +
                "Ask the user to purge it: Edit > Purge > All Memory & Disk Cache in After Effects. Nothing was deleted and no preference was changed.";
    return out;
}
//# sourceMappingURL=keying-subject-prepare.js.map