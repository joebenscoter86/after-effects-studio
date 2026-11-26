import { __esmMin } from "./rolldown-runtime.js";
import { _enum, _null, array, boolean, init_schemas, literal, number, object as object$1, record, string as string$1, union, unknown } from "../vendor/zod-2.js";
import { AMBIENT_CONTEXT_JSX, PACKAGE_ROOT, denyAppConfig, denyOperation, denyUnregisteredCategory, denyUnregisteredOperation, errorResult, getOp, init_config, init_errors, init_opschema, init_policy, init_registry, init_validate, jsxVal, listOps, policySummary, prepareOp, readOnlyMode, rejectedOutputPath, suggestName, summarizeParams, validateAeProjectDoc, validateOpArgs, wantsDialogSuppression, wantsRollback, wantsUndoGroup } from "./core-1.js";
import { init_instances, instanceLabel, listInstances, resolveTarget } from "./transport-1.js";
import { COMP_CORNERS_FN, COMP_INFO_FN, LAYER_FULL_FN, LIST_MISSING_FONTS_FN, LIST_MISSING_FOOTAGE_FN, MISSING_SOURCES_FN, OCIO_CAPTURE_FN, RENDER_FRAME_FN, init_snippets } from "./operations-4.js";
import { PieceWatcher, calibrationKey, composeContactSheet, decodePng, encodePngSrgb8, init_calibration, init_png16, init_settled_read, init_sheet, init_transform, init_watch, measureCaptureTransfer, profileForWorkingSpace, resample, resolveWatchThresholds, sceneLinearToDisplaySrgb, settleTimeoutFor, stampFiles, waitForSettled, watchArgsError } from "./color-1.js";
import { init_render_frame, init_save_project, init_version_info, renderFrameTool, saveProjectTool, versionInfoTool } from "./tools-2.js";
import { promises, readFileSync, realpathSync } from "node:fs";
import * as os$1 from "node:os";
import * as path$1 from "node:path";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";

// server/tools/capture-shared.js
function validRgb(value) {
	return Array.isArray(value) && value.length === 3 && value.every((v) => typeof v === "number" && Number.isFinite(v)) ? [
		value[0],
		value[1],
		value[2]
	] : null;
}
async function colorConversion(payload, transport) {
	const workingSpace = payload.workingSpace ?? "None";
	try {
		if (workingSpace === "None" || workingSpace === "") {
			payload.colorPipeline = "untagged 16-bit → 8-bit sRGB-tagged (values unchanged)";
			return () => {};
		}
		const calib = await measureCaptureTransfer(transport, calibrationKey(payload.projectFile ?? null, workingSpace, payload.bitsPerChannel ?? 8), !readOnlyMode());
		const calibFailed = "error" in calib || calib.kind === "unknown";
		const gain = !calibFailed && calib.kind === "linear" ? 1 / calib.scale : 1;
		const applyGain = (rgb) => {
			if (gain !== 1) for (let i = 0; i < rgb.length; i++) rgb[i] *= gain;
		};
		if (payload.captureKind === "ocio") {
			if (calibFailed) {
				payload.colorWarning = `AE applied its display transform, but the capture scale could not be measured (${"error" in calib ? calib.error : "non-linear transfer"}) \u2014 the file is uniformly dark by that unknown scale. Verify colors against the AE viewer manually.`;
				return null;
			}
			payload.colorPipeline = "AE OCIO display transform (viewer-exact, any working space)" + (gain !== 1 ? ` + capture scale 1/${gain.toFixed(2)} restored` : "");
			return applyGain;
		}
		const profile = profileForWorkingSpace(workingSpace);
		if (profile === null) {
			payload.colorWarning = `working space '${workingSpace}' has no built-in conversion \u2014 the file contains raw working-space values and will not match the viewer. Verify colors against the AE viewer manually if they matter here.`;
			return null;
		}
		if (calibFailed) {
			payload.colorWarning = `could not characterize this AE version's capture transfer (${"error" in calib ? calib.error : "non-linear transfer"}) \u2014 the file contains raw working-space values. Verify colors against the AE viewer manually if they matter here.`;
			return null;
		}
		payload.colorPipeline = `${profile.note}` + (gain !== 1 ? ` (capture scale 1/${gain.toFixed(2)} restored)` : "");
		return (rgb) => {
			applyGain(rgb);
			sceneLinearToDisplaySrgb(rgb, profile.toRec709);
		};
	} catch (err) {
		payload.colorWarning = `color post-processing failed, file left as raw capture: ${err instanceof Error ? err.message : String(err)}`;
		return null;
	}
}
function iccManagedReason(workingSpace, bitsPerChannel) {
	return `The project is colour-managed (working space '${workingSpace}'${bitsPerChannel ? `, ${bitsPerChannel} bpc` : ""}, After Effects' own colour engine): colour readings here do not match the viewer (measured: an 8-bit grey of 128 read as 67, a neutral read L* 28 for 54, and spill turned its verdict), so they are refused. Alpha-based readings (edge widths, coverage, holes, specks, the file check) read the same as in a project with no working space and are given. For colour, measure in a copy of the project set to no working space at 8 or 16 bpc, or pass colorManaged: 'off' for the raw working-space values.`;
}
function init_capture_shared() {
	return (init_capture_shared = __esmMin((() => {
		init_calibration();
		init_transform();
		init_policy();
	})))();
}

// server/tools/define-tool.js
function defineTool(spec) {
	return spec;
}
function jsonResult(payload) {
	const envelope = {
		ok: true,
		...payload
	};
	return {
		content: [{
			type: "text",
			text: JSON.stringify(envelope, null, 2)
		}],
		structuredContent: envelope,
		isError: false
	};
}
function jsxReportedFailure(result) {
	if (result === null || typeof result !== "object" || Array.isArray(result)) return null;
	const r = result;
	if (r.ok !== false) return null;
	return { error: typeof r.error === "string" ? r.error : "operation reported ok: false" };
}
function toMcpResult(result) {
	if (!result.ok) return errorResult(result.errorCode ?? "TRANSPORT", result.error ?? "unknown failure", {
		...result.dialogs?.length ? { details: { dialogs: result.dialogs } } : {},
		stack: result.stack,
		logs: result.logs,
		durationMs: result.durationMs
	});
	const reported = jsxReportedFailure(result.result);
	if (reported) return errorResult("OPERATION_FAILED", reported.error, {
		details: { result: result.result },
		logs: result.logs,
		durationMs: result.durationMs
	});
	return jsonResult({
		result: result.result,
		logs: result.logs,
		durationMs: result.durationMs
	});
}
function init_define_tool() {
	return (init_define_tool = __esmMin((() => {
		init_errors();
	})))();
}

// server/tools/catalog.js
function visibleOps(category) {
	return listOps(category).filter((op) => denyOperation(op) === null);
}
function visibleCategories() {
	const categories = /* @__PURE__ */ new Set();
	for (const op of visibleOps()) categories.add(op.category);
	return Array.from(categories).sort();
}
var catalogTool;
function init_catalog() {
	return (init_catalog = __esmMin((() => {
		init_schemas();
		init_errors();
		init_policy();
		init_registry();
		init_define_tool();
		catalogTool = defineTool({
			name: "ae_catalog",
			title: "Operation catalog",
			description: "Discover available atomic operations for ae_do. Without args: all categories with their operation names. With a category: detailed params per operation. Only operations this server will actually execute are listed.",
			group: "operations",
			blockedInReadOnly: false,
			effect: "read",
			inputShape: { category: string$1().optional().describe("Filter by category. Omit to list all categories with operation counts, then drill into a specific category.") },
			handler: async (args, _transport) => {
				if (!args.category) {
					const summary = visibleCategories().map((c) => ({
						category: c,
						operationCount: visibleOps(c).length,
						operations: visibleOps(c).map((op) => op.name)
					}));
					return jsonResult({
						categories: summary,
						totalOperations: visibleOps().length,
						policy: policySummary(),
						undo: "every ae_do call runs in ONE automatic undo group — a single Ctrl+Z / project.undo reverts the whole call (batch.run included); never open an undo group yourself. undo/redo itself (project.undo, command.execute 16/2035) is the exception: it runs outside the group, so call it alone, never inside batch.run",
						...readOnlyMode() ? { note: "AE_MCP_READONLY=1 — only operations that cannot modify the project are listed." } : {}
					});
				}
				const ops = visibleOps(args.category);
				if (ops.length === 0) {
					const available = visibleCategories();
					const withheld = denyUnregisteredCategory(args.category);
					if (withheld) return errorResult("FORBIDDEN", withheld.message, {
						details: {
							category: args.category,
							availableCategories: available
						},
						hint: withheld.hint
					});
					const hiddenByPolicy = listOps(args.category).length > 0;
					return errorResult(hiddenByPolicy ? "FORBIDDEN" : "UNKNOWN_CATEGORY", hiddenByPolicy ? `category '${args.category}' exists but every operation in it is blocked by the current policy (${policySummary()})` : `no operations in category '${args.category}'`, {
						details: {
							category: args.category,
							availableCategories: available
						},
						hint: `Available categories: ${available.join(", ")}`
					});
				}
				const details = ops.map((op) => ({
					name: op.name,
					description: op.description,
					readOnly: op.readOnly === true,
					...op.appConfig ? { appConfig: true } : {},
					params: op.params.map((p) => ({
						name: p.name,
						type: p.type,
						required: p.required ?? false,
						description: p.description,
						...p.nullable ? { nullable: true } : {},
						...p.default !== void 0 ? { default: p.default } : {}
					}))
				}));
				return jsonResult({
					category: args.category,
					operations: details
				});
			}
		});
	})))();
}

