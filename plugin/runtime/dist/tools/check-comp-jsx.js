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
//                 safe area) while visible, missing fonts and footage, and
//                 expressions in error.
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
            bitsPerChannel: AE.safeGet(function () { return app.project.bitsPerChannel; }, 8),
            missingFootage: _missingSources(comp)
        };
    `;
}
/**
 * One chunk of frames. `factor` null leaves the comp's resolution as it is
 * (read-only mode); otherwise the comp is set to [factor, factor] for the
 * captures and put back in a finally, so a throw anywhere in between still
 * restores it. Nobody has confirmed that saveFrameToPng honours
 * resolutionFactor: Node measures the PNG that comes back and works either way.
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
        var _useOcio = ${jsxVal(tryOcio)} && _ws !== "None" && _ws !== "";
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
 * The read-only structure checks. Expressions in error are read last, and the
 * whole script runs after the capture pass: expressionError may only be filled
 * in once After Effects has evaluated the expression, which rendering the
 * frames makes it do (to be confirmed live).
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
            expressions: _expr
        };
    `;
}
//# sourceMappingURL=check-comp-jsx.js.map