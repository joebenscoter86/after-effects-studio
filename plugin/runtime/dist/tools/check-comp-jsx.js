// The three scripts ae_check_comp runs inside After Effects (finish plan,
// stage 1). Everything else happens in Node.
//
//   planJsx       read-only: the comp's size, frame rate, work area and colour
//                 settings, and footage it uses that is missing.
//   captureJsx    one chunk of frames: saveFrameToPng at a reduced size
//                 (comp.resolutionFactor, set before and put back afterwards,
//                 also when the script throws), through AE's own display
//                 transform in a colour-managed project (_captureWithOcio,
//                 shared with ae_render_frame).
//   structureJsx  read-only: text layers whose bounds leave the frame (or a
//                 safe area) while visible, missing fonts and footage,
//                 expressions in error, and when something changes on each
//                 layer (for the idle report).
import { COMP_CORNERS_FN, LIST_MISSING_FONTS_FN, LIST_MISSING_FOOTAGE_FN, MISSING_SOURCES_FN, OCIO_CAPTURE_FN, RENDER_FRAME_FN, } from "../operations/snippets.js";
import { jsxVal } from "../registry.js";
/** Where inside a frame a capture is taken: a quarter in (see ae_render_frame FRAME_PICK). */
export const CHECK_FRAME_PICK = 0.25;
export function planJsx(compNameOrId) {
    return `
        ${MISSING_SOURCES_FN}
        var _arg = ${jsxVal(compNameOrId)};
        var comp = AE.findCompByNameOrId(_arg);
        if (!comp) return { ok: false, error: "no comp matching " + String(_arg) };
        return {
            ok: true,
            compName: comp.name,
            compId: comp.id,
            width: comp.width,
            height: comp.height,
            frameDuration: comp.frameDuration,
            duration: comp.duration,
            workAreaStart: AE.safeGet(function () { return comp.workAreaStart; }, 0),
            workAreaDuration: AE.safeGet(function () { return comp.workAreaDuration; }, comp.duration),
            displayStartTime: AE.safeGet(function () { return comp.displayStartTime; }, 0),
            resolutionFactor: AE.safeGet(function () { return [comp.resolutionFactor[0], comp.resolutionFactor[1]]; }, null),
            workingSpace: AE.safeGet(function () { return app.project.workingSpace; }, "None"),
            colorManagementSystem: AE.safeGet(function () { return Number(app.project.colorManagementSystem); }, null),
            bitsPerChannel: AE.safeGet(function () { return app.project.bitsPerChannel; }, 8),
            missingFootage: _missingSources(comp)
        };
    `;
}
/**
 * One chunk of frames. `factor` null leaves the comp's resolution as it is
 * (read-only mode); otherwise the comp is set to [factor, factor] for the
 * captures and put back in a finally, so a throw anywhere in between still
 * restores it. saveFrameToPng uses the factor in force when it is called
 * (measured live, AE 2027: [2, 2] wrote 540x960 and [4, 4] 270x480 from a
 * 1080x1920 comp), so restoring it at the end of the same script is safe;
 * Node still measures the PNG that comes back and works either way. Each
 * call returns at once and the files are written over the following seconds:
 * the settle wait in Node scales with the frame count.
 */