// server/tools/check-comp-jsx.js
function planJsx(compNameOrId) {
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
function captureJsx(compNameOrId, frames, paths, factor, tryOcio) {
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
function structureJsx(compNameOrId, o) {
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
var CHECK_FRAME_PICK, IDLE_TIME_DRIVEN;
function init_check_comp_jsx() {
	return (init_check_comp_jsx = __esmMin((() => {
		init_snippets();
		init_registry();
		CHECK_FRAME_PICK = .25;
		IDLE_TIME_DRIVEN = /\btime\b|wiggle\(|loopIn|loopOut|valueAtTime|posterizeTime|Date\(/;
	})))();
}

// server/tools/check-comp.js
function frameOfCapture(file) {
	const m = /frame-(\d+)\.png$/.exec(file);
	return m ? Number(m[1]) : null;
}
function aeFrameSource(transport, comp, opts) {
	const stallMs = opts.stallMs ?? 6e4;
	const drain = async (paths, before) => {
		if (paths.length === 0) return {
			settled: /* @__PURE__ */ new Set(),
			outstanding: [],
			unsettled: []
		};
		const settle = await waitForSettled(paths, {
			timeoutMs: opts.settleTimeoutMs ?? settleTimeoutFor(paths.length, opts.pixels),
			before,
			stallMs
		});
		return {
			settled: new Set(settle.settled.map((i) => paths[i])),
			outstanding: settle.unsettled.map((u) => u.path),
			unsettled: settle.unsettled
		};
	};
	return { async capture(frames, dir) {
		const t0 = performance.now();
		const paths = frames.map((k) => frameFile(dir, k));
		await promises.mkdir(dir, { recursive: true });
		const before = await stampFiles(paths);
		const result = await transport.execute({
			code: captureJsx(comp, frames, paths, opts.factor, opts.tryOcio),
			label: "check_comp_capture",
			timeoutMs: 6e4 + frames.length * 5e3
		});
		if (!result.ok) {
			const error = result.error ?? "capture call failed";
			if (/never picked up/i.test(error)) return {
				error,
				details: result,
				outstanding: []
			};
			return {
				error,
				details: result,
				outstanding: (await drain(paths, before)).outstanding
			};
		}
		const payload = result.result;
		const rendered = payload?.frames ?? [];
		const ok = rendered.filter((f) => f.ok && typeof f.writtenTo === "string");
		const okPaths = ok.map((f) => f.writtenTo);
		const okBefore = ok.map((f) => before[frames.indexOf(f.frame)]);
		if (!payload || payload.ok !== true) {
			const d2 = await drain(okPaths, okBefore);
			return {
				error: payload?.error ?? "capture reported no result",
				details: { resolution: payload?.resolution },
				outstanding: d2.outstanding
			};
		}
		const d = await drain(okPaths, okBefore);
		return {
			frames: frames.map((frame) => {
				const r = rendered.find((f) => f.frame === frame);
				if (!r) return {
					frame,
					error: "not captured"
				};
				if (!r.ok) return {
					frame,
					error: r.error ?? "capture failed"
				};
				if (!d.settled.has(r.writtenTo)) {
					const u = d.unsettled.find((x) => x.path === r.writtenTo);
					return {
						frame,
						error: `the capture had not finished writing when the wait ended (no capture finished for ${(stallMs / 1e3).toFixed(0)} s; ${u?.state ?? "missing"}): After Effects may still write it`
					};
				}
				return {
					frame,
					path: r.writtenTo
				};
			}),
			info: {
				captureKind: payload.captureKind ?? null,
				workingSpace: payload.workingSpace,
				bitsPerChannel: payload.bitsPerChannel,
				projectFile: payload.projectFile ?? null,
				bgColor: payload.bgColor ?? null,
				resolution: payload.resolution
			},
			seconds: (performance.now() - t0) / 1e3,
			outstanding: d.outstanding
		};
	} };
}
async function readPicture(file, target, convert) {
	const img = decodePng(await promises.readFile(file));
	if (convert) convert(img.rgb);
	let rgb = img.rgb;
	let width = img.width;
	let height = img.height;
	if (width > target.width + 1 || height > target.height + 1) {
		rgb = resample(img, target.width, target.height);
		width = target.width;
		height = target.height;
	}
	const pic = new Float32Array(rgb.length);
	for (let i = 0; i < rgb.length; i++) {
		const v = rgb[i] < 0 ? 0 : rgb[i] > 1 ? 1 : rgb[i];
		pic[i] = convert ? Math.round(v * 255) / 255 : v;
		rgb[i] = pic[i];
	}
	return {
		pic,
		rgb,
		width,
		height,
		captured: [img.width, img.height]
	};
}
function idleEntries(layers, idleSeconds) {
	const out = [];
	if (!(idleSeconds > 0)) return out;
	for (const L of layers) {
		if (L.changes === "always") continue;
		let best = null;
		let cursor = L.from;
		const hidden = L.hidden ?? [];
		const consider = (a, b) => {
			if (hidden.some(([h0, h1]) => Math.abs(h0 - a) < 1e-6 && Math.abs(h1 - b) < 1e-6)) return;
			if (b - a > 1e-9 && (best === null || b - a >= best[1] - best[0] - 1e-9)) best = [a, b];
		};
		for (const [a, b] of [...L.changes].sort((x, y) => x[0] - y[0])) {
			consider(cursor, a);
			cursor = Math.max(cursor, b);
		}
		consider(cursor, L.to);
		if (best === null) continue;
		const [from, to] = best;
		const seconds = r6(to - from);
		if (seconds <= idleSeconds + 1e-9) continue;
		out.push({
			layer: L.name,
			index: L.index,
			from: r6(from),
			to: r6(to),
			seconds,
			reading: `layer ${L.index} "${L.name}" is on screen with nothing changing on it from ${r6(from)} s to ${r6(to)} s (${seconds} s)`
		});
	}
	return out.sort((a, b) => b.seconds - a.seconds || a.index - b.index);
}
function capWorst(items, kindOf, severity, cap) {
	const byKind = /* @__PURE__ */ new Map();
	for (const it of items) {
		const k = kindOf(it);
		if (!byKind.has(k)) byKind.set(k, []);
		byKind.get(k).push(it);
	}
	for (const list of byKind.values()) list.sort((a, b) => severity(b) - severity(a));
	const out = [];
	const lists = [...byKind.values()];
	for (let round = 0; out.length < cap && lists.some((l) => l.length > round); round++) for (const l of lists) if (round < l.length && out.length < cap) out.push(l[round]);
	return out;
}
function countBy(items, kindOf) {
	const out = {};
	for (const it of items) out[kindOf(it)] = (out[kindOf(it)] ?? 0) + 1;
	return out;
}
function sampled(first, end, every) {
	const out = [];
	for (let k = first; k < end; k += every) out.push(k);
	return out;
}
async function checkComp(args, transport) {
	const started = performance.now();
	const every = args.every ?? 1;
	const downsample = args.downsample ?? 4;
	const maxFrames = args.maxFrames ?? 300;
	const chunkFrames = args.chunkFrames ?? 100;
	const t = resolveWatchThresholds(args.thresholds ?? {});
	const notes = [];
	const planRes = await transport.execute({
		code: planJsx(args.compNameOrId),
		label: "check_comp_plan"
	});
	if (!planRes.ok) return toMcpResult(planRes);
	const plan = planRes.result;
	if (!plan || plan.ok !== true) return toMcpResult(planRes);
	const fd = plan.frameDuration;
	const compFrames = Math.max(1, Math.round(plan.duration / fd));
	const fromSec = args.from ?? plan.workAreaStart;
	const toSec = args.to ?? plan.workAreaStart + plan.workAreaDuration;
	const first = Math.max(0, Math.min(compFrames - 1, Math.floor(fromSec / fd + 1e-6)));
	const end = Math.max(first + 1, Math.min(compFrames, Math.ceil(toSec / fd - 1e-6)));
	const all = sampled(first, end, every);
	let startIdx = 0;
	if (args.startFrame !== void 0) {
		startIdx = all.findIndex((k) => k >= args.startFrame);
		if (startIdx < 0) return errorResult("INVALID_ARGS", `startFrame ${args.startFrame} is past the range (frames ${first} to ${all[all.length - 1]})`);
	}
	const owned = all.slice(startIdx, startIdx + maxFrames);
	const ownedFrom = owned[0];
	const ownedTo = owned[owned.length - 1];
	const remaining = all.length - (startIdx + owned.length);
	const before = startIdx > 0 ? Math.min(startIdx, t.window + 1 + Math.ceil(t.frozenSeconds / (fd * every))) : 0;
	const after = remaining > 0 ? Math.min(remaining, t.window + 1) : 0;
	const frames = all.slice(startIdx - before, startIdx + owned.length + after);
	const next = remaining > 0 ? {
		startFrame: ownedTo + every,
		time: r6((ownedTo + every) * fd),
		framesLeft: remaining
	} : null;
	const outDir = path$1.resolve(args.outDir ?? path$1.join(os$1.tmpdir(), "comp-room-check", `${String(plan.compName).replace(/[^A-Za-z0-9_-]+/g, "-").slice(0, 40)}-${Date.now()}`)).replace(/\\/g, "/");
	const capDir = path$1.join(outDir, `captures-${randomUUID().slice(0, 8)}`).replace(/\\/g, "/");
	const readOnly = readOnlyMode();
	const target = {
		width: Math.max(1, Math.round(plan.width / downsample)),
		height: Math.max(1, Math.round(plan.height / downsample))
	};
	const source = aeFrameSource(transport, args.compNameOrId, {
		factor: readOnly ? null : downsample,
		tryOcio: args.colorManaged !== "off" && !readOnly,
		settleTimeoutMs: args.settleTimeoutMs,
		stallMs: args.stallTimeoutMs,
		pixels: target.width * target.height
	});
	const report = {
		comp: {
			name: plan.compName,
			id: plan.compId,
			size: [plan.width, plan.height],
			frameRate: r3(1 / fd),
			duration: r6(plan.duration)
		},
		range: {
			from: {
				frame: first,
				time: r6(first * fd)
			},
			to: {
				frame: all[all.length - 1],
				time: r6(all[all.length - 1] * fd)
			},
			source: args.from !== void 0 || args.to !== void 0 ? "from/to" : "work area",
			framesToCheck: all.length
		},
		step: every
	};
	if (plan.missingFootage.length > 0) {
		report.picture = {
			checked: false,
			reason: `source media missing for comp ${plan.compName}; restore or relink it, then check again`
		};
		report.missingFootage = plan.missingFootage;
		report.structure = await runStructure(args, transport, plan, first, end, fd);
		report.next = null;
		report.timings = { totalSeconds: r3((performance.now() - started) / 1e3) };
		return jsonResult({ result: report });
	}
	if (args.colorManaged !== "off" && plan.workingSpace !== "None" && plan.workingSpace !== "" && plan.colorManagementSystem !== 1) {
		report.picture = {
			checked: false,
			reason: `${iccManagedReason(plan.workingSpace, plan.bitsPerChannel)} The whole-piece check's picture checks (blank frames, black bars, pops, stutters, cuts, clipping, elements off frame) are tuned on display values, so they are not run.`
		};
		report.structure = await runStructure(args, transport, plan, first, end, fd);
		report.next = null;
		report.timings = { totalSeconds: r3((performance.now() - started) / 1e3) };
		return jsonResult({ result: report });
	}
	let watcher = null;
	let info = null;
	let convert = null;
	const color = {};
	let captureSeconds = 0;
	let readSeconds = 0;
	let captured = null;
	let measured = null;
	const failures = [];
	let captureError = null;
	let stalled = null;
	const outstanding = [];
	const stallMs = args.stallTimeoutMs ?? 6e4;
	let measuredFrames = 0;
	let measuredOwned = 0;
	let chunksAsked = 0;
	for (let c = 0; c < frames.length; c += chunkFrames) {
		const chunk = frames.slice(c, c + chunkFrames);
		chunksAsked++;
		const res = await source.capture(chunk, capDir);
		if ("error" in res) {
			captureError = {
				error: res.error,
				atFrame: chunk[0],
				details: res.details
			};
			outstanding.push(...res.outstanding);
			break;
		}
		captureSeconds += res.seconds;
		if (info === null) {
			info = res.info;
			Object.assign(color, res.info);
			if (args.colorManaged !== "off") convert = await colorConversion(color, transport);
		}
		if (res.info.resolution?.set && res.info.resolution.restored === false) notes.push(`the comp's resolution could not be put back to ${JSON.stringify(res.info.resolution.before)} after a capture (${res.info.resolution.restoreError ?? "unknown error"}): set it in the comp panel`);
		for (const f of res.frames) {
			if (!f.path) {
				failures.push({
					frame: f.frame,
					error: f.error ?? "capture failed"
				});
				continue;
			}
			const r0 = performance.now();
			try {
				const pic = await readPicture(f.path, target, convert);
				captured ??= pic.captured;
				measured ??= [pic.width, pic.height];
				watcher ??= new PieceWatcher({
					thresholds: t,
					frameDuration: fd,
					every,
					scale: plan.width / pic.width,
					owned: {
						from: ownedFrom,
						to: ownedTo
					},
					openStart: startIdx > 0,
					openEnd: remaining > 0
				});
				watcher.add({
					frame: f.frame,
					pic: pic.pic,
					width: pic.width,
					height: pic.height
				});
				measuredFrames++;
				if (f.frame >= ownedFrom && f.frame <= ownedTo) measuredOwned++;
			} catch (err) {
				failures.push({
					frame: f.frame,
					error: `could not read the capture: ${err instanceof Error ? err.message : String(err)}`
				});
			}
			readSeconds += (performance.now() - r0) / 1e3;
			await promises.rm(f.path, { force: true });
		}
		if (res.outstanding.length > 0) {
			outstanding.push(...res.outstanding);
			stalled = { atFrame: Math.min(...res.outstanding.map(frameOfCapture).filter((k) => k !== null)) };
			break;
		}
	}
	if (outstanding.length === 0) await promises.rm(capDir, {
		recursive: true,
		force: true
	});
	const findings = watcher ? watcher.finish() : null;
	const measureSeconds = watcher ? watcher.measureMs / 1e3 : 0;
	let nextOut = next;
	const stopAt = captureError?.atFrame ?? stalled?.atFrame ?? null;
	if (stopAt !== null && Number.isFinite(stopAt) && stopAt <= ownedTo) {
		const at = Math.max(stopAt, ownedFrom);
		nextOut = {
			startFrame: at,
			time: r6(at * fd),
			framesLeft: all.length - all.indexOf(at)
		};
	}
	report.checked = {
		from: {
			frame: ownedFrom,
			time: r6(ownedFrom * fd)
		},
		to: {
			frame: ownedTo,
			time: r6(ownedTo * fd)
		},
		frames: findings?.framesChecked ?? 0,
		contextFrames: {
			before,
			after
		},
		captureFailures: failures.length
	};
	report.next = nextOut;
	const asked = readOnly ? null : downsample;
	const resolution = info?.resolution;
	const honoured = captured === null ? null : Math.abs(captured[0] - target.width) <= 1 && Math.abs(captured[1] - target.height) <= 1;
	report.capture = {
		downsample,
		compSize: [plan.width, plan.height],
		askedSize: [target.width, target.height],
		capturedSize: captured,
		measuredSize: measured,
		resolutionFactor: asked === null ? "not touched (read-only mode): captured at the comp's own resolution and shrunk in Node" : resolution?.setError ? `could not be set (${resolution.setError}): captured at the comp's own resolution and shrunk in Node` : honoured === null ? "unknown: nothing was captured" : honoured ? `honoured: saveFrameToPng wrote ${captured[0]}\xD7${captured[1]}` : `not honoured: saveFrameToPng wrote ${captured[0]}\xD7${captured[1]}, shrunk in Node to ${measured?.[0]}\xD7${measured?.[1]}`,
		captureKind: info?.captureKind ?? null,
		stage: "output",
		picture: convert !== null ? "display values of the picture the viewer sees, as ae_render_frame writes the file: after colour conversion (colorPipeline), clamped and rounded to 8 bits; the capture's RGB is already laid over the comp background, so transparent areas read that colour" : "the raw capture (colorManaged off, or the colour conversion failed: see colorWarning): working-space values, over the comp background",
		...color.colorPipeline ? { colorPipeline: color.colorPipeline } : {},
		...color.colorWarning ? { colorWarning: color.colorWarning } : {}
	};
	if (stalled !== null) notes.push(`After Effects stopped writing captures: ${outstanding.length} had not finished when no capture had finished for ${r3(stallMs / 1e3)} s, so nothing more was asked of it. What was measured is reported; call again with startFrame ${(nextOut ?? { startFrame: stalled.atFrame }).startFrame} to continue (look at After Effects first: a dialog, a full disk or its cache)`);
	if (captureError !== null) {
		report.captureError = captureError;
		notes.push(`capturing stopped at frame ${captureError.atFrame}: ${captureError.error}. What was measured is reported; call again with startFrame ${(nextOut ?? { startFrame: captureError.atFrame }).startFrame} to continue`);
	}
	if (failures.length > 0) {
		report.captureFailures = failures.slice(0, 20);
		notes.push(`${failures.length} frame${failures.length > 1 ? "s" : ""} could not be captured or read; the series is broken there (see captureFailures)`);
	}
	report.thresholds = t;
	const flags = findings?.flags ?? [];
	const stretches = findings?.stretches ?? [];
	const shownFlags = capWorst(flags, (f) => f.kind, flagSeverity, 20).sort((a, b) => a.frame - b.frame);
	const shownStretches = capWorst(stretches, (s) => s.kind, stretchSeverity, 20).sort((a, b) => a.from.frame - b.from.frame);
	report.counts = {
		flags: countBy(flags, (f) => f.kind),
		stretches: countBy(stretches, (s) => s.kind)
	};
	report.flags = shownFlags;
	if (shownFlags.length < flags.length) report.flagsOmitted = flags.length - shownFlags.length;
	report.stretches = shownStretches;
	if (shownStretches.length < stretches.length) report.stretchesOmitted = stretches.length - shownStretches.length;
	if (findings?.extremes) report.extremes = findings.extremes;
	notes.push(...findings?.notes ?? []);
	let structureSeconds = 0;
	let structure = null;
	if (nextOut === null && args.structure !== false) {
		const s0 = performance.now();
		structure = await runStructure(args, transport, plan, first, end, fd);
		structureSeconds = (performance.now() - s0) / 1e3;
		report.structure = structure;
	} else report.structure = {
		checked: false,
		reason: args.structure === false ? "structure: false" : "structure checks run on the call that reaches the end of the range (next is not null)"
	};
	let sheetSeconds = 0;
	report.sheet = null;
	if (args.sheet !== false && findings !== null && outstanding.length > 0) report.sheet = {
		writtenTo: null,
		skipped: "no sheet: captures of the check were still outstanding in After Effects, and none is queued behind them"
	};
	else if (args.sheet !== false && findings !== null) {
		const s0 = performance.now();
		const sheetOpts = typeof args.sheet === "object" ? args.sheet : {};
		const sheet = await makeSheet(source, outDir, shownFlags, shownStretches, structure, fd, {
			from: first,
			to: end - 1
		}, target, convert, sheetOpts.maxTiles ?? DEFAULT_MAX_TILES, sheetOpts.thumbWidth, `${ownedFrom}-${ownedTo}`);
		sheetSeconds = (performance.now() - s0) / 1e3;
		report.sheet = sheet.sheet;
		outstanding.push(...sheet.outstanding);
	}
	if (outstanding.length === 0) await promises.rmdir(outDir).catch(() => {});
	report.captureQueue = outstanding.length === 0 ? {
		outstanding: 0,
		reading: "every capture asked of After Effects had finished writing before the check returned: nothing of the check is left in its queue"
	} : {
		outstanding: outstanding.length,
		folder: outstanding.some((p) => p.startsWith(capDir + "/")) ? capDir : outDir,
		frames: outstanding.map(frameOfCapture).filter((k) => k !== null).slice(0, 20),
		reading: `${outstanding.length} capture${outstanding.length > 1 ? "s" : ""} asked of After Effects had not finished when the check returned (none had finished for ${r3(stallMs / 1e3)} s); After Effects has no way to cancel them, so it may still write them. Their folder was kept, not deleted (deleting it while After Effects writes raises an error box there). Delete it once After Effects is idle.`
	};
	const coverageComplete = nextOut === next && failures.length === 0 && outstanding.length === 0;
	report.coverage = {
		framesAsked: owned.length,
		framesMeasured: measuredOwned,
		complete: coverageComplete && measuredOwned === owned.length,
		reading: coverageComplete && measuredOwned === owned.length ? `all ${owned.length} frames of this call were measured` : `${measuredOwned} of the ${owned.length} frames of this call were measured` + (stalled !== null ? "; the pass stopped because After Effects stopped writing captures" : captureError !== null ? "; the pass stopped on a failed capture" : "") + (failures.length > 0 ? `; ${failures.length} could not be captured or read` : "") + ". The findings cover the measured frames only."
	};
	const total = (performance.now() - started) / 1e3;
	report.timings = {
		captureSeconds: r3(captureSeconds),
		readSeconds: r3(readSeconds),
		measureSeconds: r3(measureSeconds),
		structureSeconds: r3(structureSeconds),
		sheetSeconds: r3(sheetSeconds),
		totalSeconds: r3(total),
		framesCaptured: measuredFrames,
		chunks: chunksAsked,
		framesPerSecond: total > 0 ? r3(measuredFrames / total) : null,
		msPerFrame: measuredFrames > 0 ? {
			capture: r3(captureSeconds * 1e3 / measuredFrames),
			read: r3((readSeconds - measureSeconds) * 1e3 / measuredFrames),
			measure: r3(measureSeconds * 1e3 / measuredFrames)
		} : null
	};
	if (info?.resolution?.set || info?.captureKind === "ocio") notes.push(`${info?.resolution?.set ? "the comp's resolution was set for the captures" : "a colour-managed capture layer was added"} and put back afterwards; After Effects still marks the project as changed (unsaved), which cannot be avoided`);
	if (readOnly) notes.push("read-only mode: the comp's resolution and the OCIO capture layer were not touched, so captures were full size (slower) and colour came from the pure-math conversion");
	report.notes = notes;
	return jsonResult({ result: report });
}
async function runStructure(args, transport, plan, first, end, fd) {
	const pct = args.safeArea?.percent;
	const px = args.safeArea?.px;
	const margins = pct !== void 0 ? [
		plan.width * pct / 100,
		plan.height * pct / 100,
		plan.width * pct / 100,
		plan.height * pct / 100
	] : px !== void 0 ? [
		px,
		px,
		px,
		px
	] : [
		0,
		0,
		0,
		0
	];
	const step = Math.max(fd, Math.round((args.boundsStep ?? .1) / fd) * fd);
	const opts = {
		from: first * fd,
		to: end * fd,
		step,
		margins,
		boundsOf: args.boundsOf ?? "text",
		maxSamples: 400,
		maxItems: 20,
		maxProperties: 5e4,
		idleSeconds: args.idleSeconds ?? 5,
		timeDriven: IDLE_TIME_DRIVEN.source
	};
	const res = await transport.execute({
		code: structureJsx(args.compNameOrId, opts),
		label: "check_comp_structure",
		timeoutMs: 12e4
	});
	if (!res.ok) return {
		checked: false,
		reason: `structure script failed: ${res.error ?? "unknown"}`
	};
	const s = res.result;
	if (!s || s.ok !== true) return {
		checked: false,
		reason: `structure script failed: ${s?.error ?? "no result"}`
	};
	const offFrame = s.bounds.findings.map((f) => ({
		layer: {
			index: f.index,
			name: f.name,
			type: f.type
		},
		edge: f.edge,
		from: {
			time: r6(f.from),
			frame: Math.floor(f.from / fd + 1e-6)
		},
		to: {
			time: r6(f.to),
			frame: Math.floor(f.to / fd + 1e-6)
		},
		byPx: f.byPx,
		extent: f.extent,
		worstAt: {
			time: r6(f.at),
			frame: Math.floor(f.at / fd + 1e-6)
		},
		box: f.box,
		reading: `${f.type} layer ${f.index} "${f.name}" ${f.extent === "wholly" ? "is wholly" : "is partly"} past the ${f.edge} edge of the ${margins.some((m) => m > 0) ? "safe area" : "frame"} from ${r6(f.from)} s to ${r6(f.to)} s while visible, by up to ${f.byPx} px (at ${r6(f.at)} s)`
	})).sort((a, b) => a.from.time - b.from.time);
	const footageInComp = s.footage.items.filter((it) => it.usedInComps.length > 0);
	const idle = opts.idleSeconds > 0 && s.idle ? idleEntries(s.idle.layers, opts.idleSeconds) : [];
	return {
		checked: true,
		safeArea: {
			margins: {
				left: r6(margins[0]),
				top: r6(margins[1]),
				right: r6(margins[2]),
				bottom: r6(margins[3])
			},
			against: margins.some((m) => m > 0) ? "safe area" : "frame edge"
		},
		offFrame: {
			count: s.bounds.total,
			layersChecked: s.bounds.layersChecked,
			samples: s.bounds.samples,
			sampleStep: r6(step),
			boundsOf: opts.boundsOf,
			findings: offFrame,
			...s.bounds.total > offFrame.length ? { omitted: s.bounds.total - offFrame.length } : {},
			...s.bounds.skipped.length > 0 ? { skipped: s.bounds.skipped.slice(0, 20) } : {},
			note: "top-level layers of this comp only (not inside nested comps); sampled at keyframe times and every sampleStep seconds, so a range's ends are known to within one step; a layer is visible when its eye is on, the time is inside its in and out points and its own opacity is above 0 (a parent's opacity is not counted)"
		},
		missingFonts: s.fonts.ok ? {
			count: s.fonts.count ?? 0,
			fonts: (s.fonts.fonts ?? []).slice(0, 20),
			scope: "project-wide"
		} : {
			count: null,
			error: s.fonts.error
		},
		missingFootage: {
			count: s.footage.count,
			items: footageInComp.slice(0, 20).concat(s.footage.items.filter((it) => it.usedInComps.length === 0).slice(0, Math.max(0, 20 - footageInComp.length))),
			scope: "project-wide (usedInComps names the comps that use each)"
		},
		expressionErrors: {
			count: s.expressions.total,
			errors: s.expressions.errors,
			compsWalked: s.expressions.compsWalked,
			propertiesVisited: s.expressions.propertiesVisited,
			...s.expressions.truncated ? { truncated: true } : {},
			note: "read after the frames were rendered (expressionError is filled in when a broken expression is set; read late in case a just-opened project fills it only when evaluated)"
		},
		idleReport: idleReportOf(s, opts.idleSeconds, idle),
		idle: idle.slice(0, 20)
	};
}
function idleReportOf(s, idleSeconds, idle) {
	const base = {
		heading: "Report (not faults)",
		idleSeconds,
		count: idle.length,
		...idle.length > 20 ? { truncated: true } : {}
	};
	if (idleSeconds === 0) return {
		...base,
		reading: "the idle report is off (idleSeconds 0)"
	};
	if (!s.idle) return {
		...base,
		reading: "the structure script returned no change times: the idle report was not made"
	};
	return {
		...base,
		layersChecked: s.idle.layersChecked,
		exempt: s.idle.exempt,
		reading: idle.length === 0 ? `no layer is on screen longer than ${idleSeconds} s with nothing changing on it` : `${idle.length} layer${idle.length > 1 ? "s are" : " is"} on screen longer than ${idleSeconds} s with nothing changing on ${idle.length > 1 ? "them" : "it"}, longest first` + (idle.length > 20 ? ` (the first ${20} listed)` : "") + ". A report, not a fault: a held card can be intended; judge each against the brief. Not counted in counts or shown on the sheet.",
		note: "top-level layers of this comp, each over its on-screen span (in to out point, inside the comp); a change is a keyframe on the layer (any property: effects, masks, text animators), on a parent's transform (not its opacity), on its track matte, a layer marker, a time-driven expression (by its text: time, wiggle, loopIn/Out, valueAtTime, posterizeTime, Date; an expression reading another layer counts as static), or for a precomp a keyframe one level down on an enabled layer or track matte (keyed time remap or playing footage inside: always changing). A Wiggly Selector, Wiggle Paths or Wiggle Transform counts as always changing; other effects that move with no keys (particles) count as static. Between two keys with equal values (and no spatial curve) nothing moves. A stretch where the layer cannot be seen (opacity 0, or scale 0 on it or a parent) is not listed. Exempt: cameras, lights, nulls, adjustment and guide layers, footage and audio that plays, and unmasked solids and stills covering the frame with no other layer below them"
	};
}
async function makeSheet(source, outDir, flags, stretches, structure, fd, range, target, convert, maxTiles, thumbWidth, tag) {
	const tiles = /* @__PURE__ */ new Map();
	const add = (frame, kind, why) => {
		const k = Math.max(range.from, Math.min(range.to, frame));
		const tile = tiles.get(k) ?? {
			frame: k,
			kinds: []
		};
		if (!tile.kinds.includes(kind)) tile.kinds.push(kind);
		if (why !== void 0) (tile.why ??= []).push(why);
		tiles.set(k, tile);
	};
	for (const f of flags) add(f.frame, f.kind);
	for (const s of stretches) add(s.kind === "frozen" ? s.from.frame : s.worst?.frame ?? s.from.frame, s.kind);
	const off = structure?.offFrame?.findings ?? [];
	for (const o of off) add(o.from.frame, `off-${o.edge}`, `off-${o.edge}: "${o.layer.name}" at the first sampled time past the ${o.edge} edge (${o.from.time} s), while still partly in frame; the finding's worstAt is when it is furthest out`);
	if (tiles.size === 0) return {
		sheet: null,
		outstanding: []
	};
	const all = [...tiles.values()].sort((a, b) => a.frame - b.frame);
	const chosen = all.slice(0, maxTiles);
	const res = await source.capture(chosen.map((c) => c.frame), outDir);
	if ("error" in res) return {
		sheet: {
			writtenTo: null,
			error: `the sheet's frames could not be captured: ${res.error}`
		},
		outstanding: res.outstanding
	};
	const images = [];
	const labels = [];
	const kept = [];
	for (const c of chosen) {
		const got = res.frames.find((f) => f.frame === c.frame);
		if (!got?.path) continue;
		try {
			const pic = await readPicture(got.path, target, convert);
			await promises.writeFile(got.path, encodePngSrgb8(pic.width, pic.height, pic.rgb));
			images.push({
				width: pic.width,
				height: pic.height,
				rgb: pic.rgb,
				bitDepth: 8
			});
			kept.push({
				frame: c.frame,
				time: r6(c.frame * fd),
				kinds: c.kinds,
				...c.why ? { why: c.why } : {},
				path: got.path
			});
		} catch {
			await promises.rm(got.path, { force: true });
		}
	}
	if (images.length === 0) return {
		sheet: {
			writtenTo: null,
			error: "none of the sheet's frames could be read"
		},
		outstanding: res.outstanding
	};
	const tileW = Math.min(thumbWidth ?? 320, images[0].width);
	const maxChars = Math.max(4, Math.floor((tileW - 4) / 12));
	for (const k of kept) labels.push(`${k.time.toFixed(2)}s ${k.kinds.map((x) => SHORT[x] ?? x).join("+")}`.slice(0, maxChars));
	const sheet = composeContactSheet(images, {
		columns: Math.min(4, images.length),
		thumbWidth: tileW,
		labels
	});
	const sheetPath = path$1.join(outDir, `check-sheet-${tag}.png`).replace(/\\/g, "/");
	await promises.writeFile(sheetPath, encodePngSrgb8(sheet.width, sheet.height, sheet.rgb));
	return {
		sheet: {
			writtenTo: sheetPath,
			size: [sheet.width, sheet.height],
			tiles: kept.length,
			omitted: all.length - chosen.length,
			frames: kept,
			label: "each tile is labelled '<time>s <kind>' (several joined by +; black, white, clip and crush stand for near-black, near-white, clipped-high and clipped-low), time in seconds from the comp's start"
		},
		outstanding: res.outstanding
	};
}
var CAPTURE_STALL_MS, frameFile, LIST_CAP, DEFAULT_MAX_TILES, DEFAULT_IDLE_SECONDS, r6, r3, stretchSeverity, flagSeverity, thresholdsSchema, CHECK_COMP_SHAPE, checkCompTool, SHORT;
function init_check_comp() {
	return (init_check_comp = __esmMin((() => {
		init_schemas();
		init_png16();
		init_settled_read();
		init_sheet();
		init_watch();
		init_config();
		init_errors();
		init_policy();
		init_capture_shared();
		init_check_comp_jsx();
		init_define_tool();
		CAPTURE_STALL_MS = 6e4;
		frameFile = (dir, frame) => path$1.join(dir, `frame-${frame}.png`).replace(/\\/g, "/");
		LIST_CAP = 20;
		DEFAULT_MAX_TILES = 12;
		DEFAULT_IDLE_SECONDS = 5;
		r6 = (v) => Math.round(v * 1e6) / 1e6;
		r3 = (v) => Math.round(v * 1e3) / 1e3;
		stretchSeverity = (s) => s.kind === "clipped-high" || s.kind === "clipped-low" ? (s.worst?.share ?? 0) * 1e3 + s.frames : s.frames;
		flagSeverity = (f) => f.kind === "pop" || f.kind === "cut" ? f.ratio : 1 / (f.ratio + 1e-6);
		thresholdsSchema = record(string$1(), union([number(), _null()])).optional().describe("Override any threshold (the rest keep their defaults, all reported back as `thresholds`): frozenSeconds 0.5 (a run with no visible change at least this long is a frozen stretch), frozenShare 0.00002 (a pair shows no visible change when at most this share of pixels changed by more than changeAbove), darkBelow 0.04 / lightAbove 0.96 (a pixel is near-black when its brightest channel is at or below, near-white when its darkest is at or above), blackShare 0.99 / blackMean 0.01 (a frame is near-black when that share of pixels is near-black, or its mean luma is at or below), whiteShare 0.99 / whiteMean 0.99 (the same for near-white), clipHighShare 0.005 (a frame is clipped when that share of pixels is at 255 in all three channels), clipLowShare null (the same at 0; null measures but never flags: a black background is at 0 by design), and the diff thresholds of ae_render_frame: changeAbove 0.04, spikeRatio 3, holdRatio 0.25, quietBelow 0.002, movingShare 0.0005, window 3, repeatBelow 0.0001.");
		CHECK_COMP_SHAPE = {
			compNameOrId: union([string$1(), number()]).describe("Composition name or numeric item id."),
			from: number().nonnegative().optional().describe("Start of the range, seconds from the comp's start (default: the work area's start)."),
			to: number().positive().optional().describe("End of the range (exclusive), seconds from the comp's start (default: the work area's end)."),
			startFrame: number().int().nonnegative().optional().describe("Continue a range: the `next.startFrame` an earlier call returned (same other arguments)."),
			every: number().int().min(1).max(60).optional().describe("Check every Nth frame (default 1, every frame). Above 1 is faster but a one-frame pop or flash between checked frames is missed, a stutter can no longer be told from a short hold, and stretch ends are known to within N − 1 frames; the result says so in `notes`."),
			downsample: number().int().min(1).max(8).optional().describe("Capture size: 1 full, 2 half, 4 quarter (default; 270×480 for 1080×1920). Applied through the comp's resolutionFactor before saveFrameToPng and put back afterwards, even when the script fails. Whether saveFrameToPng honours it is measured on the PNG that comes back (`capture`): a full-size capture is shrunk in Node to the asked size, so the numbers mean the same either way."),
			maxFrames: number().int().min(1).max(2e3).optional().describe("Frames checked per call at most (default 300); the rest is left for `next`."),
			chunkFrames: number().int().min(1).max(300).optional().describe("Frames per After Effects script (default 100). A script returns as soon as it has asked for the frames; the files arrive over the following seconds. The next chunk is asked for only once every capture of this one has finished, so After Effects never holds more than one chunk in its queue."),
			thresholds: thresholdsSchema,
			safeArea: object$1({
				percent: number().min(0).max(45).optional().describe("Inset on each side, as a percent of the frame's width (left/right) and height (top/bottom)."),
				px: number().min(0).optional().describe("Inset on each side, comp pixels.")
			}).optional().describe("Check bounds against a safe area instead of the frame edge (default: the frame)."),
			boundsOf: _enum(["text", "all"]).optional().describe("Which layers the bounds check measures: 'text' (default) or 'all' visible layers with pixels. Other layer types are opt-in because backgrounds and shapes bleed off frame on purpose."),
			boundsStep: number().positive().optional().describe("Bounds are sampled at every keyframe time and every boundsStep seconds (default 0.1)."),
			structure: boolean().optional().describe("Run the structure checks on the call that reaches the end of the range (default true)."),
			idleSeconds: number().min(0).optional().describe(`The idle report (structure.idle) lists layers on screen longer than this with nothing changing on them (default ${5} s; 0 turns it off). A report for the reviewer, never a fault.`),
			colorManaged: _enum(["auto", "off"]).optional().describe("'auto' (default) measures the picture after colour conversion, as ae_render_frame; 'off' the raw capture."),
			settleTimeoutMs: number().int().positive().optional().describe("How long to wait for the first captures of each chunk (default: grows with the chunk). The wait then goes on for as long as captures keep finishing, so a long or heavy comp is not cut off by it."),
			stallTimeoutMs: number().int().positive().optional().describe(`After Effects is taken to have stopped writing when no capture has finished for this long (default ${CAPTURE_STALL_MS / 1e3} s). The check then queues nothing more, keeps the capture folder (After Effects may still write into it) and says how many captures were outstanding and where to continue.`),
			outDir: string$1().optional().describe("Folder for the contact sheet and its frames (default: a new folder under the system temp folder)."),
			sheet: union([boolean(), object$1({
				maxTiles: number().int().min(1).max(48).optional(),
				thumbWidth: number().int().min(64).max(1024).optional()
			})]).optional().describe("The contact sheet of flagged moments (default on, at most 12 tiles; the rest are counted).")
		};
		checkCompTool = defineTool({
			name: "ae_check_comp",
			title: "Check comp",
			description: "Check a whole comp the way a viewer would watch it, in one call: walks the work area (or `from`..`to`), renders every frame (or every `every`th) at a reduced size, measures each in Node and lists what stands out. Flagged moments (`flags`, sorted by time): a one-frame pop or flash, a cut or jump, a stutter (a frame repeated while the frames around move) and a repeat at the edge of the range — the `diff` flags of ae_render_frame over the whole piece. Stretches: frozen (no visible change for at least frozenSeconds; a held title is legitimate, the report states the fact), near-black and near-white frames, and clipping (pixels at 255 in all three channels, with the box where they sit; per-channel shares alongside). Structure, read from the project on the call that reaches the end of the range: text layers whose bounds leave the frame (or `safeArea`) while visible — layer, time range, edge, by how many pixels, partly or wholly outside — missing fonts and footage, expressions in error (in nested comps too), and a report (not faults) of layers on screen and visible with nothing changing on them for longer than `idleSeconds`. One contact sheet tiles the flagged moments, labelled with time and kind; the frames on it are kept beside it, every other capture is deleted as soon as it is measured. A clean comp returns empty lists and no sheet. Bounded: at most `maxFrames` frames a call (default 300); when the range is not finished the result says where to continue (`next.startFrame`): call again with the same arguments plus that startFrame. Captures are asked of After Effects a chunk at a time, the next chunk only once every capture of the last has finished writing, and the wait follows After Effects' pace (it goes on while captures keep arriving), so a long comp is not cut off part way. The check never returns with its captures still queued unless After Effects stopped writing (none finished for `stallTimeoutMs`): it then asks for nothing more, keeps the capture folder instead of deleting it, and says so in `captureQueue`; `coverage` says how many of the call's frames were measured. Numbers are display values of the picture the viewer sees (stage 'output', after colour conversion, as ae_render_frame writes the file), with the thresholds used; it never says pass or fail. Times are seconds from the comp's start (frame × frame duration), ignoring the display start time.",
			group: "render",
			blockedInReadOnly: false,
			effect: "write",
			inputShape: CHECK_COMP_SHAPE,
			handler: async (args, transport) => {
				const invalid = (message) => errorResult("INVALID_ARGS", message);
				if (args.thresholds !== void 0) {
					const err = watchArgsError(args.thresholds);
					if (err) return invalid(err);
				}
				if (args.from !== void 0 && args.to !== void 0 && args.to <= args.from) return invalid("`to` must be after `from`");
				if (args.safeArea && args.safeArea.percent === void 0 === (args.safeArea.px === void 0)) return invalid("`safeArea` takes exactly one of `percent` or `px`");
				if (args.outDir !== void 0) {
					const rejection = rejectedOutputPath(args.outDir);
					if (rejection !== null) return errorResult("IO", rejection, { hint: "Pick a folder outside the mailbox." });
				}
				return checkComp(args, transport);
			}
		});
		SHORT = {
			"near-black": "black",
			"near-white": "white",
			"clipped-high": "clip",
			"clipped-low": "crush"
		};
	})))();
}

// server/tools/comp-info.js
var compInfoTool;
function init_comp_info() {
	return (init_comp_info = __esmMin((() => {
		init_schemas();
		init_snippets();
		init_registry();
		init_define_tool();
		compInfoTool = defineTool({
			name: "ae_comp_info",
			title: "Comp info",
			description: "Detailed comp info: size, fps, duration, work area, motion blur, comp markers (`markers.keyframes`: each `time` in seconds and `value.comment`, `value.duration`; null when there are none), layer summaries. Pass a comp name or item id — or an ARRAY of them to fetch several comps in one call.",
			group: "inspect",
			blockedInReadOnly: false,
			effect: "read",
			inputShape: { nameOrId: union([
				string$1(),
				number(),
				array(union([string$1(), number()])).min(1)
			]).describe("Composition name (exact match) or numeric item id — or an array of either to batch several comps into one round trip. If you don't know any, call ae_project_info first.") },
			handler: async (args, transport) => {
				const targets = Array.isArray(args.nameOrId) ? args.nameOrId : null;
				const code = targets ? `
        ${COMP_INFO_FN}
        var _targets = ${jsxVal(targets)};
        var _comps = [];
        var _misses = 0;
        for (var _ti = 0; _ti < _targets.length; _ti++) {
            var _c = AE.findCompByNameOrId(_targets[_ti]);
            if (_c) {
                _comps.push(_compInfo(_c));
            } else {
                _misses++;
                _comps.push({ ok: false, found: false, error: "no comp matching " + String(_targets[_ti]) });
            }
        }
        return { ok: _misses === 0, count: _comps.length, missing: _misses, comps: _comps };
    ` : `
        ${COMP_INFO_FN}
        var _arg = ${jsxVal(args.nameOrId)};
        var _c = AE.findCompByNameOrId(_arg);
        if (!_c) return { ok: false, found: false, error: "no comp matching " + String(_arg) };
        return _compInfo(_c);
    `;
				const result = await transport.execute({
					code,
					label: "comp_info"
				});
				return toMcpResult(result);
			}
		});
	})))();
}

// server/tools/context.js
var CODE, contextTool;
function init_context() {
	return (init_context = __esmMin((() => {
		init_instances();
		init_define_tool();
		CODE = `
    var proj = app.project;
    var ai = proj.activeItem;
    // The resident agent (pull path) marks the instance that answered; null
    // means this call came in through the push path (AfterFX.exe -r).
    var agent = AE.safeGet(function () { return $.global.AE_MCP_AGENT || null; }, null);
    var ctx = {
        project: {
            file: proj.file ? proj.file.fsName.replace(/\\\\/g, "/") : null,
            dirty: proj.dirty,
            numItems: proj.numItems,
            bitsPerChannel: proj.bitsPerChannel
        },
        instance: agent ? {
            id: agent.state.id,
            idSource: agent.state.idSource,
            served: agent.state.served
        } : null,
        activeComp: null,
        selectedLayers: [],
        helpers: [
            "AE.findCompByNameOrId(nameOrId)",
            "AE.findComps(nameOrIdOrPattern) \u2014 '*' glob supported",
            "AE.findItemById(id)",
            "AE.findItem(idOrName) \u2014 any project item",
            "AE.findFolder(idOrName) \u2014 null/undefined = root folder",
            "AE.findLayerInComp(comp, indexOrNameOrIdRef) \u2014 accepts { id: n } (stable Layer.id, AE 22+)",
            "AE.findLayerById(comp, id)",
            "AE.resolveLayers(comp, target) \u2014 index | name | { id: n } | 'selected' | 'all' | array of those",
            "AE.snapshotKeys(prop) / AE.applyKeys(prop, keys) / AE.removeAllKeys(prop)",
            "AE.setEase(prop, keyIndex, inInf, outInf, inSpeed?, outSpeed?) \u2014 dims/spatial handled",
            "AE.writeValue(prop, value, time?) / AE.readValue(prop, time?) \u2014 separated-dimension safe, __kind values accepted",
            "AE.offsetValue(prop, delta) \u2014 shift a value or every keyframe",
            "AE.applyKeySpecs(prop, [{time, value, interp?}], {replace, interp, spatialTangents}) \u2014 keyframe.apply's engine",
            "AE.moveAnchor(layer, [x, y]) \u2014 anchor move with position compensation",
            "AE.layerRect(layer, time) / AE.pointInRect(rect, preset) \u2014 anchor presets on rendered bounds",
            "AE.shapeGroupBounds(group, {time, includeStroke}) / AE.shapeLayerBounds(layer, opts)",
            "AE.walkShapeContents(contents, fn) / AE.recolorContents(contents, opts) / AE.canonicalGroup(group, precision)",
            "AE.geometryShape('ellipse'|'rect', center, size, roundness) \u2014 a Shape for masks/paths",
            "AE.propertyAtPath(root, path) \u2014 null instead of throwing",
            "AE.ownerLayer(prop) \u2014 the layer a property belongs to",
            "AE.bakeKeysAtTime(root, time) \u2014 freeze every animated property below root",
            "AE.layerIdSnapshot(comp) / AE.layersSince(comp, snap) \u2014 which layers a command created",
            "AE.withSelection(comp, layers, fn) \u2014 run a menu command on exactly these layers, selection restored",
            "AE.rect(shapeLayerOrGroup, [w,h], [x,y], {name, roundness, fill:[r,g,b], stroke, strokeWidth}) \u2014 group+path+style in one call",
            "AE.ellipse(shapeLayerOrGroup, [w,h], [x,y], {name, fill, stroke, strokeWidth})",
            "AE.ensureParentDir(path) \u2014 mkdir -p for an output file, returns the File",
            "AE.fitSpatialTangent(tangent, dims) \u2014 pad or trim a spatial tangent to the property's component count (Position holds 3 even on a 2D layer)",
            "AE.itemTypeName(item) \u2014 'CompItem' | 'FootageItem' | 'FolderItem' | 'UnknownItem'",
            "AE.serializeItemSummary(item)",
            "AE.serializeLayerSummary(layer)",
            "AE.serializeLayerFull(layer, opts) \u2014 opts.detail:'summary' drops default-value props",
            "AE.serializeTransform(layer)",
            "AE.serializePropertyGroup(group, depth, maxDepth, opts)",
            "AE.serializeCompMarkers(comp)",
            "AE.exportProject()",
            "AE.importProject(doc, opts)",
            "AE.safeGet(fn, fallback)",
            "AE.valueToJson(val)"
        ],
        es3Rules: [
            "var only (no let/const)",
            "function() {} only (no arrow =>)",
            "string concat only (no template literals)",
            "for(var i=0;i<n;i++) only (no for-of, no forEach/map/filter)",
            "indexOf !== -1 (no includes/startsWith/endsWith)",
            "NEVER chain ternaries: a ? b : c ? d : e parses LEFT-associative in ExtendScript \u2014 parenthesize or use if/else",
            "log('msg') to push breadcrumbs",
            "return <JSON-serializable> at end"
        ],
        tips: [
            "reparenting a layer that has keyframes: use layer.set_parent with jump:true (no transform compensation) \u2014 plain parent assignment rewrites values and corrupts keys",
            "easing: keyframe.set_easing (op) or AE.setEase (eval) \u2014 both handle the spatial=1/per-dimension KeyframeEase bookkeeping",
            "auditing a comp: ae_layer_info layerIndex:'all' with detail:'summary' skips default-value properties and includes key ease (speed/influence)",
            "render queue output folders are auto-created on render.add_to_queue / render.set_output / render.start",
            "many keys at once: keyframe.apply takes the whole list with per-key easing; its 'hold' only holds the OUT side, so a fade that ends in a hold key still fades",
            "Position separated into X/Y (Separate Dimensions, or layers from 'Create Shapes from Vector Layer'): every write op and AE.writeValue route to the followers automatically",
            "imported Illustrator layers: layer.convert_to_shapes (strips ' Outlines', can remove the source layer/footage); then shape.group_bounds / layer.split_groups to work per part",
            "layer targets accept arrays everywhere they accept 'all' \u2014 [\\"A\\", \\"B\\", { id: 12 }] is one call",
            "verifying motion: ae_render_frame times + contactSheet tiles the frames into one labelled PNG; analyze reports edge bands / content bounds; comp.sample reads values at several times",
            "several After Effects instances (AfterFX.exe -m): each MCP server addresses ONE, chosen by AE_MCP_INSTANCE (instance id or open project file name); the response's instances[] lists what is live \u2014 if the project you need is open elsewhere, say so instead of editing the wrong one"
        ],
        undoContract: [
            "every ae_do / eval.run call is auto-wrapped in ONE undo group",
            "one Ctrl+Z (or project.undo) reverts the entire call; batch.run = one call = one undo step",
            "NEVER call app.beginUndoGroup/endUndoGroup in eval.run code \u2014 an unbalanced group corrupts undo for the session",
            "if a call that changes the project THROWS, its own changes are rolled back before the error is returned: a marker is added inside the still-open group, the group is closed and undone once with dialogs suppressed; details.rollback says whether it worked (rolledBack, verified) and what is left if not \u2014 never undo again for a call that was rolled back",
            "a call that changed nothing is never followed by an undo (that would revert the user's previous action); read-only calls and calls outside the group (undo, redo, project open/new) are never rolled back",
            "eval.run and batch.run take rollback: false to keep a partial result; batch.run with stopOnError rolls the whole batch back unless rollback: false, and without stopOnError nothing is rolled back",
            "after a rollback, Redo would replay the failed call (and its marker folder): do not redo it",
            "render queue: After Effects 2027 has gone into crash recovery on undo after scripted render-queue changes (observed twice on 2026-11-10; a precaution, not a proven cause). A call that changed the render queue is never rolled back (details.rollback lists addedItems and what to do next), and once any call changed it, rollback and project.undo / project.redo / command 16/2035 refuse for the rest of the session unless acceptRenderQueueRisk: true (save first). project.open / project.new clear the block; ae_do's context shows undoBlocked while it is set",
            "undo/redo itself runs OUTSIDE the group, with dialogs suppressed: use project.undo / project.redo (or command.execute 16/2035) as its own call \u2014 never inside batch.run, and never via eval.run; their result reports any error After Effects raised (aeErrors, warning)",
            "a timeout AFTER the request was picked up most likely means a modal dialog in After Effects (instance.dialogs may not see it): look at the After Effects window before retrying",
            "ae_save_project and files written to disk (rendered PNGs, exported JSON) are NOT undoable"
        ]
    };
    if (ai && ai instanceof CompItem) {
        ctx.activeComp = {
            id: ai.id,
            name: ai.name,
            width: ai.width,
            height: ai.height,
            fps: ai.frameRate,
            duration: ai.duration,
            numLayers: ai.numLayers,
            bgColor: [ai.bgColor[0], ai.bgColor[1], ai.bgColor[2]]
        };
        var sel = [];
        for (var si = 1; si <= ai.numLayers; si++) {
            if (ai.layer(si).selected) sel.push({ index: si, name: ai.layer(si).name });
        }
        ctx.selectedLayers = sel;
    }
    // Item summary (compact). Type via AE.itemTypeName \u2014 the inline ternary
    // chain this used to be labelled EVERY item "Folder": ExtendScript parses
    // a ? b : c ? d : e left-associatively.
    var items = [];
    for (var i = 1; i <= Math.min(proj.numItems, 50); i++) {
        var it = proj.item(i);
        items.push({
            id: it.id,
            name: it.name,
            type: AE.itemTypeName(it)
        });
    }
    ctx.items = items;
    if (proj.numItems > 50) ctx.itemsTruncated = true;
    return ctx;
`;
		contextTool = defineTool({
			name: "ae_context",
			title: "Session context",
			description: "Ambient context: project state, active comp, selected layers, item list, AE.* helpers, ES3 rules, and the undo contract (every call = one auto undo group; a call that throws is rolled back). Call at session start; then rely on ae_do response context.",
			group: "inspect",
			blockedInReadOnly: false,
			effect: "read",
			inputShape: {},
			handler: async (_args, transport) => {
				const result = await transport.execute({
					code: CODE,
					label: "context"
				});
				if (!result.ok) return toMcpResult(result);
				const [instances, target] = await Promise.all([listInstances(), transport.describeTarget ? transport.describeTarget() : Promise.resolve(null)]);
				const merged = {
					...result.result !== null && typeof result.result === "object" && !Array.isArray(result.result) ? result.result : { value: result.result },
					transport: target === null ? null : target.mode === "pull" ? {
						mode: "pull",
						instance: target.instance.id
					} : target.mode === "push" ? { mode: "push" } : {
						mode: "error",
						message: target.message
					},
					instances: instances.map((i) => ({
						label: instanceLabel(i),
						id: i.id,
						alive: i.alive,
						busy: i.heartbeat?.busy ?? false,
						project: i.heartbeat?.project ?? null,
						aeVersion: i.heartbeat?.aeVersion ?? null,
						lastSeenMsAgo: i.ageMs
					}))
				};
				return toMcpResult({
					...result,
					result: merged
				});
			}
		});
	})))();
}

// server/tools/do.js
function rollbackSentence(rb) {
	if (!rb) return "";
	const errors = rb.aeErrors?.length ? ` After Effects reported during the undo: ${rb.aeErrors.join(" | ")}.` : "";
	if (rb.rolledBack) return ` \u2014 Rolled back: the call's changes were undone before this error was returned (${rb.verified === "signature" ? "checked against the project's items before the call" : rb.verified === "partial" ? "checked against the first 1000 items and the item count" : "checked by the rollback marker only"}).${errors}`;
	const next = rb.next ? ` Next: ${rb.next}` : "";
	if (!rb.attempted) return ` \u2014 Not rolled back (${rb.reason ?? "no reason given"})${rb.left ? `: ${rb.left}` : ""}.${next}${errors}`;
	return ` \u2014 NOT rolled back: ${rb.reason ?? "the rollback could not be confirmed"}. Left: ${rb.left ?? "unknown — inspect the project"}.${next}${errors}`;
}
function isBatchShaped(opResult) {
	if (opResult === null || typeof opResult !== "object") return false;
	return Array.isArray(opResult.results);
}
function countLines(text) {
	let n = 0;
	for (let i = 0; i < text.length; i++) if (text[i] === "\n") n++;
	return n;
}
function jsxErrorLocation(line, wrappedCode, wrapperLinesAboveUserJsx, opName, source) {
	if (typeof line !== "number" || !Number.isFinite(line)) return {};
	const wrappedLine = line - NEW_FUNCTION_HEADER_LINES;
	const out = { errorLine: line };
	const userLine = wrappedLine - wrapperLinesAboveUserJsx;
	if (opName === "eval.run") {
		if (userLine >= 1 && userLine <= source.userLines) {
			out.userCodeLine = userLine;
			if (source.file !== null) {
				out.file = source.file;
				out.fileLine = userLine;
			}
		} else out.inWrapper = true;
	}
	const lines = wrappedCode.split("\n");
	if (wrappedLine >= 1 && wrappedLine <= lines.length) {
		const from = Math.max(1, wrappedLine - 2);
		const to = Math.min(lines.length, wrappedLine + 2);
		const excerpt = [];
		for (let n = from; n <= to; n++) excerpt.push(`${n === wrappedLine ? ">" : " "} ${n - wrapperLinesAboveUserJsx}| ${lines[n - 1]}`);
		out.codeExcerpt = excerpt.join("\n");
	}
	return out;
}
function callerLineMessage(message, line, location) {
	if (typeof line !== "number") return message;
	const raw = `(line ${line})`;
	if (message.indexOf(raw) === -1) return message;
	let replacement = null;
	if (typeof location.fileLine === "number" && typeof location.file === "string") replacement = `(${location.file}:${location.fileLine})`;
	else if (typeof location.userCodeLine === "number") replacement = `(line ${location.userCodeLine} of your code)`;
	else if (location.inWrapper === true) replacement = `(line ${line} of the plugin's wrapper, not your code \u2014 see details.codeExcerpt)`;
	return replacement === null ? message : message.replace(raw, replacement);
}
var doTool, NEW_FUNCTION_HEADER_LINES;
function init_do() {
	return (init_do = __esmMin((() => {
		init_schemas();
		init_errors();
		/* @__PURE__ */ init_opschema();
		init_policy();
		init_registry();
		init_define_tool();
		doTool = defineTool({
			name: "ae_do",
			title: "Execute operation",
			description: "Execute an atomic operation by name (from ae_catalog). Operations can create, change and delete project content; open, close, clear and save projects; render and write files; run After Effects menu commands; change After Effects preferences; start or stop After Effects instances; read and close dialogs that block scripting; and, through eval.run when enabled, run custom ExtendScript with the user's own access to After Effects, files and system commands. Arguments are validated against the operation's declared parameters before anything reaches AE. Have more than one operation to run? Wrap them in ONE batch.run instead of several ae_do calls — read/verify steps (comp.info, layer.info, render.frame) can ride in the same batch. Every call is automatically wrapped in ONE undo group: a single Ctrl+Z (or project.undo) reverts the entire call, and a batch.run counts as one call. If a call that changes the project THROWS, its own changes are rolled back before the error is returned (one undo, with dialogs suppressed); details.rollback says whether that worked and what is left if not. eval.run and batch.run take rollback: false to keep a partial result. Never call app.beginUndoGroup/endUndoGroup in eval.run code — the wrapper already did. The exception is undo/redo itself (project.undo, project.redo, command.execute id 16/2035): those run outside the group, with dialogs suppressed, report any error After Effects raised, and cannot ride inside a batch.run. Response includes ambient context (active comp, selected layers, project state) at zero extra round trips. Example: ae_do({ operation: 'keyframe.add', args: { comp: 'Main', layer: 1, property: ['Transform','Position'], time: 2, value: [960,540] } })",
			group: "operations",
			blockedInReadOnly: false,
			effect: "destructive",
			inputShape: {
				operation: string$1().describe("Operation name from ae_catalog (e.g. 'layer.create_solid', 'keyframe.add')."),
				args: record(string$1(), unknown()).optional().describe("Arguments for the operation. Validated against ae_catalog's declared params: missing required args, wrong types, and unknown keys are rejected before AE is contacted. Omit for zero-param operations."),
				timeoutMs: number().int().positive().optional().describe("Per-call timeout in milliseconds (default 60000). Raise for long operations like render.start or big batch.run calls.")
			},
			handler: async (doArgs, transport) => {
				const op = getOp(doArgs.operation);
				if (!op) {
					const withheld = denyUnregisteredOperation(doArgs.operation);
					if (withheld) return errorResult("FORBIDDEN", withheld.message, {
						details: { operation: doArgs.operation },
						hint: withheld.hint
					});
					const suggestion = suggestName(doArgs.operation, listOps().map((o) => o.name));
					return errorResult("UNKNOWN_OPERATION", `unknown operation '${doArgs.operation}'`, {
						details: {
							operation: doArgs.operation,
							suggestion
						},
						hint: suggestion ? `Did you mean '${suggestion}'? Use ae_catalog to list operations.` : "Use ae_catalog to discover available operations."
					});
				}
				const denial = denyOperation(op);
				if (denial) return errorResult("FORBIDDEN", denial.message, {
					details: {
						operation: op.name,
						category: op.category
					},
					hint: denial.hint
				});
				const validated = validateOpArgs(op, doArgs.args);
				if (!validated.ok) return errorResult("INVALID_ARGS", `invalid arguments for '${op.name}': ` + validated.issues.map((i) => `${i.path} \u2014 ${i.message}`).join("; "), {
					details: {
						operation: op.name,
						issues: validated.issues,
						expected: summarizeParams(op.params)
					},
					hint: `ae_catalog({ category: '${op.category}' }) returns the full parameter reference.`
				});
				const consent = denyAppConfig(op, validated.value);
				if (consent) return errorResult("FORBIDDEN", consent, {
					details: {
						operation: op.name,
						category: op.category
					},
					hint: "Ask the user first if they have not explicitly requested this change."
				});
				const prepared = prepareOp(op, validated.value);
				if (!prepared.ok) return errorResult("INVALID_ARGS", `invalid arguments for '${op.name}': ${prepared.error}`, {
					details: { operation: op.name },
					...prepared.hint ? { hint: prepared.hint } : {}
				});
				const opArgs = prepared.args;
				const sourceFile = prepared.source?.file ?? null;
				if (op.run) {
					const started = Date.now();
					let opResult2;
					try {
						opResult2 = await op.run(opArgs, transport);
					} catch (err) {
						return errorResult("TRANSPORT", `${op.name}: ${err instanceof Error ? err.message : String(err)}`, {
							details: { operation: op.name },
							stack: err instanceof Error ? err.stack ?? null : null,
							durationMs: Date.now() - started
						});
					}
					const reported2 = jsxReportedFailure(opResult2);
					if (reported2) {
						const extra = opResult2;
						return errorResult(extra.errorCode ?? "OPERATION_FAILED", `${op.name}: ${reported2.error}`, {
							details: {
								operation: op.name,
								result: opResult2
							},
							durationMs: Date.now() - started,
							...extra.hint ? { hint: extra.hint } : {}
						});
					}
					return jsonResult({
						result: opResult2,
						context: null,
						logs: [],
						durationMs: Date.now() - started
					});
				}
				const userJsx = op.toJsx(opArgs);
				const wrappedCode = `
        var _opResult = (function() {
            ${userJsx}
        })();
        ${AMBIENT_CONTEXT_JSX}
        return { result: _opResult, context: _ctx };
    `;
				const wrapperLinesAboveUserJsx = countLines(wrappedCode.slice(0, wrappedCode.indexOf(userJsx)));
				const result = await transport.execute({
					code: wrappedCode,
					label: op.name,
					undoGroup: wantsUndoGroup(op, opArgs),
					suppressDialogs: wantsDialogSuppression(op, opArgs),
					rollback: wantsRollback(op, opArgs),
					acceptRenderQueueRisk: opArgs.acceptRenderQueueRisk === true,
					timeoutMs: doArgs.timeoutMs ?? 6e4
				});
				if (!result.ok) {
					const location = jsxErrorLocation(result.line, wrappedCode, wrapperLinesAboveUserJsx, op.name, {
						userLines: countLines(userJsx) + 1,
						file: sourceFile
					});
					const message = callerLineMessage(result.error ?? "unknown failure", result.line, location) + rollbackSentence(result.rollback);
					return errorResult(result.errorCode ?? "TRANSPORT", message, {
						details: {
							operation: op.name,
							...location,
							...result.rollback ? { rollback: result.rollback } : {},
							...result.dialogs?.length ? { dialogs: result.dialogs } : {}
						},
						stack: result.stack,
						logs: result.logs,
						durationMs: result.durationMs
					});
				}
				const { result: opResult, context } = result.result;
				const reported = jsxReportedFailure(opResult);
				if (reported) return errorResult("OPERATION_FAILED", `${op.name}: ${reported.error}${rollbackSentence(result.rollback)}`, {
					details: {
						operation: op.name,
						result: opResult,
						context,
						...result.rollback ? { rollback: result.rollback } : {}
					},
					logs: result.logs,
					durationMs: result.durationMs,
					...isBatchShaped(opResult) ? { hint: "Inspect details.result.results — each entry matches the input order and carries its own error." } : {}
				});
				return jsonResult({
					result: opResult,
					context,
					logs: result.logs,
					durationMs: result.durationMs,
					...result.rollback ? { rollback: result.rollback } : {}
				});
			}
		});
		NEW_FUNCTION_HEADER_LINES = 1;
	})))();
}

// server/tools/layer-info.js
var layerInfoTool;
function init_layer_info() {
	return (init_layer_info = __esmMin((() => {
		init_schemas();
		init_snippets();
		init_registry();
		init_define_tool();
		layerInfoTool = defineTool({
			name: "ae_layer_info",
			title: "Layer info",
			description: "Full layer info: transform, effects, masks, text, shape contents, keyframes (incl. interpolation names and bezier ease speed/influence). layerIndex accepts one index, an ARRAY of indices, or 'all' — auditing a whole comp is one call. detail:'summary' drops properties still at their default value (unkeyed, no expression) — start there for audits; the full tree is often 100KB+ per comp. Set includeProperties=false to skip the property tree walk entirely.",
			group: "inspect",
			blockedInReadOnly: false,
			effect: "read",
			inputShape: {
				compNameOrId: union([string$1(), number()]).describe("Composition name (exact match) or numeric item id."),
				layerIndex: union([
					number().int().positive(),
					array(number().int().positive()).min(1),
					literal("all")
				]).describe("1-based layer index — or an array of indices, or 'all' for every layer in the comp, returned together in one round trip."),
				includeProperties: boolean().optional().describe("Include the full property tree (Transform/Effects/Masks/Text). Default true."),
				detail: _enum(["full", "summary"]).optional().describe("'summary' omits properties still at their default value (no keyframes, no expression, never touched) — typically 5-10x smaller. Group skeletons are kept, so effects/masks still show. Default 'full'.")
			},
			handler: async (args, transport) => {
				const multi = typeof args.layerIndex !== "number";
				const detailJsx = jsxVal(args.detail ?? "full");
				const code = multi ? `
        ${LAYER_FULL_FN}
        var _arg = ${jsxVal(args.compNameOrId)};
        var _incl = ${jsxVal(args.includeProperties !== false)};
        var _detail = ${detailJsx};
        var comp = AE.findCompByNameOrId(_arg);
        if (!comp) return { ok: false, found: false, error: "no comp matching " + String(_arg) };
        var _spec = ${jsxVal(args.layerIndex)};
        var _idxs = [];
        if (_spec === "all") {
            for (var _ai = 1; _ai <= comp.numLayers; _ai++) _idxs.push(_ai);
        } else {
            _idxs = _spec;
        }
        var _layers = [];
        var _misses = 0;
        for (var _li = 0; _li < _idxs.length; _li++) {
            var _idx = _idxs[_li];
            if (_idx < 1 || _idx > comp.numLayers) {
                _misses++;
                _layers.push({ ok: false, found: false, index: _idx, error: "layer index " + _idx + " out of range 1.." + comp.numLayers });
            } else {
                _layers.push(_layerFull(comp.layer(_idx), _incl, _detail));
            }
        }
        return { ok: _misses === 0, compName: comp.name, count: _layers.length, missing: _misses, layers: _layers };
    ` : `
        ${LAYER_FULL_FN}
        var _arg = ${jsxVal(args.compNameOrId)};
        var _idx = ${jsxVal(args.layerIndex)};
        var _incl = ${jsxVal(args.includeProperties !== false)};
        var _detail = ${detailJsx};
        var comp = AE.findCompByNameOrId(_arg);
        if (!comp) return { ok: false, found: false, error: "no comp matching " + String(_arg) };
        if (_idx < 1 || _idx > comp.numLayers) return { ok: false, found: false, error: "layer index " + _idx + " out of range 1.." + comp.numLayers };
        return _layerFull(comp.layer(_idx), _incl, _detail);
    `;
				const result = await transport.execute({
					code,
					label: "layer_info"
				});
				return toMcpResult(result);
			}
		});
	})))();
}

// server/tools/project-export.js
var projectExportTool;
function init_project_export() {
	return (init_project_export = __esmMin((() => {
		init_schemas();
		init_config();
		init_errors();
		init_define_tool();
		projectExportTool = defineTool({
			name: "ae_project_export_json",
			title: "Export project JSON",
			description: "Serialize the entire project to JSON (folders, comps, layers, keyframes, effects, shapes, markers, time remap, solids, file refs). Write to `outPath` or return inline.",
			group: "document",
			blockedInReadOnly: false,
			effect: "write",
			inputShape: {
				outPath: string$1().optional().describe("If set, write the exported JSON to this absolute path on disk. If omitted, the JSON is returned inline in the tool response (can get large)."),
				pretty: boolean().optional().describe("Pretty-print the JSON (2-space indent). Default: true when writing to disk, false otherwise.")
			},
			handler: async (args, transport) => {
				if (args.outPath) {
					const rejection = rejectedOutputPath(args.outPath);
					if (rejection !== null) return errorResult("IO", rejection, {
						details: { outPath: path$1.resolve(args.outPath) },
						hint: "Write the document somewhere outside the mailbox, or omit outPath to receive it inline."
					});
				}
				const result = await transport.execute({
					code: `
        var doc = AE.exportProject();
        return doc;
    `,
					label: "project_export_json",
					timeoutMs: 3e5
				});
				if (!result.ok) return toMcpResult(result);
				const doc = result.result;
				const pretty = args.pretty ?? !!args.outPath;
				const jsonText = JSON.stringify(doc, null, pretty ? 2 : 0);
				if (args.outPath) {
					const abs = path$1.resolve(args.outPath);
					try {
						await promises.mkdir(path$1.dirname(abs), { recursive: true });
						await promises.writeFile(abs, jsonText, "utf8");
					} catch (err) {
						return errorResult("IO", `exported the project but could not write ${abs}: ${err instanceof Error ? err.message : String(err)}`, {
							details: {
								outPath: abs,
								bytes: Buffer.byteLength(jsonText, "utf8")
							},
							hint: "Pick a writable absolute path, or omit outPath to receive the document inline."
						});
					}
					return jsonResult({
						writtenTo: abs.replace(/\\/g, "/"),
						bytes: Buffer.byteLength(jsonText, "utf8"),
						itemCount: doc && typeof doc === "object" && "items" in doc ? doc.items?.length ?? 0 : 0,
						durationMs: result.durationMs
					});
				}
				return {
					content: [{
						type: "text",
						text: jsonText
					}],
					structuredContent: {
						ok: true,
						doc,
						durationMs: result.durationMs
					},
					isError: false
				};
			}
		});
	})))();
}

// server/tools/project-import.js
function summarizePlan(doc) {
	const items = doc.items ?? [];
	let folders = 0, comps = 0, solids = 0, files = 0, layers = 0;
	for (const it of items) if (it.type === "FolderItem") folders++;
	else if (it.type === "CompItem") {
		comps++;
		if (Array.isArray(it.layers)) layers += it.layers.length;
	} else if (it.type === "FootageItem") {
		const sk = it.sourceKind;
		if (sk === "solid") solids++;
		else if (sk === "file") files++;
	}
	return {
		folders,
		comps,
		solids,
		files,
		layers
	};
}
var projectImportTool;
function init_project_import() {
	return (init_project_import = __esmMin((() => {
		init_schemas();
		init_errors();
		init_validate();
		init_define_tool();
		projectImportTool = defineTool({
			name: "ae_project_import_json",
			title: "Import project JSON",
			description: "Rebuild the project from JSON (produced by ae_project_export_json). Supports `clearFirst` (removes every existing project item before importing), `dryRun` (validate-only), `skipValidation`.",
			group: "document",
			blockedInReadOnly: true,
			effect: "destructive",
			inputShape: {
				inPath: string$1().optional().describe("Absolute path to a JSON document produced by ae_project_export_json. Mutually exclusive with `json`."),
				json: unknown().optional().describe("Inline JSON document (object, not string). Mutually exclusive with `inPath`."),
				clearFirst: boolean().optional().describe("Remove all existing items from the current project before importing. Default: false (appends)."),
				dryRun: boolean().optional().describe("If true, validate the document and return a plan without touching AE. Useful for debugging malformed exports."),
				skipValidation: boolean().optional().describe("Skip Node-side schema validation. Only use if you trust the input and want to hand broken data to AE for diagnosis.")
			},
			handler: async (args, transport) => {
				let doc;
				if (args.inPath) {
					const abs = path$1.resolve(args.inPath);
					try {
						doc = JSON.parse(await promises.readFile(abs, "utf8"));
					} catch (err) {
						return errorResult("IO", `cannot read project document at ${abs}: ${err instanceof Error ? err.message : String(err)}`, { details: { inPath: abs } });
					}
				} else if (args.json !== void 0) doc = args.json;
				else return errorResult("INVALID_ARGS", "must provide either `inPath` or `json`", { hint: "`inPath` takes an absolute path to a document produced by ae_project_export_json; `json` takes the document inline as an object." });
				let warnings = [];
				if (!args.skipValidation) {
					const v = validateAeProjectDoc(doc);
					if (!v.ok) return errorResult("VALIDATION", "document failed schema validation:\n" + v.issues.map((i) => `  ${i.path || "(root)"}: ${i.message}`).join("\n"), {
						details: {
							issues: v.issues,
							warnings: v.warnings
						},
						hint: "Run with dryRun: true to inspect the plan, or skipValidation: true to hand the document to AE as-is for diagnosis."
					});
					warnings = v.warnings;
				}
				if (args.dryRun) {
					const items = doc.items ?? [];
					return jsonResult({
						dryRun: true,
						valid: !args.skipValidation,
						itemCount: items.length,
						warnings,
						summary: summarizePlan(doc)
					});
				}
				const result = await transport.execute({
					code: `
        return AE.importProject(payload.doc, payload.opts);
    `,
					payload: {
						doc,
						opts: { clearFirst: !!args.clearFirst }
					},
					label: "project_import_json",
					timeoutMs: 6e5
				});
				return toMcpResult(result);
			}
		});
	})))();
}

// server/tools/project-info.js
function projectInfoCode(args) {
	const limit = Math.max(1, Math.min(1e3, Math.floor(args.limit ?? 100)));
	const offset = Math.max(0, Math.floor(args.offset ?? 0));
	return `
    var proj = app.project;
    var _limit = ${jsxVal(limit)};
    var _offset = ${jsxVal(offset)};
    var counts = {};
    var items = [];
    for (var i = 1; i <= proj.numItems; i++) {
        var it = proj.item(i);
        var tn = AE.itemTypeName(it);
        counts[tn] = (counts[tn] || 0) + 1;
        if (i > _offset && items.length < _limit) items.push(AE.serializeItemSummary(it));
    }
    var active = proj.activeItem;
    var shownTo = Math.min(proj.numItems, _offset + items.length);
    return {
        file: proj.file ? proj.file.fsName.replace(/\\\\/g, "/") : null,
        dirty: app.project.dirty,
        numItems: proj.numItems,
        counts: counts,
        bitsPerChannel: proj.bitsPerChannel,
        timeDisplayType: String(proj.timeDisplayType),
        activeItem: active ? { id: active.id, name: active.name, typeName: AE.itemTypeName(active) } : null,
        items: items,
        shown: { from: items.length ? _offset + 1 : 0, to: shownTo, of: proj.numItems },
        more: shownTo < proj.numItems ? "Items " + (shownTo + 1) + " to " + proj.numItems + " not listed: call again with offset " + shownTo + " (limit up to 1000), or use project.find_layers or comp info for what you need." : null
    };
`;
}
var PROJECT_INFO_DEFAULT_LIMIT, projectInfoTool;
function init_project_info() {
	return (init_project_info = __esmMin((() => {
		init_schemas();
		init_registry();
		init_define_tool();
		PROJECT_INFO_DEFAULT_LIMIT = 100;
		projectInfoTool = defineTool({
			name: "ae_project_info",
			title: "Project info",
			description: `Project-level info: file path, dirty flag, counts of items by type, active item, and the items with type/summary, ${100} at a time (offset and limit for the rest; \`more\` says what was left out). Start here.`,
			group: "inspect",
			blockedInReadOnly: false,
			effect: "read",
			inputShape: {
				limit: number().int().min(1).max(1e3).optional().describe(`Items to list (default ${100}; about 400 characters each).`),
				offset: number().int().min(0).optional().describe("Items to skip before listing (default 0).")
			},
			handler: async (args, transport) => {
				const result = await transport.execute({
					code: projectInfoCode(args),
					label: "project_info"
				});
				return toMcpResult(result);
			}
		});
	})))();
}

// server/tools/index.js
function bindTransportToInstance(transport, instance) {
	return {
		execute: (req) => transport.execute({
			instance,
			...req
		}),
		describeTarget: () => resolveTarget(instance),
		...transport.close ? { close: () => transport.close() } : {}
	};
}
function withInstanceParam(tool) {
	if (INSTANCE_FREE_TOOLS.has(tool.name)) return tool;
	return {
		...tool,
		inputShape: {
			...tool.inputShape,
			instance: INSTANCE_PARAM
		},
		handler: async (args, transport) => {
			const { instance, ...rest } = args ?? {};
			const named = typeof instance === "string" ? instance.trim() : "";
			return tool.handler(rest, named ? bindTransportToInstance(transport, named) : transport);
		}
	};
}
var INSTANCE_PARAM, INSTANCE_FREE_TOOLS, ALL_TOOLS;
function init_tools() {
	return (init_tools = __esmMin((() => {
		init_schemas();
		init_instances();
		init_catalog();
		init_check_comp();
		init_comp_info();
		init_context();
		init_do();
		init_layer_info();
		init_project_export();
		init_project_import();
		init_project_info();
		init_render_frame();
		init_save_project();
		init_version_info();
		INSTANCE_PARAM = string$1().optional().describe("After Effects instance to address for this call, when several are running (AfterFX.exe -m): an instance id (its AE_MCP_INSTANCE at launch, or the `name` given to instance.start) or the name of the project file it has open. Omit to use this server's default (AE_MCP_INSTANCE, else the single live instance). ae_context and ae_do instance.list show what is live.");
		INSTANCE_FREE_TOOLS = /* @__PURE__ */ new Set(["ae_catalog"]);
		ALL_TOOLS = [
			projectInfoTool,
			compInfoTool,
			layerInfoTool,
			renderFrameTool,
			checkCompTool,
			saveProjectTool,
			projectExportTool,
			projectImportTool,
			versionInfoTool,
			catalogTool,
			doTool,
			contextTool
		].map((tool) => withInstanceParam(tool));
	})))();
}

// server/tools/library-modules.js
function object(value) {
	return !!value && typeof value === "object" && !Array.isArray(value);
}
function fail(id, field, reason) {
	throw new Error(`Module ${id}: ${field}: ${reason}`);
}
function string(value, id, field) {
	if (typeof value !== "string" || !value.trim()) fail(id, field, "expected nonempty string");
}
function strings(value, id, field) {
	if (!Array.isArray(value)) fail(id, field, "expected string array");
	value.forEach((v) => string(v, id, field));
}
function isReportReference(value) {
	if (value.startsWith("https://")) try {
		const u = new URL(value);
		return !u.username && !u.password && u.hostname.includes(".") && !/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(u.hostname);
	} catch {
		return false;
	}
	return /^quality\/reports\/[a-zA-Z0-9._/-]+$/.test(value) && !value.split("/").some((p) => !p || p === "." || p === "..");
}
function validateCatalog(raw, refs) {
	if (!object(raw) || raw.schemaVersion !== 1) fail("<catalog>", "schemaVersion", "expected 1");
	if (!Array.isArray(raw.modules)) fail("<catalog>", "modules", "expected array");
	const ids = /* @__PURE__ */ new Set();
	for (const item of raw.modules) {
		if (!object(item)) fail("<unknown>", "module", "expected object");
		const id = typeof item.id === "string" ? item.id : "<unknown>";
		for (const field of [
			"id",
			"title",
			"summary",
			"entryDocument"
		]) string(item[field], id, field);
		if (!/^[a-z][a-z0-9-]*$/.test(id)) fail(id, "id", "expected lowercase hyphenated ID");
		if (ids.has(id)) fail(id, "id", "duplicate ID");
		ids.add(id);
		if (typeof item.kind !== "string" || ![
			"foundation",
			"capability",
			"style"
		].includes(String(item.kind))) fail(id, "kind", "unknown enum");
		for (const field of [
			"tags",
			"whenToUse",
			"whenNotToUse",
			"requires",
			"documents",
			"compatibleWith",
			"assetRequirements",
			"fontRequirements",
			"fallbacks",
			"examples",
			"reviewChecks",
			"provenanceRefs"
		]) strings(item[field], id, field);
		if (!Array.isArray(item.inputs)) fail(id, "inputs", "expected array");
		for (const input of item.inputs) {
			if (!object(input)) fail(id, "inputs", "expected object");
			string(input.name, id, "inputs.name");
			string(input.constraints, id, "inputs.constraints");
			if (typeof input.required !== "boolean") fail(id, "inputs.required", "expected boolean");
			if (input.default !== null && typeof input.default !== "string") fail(id, "inputs.default", "expected string or null");
		}
		const e = item.evidence;
		if (!object(e)) fail(id, "evidence", "expected object");
		if (typeof e.technical !== "string" || ![
			"not-tested",
			"passed",
			"failed"
		].includes(String(e.technical))) fail(id, "evidence.technical", "unknown enum");
		if (typeof e.visual !== "string" || ![
			"not-reviewed",
			"accepted",
			"revision-needed"
		].includes(String(e.visual))) fail(id, "evidence.visual", "unknown enum");
		strings(e.reports, id, "evidence.reports");
		if ((e.technical !== "not-tested" || e.visual !== "not-reviewed") && !e.reports.length) fail(id, "evidence.reports", "tested or reviewed status requires evidence");
		for (const report of e.reports) if (!isReportReference(report)) fail(id, "evidence.reports", "expected repository report path or public HTTPS URL");
	}
	const catalog = raw;
	for (const m of catalog.modules) {
		const check = (field, values, valid) => {
			for (const value of values) if (!valid.has(value)) fail(m.id, field, `missing reference ${value}`);
		};
		check("entryDocument", [m.entryDocument], refs.documentIds);
		check("documents", m.documents, refs.documentIds);
		check("examples", m.examples, refs.documentIds);
		check("requires", m.requires, ids);
		check("compatibleWith", m.compatibleWith, ids);
		check("provenanceRefs", m.provenanceRefs, refs.provenanceIds);
	}
	const byId = new Map(catalog.modules.map((m) => [m.id, m]));
	const visiting = /* @__PURE__ */ new Set(), visited = /* @__PURE__ */ new Set();
	function visit(id) {
		if (visiting.has(id)) fail(id, "requires", "dependency cycle");
		if (visited.has(id)) return;
		visiting.add(id);
		for (const dep of byId.get(id).requires) visit(dep);
		visiting.delete(id);
		visited.add(id);
	}
	for (const id of ids) visit(id);
	return catalog;
}
function queryWords$1(query) {
	return [...new Set((query ?? "").toLowerCase().split(/[\s,;]+/u).filter(Boolean))];
}
function moduleWords(m, words) {
	const fields = [
		m.id,
		m.title,
		m.summary,
		...m.tags
	].map((v) => v.toLowerCase());
	return words.filter((w) => fields.some((v) => v.includes(w)));
}
function findModules(catalog, query) {
	if (!query?.trim()) return catalog.modules;
	const words = queryWords$1(query);
	return catalog.modules.filter((m) => moduleWords(m, words).length > 0);
}
function init_library_modules() {
	return (init_library_modules = __esmMin((() => {})))();
}

// server/tools/library-parts.js
function nameSections(doc) {
	const all = allSections(doc);
	const count = /* @__PURE__ */ new Map();
	for (const s of all) count.set(s.title, (count.get(s.title) ?? 0) + 1);
	const visit = (list, trail) => {
		for (const s of list) {
			s.name = (count.get(s.title) ?? 0) > 1 ? [...trail, s.title].join(" > ") : s.title;
			visit(s.children, [...trail, s.title]);
		}
	};
	visit(doc.sections, []);
	const seen = /* @__PURE__ */ new Map();
	for (const s of all) {
		const n = (seen.get(s.name) ?? 0) + 1;
		seen.set(s.name, n);
		if (n > 1) s.name = `${s.name} (${n})`;
	}
	return doc;
}
function parseMarkdown(text) {
	const heads = [];
	let fence = false;
	for (const m of text.matchAll(/^.*$/gm)) {
		const line = m[0];
		if (/^\s*(\x60{3}|~{3})/.test(line)) {
			fence = !fence;
			continue;
		}
		if (fence) continue;
		const h = line.match(/^(#{2,6})\s+(.+?)\s*#*\s*$/);
		if (h) heads.push({
			at: m.index ?? 0,
			level: h[1].length,
			title: h[2]
		});
	}
	const roots = [];
	const stack = [];
	const levels = [];
	for (const [i, h] of heads.entries()) {
		while (levels.length && levels[levels.length - 1] >= h.level) {
			stack.pop();
			levels.pop();
		}
		const next = heads.slice(i + 1).find((x) => x.level <= h.level);
		const end = next ? next.at : text.length;
		const firstChild = heads[i + 1] && heads[i + 1].level > h.level ? heads[i + 1].at : end;
		const s = {
			title: h.title,
			name: h.title,
			level: h.level,
			text: text.slice(h.at, end),
			intro: text.slice(h.at, firstChild),
			children: []
		};
		(stack.length ? stack[stack.length - 1].children : roots).push(s);
		stack.push(s);
		levels.push(h.level);
	}
	return nameSections({
		form: "markdown",
		opening: text.slice(0, heads.length ? heads[0].at : text.length),
		sections: roots
	});
}
function parseJson(text) {
	let value;
	try {
		value = JSON.parse(text);
	} catch {
		return null;
	}
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	const sections = [];
	const small = {};
	for (const [key, v] of Object.entries(value)) {
		const t = JSON.stringify(v, null, 2);
		const items = Array.isArray(v) && v.length && v.every((e) => e && typeof e === "object" && typeof e.id === "string") ? v : null;
		const children = items && new Set(items.map((e) => e.id)).size === items.length ? items.map((e) => {
			const et = JSON.stringify(e, null, 2);
			return {
				title: e.id,
				name: e.id,
				level: 3,
				text: et,
				intro: et,
				children: []
			};
		}) : [];
		sections.push({
			title: key,
			name: key,
			level: 2,
			text: t,
			intro: children.length ? "" : t,
			children
		});
		if (t.length <= 2e3) small[key] = v;
	}
	return nameSections({
		form: "json",
		opening: Object.keys(small).length ? JSON.stringify(small, null, 2) : "",
		sections
	});
}
function parseCode(text) {
	const decls = [...text.matchAll(/^( *)(?:function\s+([A-Za-z_$][\w$]*)\s*\(|def\s+([A-Za-z_]\w*)\s*\()/gm)].map((m) => ({
		at: m.index ?? 0,
		indent: m[1].length,
		title: m[2] ?? m[3]
	}));
	const byIndent = /* @__PURE__ */ new Map();
	for (const d of decls) byIndent.set(d.indent, (byIndent.get(d.indent) ?? 0) + 1);
	const indent = [...byIndent.entries()].filter(([, n]) => n >= 3).map(([i]) => i).sort((a, b) => a - b)[0];
	if (indent === void 0) return null;
	const top = decls.filter((d) => d.indent === indent);
	const sections = top.map((d, i) => {
		const t = text.slice(d.at, i + 1 < top.length ? top[i + 1].at : text.length);
		return {
			title: d.title,
			name: d.title,
			level: 2,
			text: t,
			intro: t,
			children: []
		};
	});
	return nameSections({
		form: "code",
		opening: text.slice(0, top[0].at),
		sections
	});
}
function parseDocument(text, file) {
	if (/\.md$/i.test(file)) return parseMarkdown(text);
	if (/\.json$/i.test(file)) {
		const j = parseJson(text);
		if (j) return j;
	}
	if (/\.(jsx|js|mjs|py)$/i.test(file)) {
		const c = parseCode(text);
		if (c) return c;
	}
	return {
		form: "text",
		opening: "",
		sections: []
	};
}
function splitText(text, max = PART_CHARS) {
	if (text.length <= max) return [text];
	const out = [];
	let cur = "";
	const add = (piece) => {
		if (cur.length + piece.length <= max) {
			cur += piece;
			return;
		}
		if (cur) {
			out.push(cur);
			cur = "";
		}
		if (piece.length <= max) {
			cur = piece;
			return;
		}
		for (const line of piece.match(/[^\n]*\n|[^\n]+$/g) ?? [piece]) {
			if (cur.length + line.length <= max) {
				cur += line;
				continue;
			}
			if (cur) {
				out.push(cur);
				cur = "";
			}
			for (let i = 0; i < line.length; i += max) {
				const c = line.slice(i, i + max);
				if (c.length === max) out.push(c);
				else cur = c;
			}
		}
	};
	for (const p of text.match(/[\s\S]*?\n\n+|[\s\S]+$/g) ?? [text]) add(p);
	if (cur) out.push(cur);
	return out;
}
function sectionNames(doc, text) {
	const out = [];
	const op = splitText(doc.opening);
	if (op.length > 1) op.forEach((_, i) => out.push(partName(OPENING, i + 1, op.length)));
	if (!doc.sections.length) {
		const w = splitText(text);
		if (w.length > 1) w.forEach((_, i) => out.push(partName(WHOLE, i + 1, w.length)));
	}
	for (const s of allSections(doc)) {
		out.push(s.name);
		const parts = splitText(ownText(s));
		if (parts.length > 1) parts.forEach((_, i) => out.push(partName(s.name, i + 1, parts.length)));
	}
	return out;
}
function outlineLines(list, depth = 0) {
	const out = [];
	for (const s of list) {
		const parts = splitText(ownText(s)).length;
		out.push(`${"  ".repeat(depth)}- ${s.name} (${s.text.length} characters${parts > 1 ? `; its own text in ${parts} parts` : ""})`);
		out.push(...outlineLines(s.children, depth + 1));
	}
	return out;
}
function wholeOrOutline(e, text, doc = parseDocument(text, e.path)) {
	const whole = `${header(e, text.length)}

${text}`;
	if (whole.length <= 4e4) return whole;
	if (!doc.sections.length) {
		const parts = splitText(text);
		return [
			header(e, text.length),
			`PART 1 OF ${parts.length}, NOT THE WHOLE DOCUMENT. ${e.id} (${e.title}, ${e.kind}) is ${text.length} characters, longer than one reply (${REPLY_CHARS} characters). Ask for the rest: ae_library { document: "${e.id}", section: [${parts.slice(1).map((_, i) => JSON.stringify(partName(WHOLE, i + 2, parts.length))).join(", ")}] }.`,
			"",
			parts[0]
		].join("\n");
	}
	const opening = splitText(doc.opening);
	return [
		header(e, text.length),
		`OUTLINE ONLY, NOT THE DOCUMENT. ${e.id} (${e.title}, ${e.kind}) is ${text.length} characters in ${allSections(doc).length} sections, longer than one reply (${REPLY_CHARS} characters). Below are its outline and its opening; nothing after the opening has been read yet. Read the sections the job needs before relying on this document: ae_library { document: "${e.id}", section: ["<section>", ...] }, several in one call while they fit.`,
		...doc.form === "code" ? [loadNote(e)] : [],
		"",
		"Outline (each section and its size; ask for a section by the name shown):",
		...outlineLines(doc.sections),
		"",
		opening.length > 1 ? `Opening (part 1 of ${opening.length}; ask for ${JSON.stringify(partName(OPENING, 2, opening.length))} next):` : "Opening:",
		opening[0] ?? ""
	].join("\n");
}
function resolve(doc, text, asked) {
	const want = asked.trim();
	const part = want.match(/^(.*) \(part (\d+) of (\d+)\)$/);
	if (part) {
		const [, base, k, n] = part;
		let source = null;
		if (base === "(opening)") source = doc.opening;
		else if (base === "(whole)" && !doc.sections.length) source = text;
		else {
			const s2 = allSections(doc).find((x) => x.name === base);
			if (s2) source = ownText(s2);
		}
		if (source === null) return null;
		const parts = splitText(source);
		const i = Number(k) - 1;
		if (parts.length < 2 || Number(n) !== parts.length || i < 0 || i >= parts.length) return null;
		return {
			name: partName(base, i + 1, parts.length),
			text: parts[i]
		};
	}
	const s = allSections(doc).find((x) => x.name === want);
	if (!s) return null;
	return s.text.length <= 38e3 ? {
		name: s.name,
		text: s.text
	} : {
		name: s.name,
		tooLong: s
	};
}
function sectionsReply(e, text, asked, doc = parseDocument(text, e.path)) {
	if (!asked.length) throw new Error("section is empty: name at least one section");
	const missing = asked.filter((a) => !resolve(doc, text, a));
	if (missing.length) {
		const names = sectionNames(doc, text);
		throw new Error(`${e.id} has no section ${missing.map((m) => JSON.stringify(m)).join(", ")} (names must match exactly). ` + (names.length ? `Its sections, by the names to ask for: ${names.map((n) => JSON.stringify(n)).join(", ")}.` : "It has no sections: read it without section."));
	}
	const blocks = [];
	const notSent = [];
	let size = 0;
	for (const a of asked) {
		const r = resolve(doc, text, a);
		let block;
		if (r.tooLong) {
			const s = r.tooLong;
			const own = splitText(ownText(s));
			block = [
				`== ${s.name} (${s.text.length} characters, longer than one reply): ${s.children.length ? "its own text and the outline of its subsections; ask for those by name" : `part 1 of ${own.length}`} ==`,
				...s.children.length ? ["Subsections:", ...outlineLines(s.children)] : [],
				...own.length > 1 ? [`Its own text is in ${own.length} parts: ${own.map((_, i) => JSON.stringify(partName(s.name, i + 1, own.length))).join(", ")}. Part 1:`] : [],
				own[0]
			].join("\n");
		} else block = `== ${r.name} (${(r.text ?? "").length} characters) ==
${r.text}`;
		if (blocks.length && size + block.length > 38e3) {
			notSent.push(r.name);
			continue;
		}
		blocks.push(block);
		size += block.length;
	}
	const head = `SECTIONS of ${e.id} (${e.title}, ${e.kind}, ${text.length} characters in ${allSections(doc).length} sections): ${blocks.length} of ${asked.length} asked for, in order.` + (notSent.length ? ` Not sent, to stay under one reply (${REPLY_CHARS} characters): ${notSent.map((n) => JSON.stringify(n)).join(", ")}; ask for them in another call.` : "") + (doc.form === "code" ? ` ${loadNote(e)}` : "");
	return [
		header(e, text.length),
		head,
		"",
		...blocks
	].join("\n");
}
var REPLY_CHARS, PART_CHARS, walk, allSections, ownText, partName, OPENING, WHOLE, header, loadNote;
function init_library_parts() {
	return (init_library_parts = __esmMin((() => {
		REPLY_CHARS = 4e4;
		PART_CHARS = 38e3;
		walk = (list, out = []) => {
			for (const s of list) {
				out.push(s);
				walk(s.children, out);
			}
			return out;
		};
		allSections = (doc) => walk(doc.sections);
		ownText = (s) => s.children.length ? s.intro : s.text;
		partName = (name, k, n) => `${name} (part ${k} of ${n})`;
		OPENING = "(opening)";
		WHOLE = "(whole)";
		header = (e, chars) => `ae_library document ${e.id}: ${e.title} (kind ${e.kind}, ${chars} characters, sha256 ${e.sha256})`;
		loadNote = (e) => `To use this code, load the whole file inside eval.run with $.evalFile from the plugin's library folder (${e.path}), as its document says; read a function here only to see what it does.`;
	})))();
}

// server/tools/library.js
function boundedFile(base, relative) {
	const candidate = path.resolve(base, relative);
	const inside = (file2) => {
		const rel = path.relative(base, file2);
		if (!rel || rel === ".." || rel.startsWith(".." + path.sep) || path.isAbsolute(rel)) throw new Error("Library path escapes bundle");
	};
	inside(candidate);
	const file = realpathSync(candidate);
	inside(file);
	return file;
}
function readLibrary(document, query, root = path.resolve(PACKAGE_ROOT, "../library")) {
	const base = realpathSync(root);
	const entries = JSON.parse(readFileSync(boundedFile(base, "manifest.json"), "utf8")).documents;
	const read = (entry2) => {
		const content = readFileSync(boundedFile(base, entry2.path), "utf8");
		if (createHash("sha256").update(content).digest("hex") !== entry2.sha256) throw new Error("Library hash mismatch: regenerate manifest after intentional edits");
		return content;
	};
	if (!document) {
		const needle = query?.trim().toLowerCase();
		const catalogEntry = entries.find((e) => e.id === "module-catalog");
		let catalog = {
			schemaVersion: 1,
			modules: []
		};
		if (catalogEntry) try {
			const raw = JSON.parse(read(catalogEntry));
			const sourceMap = JSON.parse(readFileSync(boundedFile(base, "source-map.json"), "utf8"));
			catalog = validateCatalog(raw, {
				documentIds: new Set(entries.map((e) => e.id)),
				provenanceIds: new Set((sourceMap.sources ?? []).map((s) => s.id).filter((id) => typeof id === "string"))
			});
		} catch (e) {
			throw new Error(`Module catalog: ${e instanceof Error ? e.message : String(e)}`);
		}
		const matches = findModules(catalog, query);
		const words = queryWords$1(query);
		const viaModules = /* @__PURE__ */ new Map();
		for (const m of matches) for (const w of moduleWords(m, words)) viaModules.set(m.entryDocument, (viaModules.get(m.entryDocument) ?? /* @__PURE__ */ new Set()).add(w));
		const seen = /* @__PURE__ */ new Set();
		const scored = [];
		for (const e of entries) {
			if (seen.has(e.id)) continue;
			const text = `${e.id} ${e.title} ${e.kind}`.toLowerCase();
			const score = needle ? words.filter((w) => text.includes(w) || viaModules.get(e.id)?.has(w)).length : 1;
			if (score > 0) {
				seen.add(e.id);
				scored.push({
					entry: e,
					score
				});
			}
		}
		return {
			startHere: [
				"motion-language",
				"production-workflow",
				"brief-template"
			],
			documents: [...scored].sort((a, b) => b.score - a.score).map(({ entry: entry2 }) => ({
				id: entry2.id,
				title: entry2.title,
				kind: entry2.kind
			})),
			modules: matches.map(({ id, kind, title, summary, entryDocument, requires, tags, evidence }) => ({
				id,
				kind,
				title,
				summary,
				entryDocument,
				requires,
				tags,
				evidence
			}))
		};
	}
	const entry = entries.find((e) => e.id === document);
	if (!entry) throw new Error("Unknown library document. Call ae_library without arguments for valid IDs.");
	return {
		document: entry.id,
		title: entry.title,
		kind: entry.kind,
		content: read(entry)
	};
}
function readLibraryEntry(document, root = path.resolve(PACKAGE_ROOT, "../library")) {
	const base = realpathSync(root);
	const entry = JSON.parse(readFileSync(boundedFile(base, "manifest.json"), "utf8")).documents.find((e) => e.id === document);
	if (!entry) throw new Error("Unknown library document. Call ae_library without arguments for valid IDs.");
	const content = readFileSync(boundedFile(base, entry.path), "utf8");
	if (createHash("sha256").update(content).digest("hex") !== entry.sha256) throw new Error("Library hash mismatch: regenerate manifest after intentional edits");
	return {
		entry,
		content
	};
}
function libraryDocumentReply(document, section, root) {
	const { entry, content } = readLibraryEntry(document, root);
	if (section === void 0) return wholeOrOutline(entry, content);
	return sectionsReply(entry, content, Array.isArray(section) ? section : [section]);
}
var libraryTool;
function init_library() {
	return (init_library = __esmMin((() => {
		init_schemas();
		init_config();
		init_define_tool();
		init_errors();
		/* @__PURE__ */ init_library_modules();
		init_library_parts();
		libraryTool = defineTool({
			name: "ae_library",
			title: "Motion design library",
			group: "document",
			effect: "read",
			blockedInReadOnly: false,
			description: `Read the bundled production-derived motion language, detailed choreography/camera/material modules, worked scenes and native JSX. Begin every After Effects motion task with motion-language, production-workflow and brief-template. Craft applies to all styles; JoeB appearance is optional. Offline; no AE, original repo or account required. Omit document to list IDs and startHere; query filters the index. Pass an ID to read a document: whole when it fits in one reply (${REPLY_CHARS} characters), otherwise its outline and opening only, which say so on their first line; then pass section (a heading's exact text or the name the outline shows, or a list of them) to read those sections, several in one call while they fit. Read the sections a job needs before relying on a long document.`,
			inputShape: {
				document: string$1().optional(),
				query: string$1().optional(),
				section: union([string$1(), array(string$1())]).optional().describe("With document: a section's name from its outline, or a list of them")
			},
			handler: async ({ document, query, section }) => {
				try {
					if (!document) {
						if (section !== void 0) return errorResult("INVALID_ARGS", "section needs a document: pass document and section together");
						return jsonResult(readLibrary(void 0, query));
					}
					return {
						content: [{
							type: "text",
							text: libraryDocumentReply(document, section)
						}],
						isError: false
					};
				} catch (e) {
					return errorResult("IO", e instanceof Error ? e.message : String(e));
				}
			}
		});
	})))();
}

// server/tools/arsenal.js
function assetKinds(assets) {
	if (assets === void 0 || assets === null) return null;
	if (assets === "none") return [];
	if (Array.isArray(assets)) return lower(assets);
	return lower(Object.keys(assets));
}
function distance(duration, want) {
	if (want === void 0 || duration === null || duration === void 0) return 0;
	const m = String(duration).match(/(\d+(?:\.\d+)?)\s*(?:s)?\s*(\+)?/);
	if (!m) return 0;
	const d = parseFloat(m[1]);
	return m[2] ? Math.max(0, d - want) : Math.abs(d - want);
}
function standOnTheirOwn(answering) {
	const ids = new Set(answering.map((e) => e.id));
	return answering.filter((e) => !e.variant_of || !ids.has(e.variant_of));
}
function findTechniques(catalog, ask) {
	if (ask.vocab !== catalog.vocab) throw new ArsenalRefusal(`refused: ask is vocab ${ask.vocab} but the catalog is ${catalog.vocab}`);
	for (const j of [ask.job, ...ask.support ?? []]) if (!catalog.jobs.includes(j)) throw new ArsenalRefusal(`refused: unknown job "${j}"; valid ids: ${catalog.jobs.join(", ")}`);
	const support = ask.support ?? [];
	const mood = lower(ask.mood);
	const have = assetKinds(ask.assets);
	const exclude = new Set(ask.exclude ?? []);
	const limit = ask.limit ?? 5;
	const tier = (r) => r.job === ask.job ? 0 : r.support.includes(ask.job) ? 1 : [r.job, ...r.support].some((j) => j !== null && support.includes(j)) ? 2 : null;
	const byJob = standOnTheirOwn(catalog.entries.filter((r) => (r.kind === "technique" || r.kind === "piece") && tier(r) !== null)).filter((r) => !exclude.has(r.id));
	const pass = (r, loose) => (loose.includes("status") || ask.constraints?.status === "any" || r.status === "proven") && (loose.includes("needs") || have === null || unmet(r.needs, have).length === 0);
	let relaxed = [];
	let hits = byJob.filter((r) => pass(r, relaxed));
	for (const step of ["status", "needs"]) {
		if (hits.length || !byJob.length) break;
		relaxed = [...relaxed, step];
		hits = byJob.filter((r) => pass(r, relaxed));
	}
	const overlap = (r) => lower(r.mood).filter((m) => mood.includes(m));
	const ranked = hits.map((r) => ({
		r,
		key: [
			r.kind === "piece" ? 0 : 1,
			tier(r),
			r.status === "proven" ? 0 : 1,
			-r.taught_by,
			-overlap(r).length,
			distance(r.duration, ask.duration)
		]
	})).sort((a, b) => {
		for (let i = 0; i < a.key.length; i++) if (a.key[i] !== b.key[i]) return a.key[i] - b.key[i];
		return 0;
	}).slice(0, limit);
	const fit = (r) => {
		const t = tier(r);
		const job = t === 0 ? `primary job ${ask.job}` : t === 1 ? `supports ${ask.job}` : `serves support job ${[r.job, ...r.support].find((j) => j !== null && support.includes(j))}`;
		const missing = have === null ? [] : unmet(r.needs, have);
		const needs = !r.needs.length ? "needs nothing" : missing.length ? `needs ${missing.join(", ")}, not on hand` : have === null ? `needs ${r.needs.join(", ")}` : `needs met: ${r.needs.join(", ")}`;
		const m = overlap(r);
		return [
			r.kind === "piece" ? "piece: runnable code, get returns its call" : null,
			job,
			variantText(r),
			needs,
			m.length ? `mood: ${m.join(", ")}` : mood.length ? "no mood overlap" : null,
			r.taught_by > 1 ? `taught ${r.taught_by} times` : null,
			r.status === "proven" ? "proven" : "unproven, needs a test build first"
		].filter(Boolean).join("; ");
	};
	const out = {
		vocab: catalog.vocab,
		version: catalog.version,
		results: ranked.map(({ r }) => ({
			id: r.id,
			revision: r.revision,
			name: r.name,
			line: r.line,
			status: r.status,
			needs: r.needs,
			duration: r.duration,
			motion: r.motion,
			still: r.still?.path ?? null,
			section: r.section,
			fit: fit(r),
			...r.variants?.length ? { variants: r.variants } : {},
			...r.variant_of ? { variant_of: r.variant_of } : {},
			...r.kind === "piece" && r.call ? {
				kind: "piece",
				call: r.call.signature
			} : {}
		}))
	};
	if (relaxed.length && out.results.length) out.relaxed = relaxed;
	return out;
}
function parseProvides(p) {
	const m = /^\s*([a-z-]+)\s*(?::\s*([a-z0-9-]+)\s*)?$/.exec(String(p).toLowerCase());
	return m ? [m[1], m[2] ?? null] : null;
}
function askedProvides(catalog, asked) {
	const vocab = catalog.provides ?? {};
	return (asked ?? []).map((p) => {
		const k = parseProvides(p);
		if (!k) throw new ArsenalRefusal(`refused: provides "${p}" is not "key" or "key: word"; keys: ${Object.keys(vocab).join(", ")}`);
		if (!vocab[k[0]]) throw new ArsenalRefusal(`refused: unknown provides key "${k[0]}"; valid keys: ${Object.keys(vocab).join(", ")}`);
		if (k[1] && !vocab[k[0]].includes(k[1])) throw new ArsenalRefusal(`refused: unknown ${k[0]} word "${k[1]}"; valid ${k[0]} words: ${vocab[k[0]].join(", ")}`);
		return k;
	});
}
function checkLevel(level) {
	if (level === void 0) return void 0;
	if (!LEVELS.includes(level)) throw new ArsenalRefusal(`refused: unknown level "${level}"; valid levels: ${LEVELS.join(", ")}`);
	return level;
}
function matched(e, asked) {
	const own = e.provides.map(parseProvides).filter((x) => x !== null);
	return asked.filter(([k, w]) => own.some(([ok, ow]) => ok === k && (w === null || ow === w))).map(showProvides);
}
function stem(word) {
	let w = word.toLowerCase().replace(/[^a-z0-9]/g, "");
	if (w.length > 4 && w.endsWith("ies")) w = `${w.slice(0, -3)}y`;
	else if (w.length > 4 && w.endsWith("ing")) w = w.slice(0, -3);
	else if (w.length > 3 && w.endsWith("ed")) w = w.slice(0, -2);
	else if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
	if (w.length > 3 && w.at(-1) === w.at(-2) && !/[aeiouls]/.test(w.at(-1))) w = w.slice(0, -1);
	if (w.length > 3 && w.endsWith("e")) w = w.slice(0, -1);
	return w;
}
function queryWords(query) {
	return [...new Set(query.split(/[^A-Za-z0-9]+/).filter((w) => w && !STOP.has(w.toLowerCase())).map(stem).filter((w) => w.length > 1))];
}
function wordsMatched(e, words) {
	if (!words.length) return [];
	const own = new Set(stems([
		e.id,
		e.name,
		e.line,
		e.use_for ?? "",
		e.job ?? "",
		...e.support,
		...e.provides
	].join(" ")));
	return words.filter((w) => own.has(w));
}
function findByProvides(catalog, ask) {
	const level = checkLevel(ask.level);
	const asked = askedProvides(catalog, ask.provides);
	const words = ask.query === void 0 ? [] : queryWords(ask.query);
	if (ask.query !== void 0 && !words.length) throw new ArsenalRefusal(`refused: query "${ask.query}" has no words to look for once common words are dropped; say what the beat does, e.g. "turns over" or "glass floor"`);
	if (!level && !asked.length && !words.length) throw new ArsenalRefusal("refused: find needs a job, a level, provides or a query");
	const exclude = new Set(ask.exclude ?? []);
	const limit = ask.limit ?? 5;
	const answers = (e) => (!level || atLevel(e, level)) && (!ask.shelf || e.shelf === ask.shelf) && (!asked.length || matched(e, asked).length > 0);
	let pool = catalog.entries.filter((e) => !exclude.has(e.id) && answers(e));
	let relaxed = [];
	if (words.length) {
		const best = Math.max(0, ...pool.map((e) => wordsMatched(e, words).length));
		pool = best ? pool.filter((e) => wordsMatched(e, words).length === best) : [];
		if (best && best < words.length) relaxed = ["words"];
	}
	const byId = new Map(catalog.entries.map((e) => [e.id, e]));
	const behindParent = (e) => {
		const p = e.variant_of ? byId.get(e.variant_of) : void 0;
		return !!p && answers(p) && wordsMatched(p, words).length >= wordsMatched(e, words).length;
	};
	pool = pool.filter((e) => !behindParent(e));
	let hits = pool.filter((e) => ask.status === "any" || e.status === "proven");
	if (!hits.length && pool.length) {
		relaxed = [...relaxed, "status"];
		hits = pool;
	}
	const ranked = hits.map((e, i) => ({
		e,
		key: [
			words.length && e.kind === "piece" ? 0 : 1,
			-matched(e, asked).length,
			e.still ? 0 : 1,
			i
		]
	})).sort((a, b) => {
		for (let i = 0; i < a.key.length; i++) if (a.key[i] !== b.key[i]) return a.key[i] - b.key[i];
		return 0;
	}).slice(0, limit);
	const out = {
		vocab: catalog.vocab,
		version: catalog.version,
		...words.length ? { words } : {},
		results: ranked.map(({ e }) => {
			const m = matched(e, asked);
			const w = wordsMatched(e, words);
			return {
				id: e.id,
				revision: e.revision,
				level: e.level,
				...e.also_level?.length ? { also_level: e.also_level } : {},
				name: e.name,
				line: e.line,
				status: e.status,
				kind: e.kind,
				provides: e.provides,
				needs: e.needs,
				cost: e.cost,
				still: e.still?.path ?? null,
				section: e.section,
				...e.kind === "piece" && e.call ? {
					use_for: e.use_for,
					call: e.call.signature
				} : {},
				fit: [
					e.kind === "piece" ? "piece: runnable code, get returns its call" : null,
					levelText(e),
					w.length ? `words: ${w.join(", ")} of ${words.join(", ")}` : null,
					m.length ? `provides ${m.join(", ")}` : null,
					variantText(e),
					e.status === "proven" ? "proven" : "unproven, needs a test build first",
					e.still ? null : `no still: ${e.no_still ?? "none shipped"}`
				].filter(Boolean).join("; "),
				...e.variants?.length ? { variants: e.variants } : {},
				...e.variant_of ? { variant_of: e.variant_of } : {}
			};
		})
	};
	if (relaxed.length && out.results.length) out.relaxed = relaxed;
	return out;
}
function browseCatalog(catalog, ask = {}) {
	const level = checkLevel(ask.level);
	const asked = askedProvides(catalog, ask.provides);
	const size = Math.min(Math.max(1, Math.floor(ask.page_size ?? 12)), 24);
	const order = level ? [level] : [...LEVELS];
	const seen = /* @__PURE__ */ new Set();
	const answering = [];
	for (const l of order) for (const e of catalog.entries) {
		if (seen.has(e.id) || !atLevel(e, l)) continue;
		if (ask.shelf && e.shelf !== ask.shelf) continue;
		if (asked.length && !matched(e, asked).length) continue;
		seen.add(e.id);
		answering.push(e);
	}
	const all = standOnTheirOwn(answering);
	const shown = ask.include_unpictured ? all : all.filter((e) => e.still);
	const pages = Math.max(1, Math.ceil(shown.length / size));
	const page = Math.min(Math.max(1, Math.floor(ask.page ?? 1)), pages);
	const tiles = shown.slice((page - 1) * size, page * size).map((e, i) => ({
		n: (page - 1) * size + i + 1,
		id: e.id,
		name: e.name,
		level: e.level,
		...e.also_level?.length ? { also_level: e.also_level } : {},
		...e.kind === "piece" ? { kind: "piece" } : {},
		...e.role ? { role: e.role } : {},
		...e.block ? { block: e.block } : {},
		provides: e.provides,
		status: e.status,
		...e.still ? {} : { no_still: e.no_still ?? "none shipped" },
		...e.variant_of ? { variant_of: e.variant_of } : {}
	}));
	return {
		vocab: catalog.vocab,
		version: catalog.version,
		level: level ?? "all",
		...asked.length ? { provides: asked.map(showProvides) } : {},
		page,
		pages,
		page_size: size,
		total: shown.length,
		hidden_without_still: all.length - shown.length,
		tiles
	};
}
function loadCatalog(root = LIBRARY) {
	return JSON.parse(readLibraryEntry("arsenal-catalog", root).content);
}
function listJobs(root = LIBRARY) {
	const file = JSON.parse(readLibraryEntry("arsenal-jobs", root).content);
	const catalog = loadCatalog(root);
	return {
		vocab: `jobs-v${String(file.version).replace(/^v/, "")}`,
		groups: file.groups,
		jobs: file.jobs.map(({ id, group, name, definition }) => ({
			id,
			group,
			name,
			definition
		})),
		tags: file.tags,
		levels: catalog.levels ?? LEVELS,
		provides: catalog.provides ?? {}
	};
}
function pieceReply(r, warning, catalog, root = LIBRARY) {
	const call = r.call;
	if (!call) throw new Error(`the arsenal is inconsistent: piece ${r.id} has no call`);
	readLibraryEntry(r.section.document, root);
	const dir = path.join(realpathSync(root), "pieces");
	const calls = (e) => e.call?.functions?.length ? e.call.functions : [e.call?.load ?? ""];
	const others = catalog.entries.filter((e) => e.kind === "piece" && e.call && e.id !== r.id && calls(e).some((f) => call.example.includes(`PCS.${f}(`))).map((e) => e.call.load);
	const load = `$.evalFile(File(${JSON.stringify(path.join(dir, "pcs-core.jsx"))})); ${[...others, call.load].map((n) => `PCS.need('${n}');`).join(" ")}`;
	const version = catalog.version;
	return [
		`ae_arsenal piece ${r.id}@${r.revision} (${r.status}; recipe level, runnable code; renderer ${r.cost.renderer}; catalog ${version}; file library/pieces/${call.load}.jsx, readable with ae_library ${r.section.document})`,
		warning,
		`${r.name}: ${r.line}`,
		r.use_for ? `use it for: ${r.use_for}` : null,
		`jobs: ${[r.job, ...r.support].filter(Boolean).join(", ")}; provides: ${r.provides.join("; ") || "nothing listed"}; needs: ${r.needs.length ? r.needs.join(", ") : "nothing"}`,
		"",
		"load (in eval.run with rollback: false; the house style is on until PCS.use picks another, by style block name or a style object):",
		`  ${load}`,
		`call: ${call.signature}`,
		...call.options.length ? ["options:", ...call.options.map((o) => `  ${o.name}: ${o.text}`)] : [],
		call.returns ? `returns: ${call.returns}` : null,
		"example:",
		...call.example.split("\n").map((l) => `  ${l}`),
		`works with: ${r.composes.length ? r.composes.join(", ") : "nothing recorded yet"}`,
		...r.requires?.length ? [`loads itself: ${r.requires.join(", ")}`] : [],
		...call.notes.map((n) => `note: ${n}`)
	].filter((l) => l !== null).join("\n");
}
function recipeReply(id, revision, root = LIBRARY) {
	const catalog = loadCatalog(root);
	const r = catalog.entries.find((x) => x.id === id);
	if (!r) throw new ArsenalRefusal(`refused: unknown id "${id}"; ae_arsenal browse and find return ids`);
	const warning = revision !== void 0 && revision !== r.revision ? `WARNING: pinned revision ${revision}; the shipped revision is ${r.revision}. The ${r.kind === "style" ? "entry" : r.kind === "piece" ? "piece" : "recipe"} changed since it was pinned: this is the shipped ${r.kind === "piece" ? "call" : "text"}, not the pinned one. Check it still fits the beat.` : null;
	if (r.kind === "piece") return pieceReply(r, warning, catalog, root);
	if (r.kind === "style") {
		const head2 = `ae_arsenal ${r.level} ${r.id}@${r.revision} (${levelText(r)}${r.role ? `; ${r.role === "house" ? "the house style" : "an example, not a house look"}` : ""}; ${r.status}; shelf ${r.shelf}; catalog ${catalog.version}; its document is library document ${r.section.document}, also readable with ae_library)`;
		const blockDoc = r.block ? `pieces-style-${r.block}` : null;
		const facts = [
			...r.block ? [`in pieces: PCS.use('${r.block}') after loading pieces/pcs-core.jsx${r.default ? " (the default: pieces use it when no style is picked)" : ""}; the values are in library document ${blockDoc}`, ...(r.open ?? []).map((o) => `not in it yet: ${o}`)] : [],
			`provides: ${r.provides.join("; ")}`,
			`needs: ${r.needs.length ? r.needs.join(", ") : "nothing"}`,
			`cost: renderer ${r.cost.renderer}${r.cost.seconds_per_frame !== void 0 ? `, ${r.cost.seconds_per_frame} s per frame (${r.cost.measured ?? "measured"})` : ""}`,
			`composes: ${r.composes.length ? r.composes.join(", ") : "none recorded yet"}`,
			...r.good_for ? [`good for: ${r.good_for}`] : []
		];
		const block = blockDoc && blockDoc !== r.section.document ? [
			"",
			`style block for pieces (${blockDoc}):`,
			readLibraryEntry(blockDoc, root).content.trimEnd()
		] : [];
		return [
			head2,
			warning,
			...facts,
			"",
			libraryDocumentReply(r.section.document, void 0, root),
			...block
		].filter((l) => l !== null).join("\n");
	}
	const { content } = readLibraryEntry(r.section.document, root);
	const section = content.split(/^(?=## )/m).find((s) => s.startsWith(`## ${r.section.heading ?? ""}
`) && new RegExp(`^id: ${r.id}$`, "m").test(s));
	if (!section) throw new Error(`the arsenal is inconsistent: ${r.section.document} has no section for ${r.id}`);
	return [
		`ae_arsenal recipe ${r.id}@${r.revision} (${r.status}, ${r.kind}; ${r.variant_of ? `variant of ${r.variant_of}; ` : ""}${catalog.vocab}, catalog ${catalog.version}; from library document ${r.section.document})`,
		warning,
		r.provides?.length ? `provides: ${r.provides.join("; ")}` : null,
		"",
		section.trimEnd()
	].filter((l) => l !== null).join("\n");
}
function readStill(still, root = LIBRARY) {
	const base = realpathSync(root);
	const file = realpathSync(path.resolve(base, still.path));
	const rel = path.relative(base, file);
	if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) throw new Error("Arsenal still escapes the library");
	const bytes = readFileSync(file);
	if (createHash("sha256").update(bytes).digest("hex") !== still.sha256) throw new Error(`Arsenal still hash mismatch: ${still.path}`);
	return bytes;
}
function stillContent(r, root = LIBRARY, label) {
	if (!r.still) return [];
	return [{
		type: "text",
		text: label ?? `Still of ${r.id} (${r.name}), from our own proof build:`
	}, {
		type: "image",
		data: readStill(r.still, root).toString("base64"),
		mimeType: "image/jpeg"
	}];
}
var LIBRARY, LEVELS, ArsenalRefusal, MET_BY, lower, unmet, variantText, showProvides, atLevel, levelText, STOP, stems, BROWSE_PAGE, BROWSE_PAGE_MAX, providesArg, askShape, listOf, arsenalTool;
function init_arsenal() {
	return (init_arsenal = __esmMin((() => {
		init_schemas();
		init_config();
		init_errors();
		init_define_tool();
		init_library();
		LIBRARY = path.resolve(PACKAGE_ROOT, "../library");
		LEVELS = [
			"style",
			"world",
			"recipe"
		];
		ArsenalRefusal = class extends Error {};
		MET_BY = {
			footage: ["footage", "screen"],
			photo: ["photo", "library"],
			illustration: [
				"photo",
				"library",
				"logo"
			],
			character: ["library"]
		};
		lower = (xs) => (xs ?? []).map((x) => String(x).toLowerCase());
		unmet = (needs, have) => lower(needs).filter((n) => MET_BY[n] && !MET_BY[n].some((a) => have.includes(a)));
		variantText = (e) => e.variant_of ? `variant of ${e.variant_of}, found here on its own` : null;
		showProvides = ([k, w]) => w ? `${k}: ${w}` : k;
		atLevel = (e, level) => e.level === level || (e.also_level ?? []).includes(level);
		levelText = (e) => [e.level, ...(e.also_level ?? []).map((l) => `also ${l}`)].join(", ");
		STOP = new Set("a an the this that these those it its something anything thing things some any one i me my we our you your need needs want wants make makes made get gets can could will would should like into onto to of for and or but with on in at by is are be was were been from as so then than which what when where who how do does please just more very".split(" "));
		stems = (text) => text.split(/[^A-Za-z0-9]+/).filter(Boolean).map(stem);
		BROWSE_PAGE = 12;
		BROWSE_PAGE_MAX = 24;
		providesArg = union([string$1(), array(string$1())]).optional().describe("browse and find: what an entry must provide, \"key\" or \"key: word\" (e.g. \"material: glass\", \"floor\"), one or a list; action jobs lists the vocabulary");
		askShape = {
			action: _enum([
				"browse",
				"find",
				"get",
				"jobs"
			]).describe("browse: a level as labelled stills, a page at a time; find: a shortlist by job for one beat, or by level, provides and/or plain words across levels; get: any entry by id (a piece answers with its call); jobs: the job and provides vocabularies"),
			level: _enum(LEVELS).optional().describe("browse and find: style (a look a section can borrow: colour, type, light, material), world (a set a section lives in) or recipe (one technique for one beat; pieces are recipes you run); browse without it shows every level, styles first"),
			provides: providesArg,
			query: string$1().optional().describe("find: what the beat needs in plain words (e.g. \"something that turns over\"); returns the entries that carry the most of its words, pieces first"),
			shelf: _enum(["shipped", "user"]).optional().describe("browse and find: only entries from this shelf"),
			page: number().int().positive().optional().describe("browse: which page, from 1"),
			page_size: number().int().positive().max(24).optional().describe(`browse: tiles per page, default ${12}`),
			include_unpictured: boolean().optional().describe("browse: also list entries with no still (build aids, unproven recipes); hidden by default and counted"),
			vocab: string$1().optional().describe("find: the job vocabulary the beat was written against (e.g. jobs-v1); omitted means the shipped one"),
			job: string$1().optional().describe("find: the beat's job id, from action jobs (e.g. add-depth, land-number, hand-over)"),
			support: array(string$1()).optional().describe("find: up to two support job ids"),
			duration: number().optional().describe("find: the beat's length in seconds"),
			takeaway: string$1().optional().describe("find: what the viewer must get from the beat (carried for the record; not ranked on)"),
			mood: array(string$1()).optional().describe("find: mood words, matched softly against each recipe's mood tags"),
			assets: union([
				record(string$1(), unknown()),
				array(string$1()),
				literal("none")
			]).optional().describe("find: what the beat has on hand, by kind (footage, screen, photo, logo, voice, library, type), or \"none\"; omitted means needs are not filtered"),
			constraints: object$1({
				aspect: string$1().optional(),
				theme: string$1().optional(),
				palette: string$1().optional(),
				status: _enum(["proven", "any"]).optional().describe("proven (the default) or any, to let unproven entries through")
			}).optional(),
			exclude: array(string$1()).optional().describe("find: ids already used or ruled out"),
			limit: number().int().positive().max(20).optional().describe("find: how many candidates, default 5"),
			id: string$1().optional().describe("get: an id from browse or find, at any level"),
			revision: string$1().optional().describe("get: the revision the brief pinned; a different shipped revision is answered with a warning")
		};
		listOf = (p) => p === void 0 ? void 0 : Array.isArray(p) ? p : [p];
		arsenalTool = defineTool({
			name: "ae_arsenal",
			title: "Library: styles, worlds, recipes and pieces",
			group: "document",
			effect: "read",
			blockedInReadOnly: false,
			description: "The library at three levels, each entry with a still from our own proof build and what it provides: styles (a look a section can borrow: colour, type, light, material), worlds (a set a section lives in: floor, light, environment, materials) and recipes (one technique for one beat). Among the recipes, pieces are runnable code: one file each, called by name, built and lit (thickness, light, shadow, overshoot) but carrying no look of their own. action browse shows a level as labelled stills, a page at a time (level, provides, shelf, page, page_size); start a brief there. action find with job returns a ranked shortlist for one beat, pieces first, then written recipes (job, and optionally support, duration, mood, assets, constraints.status, exclude, limit; proven only unless constraints.status is any; relaxed names any filter loosened when nothing passed; never another job; a candidate taught in other ways lists their ids as variants, and a variant learned for a job its parent does not serve comes up on its own with variant_of). action find with query (plain words, e.g. \"something that turns over\"), level and/or provides (e.g. \"material: glass\", \"floor: gloss-dark\") returns entries across levels, pieces first when the words fit one. An unknown job, level or provides word is refused with the valid ones: pick one, never invent one. action jobs lists the job and provides vocabularies. action get takes any id (and the pinned revision) with its still: a piece answers with its call (the load line, signature, options, returns and a short example) to run in eval.run; a recipe with its text; a style or world with its document. Offline; no After Effects needed.",
			inputShape: askShape,
			handler: async (args) => {
				try {
					if (args.action === "jobs") return jsonResult(listJobs());
					const catalog = loadCatalog();
					const byId = new Map(catalog.entries.map((r) => [r.id, r]));
					if (args.action === "get") {
						if (!args.id) return errorResult("INVALID_ARGS", "get needs id: an id from ae_arsenal browse or find");
						return {
							content: [{
								type: "text",
								text: recipeReply(args.id, args.revision)
							}, ...stillContent(byId.get(args.id))],
							isError: false
						};
					}
					if (args.action === "browse") {
						const page = browseCatalog(catalog, {
							level: args.level,
							provides: listOf(args.provides),
							shelf: args.shelf,
							page: args.page,
							page_size: args.page_size,
							include_unpictured: args.include_unpictured
						});
						const label = (t) => `Tile ${t.n}: ${t.id} \xB7 ${t.name} \xB7 ${[t.level, ...(t.also_level ?? []).map((l) => `also ${l}`)].join(", ")}${t.kind === "piece" ? " · piece (runnable; get returns its call)" : ""}${t.role === "house" ? " · the house style, the default for pieces" : t.role === "example" ? " · an example style, not a house look" : ""}${t.block ? ` \xB7 pieces: PCS.use('${t.block}')` : ""} \xB7 provides ${t.provides.length ? t.provides.join(", ") : "nothing listed"}${t.status === "proven" ? "" : " · unproven"}`;
						const images2 = page.tiles.flatMap((t) => byId.get(t.id).still ? stillContent(byId.get(t.id), LIBRARY, label(t)) : [{
							type: "text",
							text: `${label(t)} \xB7 no still: ${t.no_still}`
						}]);
						const next = page.page < page.pages ? ` Next: page ${page.page + 1}.` : "";
						return {
							content: [{
								type: "text",
								text: `${`ae_arsenal browse: ${page.level === "all" ? "every level, styles first" : `level ${page.level}`}${page.provides ? `, providing ${page.provides.join(" or ")}` : ""}; page ${page.page} of ${page.pages}, tiles ${page.tiles.length ? `${page.tiles[0].n} to ${page.tiles.at(-1).n}` : "none"} of ${page.total}${page.hidden_without_still ? `; ${page.hidden_without_still} without a still hidden (include_unpictured lists them)` : ""}.${next} Read one with get.`}
${JSON.stringify({
									ok: true,
									...page
								}, null, 2)}`
							}, ...images2],
							isError: false
						};
					}
					if (!args.job) {
						if (args.level === void 0 && args.provides === void 0 && args.query === void 0) return errorResult("INVALID_ARGS", "find needs job (a job id from ae_arsenal action jobs), or a query in plain words, level and/or provides", { hint: "call ae_arsenal with action jobs for the valid job ids and provides words" });
						const answer2 = findByProvides(catalog, {
							level: args.level,
							provides: listOf(args.provides),
							query: args.query,
							shelf: args.shelf,
							status: args.constraints?.status,
							exclude: args.exclude,
							limit: args.limit
						});
						const images2 = answer2.results.flatMap((c) => stillContent(byId.get(c.id)));
						return {
							content: [{
								type: "text",
								text: JSON.stringify({
									ok: true,
									...answer2
								}, null, 2)
							}, ...images2],
							isError: false
						};
					}
					if (args.level !== void 0 || args.provides !== void 0 || args.shelf !== void 0 || args.query !== void 0) return errorResult("INVALID_ARGS", "find asks by job for one beat, or by query, level and provides across levels, not both: drop job, or drop query, level, provides and shelf");
					const answer = findTechniques(catalog, {
						vocab: args.vocab ?? catalog.vocab,
						job: args.job,
						support: args.support,
						duration: args.duration,
						takeaway: args.takeaway,
						mood: args.mood,
						assets: args.assets,
						constraints: args.constraints,
						exclude: args.exclude,
						limit: args.limit
					});
					const images = answer.results.flatMap((c) => stillContent(byId.get(c.id)));
					return {
						content: [{
							type: "text",
							text: JSON.stringify({
								ok: true,
								...answer
							}, null, 2)
						}, ...images],
						isError: false
					};
				} catch (e) {
					if (e instanceof ArsenalRefusal) return errorResult("INVALID_ARGS", e.message);
					return errorResult("IO", e instanceof Error ? e.message : String(e));
				}
			}
		});
	})))();
}

export { ALL_TOOLS, arsenalTool, colorConversion, defineTool, iccManagedReason, init_arsenal, init_capture_shared, init_define_tool, init_library, init_tools, libraryTool, toMcpResult, validRgb };