export function captureJsx(compNameOrId, frames, paths, factor, tryOcio) {
    return `
        ${RENDER_FRAME_FN}
        ${OCIO_CAPTURE_FN}
        var _arg = ${jsxVal(compNameOrId)};
        var comp = AE.findCompByNameOrId(_arg);
        if (!comp) return { ok: false, error: "no comp matching " + String(_arg) };
        var _frameNums = ${jsxVal(frames)};
        var _paths = ${jsxVal(paths)};
        var _factor = ${jsxVal(factor)};
        var _pick = ${jsxVal(CHECK_FRAME_PICK)};
        var _ws = AE.safeGet(function () { return app.project.workingSpace; }, "None");
        var _cms = AE.safeGet(function () { return Number(app.project.colorManagementSystem); }, null);
        // The OCIO Display Transform only under OCIO (not right under Adobe's ICC engine, measured 2026-11-12).
        var _useOcio = ${jsxVal(tryOcio)} && _ws !== "None" && _ws !== "" && _cms === 1;
        var _frames = [];
        function _renderAll(kind) {
            for (var _fi = 0; _fi < _frameNums.length; _fi++) {
                var _k = _frameNums[_fi];
                var _r = _renderFrame(comp, (_k + _pick) * comp.frameDuration, _paths[_fi], false);
                _r.frame = _k;
                _r.captureKind = kind;
                _frames.push(_r);
            }
        }
        var _res = { asked: _factor, before: null, set: false };
        var _renderError = null;
        try {
            _res.before = AE.safeGet(function () { return [comp.resolutionFactor[0], comp.resolutionFactor[1]]; }, null);
            if (_factor !== null && _res.before !== null && (_res.before[0] !== _factor || _res.before[1] !== _factor)) {
                try {
                    comp.resolutionFactor = [_factor, _factor];
                    _res.set = true;
                } catch (eSet) {
                    _res.setError = AE.errText(eSet);
                }
            }
            if (_useOcio) {
                var _maxT = (_frameNums[_frameNums.length - 1] + _pick) * comp.frameDuration;
                _captureWithOcio(comp, _maxT, _renderAll);
            }
            if (_frames.length === 0) _renderAll("direct");
        } catch (eRender) {
            _renderError = eRender;
        } finally {
            if (_res.set) {
                try {
                    comp.resolutionFactor = _res.before;
                    _res.restored = true;
                } catch (eRestore) {
                    _res.restored = false;
                    _res.restoreError = AE.errText(eRestore);
                }
            }
        }
        if (_renderError !== null) return { ok: false, error: "capture failed: " + AE.errText(_renderError), resolution: _res, frames: _frames };
        return {
            ok: true,
            frames: _frames,
            captureKind: _frames.length > 0 ? _frames[0].captureKind : null,
            resolution: _res,
            workingSpace: _ws,
            bitsPerChannel: AE.safeGet(function () { return app.project.bitsPerChannel; }, 8),
            projectFile: app.project.file ? app.project.file.fsName.replace(/\\\\/g, "/") : null,
            bgColor: AE.safeGet(function () { return [comp.bgColor[0], comp.bgColor[1], comp.bgColor[2]]; }, null)
        };
    `;
}
/**
 * An enabled expression whose text matches this counts as changing all the
 * time, Source Text included. A heuristic, read from the text alone: an
 * expression that reads another layer's keyed property (thisComp.layer("x")
 * .position, say) changes when that layer does, but counts here as static,
 * and an expression that names `time` but holds still counts as changing.
 */
export const IDLE_TIME_DRIVEN = /\btime\b|wiggle\(|loopIn|loopOut|valueAtTime|posterizeTime|Date\(/;
/**
 * The read-only structure checks. Expressions in error are read last, and the
 * whole script runs after the capture pass. Measured live (AE 2027):
 * expressionError is filled in as soon as a broken expression is set, before
 * any render ("Expression disabled. Error at line ..."), and expressionEnabled
 * stays true. Whether it is filled in a project just opened and not yet
 * rendered is not known, so the read stays after the capture pass.
 */
export function structureJsx(compNameOrId, o) {
    return `
        ${COMP_CORNERS_FN}
        ${LIST_MISSING_FONTS_FN}
        ${LIST_MISSING_FOOTAGE_FN}
        var _arg = ${jsxVal(compNameOrId)};
        var comp = AE.findCompByNameOrId(_arg);
        if (!comp) return { ok: false, error: "no comp matching " + String(_arg) };
        var _o = ${jsxVal(o)};
        var _W = comp.width;
        var _H = comp.height;
        var _fd = comp.frameDuration;
        var _safe = { left: _o.margins[0], top: _o.margins[1], right: _W - _o.margins[2], bottom: _H - _o.margins[3] };
        var _r1 = function (v) { return Math.round(v * 10) / 10; };
        var _r6 = function (v) { return Math.round(v * 1e6) / 1e6; };

        function _layerKind(L) {
            if (L instanceof TextLayer) return "text";
            if (L instanceof ShapeLayer) return "shape";
            if (L instanceof AVLayer) return "av";
            return null;
        }
        function _skipWhy(L, kind) {
            if (kind === null) return "camera or light";
            if (_o.boundsOf === "text" && kind !== "text") return "not text";
            if (AE.safeGet(function () { return L.guideLayer; }, false)) return "guide layer";
            if (AE.safeGet(function () { return L.adjustmentLayer; }, false)) return "adjustment layer";
            if (AE.safeGet(function () { return L.nullLayer; }, false)) return "null";
            if (AE.safeGet(function () { return L.isTrackMatte; }, false)) return "track matte";
            if (AE.safeGet(function () { return L.hasVideo; }, true) === false) return "no video";
            if (!L.enabled) return "hidden (eye off)";
            if (typeof L.sourceRectAtTime !== "function") return "no sourceRectAtTime";
            return null;
        }
        function _keyTimes(group, out, depth) {
            if (depth > 12) return;
            var n = AE.safeGet(function () { return group.numProperties; }, 0);
            for (var i = 1; i <= n; i++) {
                var p = AE.safeGet(function () { return group.property(i); }, null);
                if (!p) continue;
                if (AE.safeGet(function () { return p.propertyType; }, null) === PropertyType.PROPERTY) {
                    var nk = AE.safeGet(function () { return p.numKeys; }, 0);
                    for (var k = 1; k <= nk; k++) out.push(p.keyTime(k));
                } else {
                    _keyTimes(p, out, depth + 1);
                }
            }
        }
        function _sampleTimes(L) {
            var t0 = Math.max(_o.from, L.inPoint);
            var t1 = Math.min(_o.to, L.outPoint);
            var ts = [];
            if (t1 <= t0) return ts;
            for (var t = t0; t < t1 - 1e-9; t += _o.step) ts.push(t);
            var keys = [];
            _keyTimes(L, keys, 0);
            for (var ki = 0; ki < keys.length; ki++) {
                if (keys[ki] >= t0 && keys[ki] < t1) ts.push(keys[ki]);
            }
            ts.sort(function (a, b) { return a - b; });
            var out = [];
            for (var si = 0; si < ts.length; si++) {
                if (out.length === 0 || ts[si] - out[out.length - 1] > _fd / 2) out.push(ts[si]);
            }
            if (out.length <= _o.maxSamples) return out;
            var thin = [];
            for (var ti = 0; ti < _o.maxSamples; ti++) thin.push(out[Math.floor(ti * out.length / _o.maxSamples)]);
            return thin;
        }
        // Layer to comp space without sourcePointToComp: 2D transform math up
        // the parent chain. Null when a layer in the chain is 3D.
        function _toComp2D(L, pt, t) {
            var p = [pt[0], pt[1]];
            var cur = L;
            while (cur) {
                if (AE.safeGet(function () { return cur.threeDLayer; }, false)) return null;
                var tr = cur.property("ADBE Transform Group");
                var a = tr.property("ADBE Anchor Point").valueAtTime(t, false);
                var pos = tr.property("ADBE Position").valueAtTime(t, false);
                var sc = tr.property("ADBE Scale").valueAtTime(t, false);
                var rot = tr.property("ADBE Rotate Z").valueAtTime(t, false) * Math.PI / 180;
                var x = (p[0] - a[0]) * sc[0] / 100;
                var y = (p[1] - a[1]) * sc[1] / 100;
                p = [pos[0] + x * Math.cos(rot) - y * Math.sin(rot), pos[1] + x * Math.sin(rot) + y * Math.cos(rot)];
                cur = AE.safeGet(function () { return cur.parent; }, null);
            }
            return p;
        }
        function _boxAt(L, t) {
            var r = L.sourceRectAtTime(t, false);
            if (!r || r.width <= 0 || r.height <= 0) return null;
            var pts = null;
            try {
                var c = _compCorners(L, r);
                pts = [c.topLeft, c.topRight, c.bottomLeft, c.bottomRight];
            } catch (eSp) { pts = null; }
            var via = "sourcePointToComp";
            if (pts === null || !pts[0] || pts[0].length < 2) {
                via = "transform";
                pts = [];
                var corners = [[r.left, r.top], [r.left + r.width, r.top], [r.left, r.top + r.height], [r.left + r.width, r.top + r.height]];
                for (var ci = 0; ci < 4; ci++) {
                    var q = _toComp2D(L, corners[ci], t);
                    if (q === null) return { error: "3D layer: comp-space bounds not worked out" };
                    pts.push(q);
                }
            }
            var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
            for (var pi = 0; pi < 4; pi++) {
                if (pts[pi][0] < x0) x0 = pts[pi][0];
                if (pts[pi][0] > x1) x1 = pts[pi][0];
                if (pts[pi][1] < y0) y0 = pts[pi][1];
                if (pts[pi][1] > y1) y1 = pts[pi][1];
            }
            return { x0: x0, y0: y0, x1: x1, y1: y1, via: via };
        }
        function _visibleAt(L, t) {
            if (t < L.inPoint || t >= L.outPoint) return false;
            var op = AE.safeGet(function () { return L.property("ADBE Transform Group").property("ADBE Opacity").valueAtTime(t, false); }, 100);
            return op > 0;
        }

        var _bounds = { layersChecked: 0, samples: 0, findings: [], skipped: [], total: 0 };
        var _prevTime = comp.time;
        try {
            for (var li = 1; li <= comp.numLayers; li++) {
                var L = comp.layer(li);
                var kind = _layerKind(L);
                var why = _skipWhy(L, kind);
                if (why !== null) {
                    if (kind === "text" || _o.boundsOf === "all") _bounds.skipped.push({ index: L.index, name: L.name, why: why });
                    continue;
                }
                var times = _sampleTimes(L);
                if (times.length === 0) continue;
                _bounds.layersChecked++;
                var open = {};
                var finish = function (edge) {
                    var run = open[edge];
                    if (!run) return;
                    open[edge] = null;
                    _bounds.total++;
                    if (_bounds.findings.length < _o.maxItems) _bounds.findings.push(run);
                };
                var edges = ["left", "top", "right", "bottom"];
                for (var ti = 0; ti < times.length; ti++) {
                    var t = times[ti];
                    var box = null;
                    if (_visibleAt(L, t)) {
                        comp.time = t;
                        box = _boxAt(L, t);
                        _bounds.samples++;
                    }
                    if (box && box.error) {
                        _bounds.skipped.push({ index: L.index, name: L.name, why: box.error });
                        break;
                    }
                    var over = { left: 0, top: 0, right: 0, bottom: 0 };
                    var wholly = false;
                    if (box) {
                        over.left = _safe.left - box.x0;
                        over.top = _safe.top - box.y0;
                        over.right = box.x1 - _safe.right;
                        over.bottom = box.y1 - _safe.bottom;
                        wholly = box.x1 <= _safe.left || box.x0 >= _safe.right || box.y1 <= _safe.top || box.y0 >= _safe.bottom;
                    }
                    for (var ei = 0; ei < 4; ei++) {
                        var e = edges[ei];
                        if (!box || over[e] <= 0.5) { finish(e); continue; }
                        var run = open[e];
                        if (!run) {
                            run = { index: L.index, name: L.name, type: kind, edge: e, from: _r6(t), to: _r6(t), byPx: 0, extent: "partly", at: _r6(t), box: null, via: box.via };
                            open[e] = run;
                        }
                        run.to = _r6(t);
                        if (wholly) run.extent = "wholly";
                        if (over[e] > run.byPx) {
                            run.byPx = _r1(over[e]);
                            run.at = _r6(t);
                            run.box = { x: _r1(box.x0), y: _r1(box.y0), width: _r1(box.x1 - box.x0), height: _r1(box.y1 - box.y0) };
                        }
                    }
                }
                for (var fe = 0; fe < 4; fe++) finish(edges[fe]);
            }
        } finally {
            comp.time = _prevTime;
        }

        // Change times for the idle report (0.4.1), per top-level layer on
        // screen: merged intervals [a, b] in comp seconds inside the layer's
        // span [max(inPoint, 0), min(outPoint, comp.duration)] (a === b for an
        // instant: a key on its own, a marker), or "always". Between two keys
        // of one property the value moves, unless the first is a hold key or
        // the two key values are equal (numbers or arrays of numbers, within
        // a small tolerance, and no spatial curve between them).
        // Changes: keys on the layer (its effects, masks, text animators, any
        // property), keys on the transform of every parent up the chain
        // (but not its Opacity, which does not pass to the child), the same
        // on the layer's track matte, layer markers, a time-driven expression (IDLE_TIME_DRIVEN), and for a
        // precomp the keys one level down on its enabled layers (and track
        // mattes), mapped to outer time as startTime + inner * stretch / 100;
        // a precomp with keyed time remap, or one holding footage that plays,
        // changes all the time. Keyless motion changes all the time too: an
        // enabled Wiggly Selector on a text animator, and the Wiggle Paths
        // and Wiggle Transform shape operators (_selfAnimating). Other
        // effects that move with no keys (particle systems and the like)
        // are a known blind spot: they count as static. Audio levels are not
        // a change on screen. Node finds the longest gap.
        // A gap is on screen only where the layer can be seen: nothing
        // changes inside a gap, so its held values are read once, at its
        // midpoint; at opacity 0, or scale 0 on x or y on the layer or any
        // parent up the chain, the gap is listed in hidden and Node passes
        // over it. Only gaps longer than idleSeconds are read.
        // Exempt: cameras and lights, nulls, adjustment and guide layers,
        // footage and audio whose source plays, and solids and stills with no
        // enabled mask that cover the frame with no non-exempt layer below
        // them (grounds; a masked solid is a card).
        var _idle = { layers: [], exempt: 0, layersChecked: 0 };
        var _timeRe = new RegExp(_o.timeDriven);
        var _identity = function (t) { return t; };
        function _mapper(start, stretch) {
            return function (t) { return start + t * stretch / 100; };
        }
        function _drivenByTime(p) {
            if (!AE.safeGet(function () { return p.canSetExpression && p.expressionEnabled && p.expression !== ""; }, false)) return false;
            if (AE.safeGet(function () { return p.expressionError; }, "")) return false;
            return _timeRe.test(AE.safeGet(function () { return p.expression; }, ""));
        }
        // Groups that move with no keys and no expression while enabled.
        var _selfAnimating = {
            "ADBE Text Wiggly Selector": true,
            "ADBE Vector Filter - Roughen": true,
            "ADBE Vector Filter - Wiggler": true
        };
        // True when two key values are the same number, or the same numbers
        // element by element, within a small tolerance. Anything else (text
        // documents, shapes) is not compared and counts as different.
        function _sameNum(a, b) {
            if (typeof a !== "number" || typeof b !== "number" || !(a === a) || !(b === b)) return false;
            return Math.abs(a - b) <= Math.max(1e-4, 1e-6 * Math.max(Math.abs(a), Math.abs(b)));
        }
        function _sameValue(a, b) {
            if (typeof a === "number") return _sameNum(a, b);
            if (!(a instanceof Array) || !(b instanceof Array) || a.length !== b.length) return false;
            for (var vi = 0; vi < a.length; vi++) if (!_sameNum(a[vi], b[vi])) return false;
            return true;
        }
        function _zeroTangent(v) {
            if (!(v instanceof Array)) return false;
            for (var zi = 0; zi < v.length; zi++) if (!(typeof v[zi] === "number" && Math.abs(v[zi]) < 1e-6)) return false;
            return true;
        }
        // True when the value holds still from key k0 to key k1: equal values
        // and, on a spatial property, no curve out of k0 or into k1.
        function _pairStill(p, k0, k1) {
            var v0 = AE.safeGet(function () { return p.keyValue(k0); }, null);
            var v1 = AE.safeGet(function () { return p.keyValue(k1); }, null);
            if (!_sameValue(v0, v1)) return false;
            if (!AE.safeGet(function () { return p.isSpatial; }, false)) return true;
            return _zeroTangent(AE.safeGet(function () { return p.keyOutSpatialTangent(k0); }, null)) &&
                _zeroTangent(AE.safeGet(function () { return p.keyInSpatialTangent(k1); }, null));
        }
        // Collects change intervals of a property tree into out; true when
        // something in it changes all the time. skip: a matchName passed over.
        // A key pair moves unless it is held or its two values are equal.
        function _changeWalk(group, out, depth, map, skip) {
            if (depth > 12) return false;
            var always = false;
            var n = AE.safeGet(function () { return group.numProperties; }, 0);
            for (var i = 1; i <= n; i++) {
                var p = AE.safeGet(function () { return group.property(i); }, null);
                if (!p) continue;
                var mn = AE.safeGet(function () { return p.matchName; }, "");
                if (mn === "ADBE Audio Group" || (skip && mn === skip)) continue;
                if (AE.safeGet(function () { return p.propertyType; }, null) !== PropertyType.PROPERTY) {
                    if (_selfAnimating[mn] === true && AE.safeGet(function () { return p.enabled; }, true) !== false) always = true;
                    if (_changeWalk(p, out, depth + 1, map, skip)) always = true;
                    continue;
                }
                if (_drivenByTime(p)) always = true;
                var nk = AE.safeGet(function () { return p.numKeys; }, 0);
                var prev = null;
                for (var k = 1; k <= nk; k++) {
                    var t = map(p.keyTime(k));
                    out.push([t, t]);
                    var held = AE.safeGet(function () { return p.keyOutInterpolationType(k - 1) === KeyframeInterpolationType.HOLD; }, false);
                    if (prev !== null && mn !== "ADBE Marker" && !held && !_pairStill(p, k - 1, k)) out.push([Math.min(prev, t), Math.max(prev, t)]);
                    prev = t;
                }
            }
            return always;
        }
        function _plays(src) {
            if (!src || src instanceof CompItem) return false;
            if (AE.safeGet(function () { return src.mainSource.isStill; }, false)) return false;
            return AE.safeGet(function () { return src.duration; }, 0) > 0;
        }
        function _idleExempt(L) {
            if (!(L instanceof TextLayer || L instanceof ShapeLayer || L instanceof AVLayer)) return "camera or light";
            if (AE.safeGet(function () { return L.nullLayer; }, false)) return "null";
            if (AE.safeGet(function () { return L.adjustmentLayer; }, false)) return "adjustment layer";
            if (AE.safeGet(function () { return L.guideLayer; }, false)) return "guide layer";
            if (_plays(AE.safeGet(function () { return L.source; }, null))) return "footage that plays";
            return null;
        }
        function _hasEnabledMask(L) {
            var masks = AE.safeGet(function () { return L.property("ADBE Mask Parade"); }, null);
            var nm = AE.safeGet(function () { return masks.numProperties; }, 0);
            for (var mi = 1; mi <= nm; mi++) {
                var m = AE.safeGet(function () { return masks.property(mi); }, null);
                if (!m) continue;
                if (AE.safeGet(function () { return m.enabled; }, true) === false) continue;
                if (AE.safeGet(function () { return m.maskMode === MaskMode.NONE; }, false)) continue;
                return true;
            }
            return false;
        }
        function _isGround(L, t) {
            var src = AE.safeGet(function () { return L.source; }, null);
            if (!src || src instanceof CompItem) return false;
            if (_hasEnabledMask(L)) return false;
            var flat = AE.safeGet(function () { return src.mainSource instanceof SolidSource; }, false) ||
                AE.safeGet(function () { return src.mainSource.isStill; }, false);
            if (!flat) return false;
            comp.time = t;
            var box = null;
            try { box = _boxAt(L, t); } catch (eBox) { box = null; }
            if (!box || box.error) return false;
            return box.x0 <= 0.5 && box.y0 <= 0.5 && box.x1 >= _W - 0.5 && box.y1 >= _H - 0.5;
        }
        // The layer that mattes L: trackMatteLayer (2023 on, may be null),
        // or on the older API the layer above when a matte type is set.
        function _matteOf(L) {
            var tml = AE.safeGet(function () { return L.trackMatteLayer; }, undefined);
            if (tml !== undefined) return tml;
            if (!AE.safeGet(function () { return L.trackMatteType !== TrackMatteType.NO_TRACK_MATTE; }, false)) return null;
            var idx = AE.safeGet(function () { return L.index; }, 0);
            return idx > 1 ? AE.safeGet(function () { return comp.layer(idx - 1); }, null) : null;
        }
        // Changes of L and of its parents' transforms (opacity aside).
        function _ownChanges(L, out) {
            var always = _changeWalk(L, out, 0, _identity);
            var par = AE.safeGet(function () { return L.parent; }, null);
            for (var guard = 0; par && guard < 100; guard++) {
                var ptr = AE.safeGet(function () { return par.property("ADBE Transform Group"); }, null);
                if (ptr && _changeWalk(ptr, out, 0, _identity, "ADBE Opacity")) always = true;
                par = AE.safeGet(function () { return par.parent; }, null);
            }
            return always;
        }
        function _layerChanges(L, out) {
            var always = _ownChanges(L, out);
            // A track matte's changes show through the layer it mattes.
            var matte = _matteOf(L);
            if (matte && matte !== L) {
                if (_ownChanges(matte, out)) always = true;
                if (_plays(AE.safeGet(function () { return matte.source; }, null))) always = true;
            }
            var src = AE.safeGet(function () { return L.source; }, null);
            if (!(src && src instanceof CompItem)) return always;
            if (AE.safeGet(function () { return L.timeRemapEnabled; }, false)) {
                var tr = AE.safeGet(function () { return L.property("ADBE Time Remapping"); }, null);
                if (AE.safeGet(function () { return tr.numKeys; }, 0) > 0) return true;
            }
            var start = Number(AE.safeGet(function () { return L.startTime; }, 0)) || 0;
            var stretch = Number(AE.safeGet(function () { return L.stretch; }, 100));
            if (!(stretch === stretch)) stretch = 100;
            var map = _mapper(start, stretch);
            var nIn = AE.safeGet(function () { return src.numLayers; }, 0);
            for (var j = 1; j <= nIn; j++) {
                var IL = AE.safeGet(function () { return src.layer(j); }, null);
                if (!IL) continue;
                if (!AE.safeGet(function () { return IL.enabled; }, true) &&
                    !AE.safeGet(function () { return IL.isTrackMatte; }, false)) continue;
                if (_plays(AE.safeGet(function () { return IL.source; }, null))) always = true;
                if (_changeWalk(IL, out, 0, map)) always = true;
            }
            return always;
        }
        function _mergeWithin(raw, s0, s1) {
            var clipped = [];
            for (var ri = 0; ri < raw.length; ri++) {
                var a = raw[ri][0];
                var b = raw[ri][1];
                if (b < s0 || a > s1) continue;
                clipped.push([Math.max(a, s0), Math.min(b, s1)]);
            }
            clipped.sort(function (x, y) { return x[0] - y[0]; });
            var merged = [];
            for (var mi = 0; mi < clipped.length; mi++) {
                var last = merged.length > 0 ? merged[merged.length - 1] : null;
                if (last !== null && clipped[mi][0] <= last[1] + 1e-9) {
                    if (clipped[mi][1] > last[1]) last[1] = clipped[mi][1];
                } else {
                    merged.push([clipped[mi][0], clipped[mi][1]]);
                }
            }
            for (var ci = 0; ci < merged.length; ci++) merged[ci] = [_r6(merged[ci][0]), _r6(merged[ci][1])];
            return merged;
        }
        // True when nothing of L can be seen at t: its opacity is 0, or its
        // scale, or a parent's, is 0 on x or y. A parent's opacity does not
        // pass to the child, so it is not read.
        function _hiddenAt(L, t) {
            var op = AE.safeGet(function () { return L.property("ADBE Transform Group").property("ADBE Opacity").valueAtTime(t, false); }, 100);
            if (typeof op === "number" && op <= 0) return true;
            var cur = L;
            for (var guard = 0; cur && guard < 100; guard++) {
                var sc = AE.safeGet(function () { return cur.property("ADBE Transform Group").property("ADBE Scale").valueAtTime(t, false); }, null);
                if (sc && sc.length >= 2 && (Math.abs(sc[0]) < 1e-9 || Math.abs(sc[1]) < 1e-9)) return true;
                cur = AE.safeGet(function () { return cur.parent; }, null);
            }
            return false;
        }
        // The gaps of merged inside [a0, a1] longer than idleSeconds that
        // the viewer cannot see (the same gaps Node works out).
        function _hiddenGaps(L, merged, a0, a1) {
            var out = [];
            var cursor = a0;
            var check = function (a, b) {
                if (b - a > _o.idleSeconds + 1e-9 && _hiddenAt(L, (a + b) / 2)) out.push([a, b]);
            };
            for (var gi = 0; gi < merged.length; gi++) {
                check(cursor, merged[gi][0]);
                if (merged[gi][1] > cursor) cursor = merged[gi][1];
            }
            check(cursor, a1);
            return out;
        }
        if (_o.idleSeconds > 0) {
            var _idlePrevTime = comp.time;
            var _below = false;
            try {
                for (var ii = comp.numLayers; ii >= 1; ii--) {
                    var IdL = comp.layer(ii);
                    if (!AE.safeGet(function () { return IdL.enabled; }, true)) continue;
                    var s0 = Math.max(IdL.inPoint, 0);
                    var s1 = Math.min(IdL.outPoint, comp.duration);
                    if (!(s1 > s0)) continue;
                    var idleWhy = _idleExempt(IdL);
                    if (idleWhy === null && !_below && _isGround(IdL, s0)) idleWhy = "ground";
                    if (idleWhy !== null) {
                        _idle.exempt++;
                        continue;
                    }
                    _below = true;
                    _idle.layersChecked++;
                    var raw = [];
                    var always = _layerChanges(IdL, raw);
                    var merged = always ? null : _mergeWithin(raw, s0, s1);
                    _idle.layers.push({
                        index: IdL.index,
                        name: IdL.name,
                        from: _r6(s0),
                        to: _r6(s1),
                        changes: always ? "always" : merged,
                        hidden: always ? [] : _hiddenGaps(IdL, merged, _r6(s0), _r6(s1))
                    });
                }
            } finally {
                comp.time = _idlePrevTime;
            }
        }

        // Expressions in error, in this comp and every comp nested in it, each once.
        var _expr = { compsWalked: 0, propertiesVisited: 0, total: 0, errors: [], truncated: false };
        function _exprWalk(group, path, layerRef) {
            var n = AE.safeGet(function () { return group.numProperties; }, 0);
            for (var i = 1; i <= n; i++) {
                if (_expr.propertiesVisited >= _o.maxProperties) { _expr.truncated = true; return; }
                var p = AE.safeGet(function () { return group.property(i); }, null);
                if (!p) continue;
                _expr.propertiesVisited++;
                var name = AE.safeGet(function () { return p.name; }, "?");
                if (AE.safeGet(function () { return p.propertyType; }, null) === PropertyType.PROPERTY) {
                    if (!AE.safeGet(function () { return p.canSetExpression && p.expressionEnabled && p.expression !== ""; }, false)) continue;
                    var msg = AE.safeGet(function () { return p.expressionError; }, "");
                    if (!msg) continue;
                    _expr.total++;
                    if (_expr.errors.length < _o.maxItems) {
                        _expr.errors.push({ comp: layerRef.comp, layer: layerRef.layer, index: layerRef.index, property: path + name, error: "" + msg });
                    }
                } else {
                    _exprWalk(p, path + name + " > ", layerRef);
                }
            }
        }
        var _queue = [comp];
        var _seen = {};
        while (_queue.length > 0 && !_expr.truncated) {
            var C = _queue.shift();
            if (_seen["c" + C.id]) continue;
            _seen["c" + C.id] = true;
            _expr.compsWalked++;
            for (var xi = 1; xi <= C.numLayers; xi++) {
                var XL = C.layer(xi);
                _exprWalk(XL, "", { comp: C.name, layer: XL.name, index: XL.index });
                var src = AE.safeGet(function () { return XL.source; }, null);
                if (src && src instanceof CompItem && !_seen["c" + src.id]) _queue.push(src);
            }
        }

        return {
            ok: true,
            bounds: _bounds,
            fonts: _listMissingFonts(),
            footage: _listMissingFootage(),
            nestedCompIds: (function () { var ids = []; for (var k in _seen) { if (_seen.hasOwnProperty(k)) ids.push(Number(k.substring(1))); } return ids; })(),
            expressions: _expr,
            idle: _idle
        };
    `;
}
//# sourceMappingURL=check-comp-jsx.js.map